from django.contrib import admin
from .models import VIPPhone, OTPRequest


@admin.register(VIPPhone)
class VIPPhoneAdmin(admin.ModelAdmin):
    list_display = ("phone", "full_name", "booked", "bookings_count", "created_at")
    list_filter = ("booked",)
    search_fields = ("phone", "full_name")
    readonly_fields = ("created_at",)


@admin.register(OTPRequest)
class OTPRequestAdmin(admin.ModelAdmin):
    list_display = ("phone", "status", "attempts_count", "created_at", "expires_at")
    list_filter = ("status",)
    search_fields = ("phone",)
    readonly_fields = ("created_at", "expires_at", "last_sent_at")
