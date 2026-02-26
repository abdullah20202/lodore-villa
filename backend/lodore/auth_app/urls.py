from django.urls import path
from .views import (
    RequestOTPView,
    VerifyOTPView,
    TokenRefreshView,
    MeView,
    SubmitInvitationsView,
    StaffLoginView,
    NominationsListView,
    UpdateNominationStatusView,
    ExportNominationsView,
    ReservationsListView,
)

urlpatterns = [
    # VIP Customer endpoints
    path("request-otp", RequestOTPView.as_view(), name="request-otp"),
    path("verify-otp", VerifyOTPView.as_view(), name="verify-otp"),
    path("token/refresh", TokenRefreshView.as_view(), name="token-refresh"),
    path("me", MeView.as_view(), name="me"),
    path("invitations", SubmitInvitationsView.as_view(), name="invitations"),

    # Management endpoints
    path("management/login", StaffLoginView.as_view(), name="staff-login"),
    path("management/nominations", NominationsListView.as_view(), name="nominations-list"),
    path("management/nominations/export", ExportNominationsView.as_view(), name="export-nominations"),
    path("management/nominations/<int:nomination_id>", UpdateNominationStatusView.as_view(), name="update-nomination-status"),
    path("management/reservations", ReservationsListView.as_view(), name="reservations-list"),
]
