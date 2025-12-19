"""
Blueprint models - Academic blueprints configuration.
Migrated from Laravel AcademicBlueprint model.
"""
from django.db import models
from django.core.exceptions import ValidationError

from apps.tenants.managers import TenantManager, AllTenantsManager


class AcademicBlueprint(models.Model):
    """
    Configuration object defining hierarchy labels, grading logic, and progression rules.
    """
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='blueprints'
    )
    
    # Tenant-aware managers
    objects = TenantManager()
    all_objects = AllTenantsManager()
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    hierarchy_structure = models.JSONField()  # ["Year", "Unit", "Session"]
    grading_logic = models.JSONField()  # {"type": "weighted", "components": [...]}
    progression_rules = models.JSONField(blank=True, null=True)
    gamification_enabled = models.BooleanField(default=False)
    certificate_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'academic_blueprints'
        indexes = [models.Index(fields=['name'])]

    def __str__(self):
        return self.name

    def get_hierarchy_depth(self) -> int:
        """Return the number of levels in the hierarchy."""
        return len(self.hierarchy_structure) if self.hierarchy_structure else 0

    def get_label_for_depth(self, depth: int) -> str:
        """Return the label for a specific depth level."""
        if self.hierarchy_structure and 0 <= depth < len(self.hierarchy_structure):
            return self.hierarchy_structure[depth]
        raise ValueError(f"Invalid depth {depth} for hierarchy with {self.get_hierarchy_depth()} levels")

    def clean(self):
        """Validate blueprint configuration."""
        from apps.blueprints.services import BlueprintValidationService
        validator = BlueprintValidationService()
        validator.validate_hierarchy_structure(self.hierarchy_structure)
        validator.validate_grading_logic(self.grading_logic)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Prevent deletion if programs are associated."""
        from apps.blueprints.exceptions import BlueprintInUseException
        
        if self.programs.exists():
            raise BlueprintInUseException(
                f"Cannot delete blueprint '{self.name}' because it has {self.programs.count()} associated program(s)"
            )
        super().delete(*args, **kwargs)
