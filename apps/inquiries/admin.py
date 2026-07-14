from django.contrib import admin
from django.utils import timezone

from .models import Inquiry


@admin.register(Inquiry)
class InquiryAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "kind",
        "program",
        "status",
        "notification_sent_at",
        "created_at",
    )
    list_filter = ("status", "kind", "created_at")
    search_fields = ("name", "email", "phone", "subject", "message", "program__name")
    readonly_fields = (
        "created_at",
        "updated_at",
        "notification_sent_at",
        "notification_error",
    )
    list_select_related = ("program", "submitted_by", "resolved_by")
    actions = ("mark_in_progress", "mark_resolved", "mark_as_spam")

    @admin.action(description="Mark selected inquiries as in progress")
    def mark_in_progress(self, request, queryset):
        queryset.update(
            status=Inquiry.Status.IN_PROGRESS,
            resolved_by=None,
            resolved_at=None,
            updated_at=timezone.now(),
        )

    @admin.action(description="Mark selected inquiries as resolved")
    def mark_resolved(self, request, queryset):
        queryset.update(
            status=Inquiry.Status.RESOLVED,
            resolved_by=request.user,
            resolved_at=timezone.now(),
            updated_at=timezone.now(),
        )

    @admin.action(description="Mark selected inquiries as spam")
    def mark_as_spam(self, request, queryset):
        queryset.update(
            status=Inquiry.Status.SPAM,
            resolved_by=request.user,
            resolved_at=timezone.now(),
            updated_at=timezone.now(),
        )
