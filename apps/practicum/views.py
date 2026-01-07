"""
Practicum REST API views for file operations.
Requirements: 6.2, 6.3, 6.4, 7.6
"""

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.practicum.models import PracticumSubmission
from apps.practicum.validators import validate_practicum_file
from apps.progression.models import Enrollment
from apps.curriculum.models import CurriculumNode


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def practicum_upload(request):
    """
    Upload a practicum submission file.
    Requirements: 6.2, 6.3, 6.4

    POST /api/v1/student/practicum/upload/
    - file: The uploaded file (multipart/form-data)
    - enrollment_id: The enrollment ID
    - node_id: The curriculum node ID
    """
    user = request.user

    # Get required fields
    file = request.FILES.get("file")
    enrollment_id = request.data.get("enrollment_id")
    node_id = request.data.get("node_id")

    if not file:
        return Response(
            {"error": "No file provided"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not enrollment_id or not node_id:
        return Response(
            {"error": "enrollment_id and node_id are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Verify enrollment belongs to user
    try:
        enrollment = Enrollment.objects.get(pk=enrollment_id, user=user)
    except Enrollment.DoesNotExist:
        return Response(
            {"error": "Enrollment not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Verify node belongs to program
    try:
        node = CurriculumNode.objects.get(pk=node_id, program=enrollment.program)
    except CurriculumNode.DoesNotExist:
        return Response(
            {"error": "Node not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Get practicum config from node
    practicum_config = node.properties.get("practicum", {})
    allowed_types = practicum_config.get("allowed_types", ["mp3", "mp4", "pdf"])
    max_size_mb = practicum_config.get("max_size_mb", 100)

    # Validate file
    try:
        validate_practicum_file(file, allowed_types, max_size_mb)
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check if revision is allowed
    existing_submission = (
        PracticumSubmission.objects.filter(enrollment=enrollment, node=node)
        .order_by("-version")
        .first()
    )

    if existing_submission and existing_submission.status not in ["revision_required"]:
        if existing_submission.status == "pending":
            return Response(
                {
                    "error": "You already have a pending submission. Please wait for review."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if existing_submission.status == "approved":
            return Response(
                {"error": "Your submission has already been approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # Determine version number
    version = 1
    if existing_submission:
        version = existing_submission.version + 1

    # Get file info
    file_extension = file.name.split(".")[-1].lower()
    file_size = file.size

    # Generate file path (in production, this would upload to S3/storage)
    file_path = f"practicum/{enrollment.user_id}/{enrollment.id}/{node.id}/v{version}.{file_extension}"

    # Create submission record
    submission = PracticumSubmission.objects.create(
        enrollment=enrollment,
        node=node,
        version=version,
        status="pending",
        file_path=file_path,
        file_type=file_extension,
        file_size=file_size,
        submitted_at=timezone.now(),
    )

    # TODO: Actually save the file to storage
    # In production, use django-storages with S3 or similar

    return Response(
        {
            "id": submission.id,
            "version": submission.version,
            "status": submission.status,
            "message": "File uploaded successfully",
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def practicum_download(request, pk):
    """
    Get a signed URL for downloading a practicum submission.
    Requirements: 7.6

    GET /api/v1/student/practicum/<id>/download/
    """
    user = request.user

    try:
        submission = PracticumSubmission.objects.select_related("enrollment").get(
            pk=pk, enrollment__user=user
        )
    except PracticumSubmission.DoesNotExist:
        return Response(
            {"error": "Submission not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Generate signed URL
    signed_url = submission.get_signed_url(expires_in_minutes=60)

    # In production, this would return an actual S3 presigned URL
    # For now, return a placeholder
    return Response(
        {
            "url": f"/media/{submission.file_path}?signature={signed_url}",
            "filename": f"submission_v{submission.version}.{submission.file_type}",
        }
    )
