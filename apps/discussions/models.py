from django.db import models
from django.conf import settings
from apps.curriculum.models import CurriculumNode
from apps.core.models import TimeStampedModel

class DiscussionThread(TimeStampedModel):
    """
    Topic or question thread associated with a specific curriculum node.
    """
    node = models.ForeignKey(CurriculumNode, on_delete=models.CASCADE, related_name='discussion_threads')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    content = models.TextField()
    is_pinned = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} - {self.node.title}"

class DiscussionPost(TimeStampedModel):
    """
    Reply or post within a discussion thread.
    """
    thread = models.ForeignKey(DiscussionThread, on_delete=models.CASCADE, related_name='posts')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')

    def __str__(self):
        return f"Post by {self.user} in {self.thread.title}"
