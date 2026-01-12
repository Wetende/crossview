"""Content app URLs."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContentBlockViewSet

app_name = 'content'

router = DefaultRouter()
router.register(r'blocks', ContentBlockViewSet, basename='contentblock')

urlpatterns = [
    path('api/', include(router.urls)),
]
