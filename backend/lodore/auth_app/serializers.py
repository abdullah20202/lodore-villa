from rest_framework import serializers
import re


def _normalize_phone(raw: str) -> str | None:
    """Inline normalization for serializer validation."""
    from .utils import normalize_phone
    return normalize_phone(raw)


class RequestOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)

    def validate_phone(self, value):
        normalized = _normalize_phone(value)
        if not normalized:
            raise serializers.ValidationError(
                "رقم الجوال غير صحيح. يرجى إدخال رقم سعودي صالح."
            )
        return normalized


class VerifyOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)
    requestId = serializers.CharField(max_length=255)
    code = serializers.CharField(max_length=10, min_length=4)

    def validate_phone(self, value):
        normalized = _normalize_phone(value)
        if not normalized:
            raise serializers.ValidationError(
                "رقم الجوال غير صحيح."
            )
        return normalized

    def validate_code(self, value):
        if not re.fullmatch(r"\d{4,8}", value):
            raise serializers.ValidationError("رمز التحقق يجب أن يحتوي على أرقام فقط.")
        return value


class TokenRefreshSerializer(serializers.Serializer):
    refresh = serializers.CharField()
