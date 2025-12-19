"""
Content models - PDF parsing and content optimization.
"""
from django.db import models


class ContentVersion(models.Model):
    """
    Represents a version of parsed content from a PDF upload.
    Tracks source file, parsing status, and versioning for curriculum nodes.
    """
    node = models.ForeignKey(
        'curriculum.CurriculumNode',
        on_delete=models.CASCADE,
        related_name='content_versions'
    )
    version = models.PositiveIntegerField(default=1)
    source_file_path = models.CharField(max_length=500)
    source_file_name = models.CharField(max_length=255)
    page_count = models.PositiveIntegerField()
    is_published = models.BooleanField(default=False)
    is_manually_edited = models.BooleanField(default=False)
    parsed_at = models.DateTimeField(blank=True, null=True)
    published_at = models.DateTimeField(blank=True, null=True)
    metadata = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'content_versions'
        indexes = [
            models.Index(fields=['node', 'version'], name='content_ver_node_id_version_idx'),
            models.Index(fields=['is_published'], name='content_ver_is_published_idx'),
        ]

    def __str__(self):
        return f"ContentVersion {self.version} for {self.node}"

    @property
    def sessions(self):
        """Return session nodes created from this content version."""
        return self.node.children.filter(node_type='Session')


class ParsedImage(models.Model):
    """
    Represents an image extracted from a PDF during parsing.
    Stores both original and optimized versions for mobile delivery.
    """
    content_version = models.ForeignKey(
        ContentVersion,
        on_delete=models.CASCADE,
        related_name='parsed_images'
    )
    original_path = models.CharField(max_length=500)
    optimized_path = models.CharField(max_length=500)
    page_number = models.PositiveIntegerField()
    width = models.PositiveIntegerField(blank=True, null=True)
    height = models.PositiveIntegerField(blank=True, null=True)
    file_size = models.PositiveIntegerField(blank=True, null=True)

    class Meta:
        db_table = 'parsed_images'

    def __str__(self):
        return f"Image from page {self.page_number} of {self.content_version}"
