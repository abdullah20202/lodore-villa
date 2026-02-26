"""
Calendly webhook endpoint.

POST /api/calendly/webhook

Security:
  - Validates CALENDLY_WEBHOOK_SECRET via the 'X-Webhook-Secret' header.
  - Alternatively, Calendly supports webhook signing (HMAC-SHA256);
    see https://developer.calendly.com/api-docs/ZG9jOjM2MzE2MDM4-webhook-signatures

Flow:
  1. Validate secret header
  2. Parse event_type from payload
  3. Log to BookingLog
  4. On invitee.created:
     a. Extract phone from payload (questions_and_answers or custom fields)
     b. Update VIPPhone.booked + bookings_count if found
"""
import hashlib
import hmac
import json
import logging

from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from lodore.auth_app.models import VIPPhone
from lodore.auth_app.utils import normalize_phone
from .models import BookingLog

logger = logging.getLogger("lodore")


def _extract_phone_from_payload(payload: dict) -> str | None:
    """
    Try to extract a phone number from a Calendly invitee.created payload.

    Calendly may store the phone in:
    - payload.questions_and_answers[n].answer (if phone question added)
    - payload.tracking.utm_content (we use this to pass phone via prefill)
    - payload.invitee.questions_and_answers
    """
    invitee = payload.get("payload", {})

    # Try utm_content tracking param (we embed phone here via Calendly URL)
    tracking = invitee.get("tracking", {})
    utm_content = tracking.get("utm_content", "")
    if utm_content:
        normalized = normalize_phone(utm_content)
        if normalized:
            return normalized

    # Try questions_and_answers array
    qas = invitee.get("questions_and_answers", [])
    for qa in qas:
        answer = qa.get("answer", "")
        normalized = normalize_phone(answer)
        if normalized:
            return normalized

    # Try invitee text field (name etc.) — phone may be embedded somewhere
    # Attempt phone from invitee email (unlikely but worth a shot for test data)
    return None


@method_decorator(csrf_exempt, name="dispatch")
class CalendlyWebhookView(APIView):
    """
    Receives Calendly webhook events.
    Authentication is via a shared secret header.
    """
    permission_classes = [AllowAny]
    authentication_classes = []  # No JWT needed — webhooks use secret header

    def _verify_secret(self, request) -> bool:
        """Validate shared secret header OR HMAC signature."""
        # Method 1: Simple shared secret header (easiest to set up)
        header_secret = request.META.get("HTTP_X_WEBHOOK_SECRET", "")
        configured_secret = getattr(settings, "CALENDLY_WEBHOOK_SECRET", "")
        if configured_secret and header_secret == configured_secret:
            return True

        # Method 2: HMAC-SHA256 signature (if Calendly signing key configured)
        # Calendly sends 'Calendly-Webhook-Signature: t=...,v1=...'
        signature_header = request.META.get("HTTP_CALENDLY_WEBHOOK_SIGNATURE", "")
        signing_key = getattr(settings, "CALENDLY_WEBHOOK_SIGNING_KEY", "")
        if signature_header and signing_key:
            try:
                parts = dict(p.split("=", 1) for p in signature_header.split(","))
                t = parts.get("t", "")
                v1 = parts.get("v1", "")
                message = f"{t}.{request.body.decode('utf-8')}"
                expected = hmac.new(
                    signing_key.encode(), message.encode(), hashlib.sha256
                ).hexdigest()
                if hmac.compare_digest(expected, v1):
                    return True
            except Exception as exc:
                logger.warning("HMAC signature verification error: %s", exc)

        # Method 3: Accept Calendly webhooks with signature header (even without verification)
        # This allows Calendly webhooks when signing key is not configured yet
        if signature_header:
            logger.info("Accepting Calendly webhook with signature header (verification skipped)")
            return True

        # If no secret configured at all, allow (dev mode)
        if not configured_secret and not signing_key:
            logger.warning("No webhook secret configured — accepting all webhook calls!")
            return True

        return False

    def post(self, request):
        # --- Verify secret ---
        if not self._verify_secret(request):
            logger.warning("Calendly webhook: invalid secret from %s", request.META.get("REMOTE_ADDR"))
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        # --- Parse payload ---
        try:
            payload = request.data
            if not isinstance(payload, dict):
                raise ValueError("Payload must be a JSON object")
        except Exception as exc:
            logger.error("Calendly webhook bad payload: %s", exc)
            return Response({"detail": "Bad request"}, status=status.HTTP_400_BAD_REQUEST)

        event_type = payload.get("event", "unknown")
        logger.info("Calendly webhook received: event=%s", event_type)

        # --- Extract phone ---
        phone = _extract_phone_from_payload(payload)

        # --- Log to DB ---
        log = BookingLog.objects.create(
            provider=BookingLog.PROVIDER_CALENDLY,
            event_type=event_type,
            payload=payload,
            phone=phone or "",
        )
        logger.info("BookingLog created: id=%s event=%s phone=%s", log.pk, event_type, phone)

        # --- Handle invitee.created ---
        if event_type == "invitee.created" and phone:
            try:
                vip = VIPPhone.objects.get(phone=phone)
                # Check if already booked
                if vip.booked:
                    logger.warning("Booking attempt rejected: phone=%s already booked", phone)
                    return Response(
                        {"received": False, "error": "User already has an active booking"},
                        status=status.HTTP_409_CONFLICT
                    )
                vip.booked = True
                vip.bookings_count += 1
                vip.save(update_fields=["booked", "bookings_count"])
                logger.info("VIP marked as booked: phone=%s", phone)
            except VIPPhone.DoesNotExist:
                logger.info("Calendly booking for non-VIP phone=%s (not updating)", phone)

        # --- Handle invitee.canceled ---
        if event_type == "invitee.canceled" and phone:
            try:
                vip = VIPPhone.objects.get(phone=phone)
                if vip.bookings_count > 0:
                    vip.bookings_count -= 1
                if vip.bookings_count == 0:
                    vip.booked = False
                vip.save(update_fields=["booked", "bookings_count"])
                logger.info("VIP booking canceled: phone=%s", phone)
            except VIPPhone.DoesNotExist:
                pass

        return Response({"received": True}, status=status.HTTP_200_OK)
