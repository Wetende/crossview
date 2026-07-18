from django.apps import AppConfig


class GoogleClassroomConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.google_classroom"
    verbose_name = "Google Classroom"

    def ready(self):
        from . import signals  # noqa: F401
