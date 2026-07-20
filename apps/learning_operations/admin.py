from django.contrib import admin

from .models import (
    AssessmentAttemptGrant,
    CourseDeliveryProfile,
    CourseEngagementPolicy,
    CourseInvitation,
    EnrollmentLearningActivity,
    LearnerManagementAudit,
    LearnerReminderEvent,
    LearningActivityDay,
    ManualQuizGrade,
)


admin.site.register(CourseDeliveryProfile)
admin.site.register(CourseEngagementPolicy)
admin.site.register(EnrollmentLearningActivity)
admin.site.register(LearningActivityDay)
admin.site.register(ManualQuizGrade)
admin.site.register(CourseInvitation)
admin.site.register(LearnerManagementAudit)
admin.site.register(LearnerReminderEvent)
admin.site.register(AssessmentAttemptGrant)
