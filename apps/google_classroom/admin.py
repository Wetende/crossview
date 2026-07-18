from django.contrib import admin

from .models import (
    ClassroomCourseLink,
    ClassroomGradeSync,
    ClassroomOAuthCredential,
    ClassroomResourceMapping,
    ClassroomRosterMapping,
    ClassroomRosterPreview,
    ClassroomSyncAudit,
    ClassroomSyncJob,
)


admin.site.register(ClassroomOAuthCredential)
admin.site.register(ClassroomCourseLink)
admin.site.register(ClassroomRosterMapping)
admin.site.register(ClassroomResourceMapping)
admin.site.register(ClassroomSyncJob)
admin.site.register(ClassroomGradeSync)
admin.site.register(ClassroomRosterPreview)
admin.site.register(ClassroomSyncAudit)
