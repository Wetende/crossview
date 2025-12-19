"""
Property tests for default template fallback.
**Property 3: Default Template Fallback**
**Validates: Requirements 1.4**
"""
import pytest
from hypothesis import given, strategies as st, settings
from unittest.mock import MagicMock, patch

from apps.certifications.services import TemplateGenerator, TemplateValidationError
from apps.certifications.models import CertificateTemplate


class TestDefaultTemplateFallback:
    """
    Property tests for default template fallback behavior.
    Feature: certification-engine, Property 3: Default Template Fallback
    """

    @pytest.mark.django_db
    def test_get_default_template_returns_default_when_exists(self):
        """
        Property: When a default template exists, get_default_template SHALL return it.
        **Validates: Requirements 1.4**
        """
        # Create a default template
        default_template = CertificateTemplate.objects.create(
            name="Default Certificate",
            template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}",
            is_default=True
        )
        
        generator = TemplateGenerator()
        result = generator.get_default_template()
        
        assert result is not None
        assert result.id == default_template.id
        assert result.is_default is True

    @pytest.mark.django_db
    def test_get_default_template_returns_none_when_no_default(self):
        """
        Property: When no default template exists, get_default_template SHALL return None.
        **Validates: Requirements 1.4**
        """
        # Ensure no default templates exist
        CertificateTemplate.objects.filter(is_default=True).delete()
        
        generator = TemplateGenerator()
        result = generator.get_default_template()
        
        assert result is None

    @pytest.mark.django_db
    def test_get_template_for_enrollment_uses_blueprint_template_when_exists(self):
        """
        Property: When blueprint has a template, it SHALL be used instead of default.
        **Validates: Requirements 1.4**
        """
        from apps.blueprints.models import AcademicBlueprint
        
        # Create blueprint
        blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Year", "Unit"],
            grading_logic={"type": "weighted", "components": []},
            certificate_enabled=True
        )
        
        # Create blueprint-specific template
        blueprint_template = CertificateTemplate.objects.create(
            name="Blueprint Template",
            template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}",
            blueprint=blueprint,
            is_default=False
        )
        
        # Create default template
        default_template = CertificateTemplate.objects.create(
            name="Default Template",
            template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}",
            is_default=True
        )
        
        # Mock enrollment with program that has blueprint
        enrollment = MagicMock()
        enrollment.program.blueprint = blueprint
        
        generator = TemplateGenerator()
        result = generator.get_template_for_enrollment(enrollment)
        
        assert result.id == blueprint_template.id
        assert result.blueprint_id == blueprint.id

    @pytest.mark.django_db
    def test_get_template_for_enrollment_falls_back_to_default(self):
        """
        Property: When blueprint has no template, default template SHALL be used.
        **Validates: Requirements 1.4**
        """
        from apps.blueprints.models import AcademicBlueprint
        
        # Create blueprint without template
        blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Year", "Unit"],
            grading_logic={"type": "weighted", "components": []},
            certificate_enabled=True
        )
        
        # Create only default template
        default_template = CertificateTemplate.objects.create(
            name="Default Template",
            template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}",
            is_default=True
        )
        
        # Mock enrollment with program that has blueprint but no template
        enrollment = MagicMock()
        enrollment.program.blueprint = blueprint
        
        generator = TemplateGenerator()
        result = generator.get_template_for_enrollment(enrollment)
        
        assert result.id == default_template.id
        assert result.is_default is True

    @pytest.mark.django_db
    def test_get_template_for_enrollment_raises_when_no_template_available(self):
        """
        Property: When no template is available, an error SHALL be raised.
        **Validates: Requirements 1.4**
        """
        from apps.blueprints.models import AcademicBlueprint
        
        # Create blueprint without template
        blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Year", "Unit"],
            grading_logic={"type": "weighted", "components": []},
            certificate_enabled=True
        )
        
        # Ensure no templates exist
        CertificateTemplate.objects.all().delete()
        
        # Mock enrollment
        enrollment = MagicMock()
        enrollment.program.blueprint = blueprint
        
        generator = TemplateGenerator()
        
        with pytest.raises(TemplateValidationError) as exc_info:
            generator.get_template_for_enrollment(enrollment)
        
        assert "No default template configured" in str(exc_info.value)

    @pytest.mark.django_db
    def test_enrollment_without_blueprint_uses_default(self):
        """
        Property: When enrollment has no blueprint, default template SHALL be used.
        **Validates: Requirements 1.4**
        """
        # Create default template
        default_template = CertificateTemplate.objects.create(
            name="Default Template",
            template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}",
            is_default=True
        )
        
        # Mock enrollment without blueprint
        enrollment = MagicMock()
        enrollment.program.blueprint = None
        
        generator = TemplateGenerator()
        result = generator.get_template_for_enrollment(enrollment)
        
        assert result.id == default_template.id
        assert result.is_default is True
