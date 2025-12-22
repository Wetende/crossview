"""
Certifications views - Certificate verification and download.
Requirements: 5.2, 5.3, 6.1, 6.2, 6.3
"""

from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from inertia import render

from apps.certifications.models import Certificate, VerificationLog
from apps.progression.models import Enrollment


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def certificate_download(request, pk):
    """
    Get a signed URL for downloading a certificate PDF.
    Requirements: 5.2, 8.3

    GET /api/v1/student/certificates/<id>/download/
    """
    user = request.user

    # Get user's enrollment IDs
    enrollment_ids = list(
        Enrollment.objects.filter(user=user).values_list("id", flat=True)
    )

    try:
        certificate = Certificate.objects.get(
            pk=pk,
            enrollment_id__in=enrollment_ids,
        )
    except Certificate.DoesNotExist:
        return Response(
            {"error": "Certificate not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Check if revoked
    if certificate.is_revoked:
        return Response(
            {"error": "This certificate has been revoked and cannot be downloaded"},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Generate signed download URL
    signed_url = certificate.get_signed_download_url(max_age=3600)

    return Response(
        {
            "url": signed_url,
            "filename": f"certificate_{certificate.serial_number}.pdf",
        }
    )


def verify_certificate(request, serial_number):
    """
    Public verification page for certificates.
    Requirements: 5.3, 6.1, 6.2, 6.3

    GET /certificates/verify/<serial_number>/
    """
    # Try to find the certificate
    certificate = Certificate.objects.filter(serial_number=serial_number).first()

    # Determine result
    if certificate is None:
        result = "not_found"
        certificate_data = None
    elif certificate.is_revoked:
        result = "revoked"
        certificate_data = {
            "serialNumber": certificate.serial_number,
            "studentName": certificate.student_name,
            "programTitle": certificate.program_title,
            "completionDate": certificate.completion_date.isoformat(),
            "issueDate": certificate.issue_date.isoformat(),
            "isRevoked": True,
            "revocationReason": certificate.revocation_reason,
        }
    else:
        result = "valid"
        certificate_data = {
            "serialNumber": certificate.serial_number,
            "studentName": certificate.student_name,
            "programTitle": certificate.program_title,
            "completionDate": certificate.completion_date.isoformat(),
            "issueDate": certificate.issue_date.isoformat(),
            "isRevoked": False,
        }

    # Log verification attempt
    VerificationLog.objects.create(
        certificate=certificate,
        serial_number_queried=serial_number,
        ip_address=_get_client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", ""),
        result=result,
        verified_at=timezone.now(),
    )

    return render(
        request,
        "Public/CertificateVerify",
        {
            "serialNumber": serial_number,
            "result": result,
            "certificate": certificate_data,
        },
    )


def _get_client_ip(request):
    """Get client IP address from request."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")
