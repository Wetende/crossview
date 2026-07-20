from rest_framework import serializers

from .models import CourseDeliveryProfile, ManualQuizGrade


class CourseDeliveryProfileSerializer(serializers.ModelSerializer):
    deliveryMode = serializers.ChoiceField(
        source="delivery_mode",
        choices=CourseDeliveryProfile.DELIVERY_MODE_CHOICES,
    )
    gamificationOptIn = serializers.BooleanField(
        source="gamification_opt_in", required=False
    )
    gamification_opt_in = serializers.BooleanField(read_only=True)

    def to_internal_value(self, data):
        values = data.copy()
        if "gamification_opt_in" in values and "gamificationOptIn" not in values:
            values["gamificationOptIn"] = values["gamification_opt_in"]
        return super().to_internal_value(values)

    class Meta:
        model = CourseDeliveryProfile
        fields = ["deliveryMode", "gamificationOptIn", "gamification_opt_in"]


class CourseEngagementPolicySerializer(serializers.Serializer):
    assignmentRemindersEnabled = serializers.BooleanField(required=False)
    assignmentOffsets = serializers.ListField(
        child=serializers.IntegerField(), required=False, min_length=1, max_length=20
    )
    expiryRemindersEnabled = serializers.BooleanField(required=False)
    expiryOffsets = serializers.ListField(
        child=serializers.IntegerField(), required=False, min_length=1, max_length=20
    )
    inactivityRemindersEnabled = serializers.BooleanField(required=False)
    inactivityOffsets = serializers.ListField(
        child=serializers.IntegerField(), required=False, min_length=1, max_length=20
    )


class LearnerListQuerySerializer(serializers.Serializer):
    state = serializers.CharField(required=False, allow_blank=True, max_length=32)
    search = serializers.CharField(required=False, allow_blank=True, max_length=255)
    offset = serializers.IntegerField(required=False, default=0, min_value=0)
    limit = serializers.IntegerField(required=False, default=25, min_value=1, max_value=100)


class LearnerDetailQuerySerializer(serializers.Serializer):
    curriculumOffset = serializers.IntegerField(required=False, default=0, min_value=0)
    curriculumLimit = serializers.IntegerField(
        required=False, default=25, min_value=1, max_value=100
    )


class EngagementMatrixQuerySerializer(serializers.Serializer):
    enrollmentOffset = serializers.IntegerField(required=False, default=0, min_value=0)
    enrollmentLimit = serializers.IntegerField(required=False, default=25, min_value=1, max_value=50)
    nodeOffset = serializers.IntegerField(required=False, default=0, min_value=0)
    nodeLimit = serializers.IntegerField(required=False, default=25, min_value=1, max_value=50)


class ManualQuizGradeWriteSerializer(serializers.Serializer):
    questionId = serializers.IntegerField(min_value=1, required=False)
    questionKey = serializers.IntegerField(required=False)
    pointsAwarded = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    feedback = serializers.CharField(required=False, allow_blank=True, max_length=5000)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if ("questionId" in attrs) == ("questionKey" in attrs):
            raise serializers.ValidationError(
                "Provide exactly one of questionId or questionKey."
            )
        return attrs


class ManualQuizGradeReadSerializer(serializers.ModelSerializer):
    questionId = serializers.IntegerField(source="question_id")
    pointsAwarded = serializers.DecimalField(
        source="points_awarded", max_digits=10, decimal_places=2
    )
    gradedAt = serializers.DateTimeField(source="graded_at")
    gradedBy = serializers.SerializerMethodField()

    class Meta:
        model = ManualQuizGrade
        fields = ["questionId", "pointsAwarded", "feedback", "gradedAt", "gradedBy"]

    def get_gradedBy(self, obj):
        if not obj.graded_by:
            return None
        return {
            "id": obj.graded_by_id,
            "name": obj.graded_by.get_full_name() or obj.graded_by.email,
        }


class LearnerInviteSerializer(serializers.Serializer):
    email = serializers.EmailField()


class RosterRowsSerializer(serializers.Serializer):
    rows = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True,
        max_length=2000,
    )
    confirmationToken = serializers.CharField(required=False, allow_blank=True)


class InvitationBulkActionSerializer(serializers.Serializer):
    invitationIds = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        min_length=1,
        max_length=500,
    )
    action = serializers.ChoiceField(choices=["resend", "revoke"])


class BulkLearnerActionSerializer(serializers.Serializer):
    enrollmentIds = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        min_length=1,
        max_length=500,
    )
    action = serializers.ChoiceField(
        choices=["activate", "suspend", "withdraw", "reactivate", "send_reminder"]
    )
    reason = serializers.CharField(required=False, allow_blank=True, max_length=2000)
    preview = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if attrs.get("action") == "withdraw" and not str(
            attrs.get("reason") or ""
        ).strip():
            raise serializers.ValidationError(
                {"reason": "Give a reason for withdrawing a learner."}
            )
        return attrs


class ProgressAdjustmentSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, max_length=2000)


class AssignmentReturnSerializer(ProgressAdjustmentSerializer):
    feedback = serializers.CharField(required=False, allow_blank=True, max_length=5000)


class InvitationAcceptanceSerializer(serializers.Serializer):
    firstName = serializers.CharField(required=False, allow_blank=True, max_length=150)
    lastName = serializers.CharField(required=False, allow_blank=True, max_length=150)
    password = serializers.CharField(required=False, allow_blank=True, write_only=True)
