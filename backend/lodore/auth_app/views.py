"""
Auth endpoints:
  POST /api/auth/request-otp
  POST /api/auth/verify-otp
  POST /api/auth/token/refresh
  GET  /api/auth/me
"""
import logging
from django.utils import timezone
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

from .models import VIPPhone, OTPRequest, InvitedContact
from .serializers import RequestOTPSerializer, VerifyOTPSerializer
from .utils import normalize_phone
from .unifonic import send_otp, verify_otp, UnifonicError
from .jwt_backend import get_tokens_for_phone
from .authentication import PhoneJWTAuthentication
from .throttles import RequestOTPThrottle, VerifyOTPThrottle

logger = logging.getLogger("lodore")

# Generic error messages — do NOT reveal VIP membership
_GENERIC_DENIED = {
    "ok": False,
    "message": "عذراً، لا يمكننا معالجة طلبك حالياً. تأكد من رقم الجوال وحاول مجدداً.",
}
_OTP_INVALID = {
    "ok": False,
    "message": "رمز التحقق غير صحيح أو انتهت صلاحيته.",
}


class RequestOTPView(APIView):
    """
    POST /api/auth/request-otp
    body: { "phone": "05xxxxxxxx" }

    Steps:
    1. Normalize phone
    2. Check VIPPhone exists AND booked=False
    3. Check cooldown (prevent spam)
    4. Send OTP via Unifonic
    5. Create OTPRequest record
    6. Return { ok, requestId }
    """
    authentication_classes = []   # no auth needed — public endpoint
    permission_classes = [AllowAny]
    throttle_classes = [RequestOTPThrottle]

    def post(self, request):
        serializer = RequestOTPSerializer(data=request.data)
        if not serializer.is_valid():
            # Don't leak which field failed for phone – use generic message
            return Response(_GENERIC_DENIED, status=status.HTTP_400_BAD_REQUEST)

        phone = serializer.validated_data["phone"]

        # --- VIP check (silent failure) ---
        try:
            vip = VIPPhone.objects.get(phone=phone, booked=False)
        except VIPPhone.DoesNotExist:
            logger.info("OTP requested for non-VIP or booked phone: %s", phone)
            # Return same response shape to avoid enumeration
            return Response(_GENERIC_DENIED, status=status.HTTP_403_FORBIDDEN)

        # --- Resend cooldown check ---
        cooldown = getattr(settings, "OTP_RESEND_COOLDOWN_SECONDS", 60)
        recent_otp = (
            OTPRequest.objects.filter(phone=phone, status=OTPRequest.STATUS_PENDING)
            .order_by("-created_at")
            .first()
        )
        if recent_otp:
            elapsed = (timezone.now() - recent_otp.last_sent_at).total_seconds()
            if elapsed < cooldown:
                remaining = int(cooldown - elapsed)
                return Response(
                    {
                        "ok": False,
                        "message": f"يرجى الانتظار {remaining} ثانية قبل إعادة الإرسال.",
                        "cooldownRemaining": remaining,
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

        # --- Send OTP ---
        try:
            reference_id = send_otp(phone)
        except UnifonicError as exc:
            logger.error("Failed to send OTP for %s: %s", phone, exc)
            return Response(
                {"ok": False, "message": "تعذر إرسال رمز التحقق. حاول مجدداً."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # --- Expire any previous pending OTPs for this phone ---
        OTPRequest.objects.filter(
            phone=phone, status=OTPRequest.STATUS_PENDING
        ).update(status=OTPRequest.STATUS_EXPIRED)

        # --- Create new OTPRequest ---
        otp_request = OTPRequest.objects.create(
            phone=phone,
            reference_id=reference_id,
            status=OTPRequest.STATUS_PENDING,
        )

        logger.info("OTP sent for phone=%s otp_request_id=%s", phone, otp_request.pk)

        return Response(
            {"ok": True, "requestId": reference_id},
            status=status.HTTP_200_OK,
        )


class VerifyOTPView(APIView):
    """
    POST /api/auth/verify-otp
    body: { "phone": "...", "requestId": "...", "code": "1234" }

    Steps:
    1. Normalize & validate inputs
    2. Lookup OTPRequest: phone + reference_id, status=pending, not expired
    3. Check attempt count < max
    4. Verify via Unifonic
    5. On success → mark verified, return JWT tokens
    6. On failure → increment attempts, return error
    """
    authentication_classes = []   # no auth needed — public endpoint
    permission_classes = [AllowAny]
    throttle_classes = [VerifyOTPThrottle]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(_OTP_INVALID, status=status.HTTP_400_BAD_REQUEST)

        phone = serializer.validated_data["phone"]
        reference_id = serializer.validated_data["requestId"]
        code = serializer.validated_data["code"]

        max_attempts = getattr(settings, "OTP_MAX_ATTEMPTS", 5)

        # --- Lookup OTPRequest ---
        try:
            otp_req = OTPRequest.objects.get(
                phone=phone,
                reference_id=reference_id,
                status=OTPRequest.STATUS_PENDING,
            )
        except OTPRequest.DoesNotExist:
            logger.warning("OTP not found for phone=%s ref=%s", phone, reference_id)
            return Response(_OTP_INVALID, status=status.HTTP_400_BAD_REQUEST)

        # --- Check expiry ---
        if otp_req.is_expired:
            otp_req.status = OTPRequest.STATUS_EXPIRED
            otp_req.save(update_fields=["status"])
            logger.info("OTP expired for phone=%s", phone)
            return Response(_OTP_INVALID, status=status.HTTP_400_BAD_REQUEST)

        # --- Check attempts ---
        if otp_req.attempts_count >= max_attempts:
            otp_req.status = OTPRequest.STATUS_FAILED
            otp_req.save(update_fields=["status"])
            logger.warning("OTP max attempts exceeded for phone=%s", phone)
            return Response(_OTP_INVALID, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # --- Verify with Unifonic ---
        try:
            verified = verify_otp(reference_id, code)
        except UnifonicError as exc:
            logger.error("Unifonic verify error for %s: %s", phone, exc)
            return Response(
                {"ok": False, "message": "خطأ في التحقق. حاول مجدداً."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if not verified:
            otp_req.attempts_count += 1
            otp_req.save(update_fields=["attempts_count"])
            remaining = max_attempts - otp_req.attempts_count
            logger.info(
                "OTP wrong code for phone=%s attempts=%s", phone, otp_req.attempts_count
            )
            return Response(
                {
                    "ok": False,
                    "message": "رمز التحقق غير صحيح.",
                    "attemptsRemaining": remaining,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- Success ---
        otp_req.status = OTPRequest.STATUS_VERIFIED
        otp_req.save(update_fields=["status"])
        logger.info("OTP verified successfully for phone=%s", phone)

        tokens = get_tokens_for_phone(phone)
        return Response({"ok": True, **tokens}, status=status.HTTP_200_OK)


class TokenRefreshView(APIView):
    """
    POST /api/auth/token/refresh
    body: { "refresh": "<token>" }

    Returns new access token (and rotates refresh if configured).
    """
    authentication_classes = []   # no auth needed — public endpoint
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh", "")
        if not refresh_token:
            return Response(
                {"ok": False, "message": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            access = str(token.access_token)
            # If ROTATE_REFRESH_TOKENS is True, issue a new refresh token too
            new_refresh = str(token)
        except (TokenError, InvalidToken) as exc:
            logger.warning("Token refresh failed: %s", exc)
            return Response(
                {"ok": False, "message": "Refresh token is invalid or expired."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response({"ok": True, "access": access, "refresh": new_refresh})


class MeView(APIView):
    """
    GET /api/auth/me
    Protected: requires valid JWT.
    Returns the authenticated phone number and booking status.
    """
    authentication_classes = [PhoneJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        phone = request.user.phone
        # Check if user has booked
        try:
            vip = VIPPhone.objects.get(phone=phone)
            booked = vip.booked
        except VIPPhone.DoesNotExist:
            booked = False

        return Response({"ok": True, "phone": phone, "booked": booked})


class SubmitInvitationsView(APIView):
    """
    POST /api/auth/invitations
    Protected: requires valid JWT.
    body: { "contacts": [{"name": "...", "phone": "..."}, ...] }

    Allows VIP customers to invite up to 3 contacts.
    Invitations are stored and require admin approval.
    """
    authentication_classes = [PhoneJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        inviter_phone = request.user.phone
        contacts = request.data.get("contacts", [])

        # Validate input
        if not isinstance(contacts, list):
            return Response(
                {"ok": False, "message": "يجب أن تكون جهات الاتصال قائمة."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(contacts) > 3:
            return Response(
                {"ok": False, "message": "يمكنك دعوة 3 أشخاص كحد أقصى."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(contacts) == 0:
            return Response(
                {"ok": False, "message": "يرجى إضافة جهة اتصال واحدة على الأقل."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Process each contact
        created_count = 0
        errors = []

        for contact in contacts:
            name = contact.get("name", "").strip()
            phone = contact.get("phone", "").strip()

            if not name or not phone:
                errors.append(f"الاسم ورقم الهاتف مطلوبان لكل جهة اتصال.")
                continue

            # Normalize phone
            try:
                normalized_phone = normalize_phone(phone)
            except ValueError:
                errors.append(f"رقم الهاتف {phone} غير صالح.")
                continue

            # Check if already invited by this user
            if InvitedContact.objects.filter(
                inviter_phone=inviter_phone, invited_phone=normalized_phone
            ).exists():
                errors.append(f"تم دعوة {name} ({normalized_phone}) مسبقاً.")
                continue

            # Check if already a VIP
            if VIPPhone.objects.filter(phone=normalized_phone).exists():
                errors.append(f"{name} ({normalized_phone}) هو بالفعل في قائمة VIP.")
                continue

            # Create invitation
            InvitedContact.objects.create(
                inviter_phone=inviter_phone,
                invited_phone=normalized_phone,
                invited_name=name,
            )
            created_count += 1

        if created_count == 0 and errors:
            return Response(
                {"ok": False, "message": " | ".join(errors)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_message = f"تم إرسال {created_count} دعوة بنجاح."
        if errors:
            response_message += f" بعض الأخطاء: {' | '.join(errors)}"

        logger.info(
            "Invitations submitted by %s: %s created, %s errors",
            inviter_phone,
            created_count,
            len(errors),
        )

        return Response(
            {
                "ok": True,
                "message": response_message,
                "created": created_count,
                "errors": errors if errors else [],
            },
            status=status.HTTP_201_CREATED,
        )
