"""
Grading strategies - Strategy pattern for different grading types.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List


@dataclass
class AssessmentResultData:
    """Data class representing calculated assessment result."""
    total: float
    status: str
    letter_grade: Optional[str] = None
    components: Dict[str, Any] = field(default_factory=dict)


class GradingStrategyInterface(ABC):
    """
    Abstract base class for grading strategies.
    Implements Strategy pattern for different grading types (weighted, competency, pass_fail).
    """

    @abstractmethod
    def calculate(self, component_scores: Dict[str, Any], config: Dict[str, Any]) -> AssessmentResultData:
        """
        Calculate the final result from component scores.
        
        Args:
            component_scores: Dictionary of component names to scores
            config: Grading configuration from blueprint
            
        Returns:
            AssessmentResultData with calculated total, status, and optional letter grade
        """
        pass

    @abstractmethod
    def validate_components(self, component_scores: Dict[str, Any], config: Dict[str, Any]) -> bool:
        """
        Validate that component scores match expected components.
        
        Args:
            component_scores: Dictionary of component names to scores
            config: Grading configuration from blueprint
            
        Returns:
            True if valid, False otherwise
        """
        pass

    @abstractmethod
    def get_status(self, total: float, config: Dict[str, Any]) -> str:
        """
        Get the result status based on total score.
        
        Args:
            total: Calculated total score
            config: Grading configuration from blueprint
            
        Returns:
            Status string (Pass, Fail, Competent, etc.)
        """
        pass


class WeightedGradingStrategy(GradingStrategyInterface):
    """
    Weighted grading strategy for summative assessment.
    Calculates total as sum of (score × weight) for each component.
    """

    def calculate(self, component_scores: Dict[str, Any], config: Dict[str, Any]) -> AssessmentResultData:
        """Calculate weighted total from component scores."""
        components = config.get('components', [])
        total = 0.0
        
        for comp in components:
            comp_name = comp['name']
            weight = comp['weight']
            # Missing components treated as zero (Requirement 3.4)
            score = component_scores.get(comp_name, 0)
            total += score * weight
        
        status = self.get_status(total, config)
        letter_grade = self.get_letter_grade(total, config.get('grade_boundaries', []))
        
        return AssessmentResultData(
            total=total,
            status=status,
            letter_grade=letter_grade,
            components=component_scores
        )

    def get_status(self, total: float, config: Dict[str, Any]) -> str:
        """Return Pass if total >= pass_mark, otherwise Referral."""
        pass_mark = config.get('pass_mark', 40)
        return 'Pass' if total >= pass_mark else 'Referral'

    def get_letter_grade(self, total: float, boundaries: List[Dict]) -> Optional[str]:
        """
        Map numeric score to letter grade using boundaries.
        Returns grade with highest min value that score meets or exceeds.
        """
        if not boundaries:
            # Default boundaries
            boundaries = [
                {'grade': 'A', 'min': 70},
                {'grade': 'B', 'min': 60},
                {'grade': 'C', 'min': 50},
                {'grade': 'D', 'min': 40},
                {'grade': 'F', 'min': 0}
            ]
        
        # Sort by min descending to find highest matching boundary
        sorted_boundaries = sorted(boundaries, key=lambda x: x['min'], reverse=True)
        for boundary in sorted_boundaries:
            if total >= boundary['min']:
                return boundary['grade']
        return 'F'

    def validate_components(self, component_scores: Dict[str, Any], config: Dict[str, Any]) -> bool:
        """Validate component scores - always returns True for weighted."""
        return True


class CompetencyGradingStrategy(GradingStrategyInterface):
    """
    Competency-based grading strategy for TVET programs.
    All required evidences must be present/pass to achieve Competent status.
    """

    def calculate(self, component_scores: Dict[str, Any], config: Dict[str, Any]) -> AssessmentResultData:
        """Calculate competency result - all-or-nothing."""
        # All evidences must be 'pass', 1, 1.0, or True
        passing_values = {'pass', 'present', 1, 1.0, True, 'true', 'Pass', 'Present'}
        all_pass = all(
            score in passing_values 
            for score in component_scores.values()
        )
        
        total = 1.0 if all_pass else 0.0
        status = self.get_status(total, config)
        
        return AssessmentResultData(
            total=total,
            status=status,
            components=component_scores
        )

    def get_status(self, total: float, config: Dict[str, Any]) -> str:
        """Return Competent if all pass, otherwise Not Yet Competent."""
        labels = config.get('competency_labels', {
            'pass': 'Competent',
            'fail': 'Not Yet Competent'
        })
        return labels['pass'] if total == 1.0 else labels['fail']

    def validate_components(self, component_scores: Dict[str, Any], config: Dict[str, Any]) -> bool:
        """Validate component scores - always returns True for competency."""
        return True


class PassFailGradingStrategy(GradingStrategyInterface):
    """
    Simple pass/fail grading strategy.
    Returns Pass if score meets threshold, Fail otherwise.
    """

    def calculate(self, component_scores: Dict[str, Any], config: Dict[str, Any]) -> AssessmentResultData:
        """Calculate pass/fail result based on threshold."""
        # Get the primary score (first component or 'score' key)
        if 'score' in component_scores:
            score = component_scores['score']
        elif component_scores:
            score = list(component_scores.values())[0]
        else:
            score = 0
        
        total = float(score)
        status = self.get_status(total, config)
        
        return AssessmentResultData(
            total=total,
            status=status,
            components=component_scores
        )

    def get_status(self, total: float, config: Dict[str, Any]) -> str:
        """Return Pass if total >= threshold, otherwise Fail."""
        threshold = config.get('threshold', config.get('pass_mark', 50))
        return 'Pass' if total >= threshold else 'Fail'

    def validate_components(self, component_scores: Dict[str, Any], config: Dict[str, Any]) -> bool:
        """Validate component scores - always returns True for pass/fail."""
        return True


class RubricGradingStrategy(GradingStrategyInterface):
    """
    Rubric-based grading strategy for subjective assessments.
    Calculates weighted total from dimension scores.
    """

    def calculate(self, component_scores: Dict[str, Any], config: Dict[str, Any]) -> AssessmentResultData:
        """Calculate rubric-based total from dimension scores."""
        from decimal import Decimal
        dimensions = config.get('dimensions', [])
        total = Decimal('0.0')
        
        for dim in dimensions:
            dim_name = dim['name']
            weight = Decimal(str(dim.get('weight', 1)))
            score = Decimal(str(component_scores.get(dim_name, 0)))
            total += score * weight
        
        status = self.get_status(float(total), config)
        
        return AssessmentResultData(
            total=float(total),
            status=status,
            components=component_scores
        )

    def get_status(self, total: float, config: Dict[str, Any]) -> str:
        """Return Pass if total >= pass_mark, otherwise Fail."""
        pass_mark = config.get('pass_mark', config.get('max_score', 100) * 0.5)
        return 'Pass' if total >= pass_mark else 'Fail'

    def validate_components(self, component_scores: Dict[str, Any], config: Dict[str, Any]) -> bool:
        """Validate dimension scores match rubric dimensions."""
        dimensions = config.get('dimensions', [])
        expected_dims = {dim['name'] for dim in dimensions}
        provided_dims = set(component_scores.keys())
        return expected_dims == provided_dims


class GradingStrategyFactory:
    """
    Factory for creating grading strategies from blueprint configuration.
    """

    def create_from_blueprint(self, blueprint) -> GradingStrategyInterface:
        """
        Create appropriate grading strategy based on blueprint's grading_logic type.
        
        Args:
            blueprint: AcademicBlueprint instance with grading_logic
            
        Returns:
            GradingStrategyInterface implementation
            
        Raises:
            InvalidGradingTypeException: If grading type is not recognized
        """
        from apps.assessments.exceptions import InvalidGradingTypeException
        
        grading_logic = blueprint.grading_logic or {}
        grading_type = grading_logic.get('type')
        
        if grading_type == 'weighted':
            return WeightedGradingStrategy()
        elif grading_type == 'competency':
            return CompetencyGradingStrategy()
        elif grading_type == 'pass_fail':
            return PassFailGradingStrategy()
        elif grading_type == 'rubric':
            return RubricGradingStrategy()
        else:
            raise InvalidGradingTypeException(f"Unknown grading type: {grading_type}")

    def create_from_type(self, grading_type: str) -> GradingStrategyInterface:
        """
        Create grading strategy directly from type string.
        
        Args:
            grading_type: One of 'weighted', 'competency', 'pass_fail', 'rubric'
            
        Returns:
            GradingStrategyInterface implementation
        """
        from apps.assessments.exceptions import InvalidGradingTypeException
        
        if grading_type == 'weighted':
            return WeightedGradingStrategy()
        elif grading_type == 'competency':
            return CompetencyGradingStrategy()
        elif grading_type == 'pass_fail':
            return PassFailGradingStrategy()
        elif grading_type == 'rubric':
            return RubricGradingStrategy()
        else:
            raise InvalidGradingTypeException(f"Unknown grading type: {grading_type}")
