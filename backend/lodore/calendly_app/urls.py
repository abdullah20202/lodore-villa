from django.urls import path
from .views import CalendlyWebhookView

urlpatterns = [
    path("webhook", CalendlyWebhookView.as_view(), name="calendly-webhook"),
]
