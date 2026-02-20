from django.contrib import admin
from .models import BookingLog


@admin.register(BookingLog)
class BookingLogAdmin(admin.ModelAdmin):
    list_display = ("provider", "event_type", "phone", "received_at")
    list_filter = ("event_type", "provider")
    search_fields = ("phone", "event_type")
    readonly_fields = ("received_at",)
