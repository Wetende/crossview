from rest_framework import serializers

from .models import ScheduledLearningSession, SessionAttendance


class ScheduledLearningSessionWriteSerializer(serializers.Serializer):
    kind = serializers.ChoiceField(choices=ScheduledLearningSession.Kind.choices)
    provider = serializers.ChoiceField(choices=ScheduledLearningSession.Provider.choices)
    title = serializers.CharField(required=False, max_length=255)
    summary = serializers.CharField(required=False, allow_blank=True, max_length=10_000)
    startsAt = serializers.DateTimeField()
    endsAt = serializers.DateTimeField()
    timezone = serializers.CharField(max_length=64)
    joinUrl = serializers.URLField(required=False, allow_blank=True, max_length=1000)
    recordingUrl = serializers.URLField(required=False, allow_blank=True, max_length=1000)
    meetingPassword = serializers.CharField(
        required=False, allow_blank=True, max_length=255, write_only=True
    )
    clearMeetingPassword = serializers.BooleanField(required=False, default=False)
    venue = serializers.CharField(required=False, allow_blank=True, max_length=255)
    room = serializers.CharField(required=False, allow_blank=True, max_length=255)
    address = serializers.CharField(required=False, allow_blank=True, max_length=2000)
    directions = serializers.CharField(required=False, allow_blank=True, max_length=5000)
    attendanceInstructions = serializers.CharField(
        required=False, allow_blank=True, max_length=5000
    )

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if attrs["endsAt"] <= attrs["startsAt"]:
            raise serializers.ValidationError(
                {"endsAt": "Session end time must be after its start time."}
            )
        return attrs


class AttendanceOverrideSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[
            SessionAttendance.Status.PRESENT,
            SessionAttendance.Status.ABSENT,
            SessionAttendance.Status.EXCUSED,
        ]
    )
    reason = serializers.CharField(max_length=2000)
