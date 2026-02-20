"""
Custom DRF throttle classes for OTP rate limiting.
"""
from rest_framework.throttling import SimpleRateThrottle


class RequestOTPThrottle(SimpleRateThrottle):
    """
    Rate limits POST /api/auth/request-otp to 3 requests per phone per 10 minutes.
    Cache key is based on the normalized phone number from the request body.
    """
    scope = "request_otp"

    def get_cache_key(self, request, view):
        phone = (request.data or {}).get("phone", "")
        if not phone:
            return self.get_ident(request)
        # Use phone as part of cache key so limit is per phone
        return f"throttle_request_otp_{phone}"

    def parse_rate(self, rate):
        if rate is None:
            return (None, None)
        # Support "3/10min" format
        if "min" in rate:
            parts = rate.split("/")
            num = int(parts[0])
            duration_str = parts[1]
            # e.g. "10min" → 600 seconds
            minutes = int(duration_str.replace("min", ""))
            return (num, minutes * 60)
        return super().parse_rate(rate)


class VerifyOTPThrottle(SimpleRateThrottle):
    """
    Rate limits POST /api/auth/verify-otp to 5 attempts per phone per 10 minutes.
    """
    scope = "verify_otp"

    def get_cache_key(self, request, view):
        phone = (request.data or {}).get("phone", "")
        if not phone:
            return self.get_ident(request)
        return f"throttle_verify_otp_{phone}"

    def parse_rate(self, rate):
        if rate is None:
            return (None, None)
        if "min" in rate:
            parts = rate.split("/")
            num = int(parts[0])
            duration_str = parts[1]
            minutes = int(duration_str.replace("min", ""))
            return (num, minutes * 60)
        return super().parse_rate(rate)
