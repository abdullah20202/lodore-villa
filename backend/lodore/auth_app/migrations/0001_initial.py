from django.db import migrations, models
import django.utils.timezone
from datetime import timedelta


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="VIPPhone",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("phone", models.CharField(db_index=True, max_length=20, unique=True)),
                ("full_name", models.CharField(blank=True, default="", max_length=200)),
                ("booked", models.BooleanField(default=False)),
                ("bookings_count", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "VIP Phone",
                "verbose_name_plural": "VIP Phones",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="OTPRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("phone", models.CharField(db_index=True, max_length=20)),
                ("reference_id", models.CharField(blank=True, default="", max_length=255)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("verified", "Verified"),
                            ("failed", "Failed"),
                            ("expired", "Expired"),
                        ],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("attempts_count", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("expires_at", models.DateTimeField()),
                ("last_sent_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "OTP Request",
                "verbose_name_plural": "OTP Requests",
                "ordering": ["-created_at"],
            },
        ),
    ]
