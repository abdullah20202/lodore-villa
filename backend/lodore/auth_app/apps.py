from django.apps import AppConfig


class AuthAppConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "lodore.auth_app"
    label = "auth_app"
    verbose_name = "Auth & VIP"
