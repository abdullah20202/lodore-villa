"""
BookingLog model — stores every Calendly webhook event.
"""
from django.db import models


class BookingLog(models.Model):
    PROVIDER_CALENDLY = "calendly"

    provider = models.CharField(max_length=50, default=PROVIDER_CALENDLY)
    event_type = models.CharField(max_length=100, blank=True, default="")
    # Raw JSON payload from webhook
    payload = models.JSONField()
    received_at = models.DateTimeField(auto_now_add=True)
    # Extracted phone if available (normalized)
    phone = models.CharField(max_length=20, blank=True, default="", db_index=True)

    class Meta:
        verbose_name = "Booking Log"
        verbose_name_plural = "Booking Logs"
        ordering = ["-received_at"]

    def __str__(self):
        return f"{self.provider} | {self.event_type} | {self.phone} @ {self.received_at:%Y-%m-%d %H:%M}"
