"""
Platform settings models - Single-tenant configuration.
"""

from django.conf import settings as django_settings
from django.db import models
from django.core.cache import cache
from django.templatetags.static import static
from apps.core.models import TimeStampedModel


PLATFORM_PAYLOAD_CACHE_KEY = "platform_settings:payload"
PLATFORM_COURSE_LEVELS_CACHE_KEY = "platform_settings:course_levels"


class PresetBlueprint(TimeStampedModel):
    """Preset blueprints for regulatory compliance."""

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    regulatory_body = models.CharField(max_length=255, blank=True, null=True)
    hierarchy_labels = models.JSONField()  # ["Level", "Unit", "Module"]
    grading_config = models.JSONField()  # Grading logic configuration
    structure_rules = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "preset_blueprints"
        indexes = [
            models.Index(fields=["code"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return self.name


class PlatformSettings(TimeStampedModel):
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
        TVET = 'tvet', 'TVET Institution (KASNEB/CDACC/KNEC/NITA/ICM)'
        THEOLOGY = 'theology', 'Theology/Bible School'
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

    # Regional / Locale
    currency_code = models.CharField(
        max_length=10, default="KES", help_text="e.g. USD, KES, NGN"
    )
    currency_symbol = models.CharField(
        max_length=10, default="KSh ", help_text="e.g. $, KSh, ₦"
    )

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

    # Program Categories (admin-configurable)
    program_categories = models.JSONField(
        default=list,
        blank=True,
        help_text='List of available program categories: ["Biblical Studies", "Theology", ...]'
    )

    # Public content (admin-configurable)
    public_content = models.JSONField(
        default=dict,
        blank=True,
        help_text=(
            "Optional public page content overrides such as heroHeadline, "
            "mission, vision, impactSchools, stats, and footerDescription."
        ),
    )

    # Social links (admin-configurable)
    social_links = models.JSONField(
        default=dict,
        blank=True,
        help_text=(
            "Optional social links such as facebook, twitter, linkedin, and "
            "youtube."
        ),
    )

    # Setup Status
    is_setup_complete = models.BooleanField(
        default=False,
        help_text="Has the initial setup wizard been completed?"
    )

    class Meta:
        db_table = "platform_settings"
        verbose_name = "Platform Settings"
        verbose_name_plural = "Platform Settings"

    def save(self, *args, **kwargs):
        """Ensure only one instance exists (singleton pattern)."""
        self.pk = 1
        super().save(*args, **kwargs)
        cache.delete_many(
            [PLATFORM_PAYLOAD_CACHE_KEY, PLATFORM_COURSE_LEVELS_CACHE_KEY]
        )

    def delete(self, *args, **kwargs):
        """Prevent deletion of platform settings."""
        pass  # Do nothing - settings cannot be deleted

    def get_logo_url(self) -> str:
        """Return the preferred logo URL for public surfaces."""
        if self.logo:
            return self.logo.url
        return static("airads-logo.png")

    def get_favicon_url(self) -> str:
        """
        Return the preferred favicon URL.

        We intentionally prefer the platform logo so the browser tab stays aligned
        with the visible AIRADS branding rather than an older standalone favicon.
        """
        if self.logo:
            return self.logo.url
        return static("airads-logo.png")

    @classmethod
    def get_settings(cls):
        """Get or create the platform settings instance."""
        settings = cls.objects.filter(pk=1).first()
        if settings is None:
            settings = cls(pk=1)
            settings.save()
        return settings

    @classmethod
    def get_cached_platform_payload(cls) -> dict:
        """Return a cached payload for global platform branding props."""
        payload = cache.get(PLATFORM_PAYLOAD_CACHE_KEY)
        if payload is not None:
            return payload

        settings = cls.get_settings()
        features = settings.get_default_features_for_mode()
        if settings.features:
            features.update(settings.features)
        public_content = (
            settings.public_content
            if isinstance(settings.public_content, dict)
            else {}
        )
        social_links = (
            settings.social_links if isinstance(settings.social_links, dict) else {}
        )

        payload = {
            "institutionName": settings.institution_name,
            "tagline": settings.tagline,
            "email": settings.contact_email,
            "phone": settings.contact_phone,
            "address": settings.address,
            "logoUrl": settings.get_logo_url(),
            "faviconUrl": settings.get_favicon_url(),
            "primaryColor": settings.primary_color,
            "secondaryColor": settings.secondary_color,
            "deploymentMode": settings.deployment_mode,
            "isSetupComplete": settings.is_setup_complete,
            "currencyCode": settings.currency_code,
            "currencySymbol": settings.currency_symbol,
            "programCategories": settings.get_program_categories(),
            "features": features,
            "publicContent": public_content,
            "socialLinks": social_links,
            "virtualCampusUrl": getattr(django_settings, "VIRTUAL_CAMPUS_BASE_URL", "https://virtual.airads.ac.ke"),
        }
        cache.set(PLATFORM_PAYLOAD_CACHE_KEY, payload, timeout=900)
        return payload

    @classmethod
    def get_cached_course_levels(cls) -> list:
        """Return cached course levels for filter dropdowns."""
        course_levels = cache.get(PLATFORM_COURSE_LEVELS_CACHE_KEY)
        if course_levels is not None:
            return course_levels

        course_levels = cls.get_settings().get_course_levels()
        cache.set(PLATFORM_COURSE_LEVELS_CACHE_KEY, course_levels, timeout=900)
        return course_levels

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
                'course_reviews': True,
                'drip_v2': True,
                'enrollment_mode': 'instructor_approval',  # open, instructor_approval, admin_approval
            },
            'theology': {
                'certificates': True,
                'practicum': True,
                'gamification': False,
                'self_registration': True,
                'payments': True,
                'course_reviews': True,
                'drip_v2': True,
                'enrollment_mode': 'instructor_approval',
            },
            'online': {
                'certificates': True,
                'practicum': False,
                'gamification': True,
                'self_registration': True,
                'payments': True,
                'course_reviews': True,
                'drip_v2': True,
                'enrollment_mode': 'open',
            },
            'driving': {
                'certificates': True,
                'practicum': True,
                'gamification': True,
                'self_registration': False,
                'payments': True,
                'course_reviews': True,
                'drip_v2': True,
                'enrollment_mode': 'admin_approval',
            },

            'cbc': {
                'certificates': True,
                'practicum': False,
                'gamification': True,
                'self_registration': False,
                'payments': False,
                'course_reviews': True,
                'drip_v2': True,
                'enrollment_mode': 'admin_approval',
            },
            'custom': {
                'certificates': True,
                'practicum': True,
                'gamification': False,
                'self_registration': True,
                'payments': False,
                'course_reviews': True,
                'drip_v2': True,
                'enrollment_mode': 'instructor_approval',
            },
        }
        return MODE_DEFAULTS.get(self.deployment_mode, MODE_DEFAULTS['custom'])

    def get_course_levels(self) -> list:
        """Return explicitly configured course level options."""
        return self.course_levels or []

    def get_program_categories(self) -> list:
        """Return normalized admin-configured program categories."""
        categories = self.program_categories if isinstance(self.program_categories, list) else []
        normalized = []
        seen = set()
        for category in categories:
            label = str(category).strip()
            if label and label not in seen:
                normalized.append(label)
                seen.add(label)
        return normalized
