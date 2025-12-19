"""
Property tests for auto-generation on 100% completion.
**Property 4: Auto-Generation on 100% Completion**
**Validates: Requirements 2.1, 2.3, 2.4**
"""
import pytest
from hypothesis import given, strategies as st, settings
from unittest.mock import patch, MagicMock

from apps.certifications.services import CertificationEngine
from apps.certifications.models import Certificate, CertificateTemplate


@pytest.mark.django_db
class TestAutoGenerationOnCompletion:
    """
    Property tests for automatic certificate generation on completion.
    Feature: certification-engine, Property 4: Auto-Generation on 100% Completion
    """

    @patch('apps.certifications.services.TemplateGenerator.generate')
    def test_certificate_created_on_program_completion(self, mock_generate):
        """
        Property: For any enrollment reaching 100% with certificate_enabled=True,
        a Certificate record SHALL be created.
        **Validates: Requirements 2.1, 2.3, 2.4**
        """
        from apps.blueprints.models import AcademicBlueprint
        from apps.progression.models import Enrollment
        from apps.core.models import User, Program
        
        mock_generate.return_value = "certificates/test.pdf"
        
        # Create blueprint with certificate_enabled=True
        blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []},
            certificate_enabled=True
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
        enrollment = Enrollment.objects.create(user=user, program=program, status='completed')
        
        engine = CertificationEngine()
        certificate = engine.on_program_completed(enrollment)
        
        # Verify certificate was created
        assert certificate is not None
        assert Certificate.objects.filter(enrollment=enrollment).exists()
        assert certificate.serial_number is not None
        assert certificate.pdf_path == "certificates/test.pdf"

    @patch('apps.certifications.services.TemplateGenerator.generate')
    def test_certificate_has_serial_number(self, mock_generate):
        """
        Property: For any generated certificate, it SHALL have a unique serial number.
        **Validates: Requirements 2.3**
        """
        from apps.blueprints.models import AcademicBlueprint
        from apps.progression.models import Enrollment
        from apps.core.models import User, Program
        
        mock_generate.return_value = "certificates/test.pdf"
        
        blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []},
            certificate_enabled=True
        )
        
        CertificateTemplate.objects.create(
            name="Default Template",
            template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}",
            is_default=True
        )
        
        user = User.objects.create(email="test@example.com", first_name="Test", last_name="User")
        program = Program.objects.create(name="Test Program", blueprint=blueprint)
        enrollment = Enrollment.objects.create(user=user, program=program, status='completed')
        
        engine = CertificationEngine()
        certificate = engine.on_program_completed(enrollment)
        
        # Verify serial number format
        assert certificate.serial_number is not None
        assert '-' in certificate.serial_number
        parts = certificate.serial_number.split('-')
        assert len(parts) == 3

    @patch('apps.certifications.services.TemplateGenerator.generate')
    def test_certificate_has_pdf_path(self, mock_generate):
        """
        Property: For any generated certificate, it SHALL have a pdf_path.
        **Validates: Requirements 2.4**
        """
        from apps.blueprints.models import AcademicBlueprint
        from apps.progression.models import Enrollment
        from apps.core.models import User, Program
        
        mock_generate.return_value = "certificates/generated.pdf"
        
        blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []},
            certificate_enabled=True
        )
        
        CertificateTemplate.objects.create(
            name="Default Template",
            template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}",
            is_default=True
        )
        
        user = User.objects.create(email="test@example.com", first_name="Test", last_name="User")
        program = Program.objects.create(name="Test Program", blueprint=blueprint)
        enrollment = Enrollment.objects.create(user=user, program=program, status='completed')
        
        engine = CertificationEngine()
        certificate = engine.on_program_completed(enrollment)
        
        # Verify PDF path
        assert certificate.pdf_path is not None
        assert certificate.pdf_path.endswith('.pdf')

    def test_no_certificate_when_certificate_disabled(self):
        """
        Property: For any enrollment with certificate_enabled=False,
        no certificate SHALL be generated.
        **Validates: Requirements 2.1**
        """
        from apps.blueprints.models import AcademicBlueprint
        
        blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []},
            certificate_enabled=False  # Disabled
        )
        
        enrollment = MagicMock()
        enrollment.program.blueprint = blueprint
        
        engine = CertificationEngine()
        result = engine.on_program_completed(enrollment)
        
        assert result is None

    @given(st.booleans())
    @settings(max_examples=100)
    def test_certificate_generation_respects_enabled_flag(self, certificate_enabled):
        """
        Property: Certificate generation SHALL respect the certificate_enabled flag.
        **Validates: Requirements 2.1**
        """
        blueprint = MagicMock()
        blueprint.certificate_enabled = certificate_enabled
        
        enrollment = MagicMock()
        enrollment.program.blueprint = blueprint
        
        engine = CertificationEngine()
        
        # Track if generate_certificate is called
        original_generate = engine.generate_certificate
        generate_called = [False]
        
        def mock_generate(enroll):
            generate_called[0] = True
            return MagicMock()
        
        engine.generate_certificate = mock_generate
        
        result = engine.on_program_completed(enrollment)
        
        if certificate_enabled:
            assert generate_called[0] is True
        else:
            assert generate_called[0] is False
            assert result is None

    @patch('apps.certifications.services.TemplateGenerator.generate')
    def test_certificate_record_stored_in_database(self, mock_generate):
        """
        Property: For any generated certificate, the record SHALL be stored in database.
        **Validates: Requirements 2.4**
        """
        from apps.blueprints.models import AcademicBlueprint
        from apps.progression.models import Enrollment
        from apps.core.models import User, Program
        
        mock_generate.return_value = "certificates/test.pdf"
        
        blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []},
            certificate_enabled=True
        )
        
        CertificateTemplate.objects.create(
            name="Default Template",
            template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}",
            is_default=True
        )
        
        user = User.objects.create(email="test@example.com", first_name="Test", last_name="User")
        program = Program.objects.create(name="Test Program", blueprint=blueprint)
        enrollment = Enrollment.objects.create(user=user, program=program, status='completed')
        
        initial_count = Certificate.objects.count()
        
        engine = CertificationEngine()
        certificate = engine.on_program_completed(enrollment)
        
        # Verify record was stored
        assert Certificate.objects.count() == initial_count + 1
        assert Certificate.objects.filter(id=certificate.id).exists()
