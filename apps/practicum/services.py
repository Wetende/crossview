"""
Practicum services - Submission management and review workflow.
Requirements: 2.5, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3
"""
from typing import Optional, List
from decimal import Decimal
from django.utils import timezone
from django.core.files.uploadedfile import UploadedFile
from django.db.models import QuerySet

from apps.practicum.models import PracticumSubmission, SubmissionReview
from apps.assessments.models import Rubric
from apps.assessments.services import RubricService
from apps.practicum.validators import FileValidator, ValidationResult
from apps.practicum.storage import MediaStorageService
from apps.practicum.exceptions import InvalidFileException, InvalidReviewException


class RubricService:
    """
    Service for rubric-based scoring.
    Requirements: 3.2, 3.4
    """
    
    def calculate_score(self, rubric: Rubric, dimension_scores: dict) -> Decimal:
        """
        Calculate total score from dimension scores using weights.
        Requirements: 3.2, 3.4
        
        Args:
            rubric: Rubric to use for calculation
            dimension_scores: Dict mapping dimension name to score
            
        Returns:
            Weighted total score
        """
        return rubric.calculate_score(dimension_scores)

    def get_accessible_rubrics(self, user) -> QuerySet[Rubric]:
        """
        Get rubrics accessible to the user based on their role.
        
        Rules:
        - Superadmin: All rubrics
        - Admin (Staff): Global rubrics + Rubrics for Programs they manage (TODO: strict program owner check?) + Their own
        - Instructor: Global rubrics + Rubrics for Programs they are assigned to + Their own
        
        Args:
            user: Requesting user
            
        Returns:
            QuerySet of accessible Rubrics
        """
        from django.db.models import Q
        
        # 1. Superadmin gets everything
        if user.is_superuser:
            return Rubric.objects.all()
            
        # 2. Base query: Global rubrics + Owner rubrics
        query = Q(scope='global') | Q(owner=user)
        
        # 3. Program rubrics
        # If staff, they might manage programs without being an instructor
        # For now, we assume Staff can see ALL Program-scoped rubrics (simplified "Department Head" view)
        # OR we check implicit permissions.
        # Given the "seed" data implies Staff=Admin, we'll allow access to all Program rubrics for Staff.
        if user.is_staff:
            query |= Q(scope='program')
        else:
            # Instructors only see rubrics for programs they are assigned to
            assigned_program_ids = user.assigned_programs.values_list('id', flat=True)
            query |= Q(scope='program', program_id__in=assigned_program_ids)
            
        # 4. Course rubrics
        # Instructors see course rubrics for their assigned programs
        # (Assuming 'course' scope implies it's attached to a node, but the model just links Program)
        # If scope='course', it's usually just an instructor's personal ad-hoc rubric, covered by Q(owner=user).
        # But if shared within a program course? 
        # For now, we'll stick to the Program-level check for Instructors.
        
        return Rubric.objects.filter(query).distinct()
    
    def validate_dimension_scores(self, rubric: Rubric, scores: dict) -> bool:
        """
        Validate that all required dimensions have scores.
        Requirements: 3.4
        
        Args:
            rubric: Rubric to validate against
            scores: Dimension scores to validate
            
        Returns:
            True if all dimensions have valid scores
        """
        required_dims = {d['name'] for d in rubric.dimensions}
        provided_dims = set(scores.keys())
        
        # Check all required dimensions are provided
        if required_dims != provided_dims:
            return False
        
        # Check all scores are within valid range
        for dim in rubric.dimensions:
            score = scores.get(dim['name'])
            if score is None:
                return False
            max_score = dim.get('max_score', 10)
            if not (0 <= score <= max_score):
                return False
        
        return True


class PracticumService:
    """
    Main service for practicum submission management.
    Requirements: 2.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3
    """
    
    def __init__(
        self,
        storage_service: Optional[MediaStorageService] = None,
        rubric_service: Optional[RubricService] = None,
        progression_engine=None
    ):
        """
        Initialize with optional service dependencies.
        
        Args:
            storage_service: Service for file storage
            rubric_service: Service for rubric calculations
            progression_engine: Engine for marking node completion
        """
        self.storage = storage_service or MediaStorageService()
        self.rubric_service = rubric_service or RubricService()
        self.progression_engine = progression_engine
    
    def create_submission(
        self,
        enrollment,
        node,
        file: UploadedFile,
        duration_seconds: Optional[int] = None,
        metadata: Optional[dict] = None
    ) -> PracticumSubmission:
        """
        Create a new practicum submission.
        Requirements: 2.5, 4.1
        
        Args:
            enrollment: Student's enrollment
            node: Curriculum node for the practicum
            file: Uploaded file
            duration_seconds: Duration for audio/video files
            metadata: Additional metadata
            
        Returns:
            Created PracticumSubmission
            
        Raises:
            InvalidFileException: If file validation fails
        """
        # Get practicum config from node
        config = node.completion_rules or {}
        
        # Validate file
        validator = FileValidator()
        validation = validator.validate(
            file_type=file.content_type,
            file_size=file.size,
            duration_seconds=duration_seconds,
            config=config
        )
        
        if not validation.valid:
            raise InvalidFileException(validation.errors)
        
        # Store file
        path = f"practicum/{enrollment.id}/{node.id}/"
        file_path = self.storage.store(file, path)
        
        # Create submission with default pending status
        submission = PracticumSubmission.objects.create(
            enrollment=enrollment,
            node=node,
            file_path=file_path,
            file_type=file.content_type,
            file_size=file.size,
            duration_seconds=duration_seconds,
            metadata=metadata,
            submitted_at=timezone.now(),
            status='pending'  # Default status per Requirement 4.1
        )
        
        return submission
    
    def resubmit(
        self,
        previous: PracticumSubmission,
        file: UploadedFile,
        duration_seconds: Optional[int] = None,
        metadata: Optional[dict] = None
    ) -> PracticumSubmission:
        """
        Create a resubmission with incremented version.
        Requirements: 4.5
        
        Args:
            previous: Previous submission to resubmit for
            file: New uploaded file
            duration_seconds: Duration for audio/video files
            metadata: Additional metadata
            
        Returns:
            New PracticumSubmission with incremented version
        """
        # Create new submission
        submission = self.create_submission(
            enrollment=previous.enrollment,
            node=previous.node,
            file=file,
            duration_seconds=duration_seconds,
            metadata=metadata
        )
        
        # Increment version
        submission.version = previous.version + 1
        submission.save()
        
        return submission
    
    def review_submission(
        self,
        submission: PracticumSubmission,
        reviewer,
        status: str,
        dimension_scores: Optional[dict] = None,
        comments: Optional[str] = None
    ) -> SubmissionReview:
        """
        Review a submission and update its status.
        Requirements: 3.3, 4.2, 4.3, 4.4
        
        Args:
            submission: Submission to review
            reviewer: User performing the review
            status: Review status (approved, revision_required, rejected)
            dimension_scores: Scores for each rubric dimension
            comments: Reviewer comments
            
        Returns:
            Created SubmissionReview
            
        Raises:
            InvalidReviewException: If review data is invalid
        """
        # Validate status
        valid_statuses = ['approved', 'revision_required', 'rejected']
        if status not in valid_statuses:
            raise InvalidReviewException(f"Invalid status: {status}")
        
        # Require comments for rejection (Requirement 4.4)
        if status == 'rejected' and not comments:
            raise InvalidReviewException("Comments required for rejection")
        
        # Calculate total score if dimension scores provided
        total_score = None
        rubric_id = submission.node.completion_rules.get('rubric_id')
        
        if dimension_scores and rubric_id:
            try:
                rubric = Rubric.objects.get(id=rubric_id)
                if not self.rubric_service.validate_dimension_scores(rubric, dimension_scores):
                    raise InvalidReviewException("Invalid dimension scores")
                total_score = self.rubric_service.calculate_score(rubric, dimension_scores)
            except Rubric.DoesNotExist:
                pass  # No rubric, skip scoring
        
        # Create review
        review = SubmissionReview.objects.create(
            submission=submission,
            reviewer=reviewer,
            status=status,
            dimension_scores=dimension_scores,
            total_score=total_score,
            comments=comments,
            reviewed_at=timezone.now()
        )
        
        # Update submission status
        submission.status = status
        submission.save()
        
        # Trigger completion for approved submissions (Requirement 4.2)
        if status == 'approved' and self.progression_engine:
            self.progression_engine.mark_complete(
                submission.enrollment,
                submission.node,
                'upload'
            )
        
        return review
    
    def get_submission_history(
        self,
        enrollment,
        node
    ) -> QuerySet[PracticumSubmission]:
        """
        Get all submissions for an enrollment-node pair.
        Requirements: 5.1, 5.2, 5.3
        
        Args:
            enrollment: Student's enrollment
            node: Curriculum node
            
        Returns:
            QuerySet of submissions ordered chronologically
        """
        return PracticumSubmission.objects.filter(
            enrollment=enrollment,
            node=node
        ).prefetch_related('reviews').order_by('submitted_at')
    
    def get_latest_submission(
        self,
        enrollment,
        node
    ) -> Optional[PracticumSubmission]:
        """
        Get the latest submission for an enrollment-node pair.
        
        Args:
            enrollment: Student's enrollment
            node: Curriculum node
            
        Returns:
            Latest submission or None
        """
        return PracticumSubmission.objects.filter(
            enrollment=enrollment,
            node=node
        ).order_by('-version').first()
    
    def has_approved_submission(self, enrollment, node) -> bool:
        """
        Check if there's an approved submission for the node.
        Requirements: 1.1
        
        Args:
            enrollment: Student's enrollment
            node: Curriculum node
            
        Returns:
            True if an approved submission exists
        """
        return PracticumSubmission.objects.filter(
            enrollment=enrollment,
            node=node,
            status='approved'
        ).exists()
