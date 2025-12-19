"""
Certifications app configuration.
"""
from django.apps import AppConfig


class CertificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.certifications'

    def ready(self):
        """Import signals when app is ready."""
        import apps.certifications.signals  # noqa: F401
