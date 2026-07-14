"""
Platform services - Business logic for platform management (single-tenant mode).
"""

from typing import Optional
from django.core.exceptions import ValidationError

from apps.core.taxonomy import (
    get_mode_builder_hierarchy,
    is_valid_builder_hierarchy,
)
from apps.platform.models import PlatformSettings, PresetBlueprint


# Default blueprint templates for each deployment mode
MODE_BLUEPRINTS = {
    'tvet': {
        'name': 'TVET Standard (CDACC)',
        'description': 'Competency-based blueprint for TVET institutions following CDACC guidelines',
        'hierarchy_structure': get_mode_builder_hierarchy('tvet'),
        'grading_logic': {
            'type': 'competency',
            'levels': ['Not Yet Competent', 'Competent'],
            'pass_threshold': 'Competent'
        },
    },
    'theology': {
        'name': 'Bible College Standard',
        'description': 'Weighted grading blueprint for theology and bible schools',
        'hierarchy_structure': get_mode_builder_hierarchy('theology'),
        'grading_logic': {
            'type': 'weighted',
            'components': [
                {'key': 'cat', 'label': 'CAT', 'weight': 0.30},
                {'key': 'exam', 'label': 'Final Exam', 'weight': 0.70}
            ],
            'pass_mark': 50
        },
    },

    'driving': {
        'name': 'Driving School (NTSA)',
        'description': 'Checklist-based blueprint for driving schools following NTSA guidelines',
        'hierarchy_structure': get_mode_builder_hierarchy('driving'),
        'grading_logic': {
            'type': 'checklist',
            'pass_all_required': True
        },
    },
    'cbc': {
        'name': 'CBC K-12 Standard',
        'description': 'Competency-Based Curriculum blueprint for K-12 schools',
        'hierarchy_structure': get_mode_builder_hierarchy('cbc'),
        'grading_logic': {
            'type': 'rubric',
            'levels': ['Below Expectation', 'Approaching', 'Meeting', 'Exceeding'],
            'pass_threshold': 'Meeting'
        },
    },
    'online': {
        'name': 'Online Self-Paced',
        'description': 'Percentage-based grading for online self-paced courses',
        'hierarchy_structure': get_mode_builder_hierarchy('online'),
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

    UNSUPPORTED_GRADING_TYPE_MAP = {
        "checklist": "competency",
        "rubric": "points",
    }

    @staticmethod
    def _normalize_hierarchy_for_builder(preset: PresetBlueprint) -> list:
        """
        Convert preset hierarchy labels to a builder-compatible 2-level hierarchy.

        Preference order:
        1) Mode defaults inferred from preset code (tvet/theology/online/...)
        2) Existing first 2 labels if already valid
        3) Existing last 2 labels if valid
        4) Custom defaults
        """
        mode_hint = (preset.code or "").strip().lower()
        if mode_hint in MODE_BLUEPRINTS:
            return get_mode_builder_hierarchy(mode_hint)

        labels = [
            str(label).strip()
            for label in (preset.hierarchy_labels or [])
            if str(label).strip()
        ]

        candidates = []
        if len(labels) >= 2:
            candidates.append(labels[:2])
            candidates.append(labels[-2:])

        for candidate in candidates:
            if is_valid_builder_hierarchy(candidate):
                return candidate

        return get_mode_builder_hierarchy("custom")

    @staticmethod
    def _normalize_grading_logic(preset: PresetBlueprint) -> dict:
        """Return grading logic compatible with AcademicBlueprint validation."""
        grading_logic = dict(preset.grading_config or {})
        grading_type = str(grading_logic.get("type", "")).strip().lower()

        if not grading_type:
            grading_logic["type"] = "points"
            return grading_logic

        if grading_type in PresetBlueprintService.UNSUPPORTED_GRADING_TYPE_MAP:
            grading_logic["type"] = PresetBlueprintService.UNSUPPORTED_GRADING_TYPE_MAP[
                grading_type
            ]

        return grading_logic

    @staticmethod
    def _find_matching_academic_blueprint(preset: PresetBlueprint):
        """Find an existing academic blueprint equivalent to the preset payload."""
        from apps.blueprints.models import AcademicBlueprint

        hierarchy_structure = PresetBlueprintService._normalize_hierarchy_for_builder(
            preset
        )
        grading_logic = PresetBlueprintService._normalize_grading_logic(preset)

        candidates = AcademicBlueprint.objects.filter(
            hierarchy_structure=hierarchy_structure,
            grading_logic=grading_logic,
        ).order_by("id")

        preferred_prefix = f"{preset.name} (Academic"
        for blueprint in candidates:
            if blueprint.name == preset.name or blueprint.name.startswith(
                preferred_prefix
            ):
                return blueprint

        return candidates.first()

    @staticmethod
    def _unique_blueprint_name(base_name: str) -> str:
        """Generate a stable unique name for copied academic blueprints."""
        from apps.blueprints.models import AcademicBlueprint

        candidate = f"{base_name} (Academic)"
        if not AcademicBlueprint.objects.filter(name=candidate).exists():
            return candidate

        index = 2
        while True:
            numbered = f"{base_name} (Academic {index})"
            if not AcademicBlueprint.objects.filter(name=numbered).exists():
                return numbered
            index += 1

    @staticmethod
    def create_academic_blueprint_from_preset(
        preset: PresetBlueprint,
        *,
        set_as_active: bool = False,
    ):
        """Create a new AcademicBlueprint from a preset blueprint template."""
        from apps.blueprints.models import AcademicBlueprint

        hierarchy_structure = PresetBlueprintService._normalize_hierarchy_for_builder(
            preset
        )
        grading_logic = PresetBlueprintService._normalize_grading_logic(preset)
        name = PresetBlueprintService._unique_blueprint_name(preset.name)

        blueprint = AcademicBlueprint.objects.create(
            name=name,
            description=preset.description or "",
            hierarchy_structure=hierarchy_structure,
            grading_logic=grading_logic,
            progression_rules={},
            certificate_enabled=True,
            gamification_enabled=False,
            feature_flags={},
        )

        if set_as_active:
            settings = PlatformSettings.get_settings()
            settings.active_blueprint = blueprint
            settings.save(update_fields=["active_blueprint", "updated_at"])

        return blueprint

    @staticmethod
    def get_or_create_academic_blueprint_from_preset(
        preset: PresetBlueprint,
        *,
        set_as_active: bool = False,
    ):
        """Reuse an equivalent academic blueprint when available; otherwise create one."""
        existing = PresetBlueprintService._find_matching_academic_blueprint(preset)
        if existing:
            if set_as_active:
                settings = PlatformSettings.get_settings()
                settings.active_blueprint = existing
                settings.save(update_fields=["active_blueprint", "updated_at"])
            return existing, False

        created = PresetBlueprintService.create_academic_blueprint_from_preset(
            preset,
            set_as_active=set_as_active,
        )
        return created, True

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
    def list_builder_compatible_blueprints() -> list:
        """Return blueprints valid for the 2-tier builder taxonomy."""
        from apps.blueprints.models import AcademicBlueprint

        blueprints = []
        for blueprint in AcademicBlueprint.objects.all().order_by("name"):
            if is_valid_builder_hierarchy(blueprint.hierarchy_structure):
                blueprints.append({"id": blueprint.id, "name": blueprint.name})
        return blueprints

    @staticmethod
    def get_settings() -> dict:
        """Get current platform settings."""
        from apps.platform.models import PlatformSettings

        settings = PlatformSettings.get_settings()
        public_content = (
            settings.public_content
            if isinstance(settings.public_content, dict)
            else {}
        )
        social_links = (
            settings.social_links if isinstance(settings.social_links, dict) else {}
        )
        return {
            "institutionName": settings.institution_name,
            "tagline": settings.tagline,
            "contactEmail": settings.contact_email,
            "contactPhone": settings.contact_phone,
            "address": settings.address,
            "deploymentMode": settings.deployment_mode,
            "courseLevels": settings.get_course_levels(),
            "programCategories": settings.get_program_categories(),
            "activeBlueprintId": settings.active_blueprint_id,
            "logo": settings.get_logo_url(),
            "favicon": settings.get_favicon_url(),
            "primaryColor": settings.primary_color,
            "secondaryColor": settings.secondary_color,
            "customCss": settings.custom_css,
            "features": settings.features,
            "isSetupComplete": settings.is_setup_complete,
            "publicContent": public_content,
            "socialLinks": social_links,
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
        target_hierarchy = get_mode_builder_hierarchy(deployment_mode)
        
        # Check if blueprint already exists
        blueprint = AcademicBlueprint.objects.filter(name=template['name']).first()

        if blueprint and is_valid_builder_hierarchy(blueprint.hierarchy_structure):
            return blueprint

        # Compatibility guard: legacy blueprints may carry 3-4 levels.
        # We do not slice legacy labels implicitly; we use explicit mode mapping.
        if blueprint and not blueprint.programs.exists():
            blueprint.hierarchy_structure = target_hierarchy
            blueprint.grading_logic = template['grading_logic']
            blueprint.description = template.get(
                'description', f"Auto-generated blueprint for {deployment_mode} mode"
            )
            blueprint.save()
            return blueprint

        if blueprint and blueprint.programs.exists():
            v2_name = f"{template['name']} (Builder 2-tier)"
            existing_v2 = AcademicBlueprint.objects.filter(name=v2_name).first()
            if existing_v2 and is_valid_builder_hierarchy(existing_v2.hierarchy_structure):
                return existing_v2
            return AcademicBlueprint.objects.create(
                name=v2_name,
                description=template.get(
                    'description', f"Auto-generated blueprint for {deployment_mode} mode"
                ),
                hierarchy_structure=target_hierarchy,
                grading_logic=template['grading_logic'],
                progression_rules={},
                certificate_enabled=True,
            )

        return AcademicBlueprint.objects.create(
            name=template['name'],
            description=template.get('description', f"Auto-generated blueprint for {deployment_mode} mode"),
            hierarchy_structure=target_hierarchy,
            grading_logic=template['grading_logic'],
            progression_rules={},
            certificate_enabled=True,
        )

    @staticmethod
    def ensure_active_blueprint_for_mode(settings):
        """
        Ensure settings.active_blueprint is populated and builder-compatible.

        Returns the active blueprint after normalization/creation, or None when
        deployment mode is custom and no blueprint is set.
        """
        deployment_mode = settings.deployment_mode

        if deployment_mode == "custom" and not settings.active_blueprint:
            return None

        active = settings.active_blueprint
        if active and is_valid_builder_hierarchy(active.hierarchy_structure):
            return active

        if deployment_mode == "custom" and active and not is_valid_builder_hierarchy(
            active.hierarchy_structure
        ):
            return active

        fallback = PlatformSettingsService.get_or_create_blueprint_for_mode(
            deployment_mode
        )
        if fallback and settings.active_blueprint_id != fallback.id:
            settings.active_blueprint = fallback

        return fallback

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
                if is_valid_builder_hierarchy(blueprint.hierarchy_structure):
                    settings.active_blueprint = blueprint
                elif deployment_mode != 'custom':
                    fallback = PlatformSettingsService.get_or_create_blueprint_for_mode(
                        deployment_mode
                    )
                    if fallback:
                        settings.active_blueprint = fallback
                else:
                    raise ValidationError(
                        {
                            "blueprintId": (
                                "Selected blueprint is not compatible with Course Builder. "
                                "Use a blueprint with exactly 2 labels: [Container, Content]."
                            )
                        }
                    )
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
    def update_course_levels(course_levels: list) -> None:
        """Update custom course levels."""
        from apps.platform.models import PlatformSettings

        settings = PlatformSettings.get_settings()
        settings.course_levels = course_levels or []
        settings.save(update_fields=["course_levels"])

    @staticmethod
    def update_program_categories(program_categories: list) -> None:
        """Update admin-managed program categories."""
        from apps.platform.models import PlatformSettings

        settings = PlatformSettings.get_settings()
        settings.program_categories = program_categories or []
        settings.save(update_fields=["program_categories", "updated_at"])

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
            "logo": settings.get_logo_url(),
            "favicon": settings.get_favicon_url(),
            "primaryColor": settings.primary_color,
            "secondaryColor": settings.secondary_color,
        }
