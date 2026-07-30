"""
Certifications views - Certificate verification and download.
Requirements: 5.2, 5.3, 6.1, 6.2, 6.3
"""

from datetime import timedelta
from pathlib import Path
from tempfile import NamedTemporaryFile

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.http import FileResponse, Http404, HttpResponse, JsonResponse
from django.db.models import Q
from django.utils import timezone
from django.shortcuts import get_object_or_404, redirect
from django.views.decorators.http import require_POST
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from inertia import render

from apps.certifications.models import (
    Certificate,
    CertificateAsset,
    CertificateEligibility,
    CertificateTemplate,
    CertificateTemplateAssignment,
    CertificateTemplateVersion,
)
from apps.certifications.assignments import (
    published_template_versions,
    serialize_assignment,
    set_category_assignment,
    set_course_assignment,
    set_default_assignment,
)
from apps.certifications.rendering import render_layout_pdf
from apps.certifications.services import (
    CertificationEngine,
    CertificateEligibilityService,
    VerificationService,
    serialize_verification_result,
)
from apps.certifications.template_builder import (
    clone_template,
    create_blank_template,
    publish_template,
    require_editable_template,
    require_template_manager,
    require_viewable_template,
    save_template,
    serialize_template,
    validate_layout,
)
from apps.core.utils import get_post_data
from apps.core.models import Program
from apps.platform.models import PlatformSettings
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


@login_required
def signed_certificate_download(request, signed_value):
    """Stream a signed certificate only to its learner or an administrator."""
    certificate = CertificationEngine().verify_signed_url(signed_value)
    if certificate is None:
        raise Http404("Certificate download link is invalid or expired.")
    owns_certificate = certificate.enrollment.user_id == request.user.id
    if not (owns_certificate or request.user.is_staff or request.user.is_superuser):
        raise Http404("Certificate not found.")
    if certificate.is_revoked:
        return HttpResponse(
            "This certificate has been revoked.",
            status=403,
            content_type="text/plain",
        )

    media_root = Path(settings.MEDIA_ROOT).resolve()
    pdf_file = (media_root / certificate.pdf_path).resolve()
    try:
        pdf_file.relative_to(media_root)
    except ValueError as exc:
        raise Http404("Certificate file is invalid.") from exc
    if not pdf_file.is_file():
        raise Http404("Certificate file is missing.")
    return FileResponse(
        pdf_file.open("rb"),
        as_attachment=True,
        filename=f"certificate_{certificate.serial_number}.pdf",
        content_type="application/pdf",
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
        service.issue_if_eligible(enrollment)
        refreshed += 1

    messages.success(
        request,
        f"Certificate eligibility refreshed for {refreshed} enrollments; "
        "eligible certificates were issued automatically.",
    )
    return redirect("certifications:admin.certificates")


def _validation_message(exc: ValidationError) -> str:
    if hasattr(exc, "message_dict"):
        return " ".join(
            message
            for messages_for_field in exc.message_dict.values()
            for message in messages_for_field
        )
    return " ".join(exc.messages)


def _visible_certificate_templates(user):
    templates = CertificateTemplate.objects.filter(
        Q(visibility=CertificateTemplate.Visibility.SYSTEM)
        | Q(owner=user)
        | Q(owner__isnull=True, is_starter=False)
    )
    if user.is_superuser:
        templates = CertificateTemplate.objects.all()
    return (
        templates.filter(versions__isnull=False)
        .distinct()
        .prefetch_related("versions")
        .order_by("-is_starter", "name")
    )


@login_required
def admin_certificate_templates(request):
    """Compact visual gallery plus MasterStudy-style assignment overview."""
    require_template_manager(request.user)
    visible_templates = _visible_certificate_templates(request.user)

    templates = [serialize_template(template) for template in visible_templates]
    assignments = list(
        CertificateTemplateAssignment.objects.select_related(
            "template_version__template",
            "program",
        ).order_by("scope", "category", "program__name")
    )
    published = []
    for version in published_template_versions():
        template_data = serialize_template(version.template)
        template_data.update(
            {
                "version": version.version_number,
                "templateVersionId": version.id,
                "orientation": version.orientation,
                "widthMm": float(version.width_mm),
                "heightMm": float(version.height_mm),
                "layout": version.layout,
            }
        )
        published.append(template_data)
    return render(
        request,
        "Admin/CertificateTemplates/Index",
        {
            "starters": [item for item in templates if item["isStarter"]],
            "templates": [item for item in templates if not item["isStarter"]],
            "publishedTemplates": published,
            "assignments": [serialize_assignment(item) for item in assignments],
            "categories": PlatformSettings.get_settings().get_program_categories(),
            "programs": [
                {
                    "id": program.id,
                    "name": program.name,
                    "category": program.category or "",
                }
                for program in Program.objects.order_by("name")
            ],
        },
    )


@login_required
@require_POST
def admin_certificate_template_create(request):
    require_template_manager(request.user)
    data = get_post_data(request)
    try:
        template = create_blank_template(
            name=data.get("name"),
            orientation=data.get("orientation", "landscape"),
            user=request.user,
        )
    except ValidationError as exc:
        messages.error(request, _validation_message(exc))
        return redirect("certifications:admin.certificate_templates")
    messages.success(request, "Blank certificate created.")
    return redirect(
        "certifications:admin.certificate_template.builder",
        template_id=template.id,
    )


@login_required
@require_POST
def admin_certificate_template_clone(request, template_id: int):
    source = get_object_or_404(CertificateTemplate, pk=template_id)
    require_viewable_template(source, request.user)
    data = get_post_data(request)
    try:
        template = clone_template(
            source=source,
            name=data.get("name") or f"{source.name} copy",
            user=request.user,
        )
    except ValidationError as exc:
        messages.error(request, _validation_message(exc))
        return redirect("certifications:admin.certificate_templates")
    messages.success(request, f"{source.name} copied. You can now make it your own.")
    return redirect(
        "certifications:admin.certificate_template.builder",
        template_id=template.id,
    )


@login_required
def admin_certificate_template_builder(request, template_id: int):
    template = get_object_or_404(
        CertificateTemplate.objects.prefetch_related("versions"),
        pk=template_id,
    )
    require_viewable_template(template, request.user)
    if template.is_starter:
        messages.info(request, "Copy this starter before editing it.")
        return redirect("certifications:admin.certificate_templates")
    require_editable_template(template, request.user)
    return render(
        request,
        "Admin/CertificateTemplates/Builder",
        {
            "template": serialize_template(template),
            "templates": [
                serialize_template(item)
                for item in _visible_certificate_templates(request.user)
                if not item.is_starter
            ],
        },
    )


@login_required
@require_POST
def admin_certificate_template_save(request, template_id: int):
    template = get_object_or_404(CertificateTemplate, pk=template_id)
    data = get_post_data(request)
    try:
        template, version = save_template(
            template=template,
            name=data.get("name"),
            layout=data.get("layout"),
            user=request.user,
        )
    except ValidationError as exc:
        messages.error(request, _validation_message(exc))
    else:
        if version.is_published:
            messages.info(request, f"Version {version.version_number} is already saved.")
        else:
            messages.success(request, f"Draft v{version.version_number} saved.")
    return redirect(
        "certifications:admin.certificate_template.builder",
        template_id=template.id,
    )


@login_required
@require_POST
def admin_certificate_template_publish(request, template_id: int):
    template = get_object_or_404(CertificateTemplate, pk=template_id)
    data = get_post_data(request)
    try:
        template, _ = save_template(
            template=template,
            name=data.get("name"),
            layout=data.get("layout"),
            user=request.user,
        )
        _, version = publish_template(template=template, user=request.user)
    except ValidationError as exc:
        messages.error(request, _validation_message(exc))
    else:
        messages.success(request, f"Version {version.version_number} published.")
    return redirect(
        "certifications:admin.certificate_template.builder",
        template_id=template.id,
    )


@login_required
@require_POST
def admin_certificate_template_preview(request, template_id: int):
    """Render the current draft with the same pipeline used for issuance."""
    template = get_object_or_404(CertificateTemplate, pk=template_id)
    require_editable_template(template, request.user)
    version = template.current_version
    data = get_post_data(request)
    try:
        layout = validate_layout(
            data.get("layout"),
            width_mm=version.width_mm,
            height_mm=version.height_mm,
        )
        sample_data = {
            "student_name": "Alex Morgan",
            "student_number": "STU-10482",
            "admission_number": "ADM-2026-184",
            "examination_number": "KNEC-042781",
            "program_title": "Foundations of Professional Practice",
            "course_level": "Professional certificate",
            "department": "Business and Leadership",
            "campus": "Main campus",
            "grade": "Distinction",
            "score": "87%",
            "progress": "100%",
            "course_duration": "40 hours",
            "course_start_date": "5 May 2026",
            "completion_date": "24 July 2026",
            "issue_date": "30 July 2026",
            "serial_number": "CERT-2026-00142",
            "verification_code": "CERT-2026-00142",
            "instructor_name": "Dr Taylor Reed",
            "co_instructor_name": "Prof. Casey Okafor",
            "principal_name": "Dr Jordan Kamau",
            "organization_name": PlatformSettings.get_settings().institution_name,
            "verification_url": "https://example.test/certificates/verify/CERT-2026-00142/",
        }
        if data.get("sampleProfile") == "stress":
            sample_data.update(
                {
                    "student_name": (
                        "Abdulrahman Mohammed Abdullahi-Wanyonyi"
                    ),
                    "student_number": "STUDENT-INTERNATIONAL-2026-10482",
                    "admission_number": "ADMISSION/PROFESSIONAL/2026/00184",
                    "examination_number": "NATIONAL-EXAMINATION-042781-KE",
                    "program_title": (
                        "Advanced International Professional Certificate in "
                        "Sustainable Community Leadership"
                    ),
                    "course_level": (
                        "Higher Professional Diploma — Niveau supérieur"
                    ),
                    "department": (
                        "Technology, Engineering and Digital Transformation"
                    ),
                    "campus": "München International Learning Campus",
                    "grade": "Distinction / Compétent avec excellence",
                    "instructor_name": "Dr Mary-Jane Atieno O’Dwyer",
                    "co_instructor_name": "Prof. José-María N’Guessan",
                    "principal_name": "Prof. Christopher Barasa Wanyonyi",
                    "organization_name": (
                        "International Academy for Professional and "
                        "Technical Education"
                    ),
                }
            )
        with NamedTemporaryFile(suffix=".pdf", delete=False) as temp_file:
            temp_path = temp_file.name
        render_layout_pdf(
            layout=layout,
            width_mm=version.width_mm,
            height_mm=version.height_mm,
            data=sample_data,
            target=temp_path,
        )
        pdf_bytes = Path(temp_path).read_bytes()
        Path(temp_path).unlink(missing_ok=True)
    except ValidationError as exc:
        return JsonResponse({"error": _validation_message(exc)}, status=400)
    response = HttpResponse(pdf_bytes, content_type="application/pdf")
    response["Content-Disposition"] = 'inline; filename="certificate-preview.pdf"'
    return response


@login_required
@require_POST
def admin_certificate_asset_upload(request):
    """Validate and store a reusable PNG/JPEG/WebP certificate image."""
    require_template_manager(request.user)
    upload = request.FILES.get("file")
    if upload is None:
        return JsonResponse({"error": "Choose an image to upload."}, status=400)
    if upload.size > 5 * 1024 * 1024:
        return JsonResponse({"error": "Images must be 5 MB or smaller."}, status=400)
    allowed_types = {"image/png", "image/jpeg", "image/webp"}
    if upload.content_type not in allowed_types:
        return JsonResponse(
            {"error": "Use a PNG, JPEG, or WebP image."},
            status=400,
        )
    try:
        from PIL import Image

        image = Image.open(upload)
        image.verify()
        upload.seek(0)
    except Exception:
        return JsonResponse({"error": "The uploaded image is invalid."}, status=400)

    asset = CertificateAsset.objects.create(
        owner=request.user,
        file=upload,
        original_name=Path(upload.name).name[:255],
        content_type=upload.content_type,
        size=upload.size,
    )
    return JsonResponse(
        {
            "id": asset.id,
            "name": asset.original_name,
            "url": asset.file.url,
        },
        status=201,
    )


@login_required
@require_POST
def admin_certificate_assignment_save(request):
    """Save a default, category, or course assignment from the linking tab."""
    if not (request.user.is_staff or request.user.is_superuser):
        raise Http404
    data = get_post_data(request)
    scope = str(data.get("scope") or "").strip()
    version_id = data.get("templateVersionId")
    version = None
    if version_id:
        version = get_object_or_404(
            CertificateTemplateVersion.objects.select_related("template"),
            pk=version_id,
        )
    try:
        if scope == CertificateTemplateAssignment.Scope.DEFAULT:
            set_default_assignment(version=version, user=request.user)
        elif scope == CertificateTemplateAssignment.Scope.CATEGORY:
            set_category_assignment(
                category=data.get("category"),
                version=version,
                user=request.user,
            )
        elif scope == CertificateTemplateAssignment.Scope.COURSE:
            program = get_object_or_404(Program, pk=data.get("programId"))
            set_course_assignment(
                program=program,
                version=version,
                issue_enabled=data.get("issueEnabled", True),
                user=request.user,
            )
        else:
            raise ValidationError({"scope": "Choose a valid assignment type."})
    except ValidationError as exc:
        messages.error(request, _validation_message(exc))
    else:
        messages.success(request, "Certificate link saved.")
    return redirect("/admin/certificate-templates/?tab=link")


def _get_client_ip(request):
    """Get client IP address from request."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")
