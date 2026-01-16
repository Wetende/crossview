"""
Platform settings models - Single-tenant configuration.
"""

from django.db import models


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

    # Course Levels (admin-configurable via Chameleon engine)
    course_levels = models.JSONField(
        default=list,
        blank=True,
        help_text='Course difficulty levels: [{"value": "beginner", "label": "Beginner"}, ...]'
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
                'enrollment_mode': 'instructor_approval',  # open, instructor_approval, admin_approval
            },
            'theology': {
                'certificates': True,
                'practicum': True,
                'gamification': False,
                'self_registration': True,
                'payments': False,
                'enrollment_mode': 'instructor_approval',
            },
            'online': {
                'certificates': True,
                'practicum': False,
                'gamification': True,
                'self_registration': True,
                'payments': True,
                'enrollment_mode': 'open',
            },
            'driving': {
                'certificates': True,
                'practicum': True,
                'gamification': True,
                'self_registration': False,
                'payments': True,
                'enrollment_mode': 'admin_approval',
            },
            'nita': {
                'certificates': True,
                'practicum': True,
                'gamification': False,
                'self_registration': False,
                'payments': True,
                'enrollment_mode': 'admin_approval',
            },
            'cbc': {
                'certificates': True,
                'practicum': False,
                'gamification': True,
                'self_registration': False,
                'payments': False,
                'enrollment_mode': 'admin_approval',
            },
            'custom': {
                'certificates': True,
                'practicum': True,
                'gamification': False,
                'self_registration': True,
                'payments': False,
                'enrollment_mode': 'instructor_approval',
            },
        }
        return MODE_DEFAULTS.get(self.deployment_mode, MODE_DEFAULTS['custom'])

    def get_course_levels(self) -> list:
        """Get course levels - admin-defined or mode-based defaults."""
        if self.course_levels:
            return self.course_levels
        
        # Default levels based on deployment mode (Kenya KNQF)
        MODE_LEVEL_DEFAULTS = {
            'tvet': [
                # Kenya CDACC/KNQF Levels 2-6
                {"value": "level_2", "label": "Level 2 - Basic Certificate"},
                {"value": "level_3", "label": "Level 3 - Artisan Certificate"},
                {"value": "level_4", "label": "Level 4 - Craft Certificate"},
                {"value": "level_5", "label": "Level 5 - Technician Certificate"},
                {"value": "level_6", "label": "Level 6 - Diploma"},
            ],
            'theology': [
                {"value": "foundation", "label": "Foundation"},
                {"value": "certificate", "label": "Certificate"},
                {"value": "diploma", "label": "Diploma"},
                {"value": "degree", "label": "Degree"},
            ],
            'online': [
                {"value": "beginner", "label": "Beginner"},
                {"value": "intermediate", "label": "Intermediate"},
                {"value": "advanced", "label": "Advanced"},
            ],
            'cbc': [
                {"value": "grade_1_3", "label": "Lower Primary (1-3)"},
                {"value": "grade_4_6", "label": "Upper Primary (4-6)"},
                {"value": "grade_7_9", "label": "Junior Secondary (7-9)"},
                {"value": "grade_10_12", "label": "Senior Secondary (10-12)"},
            ],
        }
        return MODE_LEVEL_DEFAULTS.get(self.deployment_mode, [
            {"value": "beginner", "label": "Beginner"},
            {"value": "intermediate", "label": "Intermediate"},
            {"value": "advanced", "label": "Advanced"},
        ])

