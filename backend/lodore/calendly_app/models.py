"""
BookingLog model — stores every Calendly webhook event.
"""
from django.db import models


class BookingLog(models.Model):
    PROVIDER_CALENDLY = "calendly"

    STATUS_SCHEDULED = "scheduled"
    STATUS_CANCELED = "canceled"
    STATUS_RESCHEDULED = "rescheduled"

    STATUS_CHOICES = [
        (STATUS_SCHEDULED, "Scheduled"),
        (STATUS_CANCELED, "Canceled"),
        (STATUS_RESCHEDULED, "Rescheduled"),
    ]

    provider = models.CharField(max_length=50, default=PROVIDER_CALENDLY)
    event_type = models.CharField(max_length=100, blank=True, default="")
    # Raw JSON payload from webhook
    payload = models.JSONField()
    received_at = models.DateTimeField(auto_now_add=True)
    # Extracted phone if available (normalized)
    phone = models.CharField(max_length=20, blank=True, default="", db_index=True)
    # Guest details
    guest_name = models.CharField(max_length=200, blank=True, default="")
    guest_email = models.EmailField(max_length=254, blank=True, default="")
    # Reservation details
    scheduled_at = models.DateTimeField(null=True, blank=True, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_SCHEDULED, db_index=True)
    # Calendly event URI for tracking
    calendly_event_uri = models.CharField(max_length=500, blank=True, default="")

    class Meta:
        verbose_name = "Booking Log"
        verbose_name_plural = "Booking Logs"
        ordering = ["-received_at"]

    def __str__(self):
        return f"{self.provider} | {self.event_type} | {self.phone} @ {self.received_at:%Y-%m-%d %H:%M}"
