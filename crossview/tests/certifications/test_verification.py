"""
Property tests for certificate verification.
**Property 7: Verification Returns Correct Response**
**Property 8: Verification Logging**
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**
"""
import pytest
from hypothesis import given, strategies as st, settings

from apps.certifications.services import VerificationService, VerificationResult
from apps.certifications.models import Certificate, CertificateTemplate, VerificationLog


@pytest.mark.django_db
class TestVerificationReturnsCorrectResponse:
    """
    Property tests for verification response correctness.
    Feature: certification-engine, Property 7: Verification Returns Correct Response
    """

    def test_valid_serial_returns_valid_status(self):
        """
        Property: For any valid serial number, verification SHALL return 'valid' status.
        **Validates: Requirements 4.1, 4.2**
        """
        from apps.blueprints.models import AcademicBlueprint
        from apps.progression.models import Enrollment
        from apps.core.models import User, Program
        
        # Create required objects
        blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []}
        )
        template = CertificateTemplate.objects.create(
            name="Test Template",
            template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}",
            is_default=True
        )
        user = User.objects.create(email="test@example.com", first_name="John", last_name="Doe")
        program = Program.objects.create(name="Test Program", blueprint=blueprint)
        enrollment = Enrollment.objects.create(user=user, program=program)
        
        # Create certificate
        certificate = Certificate.objects.create(
            enrollment=enrollment,
            template=template,
            serial_number="CCT-2025-ABC123",
            student_name="John Doe",
            program_title="Test Program",
            completion_date="2025-01-01",
            issue_date="2025-01-01",
            pdf_path="certificates/test.pdf"
        )
        
        service = VerificationService()
        result = service.verify("CCT-2025-ABC123")
        
        assert result.status == 'valid'
        assert result.certificate is not None
        assert result.certificate.id == certificate.id
        assert result.message == 'Certificate is valid'

    def test_valid_certificate_returns_details(self):
        """
        Property: For any valid certificate, verification SHALL return certificate details.
        **Validates: Requirements 4.2**
        """
        from apps.blueprints.models import AcademicBlueprint
        from apps.progression.models import Enrollment
        from apps.core.models import User, Program
        
        blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []}
        )
        template = CertificateTemplate.objects.create(
            name="Test Template",
            template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}",
            is_default=True
        )
        user = User.objects.create(email="test@example.com", first_name="Jane", last_name="Smith")
        program = Program.objects.create(name="Advanced Python", blueprint=blueprint)
        enrollment = Enrollment.objects.create(user=user, program=program)
        
        certificate = Certificate.objects.create(
            enrollment=enrollment,
            template=template,
            serial_number="CCT-2025-XYZ789",
            student_name="Jane Smith",
            program_title="Advanced Python",
            completion_date="2025-06-15",
            issue_date="2025-06-15",
            pdf_path="certificates/test.pdf"
        )
        
        service = VerificationService()
        result = service.verify("CCT-2025-XYZ789")
        
        # Verify details are returned
        assert result.certificate.student_name == "Jane Smith"
        assert result.certificate.program_title == "Advanced Python"
        assert str(result.certificate.completion_date) == "2025-06-15"
        assert str(result.certificate.issue_date) == "2025-06-15"

    @given(st.text(min_size=5, max_size=20))
    @settings(max_examples=100)
    def test_invalid_serial_returns_not_found(self, invalid_serial):
        """
        Property: For any invalid serial number, verification SHALL return 'not_found'.
        **Validates: Requirements 4.3**
        """
        service = VerificationService()
        result = service.verify(invalid_serial)
        
        assert result.status == 'not_found'
        assert result.certificate is None
        assert result.message == 'Certificate not found'

    def test_revoked_certificate_returns_revoked_status(self):
        """
        Property: For any revoked certificate, verification SHALL return 'revoked' status.
        **Validates: Requirements 4.3**
        """
        from apps.blueprints.models import AcademicBlueprint
        from apps.progression.models import Enrollment
        from apps.core.models import User, Program
        from django.utils import timezone
        
        blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []}
        )
        template = CertificateTemplate.objects.create(
            name="Test Template",
            template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}",
            is_default=True
        )
        user = User.objects.create(email="test@example.com")
        program = Program.objects.create(name="Test Program", blueprint=blueprint)
        enrollment = Enrollment.objects.create(user=user, program=program)
        
        # Create revoked certificate
        certificate = Certificate.objects.create(
            enrollment=enrollment,
            template=template,
            serial_number="CCT-2025-REVOKED",
            student_name="Test User",
            program_title="Test Program",
            completion_date="2025-01-01",
            issue_date="2025-01-01",
            pdf_path="certificates/test.pdf",
            is_revoked=True,
            revoked_at=timezone.now(),
            revocation_reason="Academic misconduct"
        )
        
        service = VerificationService()
        result = service.verify("CCT-2025-REVOKED")
        
        assert result.status == 'revoked'
        assert result.certificate is not None
        assert result.message == 'Certificate has been revoked'


@pytest.mark.django_db
class TestVerificationLogging:
    """
    Property tests for verification logging.
    Feature: certification-engine, Property 8: Verification Logging
    """

    def test_verification_creates_log_entry(self):
        """
        Property: For any verification attempt, a log entry SHALL be created.
        **Validates: Requirements 4.4**
        """
        initial_count = VerificationLog.objects.count()
        
        service = VerificationService()
        service.verify("CCT-2025-NONEXISTENT", ip_address="192.168.1.1")
        
        assert VerificationLog.objects.count() == initial_count + 1

    def test_log_contains_serial_number_queried(self):
        """
        Property: For any verification log, it SHALL contain the serial_number_queried.
        **Validates: Requirements 4.4**
        """
        service = VerificationService()
        service.verify("CCT-2025-TESTSERIAL")
        
        log = VerificationLog.objects.latest('created_at')
        assert log.serial_number_queried == "CCT-2025-TESTSERIAL"

    def test_log_contains_result(self):
        """
        Property: For any verification log, it SHALL contain the result.
        **Validates: Requirements 4.4**
        """
        service = VerificationService()
        service.verify("CCT-2025-UNKNOWN")
        
        log = VerificationLog.objects.latest('created_at')
        assert log.result == 'not_found'

    def test_log_contains_verified_at(self):
        """
        Property: For any verification log, it SHALL contain verified_at timestamp.
        **Validates: Requirements 4.4**
        """
        service = VerificationService()
        service.verify("CCT-2025-TIMESTAMP")
        
        log = VerificationLog.objects.latest('created_at')
        assert log.verified_at is not None

    def test_log_contains_ip_address_when_provided(self):
        """
        Property: For any verification with IP address, log SHALL contain ip_address.
        **Validates: Requirements 4.4**
        """
        service = VerificationService()
        service.verify("CCT-2025-IPTEST", ip_address="10.0.0.1")
        
        log = VerificationLog.objects.latest('created_at')
        assert log.ip_address == "10.0.0.1"

    def test_log_links_to_certificate_when_found(self):
        """
        Property: For any successful verification, log SHALL link to certificate.
        **Validates: Requirements 4.4**
        """
        from apps.blueprints.models import AcademicBlueprint
        from apps.progression.models import Enrollment
        from apps.core.models import User, Program
        
        blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []}
        )
        template = CertificateTemplate.objects.create(
            name="Test Template",
            template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}",
            is_default=True
        )
        user = User.objects.create(email="test@example.com")
        program = Program.objects.create(name="Test Program", blueprint=blueprint)
        enrollment = Enrollment.objects.create(user=user, program=program)
        
        certificate = Certificate.objects.create(
            enrollment=enrollment,
            template=template,
            serial_number="CCT-2025-LOGLINK",
            student_name="Test User",
            program_title="Test Program",
            completion_date="2025-01-01",
            issue_date="2025-01-01",
            pdf_path="certificates/test.pdf"
        )
        
        service = VerificationService()
        service.verify("CCT-2025-LOGLINK")
        
        log = VerificationLog.objects.latest('created_at')
        assert log.certificate is not None
        assert log.certificate.id == certificate.id

    @given(st.text(min_size=1, max_size=50))
    @settings(max_examples=100)
    def test_all_verification_attempts_are_logged(self, serial):
        """
        Property: For any serial number queried, a log entry SHALL be created.
        **Validates: Requirements 4.4**
        """
        initial_count = VerificationLog.objects.count()
        
        service = VerificationService()
        service.verify(serial)
        
        assert VerificationLog.objects.count() == initial_count + 1
        
        log = VerificationLog.objects.latest('created_at')
        assert log.serial_number_queried == serial
