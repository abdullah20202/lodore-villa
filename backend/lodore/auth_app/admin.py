from django.contrib import admin
from .models import VIPPhone, OTPRequest, InvitedContact

# Disable timezone selector in admin interface
admin.site.enable_tz_override = False


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


@admin.register(InvitedContact)
class InvitedContactAdmin(admin.ModelAdmin):
    list_display = ("invited_name", "invited_phone", "inviter_phone", "approved", "created_at")
    list_filter = ("approved", "created_at")
    search_fields = ("invited_name", "invited_phone", "inviter_phone")
    readonly_fields = ("created_at",)
    actions = ["approve_invitations", "add_to_vip_list"]

    def approve_invitations(self, request, queryset):
        """Mark selected invitations as approved"""
        updated = queryset.update(approved=True)
        self.message_user(request, f"{updated} invitation(s) approved.")
    approve_invitations.short_description = "Approve selected invitations"

    def add_to_vip_list(self, request, queryset):
        """Add approved invitations to VIP list"""
        added = 0
        for invitation in queryset.filter(approved=True):
            _, created = VIPPhone.objects.get_or_create(
                phone=invitation.invited_phone,
                defaults={"full_name": invitation.invited_name}
            )
            if created:
                added += 1
        self.message_user(request, f"{added} contact(s) added to VIP list.")
    add_to_vip_list.short_description = "Add approved to VIP list"
