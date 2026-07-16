from django.apps import AppConfig


class LearningOperationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.learning_operations"
    verbose_name = "Learning Operations"

    def ready(self):
        from . import signals  # noqa: F401

