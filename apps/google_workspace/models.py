from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class GoogleWorkspaceCredential(TimeStampedModel):
    class Status(models.TextChoices):
        CONNECTED = "connected", "Connected"
        INVALID = "invalid", "Invalid"
        REVOKED = "revoked", "Revoked"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="google_workspace_credential")
    google_user_id = models.CharField(max_length=255, blank=True, default="")
    google_email = models.EmailField(blank=True, default="")
    refresh_token_ciphertext = models.TextField(blank=True, default="")
    granted_scopes = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.CONNECTED)
    last_error = models.TextField(blank=True, default="")
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "google_workspace_oauth_credentials"


class GoogleMeetSettings(TimeStampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="google_meet_settings")
    default_timezone = models.CharField(max_length=64, default="Africa/Nairobi")
    default_reminder_minutes = models.PositiveSmallIntegerField(default=10)
    default_calendar_visibility = models.CharField(max_length=16, choices=[("private", "Private"), ("default", "Calendar default")], default="private")
    default_invite_learners = models.BooleanField(default=False)

    class Meta:
        db_table = "google_workspace_meet_settings"


class GoogleParticipantIdentity(TimeStampedModel):
    """A deliberate administrator/instructor mapping, never inferred from names."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="google_participant_identities")
    google_user_id = models.CharField(max_length=255, unique=True)
    verified_email = models.EmailField(blank=True, default="")
    source = models.CharField(max_length=32, default="manual_mapping")
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="verified_google_participant_identities")

    class Meta:
        db_table = "google_workspace_participant_identities"
