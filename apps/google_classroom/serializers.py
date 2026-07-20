from rest_framework import serializers

from .configuration import SCOPES_BY_CAPABILITY


class OAuthConnectSerializer(serializers.Serializer):
    capabilities = serializers.ListField(
        child=serializers.ChoiceField(choices=sorted(SCOPES_BY_CAPABILITY)),
        required=False,
        default=list,
        max_length=len(SCOPES_BY_CAPABILITY),
    )
    returnTo = serializers.CharField(required=False, allow_blank=True, max_length=500)


class ClassroomCourseCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    section = serializers.CharField(required=False, allow_blank=True, max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, max_length=5000)


class ClassroomCourseLinkSerializer(serializers.Serializer):
    courseId = serializers.CharField(max_length=255)


class RosterPreviewSerializer(serializers.Serializer):
    direction = serializers.ChoiceField(
        choices=["google_to_lms", "lms_to_google", "both"], default="both"
    )


class RosterApplySerializer(serializers.Serializer):
    confirmationToken = serializers.CharField(max_length=255)


class ClassroomResourceSerializer(serializers.Serializer):
    localType = serializers.ChoiceField(
        choices=["lesson", "assignment", "quiz", "announcement", "topic"]
    )
    localId = serializers.CharField(max_length=255)
    force = serializers.BooleanField(required=False, default=False)


class ResourcePublishSerializer(serializers.Serializer):
    resources = ClassroomResourceSerializer(many=True, allow_empty=False)
