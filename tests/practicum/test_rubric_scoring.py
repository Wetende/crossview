"""
Property tests for rubric score calculation.
**Feature: practicum-system, Property 5: Rubric Score Calculation**
**Validates: Requirements 3.2, 3.4**
"""
import pytest
from hypothesis import given, strategies as st, settings, assume
from decimal import Decimal
from unittest.mock import Mock

from apps.assessments.models import Rubric
from apps.practicum.services import RubricService


# Strategies for rubric testing
dimension_name_strategy = st.sampled_from([
    'introduction', 'body', 'conclusion', 'delivery', 'content',
    'organization', 'clarity', 'engagement', 'technical_skill'
])

weight_strategy = st.decimals(
    min_value=Decimal('0.1'),
    max_value=Decimal('1.0'),
    places=2
)

max_score_strategy = st.integers(min_value=1, max_value=100)
score_strategy = st.integers(min_value=0, max_value=100)


def create_dimension(name: str, weight: float, max_score: int) -> dict:
    """Create a rubric dimension."""
    return {
        'name': name,
        'weight': float(weight),
        'max_score': max_score
    }


@pytest.mark.django_db
class TestRubricScoreCalculation:
    """
    Property tests for rubric score calculation.
    **Feature: practicum-system, Property 5: Rubric Score Calculation**
    **Validates: Requirements 3.2, 3.4**
    """

    @given(
        score1=st.integers(min_value=0, max_value=10),
        score2=st.integers(min_value=0, max_value=10),
        score3=st.integers(min_value=0, max_value=10),
    )
    @settings(max_examples=100)
    def test_weighted_score_calculation(self, score1, score2, score3):
        """
        *For any* dimension scores, the total SHALL be calculated using weights.
        **Feature: practicum-system, Property 5: Rubric Score Calculation**
        **Validates: Requirements 3.2, 3.4**
        """
        # Create rubric with known weights
        rubric = Mock(spec=Rubric)
        rubric.dimensions = [
            {'name': 'introduction', 'weight': 0.3, 'max_score': 10},
            {'name': 'body', 'weight': 0.5, 'max_score': 10},
            {'name': 'conclusion', 'weight': 0.2, 'max_score': 10},
        ]
        rubric.calculate_score = Rubric.calculate_score.__get__(rubric, Rubric)
        
        dimension_scores = {
            'introduction': score1,
            'body': score2,
            'conclusion': score3,
        }
        
        service = RubricService()
        total = service.calculate_score(rubric, dimension_scores)
        
        # Calculate expected weighted total
        expected = Decimal(str(score1)) * Decimal('0.3') + \
                   Decimal(str(score2)) * Decimal('0.5') + \
                   Decimal(str(score3)) * Decimal('0.2')
        
        assert total == expected

    @given(
        weight1=st.floats(min_value=0.1, max_value=0.5),
        weight2=st.floats(min_value=0.1, max_value=0.5),
        score=st.integers(min_value=0, max_value=10),
    )
    @settings(max_examples=100)
    def test_weights_affect_total(self, weight1, weight2, score):
        """
        *For any* rubric with weighted dimensions, weights SHALL affect the total.
        **Feature: practicum-system, Property 5: Rubric Score Calculation**
        **Validates: Requirements 3.4**
        """
        assume(abs(weight1 - weight2) > 0.05)  # Ensure weights are different
        
        # Create two rubrics with different weights
        rubric1 = Mock(spec=Rubric)
        rubric1.dimensions = [
            {'name': 'dim1', 'weight': weight1, 'max_score': 10},
        ]
        rubric1.calculate_score = Rubric.calculate_score.__get__(rubric1, Rubric)
        
        rubric2 = Mock(spec=Rubric)
        rubric2.dimensions = [
            {'name': 'dim1', 'weight': weight2, 'max_score': 10},
        ]
        rubric2.calculate_score = Rubric.calculate_score.__get__(rubric2, Rubric)
        
        dimension_scores = {'dim1': score}
        
        service = RubricService()
        total1 = service.calculate_score(rubric1, dimension_scores)
        total2 = service.calculate_score(rubric2, dimension_scores)
        
        if score > 0:
            assert total1 != total2, "Different weights should produce different totals"

    def test_zero_scores_produce_zero_total(self):
        """All zero scores should produce zero total."""
        rubric = Mock(spec=Rubric)
        rubric.dimensions = [
            {'name': 'introduction', 'weight': 0.3, 'max_score': 10},
            {'name': 'body', 'weight': 0.5, 'max_score': 10},
            {'name': 'conclusion', 'weight': 0.2, 'max_score': 10},
        ]
        rubric.calculate_score = Rubric.calculate_score.__get__(rubric, Rubric)
        
        dimension_scores = {
            'introduction': 0,
            'body': 0,
            'conclusion': 0,
        }
        
        service = RubricService()
        total = service.calculate_score(rubric, dimension_scores)
        
        assert total == Decimal('0')

    def test_max_scores_produce_weighted_max(self):
        """Max scores should produce weighted maximum total."""
        rubric = Mock(spec=Rubric)
        rubric.dimensions = [
            {'name': 'introduction', 'weight': 0.3, 'max_score': 10},
            {'name': 'body', 'weight': 0.5, 'max_score': 10},
            {'name': 'conclusion', 'weight': 0.2, 'max_score': 10},
        ]
        rubric.calculate_score = Rubric.calculate_score.__get__(rubric, Rubric)
        
        dimension_scores = {
            'introduction': 10,
            'body': 10,
            'conclusion': 10,
        }
        
        service = RubricService()
        total = service.calculate_score(rubric, dimension_scores)
        
        # With weights summing to 1.0 and all scores at 10
        expected = Decimal('10') * Decimal('0.3') + \
                   Decimal('10') * Decimal('0.5') + \
                   Decimal('10') * Decimal('0.2')
        assert total == expected


@pytest.mark.django_db
class TestDimensionScoreValidation:
    """Tests for dimension score validation."""

    def test_valid_scores_pass_validation(self):
        """Valid dimension scores should pass validation."""
        rubric = Mock(spec=Rubric)
        rubric.dimensions = [
            {'name': 'introduction', 'weight': 0.3, 'max_score': 10},
            {'name': 'body', 'weight': 0.5, 'max_score': 10},
        ]
        
        scores = {
            'introduction': 8,
            'body': 7,
        }
        
        service = RubricService()
        assert service.validate_dimension_scores(rubric, scores) is True

    def test_missing_dimension_fails_validation(self):
        """Missing dimension scores should fail validation."""
        rubric = Mock(spec=Rubric)
        rubric.dimensions = [
            {'name': 'introduction', 'weight': 0.3, 'max_score': 10},
            {'name': 'body', 'weight': 0.5, 'max_score': 10},
        ]
        
        scores = {
            'introduction': 8,
            # 'body' is missing
        }
        
        service = RubricService()
        assert service.validate_dimension_scores(rubric, scores) is False

    def test_extra_dimension_fails_validation(self):
        """Extra dimension scores should fail validation."""
        rubric = Mock(spec=Rubric)
        rubric.dimensions = [
            {'name': 'introduction', 'weight': 0.3, 'max_score': 10},
        ]
        
        scores = {
            'introduction': 8,
            'extra': 5,  # Not in rubric
        }
        
        service = RubricService()
        assert service.validate_dimension_scores(rubric, scores) is False

    def test_score_exceeding_max_fails_validation(self):
        """Scores exceeding max_score should fail validation."""
        rubric = Mock(spec=Rubric)
        rubric.dimensions = [
            {'name': 'introduction', 'weight': 0.3, 'max_score': 10},
        ]
        
        scores = {
            'introduction': 15,  # Exceeds max_score of 10
        }
        
        service = RubricService()
        assert service.validate_dimension_scores(rubric, scores) is False

    def test_negative_score_fails_validation(self):
        """Negative scores should fail validation."""
        rubric = Mock(spec=Rubric)
        rubric.dimensions = [
            {'name': 'introduction', 'weight': 0.3, 'max_score': 10},
        ]
        
        scores = {
            'introduction': -5,
        }
        
        service = RubricService()
        assert service.validate_dimension_scores(rubric, scores) is False
