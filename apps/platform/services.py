"""
Platform services - Business logic for platform management (single-tenant mode).
"""

from typing import Optional
from django.core.exceptions import ValidationError

from apps.platform.models import PresetBlueprint


# Default blueprint templates for each deployment mode
MODE_BLUEPRINTS = {
    'tvet': {
        'name': 'TVET Standard (CDACC)',
        'description': 'Competency-based blueprint for TVET institutions following CDACC guidelines',
        'hierarchy_structure': ['Level', 'Unit', 'Learning Outcome', 'Session'],
        'grading_logic': {
            'type': 'competency',
            'levels': ['Not Yet Competent', 'Competent'],
            'pass_threshold': 'Competent'
        },
    },
    'theology': {
        'name': 'Bible College Standard',
        'description': 'Weighted grading blueprint for theology and bible schools',
        'hierarchy_structure': ['Year', 'Semester', 'Course', 'Session'],
        'grading_logic': {
            'type': 'weighted',
            'components': [
                {'key': 'cat', 'label': 'CAT', 'weight': 0.30},
                {'key': 'exam', 'label': 'Final Exam', 'weight': 0.70}
            ],
            'pass_mark': 50
        },
    },
    'nita': {
        'name': 'NITA Trade Test',
        'description': 'Trade test blueprint following NITA guidelines',
        'hierarchy_structure': ['Trade', 'Grade', 'Module', 'Practical'],
        'grading_logic': {
            'type': 'competency',
            'levels': ['Fail', 'Pass', 'Credit', 'Distinction'],
            'pass_threshold': 'Pass'
        },
    },
    'driving': {
        'name': 'Driving School (NTSA)',
        'description': 'Checklist-based blueprint for driving schools following NTSA guidelines',
        'hierarchy_structure': ['License Class', 'Phase', 'Lesson'],
        'grading_logic': {
            'type': 'checklist',
            'pass_all_required': True
        },
    },
    'cbc': {
        'name': 'CBC K-12 Standard',
        'description': 'Competency-Based Curriculum blueprint for K-12 schools',
        'hierarchy_structure': ['Grade', 'Strand', 'Sub-Strand', 'Lesson'],
        'grading_logic': {
            'type': 'rubric',
            'levels': ['Below Expectation', 'Approaching', 'Meeting', 'Exceeding'],
            'pass_threshold': 'Meeting'
        },
    },
    'online': {
        'name': 'Online Self-Paced',
        'description': 'Percentage-based grading for online self-paced courses',
        'hierarchy_structure': ['Course', 'Module', 'Lesson'],
        'grading_logic': {
            'type': 'percentage',
            'pass_mark': 70
        },
    },
}


class PlatformStatsService:
    """Service for platform-wide statistics (single-tenant mode)."""

    @staticmethod
    def get_dashboard_stats() -> dict:
        """Get platform-wide stats for super admin dashboard."""
        from apps.core.models import User, Program

        total_users = User.objects.count()
        total_programs = Program.objects.count()
        active_programs = Program.objects.filter(is_published=True).count()

        return {
            "totalUsers": total_users,
            "totalPrograms": total_programs,
            "activePrograms": active_programs,
        }


class PresetBlueprintService:
    """Service for preset blueprint management."""

    @staticmethod
    def list_presets() -> list:
        """List all preset blueprints."""
        presets = PresetBlueprint.objects.order_by("name")
        return [
            {
                "id": p.id,
                "name": p.name,
                "code": p.code,
                "description": p.description or "",
                "regulatoryBody": p.regulatory_body or "",
                "hierarchyLabels": p.hierarchy_labels or [],
                "gradingConfig": p.grading_config or {},
                "isActive": p.is_active,
            }
            for p in presets
        ]

    @staticmethod
    def create_preset(
        name: str,
        code: str,
        hierarchy_labels: list,
        description: str = "",
        regulatory_body: str = "",
        grading_config: Optional[dict] = None,
        is_active: bool = True,
    ) -> PresetBlueprint:
        """Create a new preset blueprint."""
        if PresetBlueprint.objects.filter(code=code).exists():
            raise ValidationError({"code": "Code already exists"})
        if not hierarchy_labels:
            raise ValidationError(
                {"hierarchyLabels": "At least one hierarchy level is required"}
            )

        return PresetBlueprint.objects.create(
            name=name,
            code=code,
            description=description,
            regulatory_body=regulatory_body,
            hierarchy_labels=hierarchy_labels,
            grading_config=grading_config or {},
            is_active=is_active,
        )

    @staticmethod
    def update_preset(
        preset_id: int,
        name: str,
        code: str,
        hierarchy_labels: list,
        description: str = "",
        regulatory_body: str = "",
        grading_config: Optional[dict] = None,
        is_active: Optional[bool] = None,
    ) -> PresetBlueprint:
        """Update a preset blueprint."""
        preset = PresetBlueprint.objects.get(pk=preset_id)

        if PresetBlueprint.objects.filter(code=code).exclude(pk=preset_id).exists():
            raise ValidationError({"code": "Code already exists"})
        if not hierarchy_labels:
            raise ValidationError(
                {"hierarchyLabels": "At least one hierarchy level is required"}
            )

        preset.name = name
        preset.code = code
        preset.description = description
        preset.regulatory_body = regulatory_body
        preset.hierarchy_labels = hierarchy_labels
        if grading_config is not None:
            preset.grading_config = grading_config
        if is_active is not None:
            preset.is_active = is_active

        preset.save()
        return preset


class PlatformSettingsService:
    """Service for platform settings management (single-tenant mode)."""

    @staticmethod
    def get_settings() -> dict:
        """Get current platform settings."""
        from apps.platform.models import PlatformSettings
        
        settings = PlatformSettings.get_settings()
        return {
            "institutionName": settings.institution_name,
            "tagline": settings.tagline,
            "contactEmail": settings.contact_email,
            "contactPhone": settings.contact_phone,
            "address": settings.address,
            "deploymentMode": settings.deployment_mode,
            "activeBlueprintId": settings.active_blueprint_id,
            "logo": settings.logo.url if settings.logo else None,
            "favicon": settings.favicon.url if settings.favicon else None,
            "primaryColor": settings.primary_color,
            "secondaryColor": settings.secondary_color,
            "customCss": settings.custom_css,
            "features": settings.features,
            "isSetupComplete": settings.is_setup_complete,
        }

    @staticmethod
    def get_deployment_modes() -> list:
        """Get available deployment modes."""
        from apps.platform.models import PlatformSettings
        
        return [
            {"value": choice[0], "label": choice[1]}
            for choice in PlatformSettings.DeploymentMode.choices
        ]

    @staticmethod
    def update_institution_info(
        institution_name: str,
        tagline: str = "",
        contact_email: str = "",
        contact_phone: str = "",
        address: str = "",
    ) -> None:
        """Update institution information (Step 1 of wizard)."""
        from apps.platform.models import PlatformSettings
        
        settings = PlatformSettings.get_settings()
        settings.institution_name = institution_name
        settings.tagline = tagline
        settings.contact_email = contact_email
        settings.contact_phone = contact_phone
        settings.address = address
        settings.save()

    @staticmethod
    def get_or_create_blueprint_for_mode(deployment_mode: str):
        """Get existing or create default blueprint for deployment mode."""
        from apps.blueprints.models import AcademicBlueprint
        
        if deployment_mode not in MODE_BLUEPRINTS:
            return None
        
        template = MODE_BLUEPRINTS[deployment_mode]
        
        # Check if blueprint already exists
        blueprint = AcademicBlueprint.objects.filter(
            name=template['name']
        ).first()
        
        if not blueprint:
            blueprint = AcademicBlueprint.objects.create(
                name=template['name'],
                description=template.get('description', f"Auto-generated blueprint for {deployment_mode} mode"),
                hierarchy_structure=template['hierarchy_structure'],
                grading_logic=template['grading_logic'],
                progression_rules={},
                certificate_enabled=True,
            )
        
        return blueprint

    @staticmethod
    def update_deployment_mode(
        deployment_mode: str,
        blueprint_id: int = None,
    ) -> None:
        """Update deployment mode and auto-create blueprint (Step 2 of wizard)."""
        from apps.platform.models import PlatformSettings
        from apps.blueprints.models import AcademicBlueprint
        
        settings = PlatformSettings.get_settings()
        settings.deployment_mode = deployment_mode
        
        # Auto-create blueprint if not custom and no blueprint provided
        if not blueprint_id and deployment_mode != 'custom':
            blueprint = PlatformSettingsService.get_or_create_blueprint_for_mode(deployment_mode)
            if blueprint:
                settings.active_blueprint = blueprint
        elif blueprint_id:
            # Use provided blueprint
            try:
                blueprint = AcademicBlueprint.objects.get(pk=blueprint_id)
                settings.active_blueprint = blueprint
            except AcademicBlueprint.DoesNotExist:
                pass
        
        # Apply default features for mode
        settings.features = settings.get_default_features_for_mode()
        settings.save()

    @staticmethod
    def update_branding(
        primary_color: str = None,
        secondary_color: str = None,
        custom_css: str = "",
        logo=None,
        favicon=None,
    ) -> None:
        """Update branding (Step 3 of wizard)."""
        from apps.platform.models import PlatformSettings
        
        settings = PlatformSettings.get_settings()
        
        if primary_color:
            settings.primary_color = primary_color
        if secondary_color:
            settings.secondary_color = secondary_color
        if custom_css is not None:
            settings.custom_css = custom_css
        if logo:
            settings.logo = logo
        if favicon:
            settings.favicon = favicon
        
        settings.save()

    @staticmethod
    def update_features(features: dict) -> None:
        """Update feature flags (Step 4 of wizard)."""
        from apps.platform.models import PlatformSettings
        
        settings = PlatformSettings.get_settings()
        # Merge with existing features
        current_features = settings.features or {}
        current_features.update(features)
        settings.features = current_features
        settings.save()

    @staticmethod
    def complete_setup() -> None:
        """Mark setup as complete."""
        from apps.platform.models import PlatformSettings
        
        settings = PlatformSettings.get_settings()
        settings.is_setup_complete = True
        settings.save()

    @staticmethod
    def is_setup_required() -> bool:
        """Check if setup wizard should be shown."""
        from apps.platform.models import PlatformSettings
        
        settings = PlatformSettings.get_settings()
        return not settings.is_setup_complete

    @staticmethod
    def is_feature_enabled(feature_name: str) -> bool:
        """Check if a feature is enabled."""
        from apps.platform.models import PlatformSettings
        
        settings = PlatformSettings.get_settings()
        return settings.is_feature_enabled(feature_name)

    @staticmethod
    def get_branding_context() -> dict:
        """Get branding info for templates and frontend."""
        from apps.platform.models import PlatformSettings
        
        settings = PlatformSettings.get_settings()
        return {
            "institutionName": settings.institution_name,
            "tagline": settings.tagline,
            "logo": settings.logo.url if settings.logo else None,
            "favicon": settings.favicon.url if settings.favicon else None,
            "primaryColor": settings.primary_color,
            "secondaryColor": settings.secondary_color,
        }
