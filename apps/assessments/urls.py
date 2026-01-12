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
]
