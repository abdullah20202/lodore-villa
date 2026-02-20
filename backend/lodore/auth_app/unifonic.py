"""
Unifonic SMS API wrapper for OTP delivery.

Uses Unifonic SMS REST API:
  https://el.cloud.unifonic.com/rest/SMS/messages

We generate OTP codes ourselves and send them via SMS.
Verification is done server-side by storing the code temporarily in Django cache.

MOCK / TEST MODE
----------------
When DEBUG=True AND UNIFONIC_APP_SID is empty/placeholder, OR when
UNIFONIC_FORCE_MOCK=True, the service automatically switches to mock mode:
  - send_otp()  → skips the real API, returns a fake reference_id, logs
                  the fixed test code "123456" to the console.
  - verify_otp() → accepts only "123456" as a valid code (one-time use).

This lets you run the entire flow locally without real Unifonic credentials.
Switch off by setting UNIFONIC_APP_SID to your real value in .env.
"""
import logging
import uuid
import random
import time
from typing import Optional
import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger("lodore.unifonic")

# Configurable timeouts (seconds)
REQUEST_TIMEOUT = 15

# Fixed OTP code used in mock mode
MOCK_OTP_CODE = "123456"
# In-memory store: reference_id → phone (mock only)
_mock_store: dict[str, str] = {}

# OTP code settings
OTP_CODE_LENGTH = 6
OTP_CACHE_TTL = 600  # 10 minutes

# Unifonic SMS API endpoint
UNIFONIC_SMS_URL = "https://el.cloud.unifonic.com/rest/SMS/messages"


def _is_mock_mode() -> bool:
    """Return True when running in test/dev mode without real Unifonic creds."""
    # Force mock if explicitly enabled
    force_mock = getattr(settings, "UNIFONIC_FORCE_MOCK", False)
    if force_mock:
        return True

    # Auto-detect based on credentials
    app_sid = getattr(settings, "UNIFONIC_APP_SID", "")
    is_placeholder = not app_sid or app_sid.startswith("YOUR_") or app_sid == "changeme"
    return bool(getattr(settings, "DEBUG", False)) and is_placeholder


def _get_sender_id() -> str:
    """Get sender ID from settings with fallback."""
    return getattr(settings, "UNIFONIC_SENDER_ID", "lodore")


def _format_recipient(phone: str) -> str:
    """
    Format phone number for Unifonic API.

    Args:
        phone: Normalized Saudi phone (05xxxxxxxx)

    Returns:
        Formatted recipient based on UNIFONIC_RECIPIENT_PREFIX_MODE:
        - "plus": +9665xxxxxxxx
        - "plain": 9665xxxxxxxx (default)
    """
    # Remove leading 0, add 966 country code
    without_zero = phone[1:] if phone.startswith("0") else phone
    international = f"966{without_zero}"

    prefix_mode = getattr(settings, "UNIFONIC_RECIPIENT_PREFIX_MODE", "plain")
    if prefix_mode == "plus":
        return f"+{international}"
    return international


def _mask_phone(phone: str) -> str:
    """Mask phone number for logging: 050*****343"""
    if len(phone) < 6:
        return "***"
    return f"{phone[:3]}*****{phone[-3:]}"


def _generate_trace_id() -> str:
    """Generate short trace ID for request tracking."""
    return uuid.uuid4().hex[:8].upper()


def _generate_otp_code() -> str:
    """Generate random OTP code."""
    return "".join([str(random.randint(0, 9)) for _ in range(OTP_CODE_LENGTH)])


def _safe_truncate(text: str, max_len: int = 500) -> str:
    """Safely truncate text for logging."""
    if not text:
        return ""
    if len(text) <= max_len:
        return text
    return text[:max_len] + "... [truncated]"


class UnifonicError(Exception):
    """Raised when Unifonic returns a non-success response or network fails."""

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        content_type: Optional[str] = None,
        response_preview: Optional[str] = None,
        response_data: Optional[dict] = None,
    ):
        super().__init__(message)
        self.status_code = status_code
        self.content_type = content_type
        self.response_preview = response_preview
        self.response_data = response_data or {}


def send_otp(phone: str) -> str:
    """
    Send an OTP to the given phone number via Unifonic SMS API.

    Args:
        phone: Normalized phone number (05xxxxxxxx).

    Returns:
        reference_id (str): Unique ID for this OTP request.

    Raises:
        UnifonicError: if the API call fails.
    """
    trace_id = _generate_trace_id()
    masked_phone = _mask_phone(phone)

    # ── MOCK MODE ──────────────────────────────────────────────────────────
    if _is_mock_mode():
        reference_id = f"MOCK-{uuid.uuid4().hex[:12].upper()}"
        # Store in cache (not in-memory dict) for multi-worker compatibility
        cache_key = f"otp:{reference_id}"
        cache.set(cache_key, {"phone": phone, "code": MOCK_OTP_CODE}, timeout=OTP_CACHE_TTL)
        logger.warning(
            "[%s] 🔧 MOCK MODE — OTP not sent via Unifonic | "
            "phone=%s ref=%s code=%s",
            trace_id, masked_phone, reference_id, MOCK_OTP_CODE,
        )
        print(
            f"\n{'='*60}\n"
            f"  🔧 MOCK OTP | trace={trace_id}\n"
            f"  Phone      : {masked_phone}\n"
            f"  Ref ID     : {reference_id}\n"
            f"  OTP CODE   : {MOCK_OTP_CODE}\n"
            f"{'='*60}\n",
            flush=True,
        )
        return reference_id
    # ── END MOCK MODE ───────────────────────────────────────────────────────

    # Generate OTP code and reference ID
    otp_code = _generate_otp_code()
    reference_id = f"OTP-{uuid.uuid4().hex[:12].upper()}"
    recipient = _format_recipient(phone)
    sender_id = _get_sender_id()

    # Build SMS message
    message_body = f"رمز التحقق الخاص بك: {otp_code}\nلودور فيلا - Lodore Villa"

    # Prepare payload
    app_sid = getattr(settings, "UNIFONIC_APP_SID", "")
    payload = {
        "AppSid": app_sid,
        "SenderID": sender_id,
        "Recipient": recipient,
        "Body": message_body,
        "responseType": "json",  # Force JSON response
    }

    logger.info(
        "[%s] Sending OTP SMS | phone=%s ref=%s recipient=%s sender=%s",
        trace_id, masked_phone, reference_id, recipient, sender_id,
    )

    # Debug mode: log OTP code (DO NOT do this in production)
    if getattr(settings, "DEBUG", False):
        logger.debug("[%s] DEBUG OTP CODE: %s", trace_id, otp_code)

    start_time = time.time()
    resp = None

    try:
        resp = requests.post(UNIFONIC_SMS_URL, data=payload, timeout=REQUEST_TIMEOUT)
        elapsed_ms = int((time.time() - start_time) * 1000)

        status_code = resp.status_code
        content_type = resp.headers.get("Content-Type", "unknown")

        logger.info(
            "[%s] Unifonic response | status=%d content_type=%s elapsed=%dms",
            trace_id, status_code, content_type, elapsed_ms,
        )

        # Handle non-2xx status codes
        if status_code not in (200, 201):
            response_preview = _safe_truncate(resp.text)
            logger.error(
                "[%s] Unifonic HTTP error | status=%d preview=%s",
                trace_id, status_code, response_preview,
            )
            raise UnifonicError(
                f"Unifonic SMS API returned status {status_code}",
                status_code=status_code,
                content_type=content_type,
                response_preview=response_preview,
            )

        # Parse JSON safely
        try:
            data = resp.json()
        except Exception as json_exc:
            response_preview = _safe_truncate(resp.text)
            logger.error(
                "[%s] Unifonic response is not valid JSON | error=%s preview=%s",
                trace_id, str(json_exc), response_preview,
            )
            raise UnifonicError(
                f"Unifonic returned non-JSON response (status {status_code})",
                status_code=status_code,
                content_type=content_type,
                response_preview=response_preview,
            ) from json_exc

        # Check Unifonic's success flag
        success = data.get("success", False)
        if not success:
            error_msg = data.get("message") or data.get("errorMessage") or "Unknown error"
            logger.error(
                "[%s] Unifonic API error | success=False message=%s data=%s",
                trace_id, error_msg, data,
            )
            raise UnifonicError(
                f"Unifonic API error: {error_msg}",
                status_code=status_code,
                response_data=data,
            )

        # Store in cache ONLY after successful send
        cache_key = f"otp:{reference_id}"
        cache.set(cache_key, {"phone": phone, "code": otp_code}, timeout=OTP_CACHE_TTL)

        logger.info(
            "[%s] ✓ OTP SMS sent successfully | ref=%s phone=%s",
            trace_id, reference_id, masked_phone,
        )

        return reference_id

    except requests.exceptions.Timeout as exc:
        elapsed_ms = int((time.time() - start_time) * 1000)
        logger.error(
            "[%s] Unifonic request timeout | elapsed=%dms error=%s",
            trace_id, elapsed_ms, str(exc),
        )
        raise UnifonicError(f"Unifonic API timeout after {elapsed_ms}ms") from exc

    except requests.exceptions.RequestException as exc:
        elapsed_ms = int((time.time() - start_time) * 1000)
        logger.error(
            "[%s] Unifonic network error | elapsed=%dms error=%s",
            trace_id, elapsed_ms, str(exc),
        )
        raise UnifonicError(f"Network error contacting Unifonic: {exc}") from exc


def verify_otp(reference_id: str, code: str) -> bool:
    """
    Verify the OTP code against our cache.

    Args:
        reference_id: The reference ID returned by send_otp.
        code: The OTP code entered by the user.

    Returns:
        True if the code is correct; False otherwise.
    """
    trace_id = _generate_trace_id()

    # ── MOCK MODE ──────────────────────────────────────────────────────────
    if _is_mock_mode():
        # Use cache instead of in-memory dict for multi-worker compatibility
        cache_key = f"otp:{reference_id}"
        cached_data = cache.get(cache_key)
        is_valid = cached_data and (cached_data.get("code") == code)
        logger.warning(
            "[%s] 🔧 MOCK MODE — verify_otp | ref=%s code=%s valid=%s",
            trace_id, reference_id, code, is_valid,
        )
        if is_valid:
            cache.delete(cache_key)  # one-time use
        return is_valid
    # ── END MOCK MODE ───────────────────────────────────────────────────────

    cache_key = f"otp:{reference_id}"
    cached_data = cache.get(cache_key)

    if not cached_data:
        logger.info(
            "[%s] OTP verify failed | ref=%s reason=not_found_or_expired",
            trace_id, reference_id,
        )
        return False

    stored_code = cached_data.get("code", "")
    stored_phone = cached_data.get("phone", "")
    masked_phone = _mask_phone(stored_phone)

    is_valid = (stored_code == code)

    if is_valid:
        # Delete from cache after successful verification (one-time use)
        cache.delete(cache_key)
        logger.info(
            "[%s] ✓ OTP verified successfully | ref=%s phone=%s",
            trace_id, reference_id, masked_phone,
        )
    else:
        logger.info(
            "[%s] OTP verify failed | ref=%s phone=%s reason=wrong_code",
            trace_id, reference_id, masked_phone,
        )

    return is_valid
