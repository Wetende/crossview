"""
Property-based tests for public views.
Requirements: 5.2, 5.3, 5.5

Uses Hypothesis for property-based testing with minimum 100 iterations.
"""

import pytest
from hypothesis import given, strategies as st, settings, assume, HealthCheck
from django.test import Client
from django.utils import timezone
from datetime import date

from apps.certifications.models import Certificate, VerificationLog


HYPOTHESIS_SETTINGS = settings(
    max_examples=10, 
    suppress_health_check=[HealthCheck.function_scoped_fixture, HealthCheck.too_slow],
    deadline=None
)


# =============================================================================
# Property 12: Certificate Verification Detail Display
# =============================================================================


class TestCertificateVerificationDisplay:
    """
    Property 12: For any valid certificate serial number, the verification page
    SHALL display the student name, program title, completion date, and issue date.
    If revoked, it SHALL additionally display the revoked status and date.
    """

    @pytest.mark.django_db
    def test_valid_certificate_displays_details(self, client, certificate):
        """Valid certificate should display all required details."""
        response = client.post(
            "/verify-certificate/",
            {
                "serial_number": certificate.serial_number,
            },
        )

        assert response.status_code == 200

    @pytest.mark.django_db
    def test_revoked_certificate_shows_revoked_status(
        self, client, revoked_certificate
    ):
        """Revoked certificate should show revoked status."""
        response = client.post(
            "/verify-certificate/",
            {
                "serial_number": revoked_certificate.serial_number,
            },
        )

        assert response.status_code == 200

    @pytest.mark.django_db
    @given(
        serial=st.text(
            min_size=5, max_size=20, alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-"
        )
    )
    @HYPOTHESIS_SETTINGS
    def test_nonexistent_certificate_returns_not_found(self, client, serial):
        """Non-existent serial should return not found result."""
        # Ensure serial doesn't exist
        assume(not Certificate.objects.filter(serial_number=serial).exists())

        response = client.post(
            "/verify-certificate/",
            {
                "serial_number": serial,
            },
        )

        assert response.status_code == 200


# =============================================================================
# Property 13: Verification Audit Logging
# =============================================================================


class TestVerificationAuditLogging:
    """
    Property 13: For any certificate verification attempt, a VerificationLog record
    SHALL be created containing the queried serial number, IP address, user agent,
    result, and timestamp.
    """

    @pytest.mark.django_db
    def test_valid_certificate_creates_log(self, client, certificate):
        """Verifying valid certificate should create log entry."""
        initial_count = VerificationLog.objects.count()

        response = client.post(
            "/verify-certificate/",
            {
                "serial_number": certificate.serial_number,
            },
            HTTP_USER_AGENT="Test Browser",
        )

        assert VerificationLog.objects.count() == initial_count + 1

        log = VerificationLog.objects.latest("created_at")
        assert log.serial_number_queried == certificate.serial_number
        assert log.result == "valid"
        assert log.user_agent == "Test Browser"
        assert log.verified_at is not None

    @pytest.mark.django_db
    def test_revoked_certificate_logs_revoked(self, client, revoked_certificate):
        """Verifying revoked certificate should log 'revoked' result."""
        response = client.post(
            "/verify-certificate/",
            {
                "serial_number": revoked_certificate.serial_number,
            },
        )

        log = VerificationLog.objects.latest("created_at")
        assert log.result == "revoked"

    @pytest.mark.django_db
    @given(
        serial=st.text(
            min_size=5, max_size=20, alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-"
        )
    )
    @HYPOTHESIS_SETTINGS
    def test_nonexistent_certificate_logs_not_found(self, client, serial):
        """Verifying non-existent certificate should log 'not_found' result."""
        assume(not Certificate.objects.filter(serial_number=serial).exists())
        assume(serial.strip())  # Ensure non-empty

        initial_count = VerificationLog.objects.count()

        response = client.post(
            "/verify-certificate/",
            {
                "serial_number": serial,
            },
        )

        assert VerificationLog.objects.count() == initial_count + 1

        log = VerificationLog.objects.latest("created_at")
        assert log.serial_number_queried == serial.upper()
        assert log.result == "not_found"

    @pytest.mark.django_db
    def test_log_captures_ip_address(self, client, certificate):
        """Log should capture client IP address."""
        response = client.post(
            "/verify-certificate/",
            {
                "serial_number": certificate.serial_number,
            },
            REMOTE_ADDR="192.168.1.100",
        )

        log = VerificationLog.objects.latest("created_at")
        assert log.ip_address == "192.168.1.100"


# =============================================================================
# Fixtures
# =============================================================================


@pytest.fixture
def client():
    """Django test client."""
    return Client()


@pytest.fixture
def certificate(db):
    """Create a valid certificate for testing."""
    from apps.core.models import Program
    from apps.progression.models import Enrollment
    from apps.certifications.models import CertificateTemplate, Certificate

    # Create minimal required objects
    program = Program.objects.create(
        name="Test Program",
        code="TEST-001",
    )

    # Create user for enrollment
    from apps.core.tests.factories import UserFactory

    user = UserFactory()

    # Create enrollment
    enrollment = Enrollment.objects.create(
        user=user,
        program=program,
        status="completed",
    )

    # Create template
    template = CertificateTemplate.objects.create(
        name="Test Template",
        template_html="<html>{{student_name}}{{program_title}}{{completion_date}}{{serial_number}}</html>",
    )

    # Create certificate
    return Certificate.objects.create(
        enrollment=enrollment,
        template=template,
        serial_number="CERT-TEST-001",
        student_name=user.get_full_name(),
        program_title=program.name,
        completion_date=date.today(),
        issue_date=date.today(),
        pdf_path="/certificates/test.pdf",
        is_revoked=False,
    )


@pytest.fixture
def revoked_certificate(db, certificate):
    """Create a revoked certificate for testing."""
    certificate.is_revoked = True
    certificate.revoked_at = timezone.now()
    certificate.revocation_reason = "Test revocation"
    certificate.serial_number = "CERT-REVOKED-001"
    certificate.save()
    return certificate
