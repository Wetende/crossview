from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import DiscussionThread, DiscussionPost
from .serializers import DiscussionThreadSerializer, DiscussionPostSerializer

class DiscussionThreadViewSet(viewsets.ModelViewSet):
    """
    API for managing discussion threads.
    Filter by user or node_id.
    """
    queryset = DiscussionThread.objects.all().order_by('-is_pinned', '-created_at')
    serializer_class = DiscussionThreadSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['node', 'user']
    search_fields = ['title', 'content']

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class DiscussionPostViewSet(viewsets.ModelViewSet):
    """
    API for managing discussion posts (replies).
    Filter by thread_id.
    """
    queryset = DiscussionPost.objects.all().order_by('created_at')
    serializer_class = DiscussionPostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['thread', 'user']

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
