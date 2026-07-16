from django.urls import path

from . import page_views


app_name = "learning_operations_pages"

urlpatterns = [
    path(
        "course-invitations/<str:token>/",
        page_views.course_invitation_page,
        name="invitation-accept",
    ),
    path(
        "instructor/programs/<int:program_id>/students/",
        page_views.instructor_course_students,
        name="course-students",
    ),
    path(
        "instructor/programs/<int:program_id>/students/<int:enrollment_id>/",
        page_views.instructor_course_learner,
        name="course-learner",
    ),
]
