from django.urls import path
from .views import (
    RequestOTPView,
    VerifyOTPView,
    TokenRefreshView,
    MeView,
    SubmitInvitationsView,
)

urlpatterns = [
    path("request-otp", RequestOTPView.as_view(), name="request-otp"),
    path("verify-otp", VerifyOTPView.as_view(), name="verify-otp"),
    path("token/refresh", TokenRefreshView.as_view(), name="token-refresh"),
    path("me", MeView.as_view(), name="me"),
    path("invitations", SubmitInvitationsView.as_view(), name="invitations"),
]
