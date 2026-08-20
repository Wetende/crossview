from rest_framework import serializers
from .configuration import SCOPES_BY_CAPABILITY


class OAuthConnectSerializer(serializers.Serializer):
    capabilities = serializers.ListField(child=serializers.ChoiceField(choices=sorted(SCOPES_BY_CAPABILITY)), required=False, default=list)
    returnTo = serializers.CharField(required=False, allow_blank=True, max_length=500)


class GoogleMeetSettingsSerializer(serializers.Serializer):
    defaultTimezone = serializers.CharField(required=False, max_length=64)
    defaultReminderMinutes = serializers.IntegerField(required=False, min_value=0, max_value=10080)
    defaultCalendarVisibility = serializers.ChoiceField(required=False, choices=["private", "default"])
    defaultInviteLearners = serializers.BooleanField(required=False)
