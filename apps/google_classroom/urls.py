from django.urls import path

from . import views

app_name = "google_classroom"

urlpatterns = [
    path("connection/", views.ClassroomConnectionView.as_view(), name="connection"),
    path("oauth/callback/", views.oauth_callback, name="oauth-callback"),
    path("courses/", views.ClassroomCoursesView.as_view(), name="courses"),
    path("programs/<int:program_id>/", views.ClassroomCourseLinkView.as_view(), name="course-link"),
    path("programs/<int:program_id>/roster/preview/", views.ClassroomRosterPreviewView.as_view(), name="roster-preview"),
    path("programs/<int:program_id>/roster/apply/", views.ClassroomRosterApplyView.as_view(), name="roster-apply"),
    path("programs/<int:program_id>/resources/publish/", views.ClassroomResourcePublishView.as_view(), name="resource-publish"),
    path("programs/<int:program_id>/resources/<int:mapping_id>/", views.ClassroomResourceUnlinkView.as_view(), name="resource-unlink"),
    path("programs/<int:program_id>/sync/preview/", views.ClassroomSyncPreviewView.as_view(), name="sync-preview"),
    path("programs/<int:program_id>/sync/", views.ClassroomSyncNowView.as_view(), name="sync-now"),
    path("programs/<int:program_id>/history/", views.ClassroomSyncHistoryView.as_view(), name="history"),
]
