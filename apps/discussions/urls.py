from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DiscussionThreadViewSet, DiscussionPostViewSet

app_name = 'discussions'

router = DefaultRouter()
router.register(r'threads', DiscussionThreadViewSet, basename='discussionthread')
router.register(r'posts', DiscussionPostViewSet, basename='discussionpost')

urlpatterns = [
    path('api/', include(router.urls)),
]
