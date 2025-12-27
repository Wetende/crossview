"""
Tenant models - Multi-tenancy support.
"""

from django.db import models


class Tenant(models.Model):
    """Tenant model for multi-tenancy."""

    name = models.CharField(max_length=255)
    subdomain = models.CharField(max_length=100, unique=True)
    admin_email = models.EmailField()
    is_active = models.BooleanField(default=True)
    settings = models.JSONField(default=dict, blank=True)
    activated_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tenants"
        indexes = [
            models.Index(fields=["subdomain"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return self.name


class TenantBranding(models.Model):
    """Branding configuration for a tenant."""

    tenant = models.OneToOneField(
        Tenant, on_delete=models.CASCADE, related_name="branding"
    )
    logo_path = models.CharField(max_length=500, blank=True, null=True)
    favicon_path = models.CharField(max_length=500, blank=True, null=True)
    primary_color = models.CharField(max_length=7, default="#3B82F6")  # Hex color
    secondary_color = models.CharField(max_length=7, default="#1E40AF")
    institution_name = models.CharField(max_length=255, blank=True, null=True)
    tagline = models.CharField(max_length=255, blank=True, null=True)
    custom_css = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tenant_brandings"

    def __str__(self):
        return f"Branding for {self.tenant.name}"


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
        db_table = "preset_blueprints"
        indexes = [
            models.Index(fields=["code"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return self.name


class PlatformSettings(models.Model):
    """
    Single-tenant platform configuration.
    
    This model stores the configuration for a single deployment instance.
    Each forked/deployed instance has exactly ONE row in this table.
    
    Usage:
        settings = PlatformSettings.get_settings()
        if settings.deployment_mode == 'tvet':
            # TVET-specific logic
    """

    class DeploymentMode(models.TextChoices):
        TVET = 'tvet', 'TVET Institution (CDACC/KNEC)'
        THEOLOGY = 'theology', 'Theology/Bible School'
        NITA = 'nita', 'NITA Trade Test'
        DRIVING = 'driving', 'Driving School (NTSA)'
        CBC = 'cbc', 'CBC K-12 School'
        ONLINE = 'online', 'Online Courses (Self-Paced)'
        CUSTOM = 'custom', 'Custom Configuration'

    # Institution Information
    institution_name = models.CharField(max_length=255, default="My Institution")
    tagline = models.CharField(max_length=255, blank=True, default="")
    contact_email = models.EmailField(default="admin@example.com")
    contact_phone = models.CharField(max_length=20, blank=True, default="")
    address = models.TextField(blank=True, default="")

    # Deployment Mode
    deployment_mode = models.CharField(
        max_length=20,
        choices=DeploymentMode.choices,
        default=DeploymentMode.CUSTOM,
    )

    # Active Blueprint (defines terminology and grading logic)
    active_blueprint = models.ForeignKey(
        'blueprints.AcademicBlueprint',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='platform_settings',
        help_text="The academic blueprint defining curriculum structure and grading"
    )

    # Branding
    logo = models.ImageField(upload_to='branding/', null=True, blank=True)
    favicon = models.ImageField(upload_to='branding/', null=True, blank=True)
    primary_color = models.CharField(max_length=7, default="#3B82F6")  # Hex color
    secondary_color = models.CharField(max_length=7, default="#1E40AF")
    custom_css = models.TextField(blank=True, default="")

    # Feature Flags (JSON for flexibility)
    features = models.JSONField(
        default=dict,
        blank=True,
        help_text="Feature toggles: {'certificates': true, 'gamification': false, ...}"
    )

    # Setup Status
    is_setup_complete = models.BooleanField(
        default=False,
        help_text="Has the initial setup wizard been completed?"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "platform_settings"
        verbose_name = "Platform Settings"
        verbose_name_plural = "Platform Settings"

    def save(self, *args, **kwargs):
        """Ensure only one instance exists (singleton pattern)."""
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Prevent deletion of platform settings."""
        pass  # Do nothing - settings cannot be deleted

    @classmethod
    def get_settings(cls):
        """Get or create the platform settings instance."""
        settings, _ = cls.objects.get_or_create(pk=1)
        return settings

    def __str__(self):
        return f"{self.institution_name} Settings"

    # Feature flag helpers
    def is_feature_enabled(self, feature_name: str) -> bool:
        """Check if a specific feature is enabled."""
        default_features = self.get_default_features_for_mode()
        return self.features.get(feature_name, default_features.get(feature_name, False))

    def get_default_features_for_mode(self) -> dict:
        """Get default feature flags based on deployment mode."""
        MODE_DEFAULTS = {
            'tvet': {
                'certificates': True,
                'practicum': True,
                'portfolio': True,
                'gamification': False,
                'self_registration': False,
                'payments': False,
            },
            'theology': {
                'certificates': True,
                'practicum': True,
                'gamification': False,
                'self_registration': True,
                'payments': False,
            },
            'online': {
                'certificates': True,
                'practicum': False,
                'gamification': True,
                'self_registration': True,
                'payments': True,
            },
            'driving': {
                'certificates': True,
                'practicum': True,
                'gamification': True,
                'self_registration': False,
                'payments': True,
            },
            'custom': {
                'certificates': True,
                'practicum': True,
                'gamification': False,
                'self_registration': True,
                'payments': False,
            },
        }
        return MODE_DEFAULTS.get(self.deployment_mode, MODE_DEFAULTS['custom'])

