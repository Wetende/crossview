"""
Property tests for template attachment requiring certificate enabled.
**Property 1: Template Attachment Requires Certificate Enabled**
**Validates: Requirements 1.1**
"""
import pytest
from hypothesis import given, strategies as st, settings
from unittest.mock import MagicMock, patch

from apps.certifications.services import CertificationEngine, TemplateGenerator
from apps.certifications.models import CertificateTemplate


class TestTemplateAttachmentRequiresCertificateEnabled:
    """
    Property tests for template attachment requiring certificate_enabled.
    Feature: certification-engine, Property 1: Template Attachment Requires Certificate Enabled
    """

    @pytest.mark.django_db
    def test_certificate_not_generated_when_certificate_disabled(self):
        """
        Property: For any blueprint with certificate_enabled=False, 
        on_program_completed SHALL NOT generate a certificate.
        **Validates: Requirements 1.1**
        """
        from apps.blueprints.models import AcademicBlueprint
        
        # Create blueprint with certificate_enabled=False
        blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Year", "Unit"],
            grading_logic={"type": "weighted", "components": []},
            certificate_enabled=False  # Disabled
        )
        
        # Mock enrollment
        enrollment = MagicMock()
        enrollment.program.blueprint = blueprint
        
        engine = CertificationEngine()
        result = engine.on_program_completed(enrollment)
        
        assert result is None

    @pytest.mark.django_db
    @patch('apps.certifications.services.TemplateGenerator.generate')
    def test_certificate_generated_when_certificate_enabled(self, mock_generate):
        """
        Property: For any blueprint with certificate_enabled=True,
        on_program_completed SHALL generate a certificate.
        **Validates: Requirements 1.1**
        """
        from apps.blueprints.models import AcademicBlueprint
        from apps.certifications.models import Certificate
        from apps.progression.models import Enrollment
        from apps.core.models import User, Program
        
        # Mock PDF generation to avoid WeasyPrint dependency
        mock_generate.return_value = "certificates/test.pdf"
        
        # Create blueprint with certificate_enabled=True
        blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Year", "Unit"],
            grading_logic={"type": "weighted", "components": []},
            certificate_enabled=True  # Enabled
        )
        
        # Create default template
        CertificateTemplate.objects.create(
            name="Default Template",
            template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}",
            is_default=True
        )
        
        # Create user and program
        user = User.objects.create(email="test@example.com", first_name="Test", last_name="User")
        program = Program.objects.create(name="Test Program", blueprint=blueprint)
        
        # Create enrollment
        enrollment = Enrollment.objects.create(user=user, program=program, status='completed')
        
        engine = CertificationEngine()
        result = engine.on_program_completed(enrollment)
        
        assert result is not None
        assert isinstance(result, Certificate)
        assert result.student_name == "Test User"
        assert result.program_title == "Test Program"
        assert mock_generate.called

    @given(st.booleans())
    @settings(max_examples=100)
    def test_certificate_generation_respects_certificate_enabled_flag(self, certificate_enabled):
        """
        Property: For any blueprint, certificate generation SHALL respect certificate_enabled flag.
        **Validates: Requirements 1.1**
        """
        # Mock blueprint
        blueprint = MagicMock()
        blueprint.certificate_enabled = certificate_enabled
        
        # Mock enrollment
        enrollment = MagicMock()
        enrollment.program.blueprint = blueprint
        
        # Mock the generate_certificate method to track if it's called
        engine = CertificationEngine()
        original_generate = engine.generate_certificate
        generate_called = [False]
        
        def mock_generate(enroll):
            generate_called[0] = True
            return MagicMock()  # Return mock certificate
        
        engine.generate_certificate = mock_generate
        
        result = engine.on_program_completed(enrollment)
        
        if certificate_enabled:
            assert generate_called[0] is True
            assert result is not None
        else:
            assert generate_called[0] is False
            assert result is None

    @pytest.mark.django_db
    def test_template_can_be_attached_to_blueprint_with_certificate_enabled(self):
        """
        Property: Templates CAN be attached to blueprints with certificate_enabled=True.
        **Validates: Requirements 1.1**
        """
        from apps.blueprints.models import AcademicBlueprint
        
        # Create blueprint with certificate_enabled=True
        blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Year", "Unit"],
            grading_logic={"type": "weighted", "components": []},
            certificate_enabled=True
        )
        
        # Create template attached to blueprint
        template = CertificateTemplate.objects.create(
            name="Blueprint Template",
            template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}",
            blueprint=blueprint
        )
        
        assert template.blueprint_id == blueprint.id
        assert blueprint.certificate_templates.count() == 1

    @pytest.mark.django_db
    def test_enrollment_without_blueprint_does_not_generate_certificate(self):
        """
        Property: For any enrollment without a blueprint, no certificate SHALL be generated.
        **Validates: Requirements 1.1**
        """
        # Mock enrollment without blueprint
        enrollment = MagicMock()
        enrollment.program.blueprint = None
        
        engine = CertificationEngine()
        result = engine.on_program_completed(enrollment)
        
        assert result is None
