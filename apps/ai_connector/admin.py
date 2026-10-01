from django.contrib import admin

from .models import CourseChange


@admin.register(CourseChange)
class CourseChangeAdmin(admin.ModelAdmin):
    """Read-only audit trail of changes requested through AI apps."""

    list_display = ("created_at", "kind", "program_code", "summary", "user_email", "client_name", "status")
    list_filter = ("kind", "status", "affects_published_content")
    search_fields = ("summary", "program_code", "user_email", "client_name")
    date_hierarchy = "created_at"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
