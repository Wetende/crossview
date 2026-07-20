from django.apps import AppConfig


class LiveSessionsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.live_sessions"
    verbose_name = "Scheduled learning sessions"
