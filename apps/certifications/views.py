"""
Certifications views - Certificate verification and download.
Requirements: 5.2, 5.3, 6.1, 6.2, 6.3
"""

from datetime import timedelta

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from django.shortcuts import get_object_or_404, redirect
from django.views.decorators.http import require_POST
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from inertia import render

from apps.certifications.models import (
    Certificate,
    CertificateEligibility,
)
from apps.certifications.services import (
    CertificateEligibilityService,
    VerificationService,
    serialize_verification_result,
)
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
    normalized_serial = str(serial_number or "").strip().upper()
    result = VerificationService().verify(
        normalized_serial,
        ip_address=_get_client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
    )
    payload = serialize_verification_result(result)

    return render(
        request,
        "Public/CertificateVerification",
        {
            "serialNumber": normalized_serial,
            **payload,
        },
    )


@login_required
def admin_certificates(request):
    """
    Admin page to manage all certificates.
    Requirements: Certificate management for admins

    GET /admin/certificates/
    """
    # Require admin or superadmin role
    # Require admin or superadmin role
    if not (request.user.is_superuser or request.user.is_staff):
        return redirect("core:dashboard")

    # Get all certificates with related data
    certificates = Certificate.objects.select_related(
        "enrollment", "enrollment__user", "enrollment__program"
    ).order_by("-issue_date")

    queue_records = CertificateEligibility.objects.select_related(
        "enrollment",
        "enrollment__user",
        "enrollment__program",
        "certificate",
        "reviewed_by",
    ).order_by("status", "-eligible_at", "-updated_at")

    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)

    total_certificates = certificates.count()
    certificates_this_month = certificates.filter(issue_date__gte=thirty_days_ago).count()
    revoked_count = certificates.filter(is_revoked=True).count()

    pending_queue_count = queue_records.filter(status="pending").count()
    released_queue_count = queue_records.filter(status="released").count()
    ineligible_queue_count = queue_records.filter(status="ineligible").count()

    serialized_certificates = []
    for cert in certificates:
        serialized_certificates.append(
            {
                "id": cert.id,
                "eligibilityId": None,
                "serialNumber": cert.serial_number,
                "studentName": cert.student_name,
                "studentEmail": cert.enrollment.user.email if cert.enrollment else None,
                "programTitle": cert.program_title,
                "completionDate": cert.completion_date.isoformat() if cert.completion_date else None,
                "issuedAt": cert.issue_date.isoformat() if cert.issue_date else None,
                "isRevoked": cert.is_revoked,
                "revocationReason": cert.revocation_reason,
                "queueStatus": "released",
                "canRelease": False,
                "reviewedBy": None,
                "releasedAt": cert.issue_date.isoformat() if cert.issue_date else None,
            }
        )

    issued_enrollment_ids = {
        cert.enrollment_id for cert in certificates if cert.enrollment_id is not None
    }

    for record in queue_records:
        if record.enrollment_id in issued_enrollment_ids:
            continue

        serialized_certificates.append(
            {
                "id": record.certificate_id,
                "eligibilityId": record.id,
                "serialNumber": (
                    record.certificate.serial_number
                    if record.certificate_id
                    else f"QUEUE-{record.enrollment_id}"
                ),
                "studentName": (
                    record.enrollment.user.get_full_name() or record.enrollment.user.email
                ),
                "studentEmail": record.enrollment.user.email,
                "programTitle": record.enrollment.program.name,
                "completionDate": (
                    record.enrollment.completed_at.isoformat()
                    if record.enrollment.completed_at
                    else None
                ),
                "issuedAt": (
                    record.certificate.issue_date.isoformat()
                    if record.certificate_id and record.certificate.issue_date
                    else None
                ),
                "isRevoked": bool(record.certificate and record.certificate.is_revoked),
                "revocationReason": (
                    record.certificate.revocation_reason
                    if record.certificate and record.certificate.is_revoked
                    else None
                ),
                "queueStatus": record.status,
                "canRelease": record.status == "pending",
                "reviewedBy": (
                    record.reviewed_by.get_full_name() or record.reviewed_by.email
                    if record.reviewed_by
                    else None
                ),
                "releasedAt": (
                    record.released_at.isoformat() if record.released_at else None
                ),
            }
        )

    return render(
        request,
        "Admin/Certificates/Index",
        {
            "certificates": serialized_certificates,
            "stats": {
                "total": total_certificates,
                "thisMonth": certificates_this_month,
                "revoked": revoked_count,
                "pendingQueue": pending_queue_count,
                "releasedQueue": released_queue_count,
                "ineligibleQueue": ineligible_queue_count,
            },
        },
    )


@login_required
@require_POST
def admin_certificate_release(request, eligibility_id: int):
    """Admin-only manual release action for eligible certificate queue records."""
    if not (request.user.is_superuser or request.user.is_staff):
        messages.error(request, "Only admins can release certificates")
        return redirect("certifications:admin.certificates")

    eligibility = get_object_or_404(CertificateEligibility, pk=eligibility_id)
    notes = str(request.POST.get("notes") or "").strip()

    service = CertificateEligibilityService()
    try:
        service.release(eligibility, approved_by=request.user, notes=notes)
    except ValueError as exc:
        messages.error(request, str(exc))
    except Exception:
        messages.error(request, "Certificate release failed. Please try again.")
    else:
        messages.success(request, "Certificate released successfully")

    return redirect("certifications:admin.certificates")


@login_required
@require_POST
def admin_certificate_refresh_queue(request):
    """Refresh eligibility queue for all enrollments.

    Keeps queue status in sync after grading/progression updates.
    """
    if not (request.user.is_superuser or request.user.is_staff):
        messages.error(request, "Only admins can refresh certificate eligibility")
        return redirect("certifications:admin.certificates")

    service = CertificateEligibilityService()
    enrollments = Enrollment.objects.filter(
        status__in=["active", "completed"],
    ).select_related("program", "program__blueprint", "user")

    refreshed = 0
    for enrollment in enrollments:
        service.refresh_enrollment(enrollment)
        refreshed += 1

    messages.success(request, f"Certificate eligibility refreshed for {refreshed} enrollments")
    return redirect("certifications:admin.certificates")

def _get_client_ip(request):
    """Get client IP address from request."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")
