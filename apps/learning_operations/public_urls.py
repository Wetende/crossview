from django.urls import path

from . import page_views


app_name = "learning_operations_pages"

urlpatterns = [
    path(
        "course-invitations/<str:token>/",
        page_views.course_invitation_page,
        name="invitation-accept",
    ),
]
