import logging
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ImproperlyConfigured, PermissionDenied, ValidationError
from django.shortcuts import redirect
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.api_permissions import IsInstructorOrStaff
from .models import GoogleMeetSettings
from .oauth import build_authorization_url, complete_authorization, disconnect_workspace
from .serializers import GoogleMeetSettingsSerializer, OAuthConnectSerializer
from .services import require_connected_credential, serialize_connection

logger = logging.getLogger(__name__)


def _error(exc):
    message = exc.messages[0] if isinstance(exc, ValidationError) else str(exc)
    return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)


class GoogleWorkspaceConnectionView(APIView):
    permission_classes = [IsInstructorOrStaff]
    def get(self, request):
        return Response(serialize_connection(request.user))
    def post(self, request):
        serializer = OAuthConnectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            return Response({"authorizationUrl": build_authorization_url(request, serializer.validated_data["capabilities"], serializer.validated_data.get("returnTo", ""))})
        except (ImproperlyConfigured, ValueError) as exc:
            return _error(exc)
    def delete(self, request):
        try:
            disconnect_workspace(require_connected_credential(request.user))
        except (ValidationError, ValueError, RuntimeError) as exc:
            return _error(exc)
        return Response({"disconnected": True})


class GoogleMeetSettingsView(APIView):
    permission_classes = [IsInstructorOrStaff]
    def get(self, request):
        settings, _ = GoogleMeetSettings.objects.get_or_create(user=request.user)
        return Response(_serialize_settings(settings))
    def patch(self, request):
        settings, _ = GoogleMeetSettings.objects.get_or_create(user=request.user)
        serializer = GoogleMeetSettingsSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        fields = {"defaultTimezone": "default_timezone", "defaultReminderMinutes": "default_reminder_minutes", "defaultCalendarVisibility": "default_calendar_visibility", "defaultInviteLearners": "default_invite_learners"}
        for api_name, field in fields.items():
            if api_name in serializer.validated_data:
                setattr(settings, field, serializer.validated_data[api_name])
        settings.save()
        return Response(_serialize_settings(settings))


def _serialize_settings(settings):
    return {"defaultTimezone": settings.default_timezone, "defaultReminderMinutes": settings.default_reminder_minutes, "defaultCalendarVisibility": settings.default_calendar_visibility, "defaultInviteLearners": settings.default_invite_learners}


@login_required
def oauth_callback(request):
    if request.GET.get("error"):
        messages.error(request, "Google Workspace authorization was cancelled.")
        return redirect("/instructor/programs/")
    try:
        _, return_to = complete_authorization(request, state=request.GET.get("state", ""), code=request.GET.get("code", ""))
    except (PermissionDenied, ValidationError, ImproperlyConfigured, ValueError) as exc:
        logger.warning("Google Workspace authorization failed: %s", exc)
        messages.error(request, str(exc))
        return redirect("/instructor/programs/")
    except Exception:
        logger.exception("Unexpected Google Workspace OAuth callback failure")
        messages.error(request, "Google Workspace authorization could not be completed. Check the configured callback URL and server log.")
        return redirect("/instructor/programs/")
    messages.success(request, "Google Calendar connected. You can now create Google Meet lessons.")
    return redirect(return_to)
