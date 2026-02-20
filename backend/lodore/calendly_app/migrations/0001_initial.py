from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="BookingLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("provider", models.CharField(default="calendly", max_length=50)),
                ("event_type", models.CharField(blank=True, default="", max_length=100)),
                ("payload", models.JSONField()),
                ("received_at", models.DateTimeField(auto_now_add=True)),
                ("phone", models.CharField(blank=True, db_index=True, default="", max_length=20)),
            ],
            options={
                "verbose_name": "Booking Log",
                "verbose_name_plural": "Booking Logs",
                "ordering": ["-received_at"],
            },
        ),
    ]
