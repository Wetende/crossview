"""
Curriculum models - Curriculum nodes and tree structure.
Migrated from Laravel CurriculumNode model.
"""
from django.db import models
from django.core.exceptions import ValidationError


class CurriculumNode(models.Model):
    """
    Represents a node in the curriculum tree structure.
    Supports hierarchical organization with self-referencing parent.
    """
    program = models.ForeignKey(
        'core.Program',
        on_delete=models.CASCADE,
        related_name='curriculum_nodes'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children'
    )
    node_type = models.CharField(max_length=50)  # e.g., "Year", "Unit", "Session"
    title = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    properties = models.JSONField(default=dict, blank=True)  # Flexible properties storage
    completion_rules = models.JSONField(default=dict, blank=True)  # Rules for completion
    position = models.PositiveIntegerField(default=0)  # Order among siblings
    is_published = models.BooleanField(default=False)
    
    # Scheduling Fields (Phase 2)
    unlock_date = models.DateTimeField(null=True, blank=True, help_text='Absolute date when content unlocks')
    unlock_after_days = models.PositiveIntegerField(null=True, blank=True, help_text='Days after enrollment to unlock')
    is_preview = models.BooleanField(default=False, help_text='Allow non-enrolled users to view')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'curriculum_nodes'
        ordering = ['position']
        indexes = [
            models.Index(fields=['program', 'parent']),
            models.Index(fields=['node_type']),
        ]

    def __str__(self):
        return f"{self.node_type}: {self.title}"

    def get_depth(self) -> int:
        """Calculate the depth of this node in the tree (0 = root)."""
        depth = 0
        node = self
        while node.parent is not None:
            depth += 1
            node = node.parent
        return depth

    def get_label(self) -> str:
        """Get the label for this node's type from the blueprint."""
        if self.program and self.program.blueprint:
            try:
                return self.program.blueprint.get_label_for_depth(self.get_depth())
            except (ValueError, IndexError):
                pass
        return self.node_type

    def get_ancestors(self):
        """Return list of ancestor nodes from root to parent."""
        ancestors = []
        node = self.parent
        while node is not None:
            ancestors.insert(0, node)
            node = node.parent
        return ancestors

    def get_descendants(self):
        """Return all descendant nodes recursively."""
        descendants = []
        for child in self.children.all():
            descendants.append(child)
            descendants.extend(child.get_descendants())
        return descendants

    def clean(self):
        """Validate node against blueprint constraints."""
        from apps.curriculum.exceptions import InvalidNodeTypeException, MaxDepthExceededException
        
        if self.program and self.program.blueprint:
            blueprint = self.program.blueprint
            hierarchy = blueprint.hierarchy_structure or []
            
            # Validate node_type exists in hierarchy
            if self.node_type not in hierarchy:
                raise InvalidNodeTypeException(
                    f"Node type '{self.node_type}' is not valid for this blueprint. "
                    f"Valid types: {hierarchy}"
                )
            
            # Validate depth doesn't exceed hierarchy
            depth = self.get_depth()
            if depth >= len(hierarchy):
                raise MaxDepthExceededException(
                    f"Node depth {depth} exceeds maximum allowed depth {len(hierarchy) - 1}"
                )

    def save(self, *args, **kwargs):
        # Skip validation if skip_validation is passed
        if not kwargs.pop('skip_validation', False):
            self.full_clean()
        super().save(*args, **kwargs)


class CourseChangeRequest(models.Model):
    """
    Admin feedback on submitted course/program.
    Used in the course vetting workflow to request specific changes.
    """
    program = models.ForeignKey(
        'core.Program',
        on_delete=models.CASCADE,
        related_name='change_requests'
    )
    node = models.ForeignKey(
        'CurriculumNode',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='change_requests',
        help_text='Specific node the feedback relates to (optional)'
    )
    message = models.TextField()
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        'core.User',
        on_delete=models.CASCADE,
        related_name='created_change_requests'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'course_change_requests'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['program', 'is_resolved']),
        ]

    def __str__(self):
        target = f"for {self.node}" if self.node else f"for {self.program}"
        return f"Change Request {target}"

