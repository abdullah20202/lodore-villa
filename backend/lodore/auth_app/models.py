"""
Models for Lodore Villa VIP Booking System.
"""
from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.conf import settings


class VIPPhone(models.Model):
    """
    Stores whitelisted VIP phone numbers (normalized to 05xxxxxxxx format).
    """
    phone = models.CharField(max_length=20, unique=True, db_index=True)
    full_name = models.CharField(max_length=200, blank=True, default="")
    email = models.EmailField(max_length=254, blank=True, default="")
    booked = models.BooleanField(default=False)
    bookings_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "VIP Phone"
        verbose_name_plural = "VIP Phones"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.phone} ({self.full_name or 'Unknown'})"


class InvitedContact(models.Model):
    """
    Stores contacts invited by VIP customers.
    Requires admin approval before being added to VIP list.
    """
    STATUS_PENDING = "pending"
    STATUS_CONTACTED = "contacted"
    STATUS_INVITED = "invited"
    STATUS_CONFIRMED = "confirmed"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_CONTACTED, "Contacted"),
        (STATUS_INVITED, "Invited"),
        (STATUS_CONFIRMED, "Confirmed"),
    ]

    inviter_phone = models.CharField(max_length=20, db_index=True)
    invited_phone = models.CharField(max_length=20, db_index=True)
    invited_name = models.CharField(max_length=200)
    approved = models.BooleanField(default=False)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Invited Contact"
        verbose_name_plural = "Invited Contacts"
        ordering = ["-created_at"]
        unique_together = [["inviter_phone", "invited_phone"]]

    def __str__(self):
        approved_text = "✓ Approved" if self.approved else "⏳ Pending"
        return f"{self.invited_name} ({self.invited_phone}) - {self.get_status_display()} - {approved_text}"


class OTPRequest(models.Model):
    """
    Tracks OTP send/verify cycles.
    """
    STATUS_PENDING = "pending"
    STATUS_VERIFIED = "verified"
    STATUS_FAILED = "failed"
    STATUS_EXPIRED = "expired"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_VERIFIED, "Verified"),
        (STATUS_FAILED, "Failed"),
        (STATUS_EXPIRED, "Expired"),
    ]

    phone = models.CharField(max_length=20, db_index=True)
    # Reference ID returned by Unifonic after sending OTP
    reference_id = models.CharField(max_length=255, blank=True, default="")
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    attempts_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    last_sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "OTP Request"
        verbose_name_plural = "OTP Requests"
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.pk:
            expiry_minutes = getattr(settings, "OTP_EXPIRY_MINUTES", 5)
            self.expires_at = timezone.now() + timedelta(minutes=expiry_minutes)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_verified(self):
        return self.status == self.STATUS_VERIFIED

    def __str__(self):
        return f"OTP {self.phone} [{self.status}] @ {self.created_at:%Y-%m-%d %H:%M}"
