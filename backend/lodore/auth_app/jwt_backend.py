"""
Custom JWT authentication backend.

We don't use Django's User model — instead we embed the normalized phone
number directly in the JWT payload and validate against VIPPhone.
"""
import logging
from rest_framework_simplejwt.tokens import RefreshToken
from .models import VIPPhone

logger = logging.getLogger("lodore")

PHONE_CLAIM = "phone"


def get_tokens_for_phone(phone: str) -> dict:
    """
    Generate JWT access + refresh tokens for a verified VIP phone number.
    We embed the phone in the payload instead of a user_id.
    """
    # Use a dummy user-like object – simplejwt requires an object with an id
    # We create a minimal wrapper that satisfies simplejwt's requirements.
    class PhoneHolder:
        def __init__(self, phone):
            self.id = phone  # use phone as the "id"
            self.pk = phone

    holder = PhoneHolder(phone)
    refresh = RefreshToken.for_user(holder)
    # Embed phone explicitly in the payload
    refresh[PHONE_CLAIM] = phone
    refresh.access_token[PHONE_CLAIM] = phone

    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


def phone_from_token(validated_token) -> str | None:
    """Extract the phone claim from a validated JWT token."""
    return validated_token.get(PHONE_CLAIM)
