"""
Custom JWT authentication that does NOT require a Django User object.
Instead, the phone number is stored directly in the JWT payload.
"""
import logging
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import VIPPhone
from .jwt_backend import PHONE_CLAIM

logger = logging.getLogger("lodore")


class _PhonePrincipal:
    """Minimal object to satisfy DRF's request.user interface."""
    is_authenticated = True

    def __init__(self, phone: str):
        self.phone = phone
        self.pk = phone
        self.id = phone

    def __str__(self):
        return self.phone


class PhoneJWTAuthentication(BaseAuthentication):
    """
    Authenticate using a JWT that contains a 'phone' claim.
    Does NOT require a Django User record.
    """

    def authenticate(self, request):
        header = request.META.get("HTTP_AUTHORIZATION", "")
        if not header.startswith("Bearer "):
            return None

        raw_token = header.split(" ", 1)[1]
        try:
            token = AccessToken(raw_token)
        except (InvalidToken, TokenError) as exc:
            logger.warning("Invalid JWT: %s", exc)
            raise AuthenticationFailed("Invalid or expired token.") from exc

        phone = token.get(PHONE_CLAIM)
        if not phone:
            raise AuthenticationFailed("Token missing phone claim.")

        return (_PhonePrincipal(phone), token)

    def authenticate_header(self, request):
        return "Bearer"
