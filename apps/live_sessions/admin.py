from django.contrib import admin

from .models import (
    LiveSessionSyncJob,
    ScheduledLearningSession,
    SessionAttendance,
    SessionAttendanceAudit,
)


admin.site.register(ScheduledLearningSession)
admin.site.register(SessionAttendance)
admin.site.register(SessionAttendanceAudit)
admin.site.register(LiveSessionSyncJob)
