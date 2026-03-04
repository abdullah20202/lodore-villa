"""
Dashboard statistics API endpoint
"""
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Count, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import VIPPhone, InvitedContact
from lodore.calendly_app.models import BookingLog


class DashboardStatsView(APIView):
    """Get dashboard statistics for management panel"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get current time
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())
        month_start = today_start.replace(day=1)

        # VIP Statistics
        total_vips = VIPPhone.objects.count()
        active_bookings = VIPPhone.objects.filter(booked=True).count()

        # Nomination Statistics
        pending_nominations = InvitedContact.objects.filter(approved=False).count()
        total_nominations = InvitedContact.objects.count()
        approved_nominations = InvitedContact.objects.filter(approved=True).count()

        # Booking Statistics
        total_reservations = BookingLog.objects.filter(
            provider=BookingLog.PROVIDER_CALENDLY
        ).count()

        scheduled_reservations = BookingLog.objects.filter(
            provider=BookingLog.PROVIDER_CALENDLY,
            status=BookingLog.STATUS_SCHEDULED
        ).count()

        canceled_reservations = BookingLog.objects.filter(
            provider=BookingLog.PROVIDER_CALENDLY,
            status=BookingLog.STATUS_CANCELED
        ).count()

        rescheduled_reservations = BookingLog.objects.filter(
            provider=BookingLog.PROVIDER_CALENDLY,
            status=BookingLog.STATUS_RESCHEDULED
        ).count()

        # Today's reservations
        today_reservations = BookingLog.objects.filter(
            provider=BookingLog.PROVIDER_CALENDLY,
            scheduled_at__gte=today_start,
            scheduled_at__lt=today_start + timedelta(days=1),
            status=BookingLog.STATUS_SCHEDULED
        ).count()

        # This week's reservations
        week_reservations = BookingLog.objects.filter(
            provider=BookingLog.PROVIDER_CALENDLY,
            scheduled_at__gte=week_start,
            scheduled_at__lt=week_start + timedelta(days=7),
            status=BookingLog.STATUS_SCHEDULED
        ).count()

        # This month's reservations
        month_reservations = BookingLog.objects.filter(
            provider=BookingLog.PROVIDER_CALENDLY,
            scheduled_at__gte=month_start,
            status=BookingLog.STATUS_SCHEDULED
        ).count()

        # Recent activity (last 7 days)
        recent_vips = VIPPhone.objects.filter(
            created_at__gte=now - timedelta(days=7)
        ).count()

        recent_reservations = BookingLog.objects.filter(
            provider=BookingLog.PROVIDER_CALENDLY,
            received_at__gte=now - timedelta(days=7)
        ).count()

        recent_nominations = InvitedContact.objects.filter(
            created_at__gte=now - timedelta(days=7)
        ).count()

        # Daily reservation trend (last 7 days)
        daily_trend = []
        for i in range(6, -1, -1):
            day_start = today_start - timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            count = BookingLog.objects.filter(
                provider=BookingLog.PROVIDER_CALENDLY,
                scheduled_at__gte=day_start,
                scheduled_at__lt=day_end,
                status=BookingLog.STATUS_SCHEDULED
            ).count()
            daily_trend.append({
                "date": day_start.strftime("%Y-%m-%d"),
                "count": count
            })

        # Status breakdown
        status_breakdown = {
            "scheduled": scheduled_reservations,
            "canceled": canceled_reservations,
            "rescheduled": rescheduled_reservations
        }

        return Response({
            "vip_stats": {
                "total": total_vips,
                "active_bookings": active_bookings,
                "recent_added": recent_vips
            },
            "nomination_stats": {
                "total": total_nominations,
                "pending": pending_nominations,
                "approved": approved_nominations,
                "recent": recent_nominations
            },
            "reservation_stats": {
                "total": total_reservations,
                "today": today_reservations,
                "week": week_reservations,
                "month": month_reservations,
                "recent": recent_reservations,
                "status_breakdown": status_breakdown
            },
            "trends": {
                "daily_reservations": daily_trend
            }
        }, status=status.HTTP_200_OK)
