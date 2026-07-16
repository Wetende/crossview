"""Assessments app URLs."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'assessments'

router = DefaultRouter()
router.register(r'quizzes', views.QuizViewSet, basename='quiz')
router.register(r'questions', views.QuestionViewSet, basename='question')
router.register(r'question-bank', views.QuestionBankViewSet, basename='question-bank')

urlpatterns = [
    path('', include(router.urls)),
    path(
        'programs/<int:program_id>/question-library/',
        views.ProgramQuestionLibraryViewSet.as_view({'get': 'list'}),
        name='program-question-library',
    ),
    path(
        'programs/<int:program_id>/question-library/banks/',
        views.ProgramQuestionLibraryViewSet.as_view(
            {'get': 'banks', 'post': 'create_bank'}
        ),
        name='program-question-banks',
    ),
    path(
        'programs/<int:program_id>/question-library/banks/<int:pk>/',
        views.ProgramQuestionLibraryViewSet.as_view(
            {'get': 'bank_detail', 'patch': 'bank_detail', 'delete': 'bank_detail'}
        ),
        name='program-question-bank-detail',
    ),
    path(
        'programs/<int:program_id>/question-library/entries/',
        views.ProgramQuestionLibraryViewSet.as_view({'post': 'save_to_library'}),
        name='program-question-entry-create',
    ),
    path(
        'programs/<int:program_id>/question-library/entries/<int:pk>/',
        views.ProgramQuestionLibraryViewSet.as_view(
            {'get': 'entry_detail', 'patch': 'entry_detail', 'delete': 'entry_detail'}
        ),
        name='program-question-entry-detail',
    ),
    path(
        'programs/<int:program_id>/question-library/entries/<int:pk>/add-to-quiz/',
        views.ProgramQuestionLibraryViewSet.as_view({'post': 'add_to_quiz'}),
        name='program-question-entry-add-to-quiz',
    ),
    path(
        'programs/<int:program_id>/question-library/categories/',
        views.ProgramQuestionLibraryViewSet.as_view({'get': 'categories'}),
        name='program-question-categories',
    ),
    path(
        'programs/<int:program_id>/question-library/stats/',
        views.ProgramQuestionLibraryViewSet.as_view({'get': 'stats'}),
        name='program-question-library-stats',
    ),
    path('rubrics/', views.rubric_list, name='rubric_list'),
    path('rubrics/create/', views.rubric_create, name='rubric_create'),
    path('rubrics/<int:pk>/edit/', views.rubric_edit, name='rubric_edit'),
]

