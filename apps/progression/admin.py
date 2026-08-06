from django.contrib import admin
from .models import (
    Badge,
    Enrollment,
    EnrollmentIntent,
    LearningStreak,
    NodeCompletion,
    StudentBadge,
    StudentXP,
)


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ["user", "program", "status", "enrolled_at", "completed_at"]
    list_filter = ["status", "program"]
    search_fields = ["user__username", "user__email", "program__name"]
    ordering = ["-enrolled_at"]
    date_hierarchy = "enrolled_at"
    raw_id_fields = ["user", "program"]


@admin.register(EnrollmentIntent)
class EnrollmentIntentAdmin(admin.ModelAdmin):
    list_display = ["name", "email", "program", "status", "created_at"]
    list_filter = ["status", "program", "created_at"]
    search_fields = ["name", "email", "phone", "program__name"]
    raw_id_fields = ["user", "program", "order", "enrollment"]


@admin.register(NodeCompletion)
class NodeCompletionAdmin(admin.ModelAdmin):
    list_display = ["enrollment", "node", "completion_type", "completed_at"]
    list_filter = ["completion_type"]
    search_fields = ["enrollment__user__username", "node__title"]
    ordering = ["-completed_at"]
    date_hierarchy = "completed_at"
    raw_id_fields = ["enrollment", "node"]


admin.site.register(Badge)
admin.site.register(StudentBadge)
admin.site.register(StudentXP)
admin.site.register(LearningStreak)
