"""
Property tests for WeightedGradingStrategy.

Tests Properties 1, 3, 7, and 9 from the design document.
"""
import pytest
from hypothesis import given, strategies as st, settings as hyp_settings, assume

from apps.assessments.strategies import WeightedGradingStrategy, AssessmentResultData


# Strategy for generating weights that sum to 1.0
@st.composite
def weights_summing_to_one(draw, num_components=2):
    """Generate a list of weights that sum to 1.0."""
    if num_components == 1:
        return [1.0]
    
    # Generate n-1 random values and compute the last one
    weights = []
    remaining = 1.0
    for i in range(num_components - 1):
        max_weight = remaining - (num_components - i - 1) * 0.01  # Leave room for others
        if max_weight <= 0.01:
            max_weight = 0.01
        w = draw(st.floats(min_value=0.01, max_value=max_weight))
        weights.append(w)
        remaining -= w
    weights.append(remaining)
    return weights


@st.composite
def weighted_config_strategy(draw):
    """Generate valid weighted grading config with weights summing to 1.0."""
    num_components = draw(st.integers(min_value=1, max_value=4))
    component_names = ['cat', 'exam', 'assignment', 'practical'][:num_components]
    weights = draw(weights_summing_to_one(num_components))
    
    components = [
        {'name': name, 'weight': weight}
        for name, weight in zip(component_names, weights)
    ]
    
    pass_mark = draw(st.floats(min_value=0, max_value=100))
    
    return {
        'type': 'weighted',
        'components': components,
        'pass_mark': pass_mark
    }


@st.composite
def component_scores_for_config(draw, config):
    """Generate component scores matching a config."""
    scores = {}
    for comp in config['components']:
        scores[comp['name']] = draw(st.floats(min_value=0, max_value=100, allow_nan=False, allow_infinity=False))
    return scores


class TestWeightedCalculation:
    """
    Property 1: Weighted Calculation Correctness
    
    *For any* set of component scores and weights where weights sum to 1.0,
    the calculated total SHALL equal the sum of (score × weight) for each component.
    """

    @given(data=st.data())
    @hyp_settings(max_examples=100, deadline=None)
    def test_weighted_sum_correctness(self, data):
        """
        **Feature: assessment-engine, Property 1: Weighted Calculation Correctness**
        **Validates: Requirements 1.1, 3.1**
        
        For any scores and weights, total = sum(score * weight).
        """
        config = data.draw(weighted_config_strategy())
        scores = data.draw(component_scores_for_config(config))
        
        strategy = WeightedGradingStrategy()
        result = strategy.calculate(scores, config)
        
        # Calculate expected total manually
        expected_total = sum(
            scores.get(comp['name'], 0) * comp['weight']
            for comp in config['components']
        )
        
        # Allow small floating point tolerance
        assert abs(result.total - expected_total) < 0.0001

    @given(
        cat_score=st.floats(min_value=0, max_value=100, allow_nan=False, allow_infinity=False),
        exam_score=st.floats(min_value=0, max_value=100, allow_nan=False, allow_infinity=False)
    )
    @hyp_settings(max_examples=100, deadline=None)
    def test_30_70_weighting(self, cat_score, exam_score):
        """
        Test specific 30/70 weighting (Theology model).
        """
        config = {
            'type': 'weighted',
            'components': [
                {'name': 'cat', 'weight': 0.3},
                {'name': 'exam', 'weight': 0.7}
            ],
            'pass_mark': 40
        }
        scores = {'cat': cat_score, 'exam': exam_score}
        
        strategy = WeightedGradingStrategy()
        result = strategy.calculate(scores, config)
        
        expected = cat_score * 0.3 + exam_score * 0.7
        assert abs(result.total - expected) < 0.0001


class TestPassFailThreshold:
    """
    Property 3: Pass/Fail Threshold
    
    *For any* score and pass_mark threshold, the status SHALL be "Pass"
    if score >= pass_mark, otherwise "Fail" or "Referral".
    """

    @given(
        total=st.floats(min_value=0, max_value=100, allow_nan=False, allow_infinity=False),
        pass_mark=st.floats(min_value=0, max_value=100, allow_nan=False, allow_infinity=False)
    )
    @hyp_settings(max_examples=100, deadline=None)
    def test_pass_fail_threshold(self, total, pass_mark):
        """
        **Feature: assessment-engine, Property 3: Pass/Fail Threshold**
        **Validates: Requirements 1.3, 3.2, 3.3**
        
        Status is Pass if total >= pass_mark, otherwise Referral.
        """
        config = {'pass_mark': pass_mark}
        strategy = WeightedGradingStrategy()
        
        status = strategy.get_status(total, config)
        
        if total >= pass_mark:
            assert status == 'Pass'
        else:
            assert status == 'Referral'

    @given(score=st.floats(min_value=40, max_value=100, allow_nan=False, allow_infinity=False))
    @hyp_settings(max_examples=50, deadline=None)
    def test_passing_scores(self, score):
        """Test that scores >= 40 pass with default pass_mark."""
        config = {'pass_mark': 40}
        strategy = WeightedGradingStrategy()
        assert strategy.get_status(score, config) == 'Pass'

    @given(score=st.floats(min_value=0, max_value=39.99, allow_nan=False, allow_infinity=False))
    @hyp_settings(max_examples=50, deadline=None)
    def test_failing_scores(self, score):
        """Test that scores < 40 get Referral with default pass_mark."""
        config = {'pass_mark': 40}
        strategy = WeightedGradingStrategy()
        assert strategy.get_status(score, config) == 'Referral'


class TestMissingComponent:
    """
    Property 7: Missing Component Treated as Zero
    
    *For any* weighted calculation with a missing component score,
    the calculation SHALL treat the missing component as zero.
    """

    @given(
        present_score=st.floats(min_value=0, max_value=100, allow_nan=False, allow_infinity=False)
    )
    @hyp_settings(max_examples=100, deadline=None)
    def test_missing_component_as_zero(self, present_score):
        """
        **Feature: assessment-engine, Property 7: Missing Component Treated as Zero**
        **Validates: Requirements 3.4**
        
        Missing components contribute 0 to the total.
        """
        config = {
            'type': 'weighted',
            'components': [
                {'name': 'cat', 'weight': 0.3},
                {'name': 'exam', 'weight': 0.7}
            ],
            'pass_mark': 40
        }
        
        # Only provide cat score, exam is missing
        scores = {'cat': present_score}
        
        strategy = WeightedGradingStrategy()
        result = strategy.calculate(scores, config)
        
        # Expected: cat * 0.3 + 0 * 0.7 = cat * 0.3
        expected = present_score * 0.3
        assert abs(result.total - expected) < 0.0001

    def test_all_components_missing(self):
        """Test that all missing components result in zero total."""
        config = {
            'type': 'weighted',
            'components': [
                {'name': 'cat', 'weight': 0.3},
                {'name': 'exam', 'weight': 0.7}
            ],
            'pass_mark': 40
        }
        
        strategy = WeightedGradingStrategy()
        result = strategy.calculate({}, config)
        
        assert result.total == 0.0


class TestGradeBoundaryMapping:
    """
    Property 9: Grade Boundary Mapping
    
    *For any* numeric score and grade_boundaries array, the letter grade SHALL be
    the grade with the highest min value that the score meets or exceeds.
    """

    @given(score=st.floats(min_value=0, max_value=100, allow_nan=False, allow_infinity=False))
    @hyp_settings(max_examples=100, deadline=None)
    def test_default_grade_boundaries(self, score):
        """
        **Feature: assessment-engine, Property 9: Grade Boundary Mapping**
        **Validates: Requirements 5.1, 5.3**
        
        Default boundaries: A>=70, B>=60, C>=50, D>=40, F<40.
        """
        strategy = WeightedGradingStrategy()
        grade = strategy.get_letter_grade(score, [])
        
        if score >= 70:
            assert grade == 'A'
        elif score >= 60:
            assert grade == 'B'
        elif score >= 50:
            assert grade == 'C'
        elif score >= 40:
            assert grade == 'D'
        else:
            assert grade == 'F'

    @given(
        score=st.floats(min_value=0, max_value=100, allow_nan=False, allow_infinity=False),
        a_min=st.integers(min_value=70, max_value=90),
        b_min=st.integers(min_value=50, max_value=69),
        c_min=st.integers(min_value=30, max_value=49)
    )
    @hyp_settings(max_examples=100, deadline=None)
    def test_custom_grade_boundaries(self, score, a_min, b_min, c_min):
        """Test custom grade boundaries are respected."""
        assume(a_min > b_min > c_min)
        
        boundaries = [
            {'grade': 'A', 'min': a_min},
            {'grade': 'B', 'min': b_min},
            {'grade': 'C', 'min': c_min},
            {'grade': 'F', 'min': 0}
        ]
        
        strategy = WeightedGradingStrategy()
        grade = strategy.get_letter_grade(score, boundaries)
        
        if score >= a_min:
            assert grade == 'A'
        elif score >= b_min:
            assert grade == 'B'
        elif score >= c_min:
            assert grade == 'C'
        else:
            assert grade == 'F'

    def test_boundary_edge_cases(self):
        """Test exact boundary values."""
        boundaries = [
            {'grade': 'A', 'min': 70},
            {'grade': 'B', 'min': 60},
            {'grade': 'C', 'min': 50},
            {'grade': 'D', 'min': 40},
            {'grade': 'F', 'min': 0}
        ]
        
        strategy = WeightedGradingStrategy()
        
        # Exact boundary values should get the higher grade
        assert strategy.get_letter_grade(70, boundaries) == 'A'
        assert strategy.get_letter_grade(60, boundaries) == 'B'
        assert strategy.get_letter_grade(50, boundaries) == 'C'
        assert strategy.get_letter_grade(40, boundaries) == 'D'
        
        # Just below boundary
        assert strategy.get_letter_grade(69.99, boundaries) == 'B'
        assert strategy.get_letter_grade(39.99, boundaries) == 'F'
