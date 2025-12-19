"""
Certification services - Template generation, serial numbers, verification.
Requirements: 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3
"""
import os
import random
import string
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from django.conf import settings
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.utils import timezone

from .models import Certificate, CertificateTemplate, VerificationLog


class TemplateValidationError(Exception):
    """Raised when template validation fails."""
    def __init__(self, message: str, missing_placeholders: list = None):
        super().__init__(message)
        self.missing_placeholders = missing_placeholders or []


class TemplateGenerator:
    """
    Service for managing certificate templates and generating PDFs.
    Requirements: 1.2, 1.3, 1.4, 2.2
    """
    REQUIRED_PLACEHOLDERS = [
        '{{student_name}}',
        '{{program_title}}',
        '{{completion_date}}',
        '{{serial_number}}'
    ]

    def validate_template(self, template_html: str) -> dict:
        """
        Validate that template contains all required placeholders.
        Requirements: 1.2, 1.3
        
        Returns:
            dict with 'valid' (bool) and 'missing' (list of missing placeholders)
        """
        missing = [p for p in self.REQUIRED_PLACEHOLDERS if p not in template_html]
        return {'valid': len(missing) == 0, 'missing': missing}

    def get_default_template(self) -> Optional[CertificateTemplate]:
        """
        Get the default certificate template.
        Requirements: 1.4
        """
        return CertificateTemplate.objects.filter(is_default=True).first()

    def get_template_for_enrollment(self, enrollment) -> CertificateTemplate:
        """
        Get the appropriate template for an enrollment.
        Falls back to default template if no blueprint-specific template exists.
        Requirements: 1.4
        """
        blueprint = enrollment.program.blueprint
        if blueprint:
            template = CertificateTemplate.objects.filter(blueprint=blueprint).first()
            if template:
                return template
        
        default = self.get_default_template()
        if not default:
            raise TemplateValidationError("No default template configured")
        return default

    def generate(self, template: CertificateTemplate, data: dict) -> str:
        """
        Generate a PDF certificate from template and data.
        Requirements: 2.2
        
        Args:
            template: The certificate template to use
            data: Dictionary with student_name, program_title, completion_date, serial_number
            
        Returns:
            Path to the generated PDF file
        """
        from weasyprint import HTML
        
        # Replace placeholders with actual values
        html_content = template.template_html
        for key, value in data.items():
            placeholder = f"{{{{{key}}}}}"
            html_content = html_content.replace(placeholder, str(value))
        
        # Ensure certificates directory exists
        cert_dir = os.path.join(settings.MEDIA_ROOT, 'certificates')
        os.makedirs(cert_dir, exist_ok=True)
        
        # Generate PDF
        pdf_filename = f"{data['serial_number']}.pdf"
        pdf_path = os.path.join('certificates', pdf_filename)
        full_path = os.path.join(settings.MEDIA_ROOT, pdf_path)
        
        HTML(string=html_content).write_pdf(full_path)
        
        return pdf_path


class SerialNumberGenerator:
    """
    Service for generating unique certificate serial numbers.
    Requirements: 3.1, 3.2, 3.3
    """
    DEFAULT_PREFIX = 'CCT'

    def generate(self, prefix: str = None) -> str:
        """
        Generate a unique serial number in PREFIX-YEAR-XXXXXX format.
        Requirements: 3.1, 3.2, 3.3
        
        Args:
            prefix: Institution prefix (default: CCT)
            
        Returns:
            Unique serial number string
        """
        prefix = prefix or self.DEFAULT_PREFIX
        year = datetime.now().year
        
        # Generate random alphanumeric code
        random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        serial = f"{prefix}-{year}-{random_part}"
        
        # Ensure uniqueness
        while not self.is_unique(serial):
            random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            serial = f"{prefix}-{year}-{random_part}"
        
        return serial

    def is_unique(self, serial_number: str) -> bool:
        """
        Check if a serial number is unique.
        Requirements: 3.2
        """
        return not Certificate.objects.filter(serial_number=serial_number).exists()

    def parse(self, serial_number: str) -> dict:
        """
        Parse a serial number into its components.
        Requirements: 3.3
        
        Returns:
            dict with 'prefix', 'year', 'code'
        """
        parts = serial_number.split('-')
        if len(parts) != 3:
            raise ValueError(f"Invalid serial number format: {serial_number}")
        return {
            'prefix': parts[0],
            'year': int(parts[1]),
            'code': parts[2]
        }

    def validate_format(self, serial_number: str) -> bool:
        """
        Validate that a serial number matches the expected format.
        """
        import re
        pattern = r'^[A-Z]{2,5}-\d{4}-[A-Z0-9]{6}$'
        return bool(re.match(pattern, serial_number))


@dataclass
class VerificationResult:
    """Result of a certificate verification attempt."""
    status: str  # 'valid', 'revoked', 'not_found'
    certificate: Optional[Certificate] = None
    message: str = ''


class VerificationService:
    """
    Service for verifying certificate authenticity.
    Requirements: 4.1, 4.2, 4.3, 4.4
    """

    def verify(self, serial_number: str, ip_address: str = None, user_agent: str = None) -> VerificationResult:
        """
        Verify a certificate by its serial number.
        Requirements: 4.1, 4.2, 4.3
        
        Returns:
            VerificationResult with status and certificate details
        """
        try:
            certificate = Certificate.objects.select_related('template', 'enrollment').get(
                serial_number=serial_number
            )
            if certificate.is_revoked:
                result = VerificationResult(
                    status='revoked',
                    certificate=certificate,
                    message='Certificate has been revoked'
                )
            else:
                result = VerificationResult(
                    status='valid',
                    certificate=certificate,
                    message='Certificate is valid'
                )
        except Certificate.DoesNotExist:
            result = VerificationResult(
                status='not_found',
                message='Certificate not found'
            )
            certificate = None
        
        # Log the verification attempt
        self.log_attempt(certificate, serial_number, result.status, ip_address, user_agent)
        
        return result

    def log_attempt(
        self,
        certificate: Optional[Certificate],
        serial_number: str,
        result: str,
        ip_address: str = None,
        user_agent: str = None
    ) -> VerificationLog:
        """
        Log a verification attempt.
        Requirements: 4.4
        """
        return VerificationLog.objects.create(
            certificate=certificate,
            serial_number_queried=serial_number,
            ip_address=ip_address,
            user_agent=user_agent,
            result=result,
            verified_at=timezone.now()
        )


class CertificationEngine:
    """
    Main orchestration service for certificate generation and management.
    Requirements: 2.1, 2.3, 2.4, 5.1, 6.1, 6.2, 6.3
    """

    def __init__(
        self,
        template_generator: TemplateGenerator = None,
        serial_generator: SerialNumberGenerator = None,
        verification_service: VerificationService = None
    ):
        self.template_generator = template_generator or TemplateGenerator()
        self.serial_generator = serial_generator or SerialNumberGenerator()
        self.verification_service = verification_service or VerificationService()

    def generate_certificate(self, enrollment) -> Certificate:
        """
        Generate a certificate for a completed enrollment.
        Requirements: 2.1, 2.3, 2.4
        
        Args:
            enrollment: The completed enrollment
            
        Returns:
            The created Certificate instance
        """
        template = self.template_generator.get_template_for_enrollment(enrollment)
        serial = self.serial_generator.generate()
        
        completion_date = timezone.now().date()
        if enrollment.completed_at:
            completion_date = enrollment.completed_at.date()
        
        data = {
            'student_name': enrollment.user.get_full_name() or enrollment.user.email,
            'program_title': enrollment.program.name,
            'completion_date': completion_date.strftime('%B %d, %Y'),
            'serial_number': serial,
        }
        
        pdf_path = self.template_generator.generate(template, data)
        
        return Certificate.objects.create(
            enrollment=enrollment,
            template=template,
            serial_number=serial,
            student_name=data['student_name'],
            program_title=data['program_title'],
            completion_date=completion_date,
            issue_date=timezone.now().date(),
            pdf_path=pdf_path,
        )

    def on_program_completed(self, enrollment) -> Optional[Certificate]:
        """
        Handler for program completion events.
        Requirements: 2.1
        
        Args:
            enrollment: The enrollment that reached 100% completion
            
        Returns:
            Certificate if generated, None if certificate_enabled is False
        """
        blueprint = enrollment.program.blueprint
        if blueprint and blueprint.certificate_enabled:
            return self.generate_certificate(enrollment)
        return None

    def get_certificate_for_download(self, certificate: Certificate) -> str:
        """
        Get the PDF file path for download.
        Requirements: 5.1
        """
        return certificate.pdf_path

    def revoke(self, certificate: Certificate, reason: str) -> Certificate:
        """
        Revoke a certificate.
        Requirements: 6.1, 6.2, 6.3
        
        Args:
            certificate: The certificate to revoke
            reason: Reason for revocation
            
        Returns:
            The updated certificate
        """
        certificate.is_revoked = True
        certificate.revoked_at = timezone.now()
        certificate.revocation_reason = reason
        certificate.save()
        return certificate

    def get_signed_download_url(self, certificate: Certificate, max_age: int = 3600) -> str:
        """
        Generate a signed URL for certificate download.
        Requirements: 5.2
        
        Args:
            certificate: The certificate
            max_age: URL expiration in seconds (default 1 hour)
        """
        return certificate.get_signed_download_url(max_age)

    def verify_signed_url(self, signed_value: str, max_age: int = 3600) -> Optional[Certificate]:
        """
        Verify a signed download URL and return the certificate.
        Requirements: 5.2
        """
        signer = TimestampSigner()
        try:
            value = signer.unsign(signed_value, max_age=max_age)
            cert_id, _ = value.split(':', 1)
            return Certificate.objects.get(id=int(cert_id))
        except (BadSignature, SignatureExpired, Certificate.DoesNotExist, ValueError):
            return None
