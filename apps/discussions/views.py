from rest_framework import filters, mixins, serializers, viewsets
from django_filters.rest_framework import DjangoFilterBackend

from apps.core.api_permissions import (
    IsInstructorOrStaff,
    get_object_in_instructor_scope,
    scope_queryset_to_instructor_programs,
)
from apps.curriculum.models import CurriculumNode
from .models import DiscussionThread, DiscussionPost
from .serializers import DiscussionThreadSerializer, DiscussionPostSerializer


class DiscussionThreadViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """
    API for managing discussion threads.
    Filter by user or node_id.
    """
    queryset = DiscussionThread.objects.all().order_by('-is_pinned', '-created_at')
    serializer_class = DiscussionThreadSerializer
    permission_classes = [IsInstructorOrStaff]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['node', 'user']
    search_fields = ['title', 'content']

    def get_queryset(self):
        queryset = DiscussionThread.objects.select_related(
            "node",
            "node__program",
            "user",
        ).order_by("-is_pinned", "-created_at")
        return scope_queryset_to_instructor_programs(
            queryset,
            self.request.user,
            "node__program_id",
        )

    def _get_accessible_node(self, node):
        node_id = getattr(node, "pk", node)
        return get_object_in_instructor_scope(
            CurriculumNode.objects.select_related("program"),
            self.request.user,
            "program_id",
            pk=node_id,
        )

    def perform_create(self, serializer):
        node = self._get_accessible_node(serializer.validated_data["node"])
        serializer.save(user=self.request.user, node=node)


class DiscussionPostViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """
    API for managing discussion posts (replies).
    Filter by thread_id.
    """
    queryset = DiscussionPost.objects.all().order_by('created_at')
    serializer_class = DiscussionPostSerializer
    permission_classes = [IsInstructorOrStaff]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['thread', 'user']

    def get_queryset(self):
        queryset = DiscussionPost.objects.select_related(
            "thread",
            "thread__node",
            "thread__node__program",
            "user",
            "parent",
        ).order_by("created_at")
        return scope_queryset_to_instructor_programs(
            queryset,
            self.request.user,
            "thread__node__program_id",
        )

    def _get_accessible_thread(self, thread):
        thread_id = getattr(thread, "pk", thread)
        return get_object_in_instructor_scope(
            DiscussionThread.objects.select_related("node", "node__program"),
            self.request.user,
            "node__program_id",
            pk=thread_id,
        )

    def _get_accessible_parent(self, parent, thread):
        if parent is None:
            return None

        parent_id = getattr(parent, "pk", parent)
        parent_post = get_object_in_instructor_scope(
            DiscussionPost.objects.select_related("thread", "thread__node", "thread__node__program"),
            self.request.user,
            "thread__node__program_id",
            pk=parent_id,
        )
        if parent_post.thread_id != thread.id:
            raise serializers.ValidationError(
                {"parent": "Parent post must belong to the selected thread."}
            )
        return parent_post

    def perform_create(self, serializer):
        thread = self._get_accessible_thread(serializer.validated_data["thread"])
        if thread.is_locked:
            raise serializers.ValidationError(
                {"thread": "This discussion is locked."}
            )

        parent = self._get_accessible_parent(
            serializer.validated_data.get("parent"),
            thread,
        )
        serializer.save(user=self.request.user, thread=thread, parent=parent)
