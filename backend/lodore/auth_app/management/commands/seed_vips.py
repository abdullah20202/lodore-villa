"""
Management command: seed_vips

Inserts a small set of test VIP phone numbers for local development.
Safe to run multiple times (uses get_or_create).

Usage:
  python manage.py seed_vips
"""
from django.core.management.base import BaseCommand
from lodore.auth_app.models import VIPPhone

TEST_VIPS = [
    {"phone": "0512345678", "full_name": "محمد علي (Test)"},
    {"phone": "0523456789", "full_name": "سارة أحمد (Test)"},
    {"phone": "0598765432", "full_name": "خالد عمر (Test)"},
    {"phone": "0511111111", "full_name": "فاطمة خالد (Test)"},
    {"phone": "0522222222", "full_name": "عبدالله محمد (Test)"},
]


class Command(BaseCommand):
    help = "Seed test VIP phone numbers into the database (dev only)."

    def handle(self, *args, **options):
        self.stdout.write("Seeding test VIP phones...")
        for entry in TEST_VIPS:
            obj, created = VIPPhone.objects.get_or_create(
                phone=entry["phone"],
                defaults={"full_name": entry["full_name"]},
            )
            status = "Created" if created else "Already exists"
            self.stdout.write(
                self.style.SUCCESS(f"  {status}: {obj.phone} — {obj.full_name}")
            )

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(
            f"Done. {len(TEST_VIPS)} VIP phones available for testing."
        ))
        self.stdout.write(self.style.WARNING(
            "Use any of the above phones on /verify.\n"
            "OTP code (mock mode): 123456"
        ))
