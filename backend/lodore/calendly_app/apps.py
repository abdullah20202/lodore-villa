from django.apps import AppConfig


class CalendlyAppConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "lodore.calendly_app"
    label = "calendly_app"
    verbose_name = "Calendly Bookings"
