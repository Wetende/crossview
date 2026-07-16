from django.contrib import admin

from .models import (
    CourseDeliveryProfile,
    EnrollmentLearningActivity,
    LearningActivityDay,
    ManualQuizGrade,
)


admin.site.register(CourseDeliveryProfile)
admin.site.register(EnrollmentLearningActivity)
admin.site.register(LearningActivityDay)
admin.site.register(ManualQuizGrade)
