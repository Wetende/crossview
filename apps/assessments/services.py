"""
Assessment Engine service - Core service for calculating and managing assessment results.
"""
from typing import Dict, Any, Optional, List
from decimal import Decimal
from django.utils import timezone
from django.db.models import QuerySet, Q

from apps.assessments.models import AssessmentResult, Rubric
from apps.assessments.strategies import GradingStrategyFactory, AssessmentResultData
from apps.progression.models import Enrollment
from apps.curriculum.models import CurriculumNode


class AssessmentEngine:
    """
    Core service for calculating and managing assessment results.
    Uses Strategy pattern for different grading types.
    """

    def __init__(self, strategy_factory: Optional[GradingStrategyFactory] = None):
        """
        Initialize AssessmentEngine with optional strategy factory.
        
        Args:
            strategy_factory: Factory for creating grading strategies. 
                            If None, creates default factory.
        """
        self.strategy_factory = strategy_factory or GradingStrategyFactory()

    def calculate_result(
        self, 
        enrollment: Enrollment, 
        node: CurriculumNode, 
        component_scores: Dict[str, Any]
    ) -> AssessmentResult:
        """
        Calculate assessment result using blueprint's grading strategy.
        
        Args:
            enrollment: Student's enrollment
            node: Curriculum node being assessed
            component_scores: Dictionary of component names to scores
            
        Returns:
            AssessmentResult instance (not saved)
        """
        blueprint = enrollment.program.blueprint
        strategy = self.strategy_factory.create_from_blueprint(blueprint)
        grading_config = blueprint.grading_logic
        
        result_data = strategy.calculate(component_scores, grading_config)
        
        return AssessmentResult(
            enrollment=enrollment,
            node=node,
            result_data=result_data.__dict__
        )

    def save_result(self, result: AssessmentResult) -> AssessmentResult:
        """
        Save assessment result with upsert behavior.
        Updates existing record if one exists for enrollment-node combination.
        
        Args:
            result: AssessmentResult to save
            
        Returns:
            Saved AssessmentResult instance
        """
        existing, created = AssessmentResult.objects.update_or_create(
            enrollment=result.enrollment,
            node=result.node,
            defaults={
                'result_data': result.result_data,
                'lecturer_comments': result.lecturer_comments,
                'graded_by': result.graded_by,
            }
        )
        return existing

    def calculate_and_save(
        self,
        enrollment: Enrollment,
        node: CurriculumNode,
        component_scores: Dict[str, Any],
        graded_by=None,
        comments: str = None
    ) -> AssessmentResult:
        """
        Calculate and save assessment result in one operation.
        
        Args:
            enrollment: Student's enrollment
            node: Curriculum node being assessed
            component_scores: Dictionary of component names to scores
            graded_by: User who graded (optional)
            comments: Lecturer comments (optional)
            
        Returns:
            Saved AssessmentResult instance
        """
        result = self.calculate_result(enrollment, node, component_scores)
        result.graded_by = graded_by
        result.lecturer_comments = comments
        return self.save_result(result)

    def publish_result(self, result: AssessmentResult) -> AssessmentResult:
        """
        Publish a single assessment result.
        Sets is_published to True and records timestamp.
        
        Args:
            result: AssessmentResult to publish
            
        Returns:
            Updated AssessmentResult
        """
        result.is_published = True
        result.published_at = timezone.now()
        result.save()
        return result

    def bulk_publish(self, node: CurriculumNode) -> int:
        """
        Publish all unpublished results for a curriculum node.
        
        Args:
            node: CurriculumNode to publish results for
            
        Returns:
            Number of results published
        """
        return AssessmentResult.objects.filter(
            node=node,
            is_published=False
        ).update(
            is_published=True,
            published_at=timezone.now()
        )

    def get_student_results(
        self, 
        user, 
        published_only: bool = True
    ) -> QuerySet[AssessmentResult]:
        """
        Get assessment results for a student.
        
        Args:
            user: User to get results for
            published_only: If True, only return published results
            
        Returns:
            QuerySet of AssessmentResult
        """
        qs = AssessmentResult.objects.filter(enrollment__user=user)
        if published_only:
            qs = qs.filter(is_published=True)
        return qs.select_related('enrollment', 'node')

    def get_node_results(
        self, 
        node: CurriculumNode, 
        published_only: bool = False
    ) -> QuerySet[AssessmentResult]:
        """
        Get all assessment results for a curriculum node.
        
        Args:
            node: CurriculumNode to get results for
            published_only: If True, only return published results
            
        Returns:
            QuerySet of AssessmentResult
        """
        qs = AssessmentResult.objects.filter(node=node)
        if published_only:
            qs = qs.filter(is_published=True)
        return qs.select_related('enrollment', 'enrollment__user')

    def get_result(
        self, 
        enrollment: Enrollment, 
        node: CurriculumNode
    ) -> Optional[AssessmentResult]:
        """
        Get a specific assessment result.
        
        Args:
            enrollment: Student's enrollment
            node: Curriculum node
            
        Returns:
            AssessmentResult or None if not found
        """
        try:
            return AssessmentResult.objects.get(
                enrollment=enrollment,
                node=node
            )
        except AssessmentResult.DoesNotExist:
            return None


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
        - Admin (Staff): Global rubrics + Rubrics for Programs they manage
        - Instructor: Global rubrics + Rubrics for Programs they are assigned to + Their own
        
        Args:
            user: Requesting user
            
        Returns:
            QuerySet of accessible Rubrics
        """
        
        # 1. Superadmin gets everything
        if user.is_superuser:
            return Rubric.objects.all()
            
        # 2. Base query: Global rubrics + Owner rubrics
        query = Q(scope='global') | Q(owner=user)
        
        # 3. Program rubrics
        if user.is_staff:
            query |= Q(scope='program')
        else:
            # Instructors only see rubrics for programs they are assigned to
            assigned_program_ids = user.assigned_programs.values_list('id', flat=True)
            query |= Q(scope='program', program_id__in=assigned_program_ids)
            
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
