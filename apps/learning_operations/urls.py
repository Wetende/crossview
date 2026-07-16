from django.urls import path

from . import views

app_name = "learning_operations"

urlpatterns = [
    path("student/", views.StudentOperationsView.as_view(), name="student"),
    path(
        "programs/<int:program_id>/delivery/",
        views.CourseDeliveryProfileView.as_view(),
        name="delivery",
    ),
    path(
        "programs/<int:program_id>/summary/",
        views.ProgramOperationsSummaryView.as_view(),
        name="summary",
    ),
    path(
        "programs/<int:program_id>/learners/",
        views.ProgramLearnersView.as_view(),
        name="learners",
    ),
    path(
        "programs/<int:program_id>/learners/<int:enrollment_id>/",
        views.ProgramLearnerDetailView.as_view(),
        name="learner-detail",
    ),
    path(
        "programs/<int:program_id>/engagement-matrix/",
        views.ProgramEngagementMatrixView.as_view(),
        name="engagement-matrix",
    ),
    path(
        "programs/<int:program_id>/revenue/",
        views.ProgramRevenueView.as_view(),
        name="revenue",
    ),
    path(
        "quiz-attempts/<int:attempt_id>/manual-grade/",
        views.ManualQuizGradeView.as_view(),
        name="manual-quiz-grade",
    ),
]

