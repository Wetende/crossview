"""
Tenant models - Multi-tenancy support.
"""
from django.db import models


class SubscriptionTier(models.Model):
    """Subscription tier for tenants."""
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    max_students = models.IntegerField(default=100)
    max_storage_mb = models.IntegerField(default=5000)
    max_programs = models.IntegerField(default=10)
    price_monthly = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    features = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'subscription_tiers'

    def __str__(self):
        return self.name


class Tenant(models.Model):
    """Tenant model for multi-tenancy."""
    name = models.CharField(max_length=255)
    subdomain = models.CharField(max_length=100, unique=True)
    admin_email = models.EmailField()
    subscription_tier = models.ForeignKey(
        SubscriptionTier,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tenants'
    )
    is_active = models.BooleanField(default=True)
    settings = models.JSONField(default=dict, blank=True)
    activated_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tenants'
        indexes = [
            models.Index(fields=['subdomain']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name


class TenantBranding(models.Model):
    """Branding configuration for a tenant."""
    tenant = models.OneToOneField(
        Tenant,
        on_delete=models.CASCADE,
        related_name='branding'
    )
    logo_path = models.CharField(max_length=500, blank=True, null=True)
    favicon_path = models.CharField(max_length=500, blank=True, null=True)
    primary_color = models.CharField(max_length=7, default='#3B82F6')  # Hex color
    secondary_color = models.CharField(max_length=7, default='#1E40AF')
    institution_name = models.CharField(max_length=255, blank=True, null=True)
    tagline = models.CharField(max_length=255, blank=True, null=True)
    custom_css = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tenant_brandings'

    def __str__(self):
        return f"Branding for {self.tenant.name}"


class TenantLimits(models.Model):
    """Usage limits and current usage for a tenant."""
    tenant = models.OneToOneField(
        Tenant,
        on_delete=models.CASCADE,
        related_name='limits'
    )
    max_students = models.IntegerField(default=100)
    max_storage_mb = models.IntegerField(default=5000)
    max_programs = models.IntegerField(default=10)
    current_students = models.IntegerField(default=0)
    current_storage_mb = models.IntegerField(default=0)
    current_programs = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tenant_limits'

    def __str__(self):
        return f"Limits for {self.tenant.name}"

    def is_student_limit_exceeded(self) -> bool:
        return self.current_students >= self.max_students

    def is_storage_limit_exceeded(self) -> bool:
        return self.current_storage_mb >= self.max_storage_mb

    def is_program_limit_exceeded(self) -> bool:
        return self.current_programs >= self.max_programs


class PresetBlueprint(models.Model):
    """Preset blueprints for regulatory compliance."""
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    regulatory_body = models.CharField(max_length=255, blank=True, null=True)
    hierarchy_labels = models.JSONField()  # ["Level", "Unit", "Module"]
    grading_config = models.JSONField()  # Grading logic configuration
    structure_rules = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'preset_blueprints'
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name
