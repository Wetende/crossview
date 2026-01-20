"""
Certification models - Certificate generation and verification.
Requirements: 1.1, 1.2, 1.3, 1.4, 2.4, 3.2, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3
"""
from django.db import models
from django.core.signing import TimestampSigner
from django.urls import reverse
from apps.core.models import TimeStampedModel


class CertificateTemplate(TimeStampedModel):
    """
    Configurable PDF template with placeholders for certificate generation.
    Requirements: 1.1, 1.2, 1.3, 1.4
    """
    REQUIRED_PLACEHOLDERS = [
        '{{student_name}}',
        '{{program_title}}',
        '{{completion_date}}',
        '{{serial_number}}'
    ]

    name = models.CharField(max_length=255)
    blueprint = models.ForeignKey(
        'blueprints.AcademicBlueprint',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='certificate_templates'
    )
    template_html = models.TextField()
    is_default = models.BooleanField(default=False)
    metadata = models.JSONField(blank=True, null=True)

    class Meta:
        db_table = 'certificate_templates'
        indexes = [
            models.Index(fields=['blueprint'], name='cert_tmpl_blueprint_idx'),
            models.Index(fields=['is_default'], name='cert_tmpl_is_default_idx'),
        ]

    def __str__(self):
        return self.name

    def has_required_placeholders(self) -> bool:
        """
        Check if template contains all required placeholders.
        Requirements: 1.2, 1.3
        """
        return all(p in self.template_html for p in self.REQUIRED_PLACEHOLDERS)

    def get_missing_placeholders(self) -> list:
        """Return list of missing required placeholders."""
        return [p for p in self.REQUIRED_PLACEHOLDERS if p not in self.template_html]


class Certificate(TimeStampedModel):
    """
    Generated PDF certificate awarded to a student upon program completion.
    Requirements: 2.4, 3.2, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3
    """
    enrollment = models.ForeignKey(
        'progression.Enrollment',
        on_delete=models.CASCADE,
        related_name='certificates'
    )
    template = models.ForeignKey(
        'CertificateTemplate',
        on_delete=models.PROTECT,
        related_name='certificates'
    )
    serial_number = models.CharField(max_length=50, unique=True)
    student_name = models.CharField(max_length=255)
    program_title = models.CharField(max_length=255)
    completion_date = models.DateField()
    issue_date = models.DateField()
    pdf_path = models.CharField(max_length=500)
    is_revoked = models.BooleanField(default=False)
    revoked_at = models.DateTimeField(blank=True, null=True)
    revocation_reason = models.TextField(blank=True, null=True)
    metadata = models.JSONField(blank=True, null=True)

    class Meta:
        db_table = 'certificates'
        indexes = [
            models.Index(fields=['serial_number'], name='cert_serial_number_idx'),
            models.Index(fields=['enrollment'], name='cert_enrollment_idx'),
            models.Index(fields=['is_revoked'], name='cert_is_revoked_idx'),
        ]

    def __str__(self):
        return f"{self.serial_number} - {self.student_name}"

    def get_signed_download_url(self, max_age: int = 3600) -> str:
        """
        Generate a signed URL for downloading the certificate PDF.
        Requirements: 5.2
        
        Args:
            max_age: URL expiration time in seconds (default 1 hour)
        """
        signer = TimestampSigner()
        signed_value = signer.sign(f"{self.id}:{self.pdf_path}")
        return f"/certificates/download/{signed_value}/"

    def get_verification_url(self) -> str:
        """
        Generate a public verification URL for the certificate.
        Requirements: 5.3
        """
        return reverse('certifications:verify', kwargs={'serial_number': self.serial_number})


class VerificationLog(TimeStampedModel):
    """
    Log of certificate verification attempts for audit purposes.
    Requirements: 4.4
    """
    RESULT_CHOICES = [
        ('valid', 'Valid'),
        ('revoked', 'Revoked'),
        ('not_found', 'Not Found'),
    ]

    certificate = models.ForeignKey(
        'Certificate',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verification_logs'
    )
    serial_number_queried = models.CharField(max_length=50)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    result = models.CharField(max_length=20, choices=RESULT_CHOICES)
    verified_at = models.DateTimeField()

    class Meta:
        db_table = 'verification_logs'
        indexes = [
            models.Index(fields=['serial_number_queried'], name='verif_serial_queried_idx'),
            models.Index(fields=['verified_at'], name='verif_verified_at_idx'),
        ]

    def __str__(self):
        return f"{self.serial_number_queried} - {self.result} at {self.verified_at}"
