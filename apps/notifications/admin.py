from django.contrib import admin
from .models import Notification, NotificationEmailOutbox, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'recipient', 'notification_type', 'title', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'priority', 'created_at']
    search_fields = ['recipient__email', 'title', 'message']
    readonly_fields = ['created_at', 'read_at']
    ordering = ['-created_at']


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'in_app_enabled', 'email_enabled', 'email_digest']
    list_filter = ['in_app_enabled', 'email_enabled', 'email_digest']
    search_fields = ['user__email']


@admin.register(NotificationEmailOutbox)
class NotificationEmailOutboxAdmin(admin.ModelAdmin):
    list_display = ['recipient', 'notification_type', 'digest_mode', 'status', 'available_at']
    list_filter = ['digest_mode', 'status', 'notification_type']
    search_fields = ['recipient__email', 'subject', 'idempotency_key']
    readonly_fields = ['attempts', 'locked_at', 'sent_at', 'last_error']
