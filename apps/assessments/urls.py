"""Assessments app URLs."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'assessments'

router = DefaultRouter()
router.register(r'quizzes', views.QuizViewSet, basename='quiz')
router.register(r'questions', views.QuestionViewSet, basename='question')
router.register(r'question-bank', views.QuestionBankViewSet, basename='question-bank')

library = views.QuestionLibraryViewSet.as_view

urlpatterns = [
    path('', include(router.urls)),
    path(
        'question-library/banks/',
        library({'get': 'banks', 'post': 'create_bank'}),
        name='question-library-banks',
    ),
    path(
        'question-library/banks/<int:pk>/',
        library({'get': 'bank_detail', 'patch': 'bank_detail', 'delete': 'bank_detail'}),
        name='question-library-bank-detail',
    ),
    path(
        'question-library/banks/<int:pk>/promote/',
        library({'post': 'promote_bank'}),
        name='question-library-bank-promote',
    ),
    path(
        'question-library/entries/',
        library({'get': 'list', 'post': 'save_to_library'}),
        name='question-library-entries',
    ),
    path(
        'question-library/entries/<int:pk>/',
        library({'get': 'entry_detail', 'patch': 'entry_detail', 'delete': 'entry_detail'}),
        name='question-library-entry-detail',
    ),
    path(
        'question-library/entries/<int:pk>/add-to-quiz/',
        library({'post': 'add_to_quiz'}),
        name='question-library-entry-add-to-quiz',
    ),
    path(
        'question-library/categories/',
        library({'get': 'categories'}),
        name='question-library-categories',
    ),
    path(
        'question-library/stats/',
        library({'get': 'stats'}),
        name='question-library-stats',
    ),
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

