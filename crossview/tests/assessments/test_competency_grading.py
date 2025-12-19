"""
Property tests for CompetencyGradingStrategy.

Tests Properties 2 and 8 from the design document.
"""
import pytest
from hypothesis import given, strategies as st, settings as hyp_settings

from apps.assessments.strategies import CompetencyGradingStrategy, AssessmentResultData


# Strategy for generating evidence sets
evidence_names = ['practical_observation', 'portfolio', 'written_test', 'oral_exam', 'project']

passing_values_strategy = st.sampled_from(['pass', 'present', 1, 1.0, True])
failing_values_strategy = st.sampled_from(['fail', 'absent', 0, 0.0, False])


@st.composite
def all_passing_evidences(draw):
    """Generate evidence set where all evidences pass."""
    num_evidences = draw(st.integers(min_value=1, max_value=5))
    names = evidence_names[:num_evidences]
    return {name: draw(passing_values_strategy) for name in names}


@st.composite
def at_least_one_failing_evidence(draw):
    """Generate evidence set with at least one failing evidence."""
    num_evidences = draw(st.integers(min_value=1, max_value=5))
    names = evidence_names[:num_evidences]
    
    # Generate all passing first
    evidences = {name: draw(passing_values_strategy) for name in names}
    
    # Make at least one fail
    fail_key = draw(st.sampled_from(list(evidences.keys())))
    evidences[fail_key] = draw(failing_values_strategy)
    
    return evidences


@st.composite
def mixed_evidences(draw):
    """Generate evidence set with random pass/fail values."""
    num_evidences = draw(st.integers(min_value=1, max_value=5))
    names = evidence_names[:num_evidences]
    
    evidences = {}
    for name in names:
        if draw(st.booleans()):
            evidences[name] = draw(passing_values_strategy)
        else:
            evidences[name] = draw(failing_values_strategy)
    
    return evidences


class TestCompetencyAllOrNothing:
    """
    Property 2: Competency All-Or-Nothing
    
    *For any* set of required evidences, the status SHALL be "Competent"
    if and only if ALL evidences are marked "pass" or "present".
    """

    @given(evidences=all_passing_evidences())
    @hyp_settings(max_examples=100, deadline=None)
    def test_all_passing_is_competent(self, evidences):
        """
        **Feature: assessment-engine, Property 2: Competency All-Or-Nothing**
        **Validates: Requirements 1.2, 4.2, 4.3**
        
        When all evidences pass, status is Competent.
        """
        config = {'type': 'competency'}
        strategy = CompetencyGradingStrategy()
        result = strategy.calculate(evidences, config)
        
        assert result.status == 'Competent'
        assert result.total == 1.0

    @given(evidences=at_least_one_failing_evidence())
    @hyp_settings(max_examples=100, deadline=None)
    def test_any_failing_is_not_competent(self, evidences):
        """
        **Feature: assessment-engine, Property 2: Competency All-Or-Nothing**
        **Validates: Requirements 1.2, 4.2, 4.3**
        
        When any evidence fails, status is Not Yet Competent.
        """
        config = {'type': 'competency'}
        strategy = CompetencyGradingStrategy()
        result = strategy.calculate(evidences, config)
        
        assert result.status == 'Not Yet Competent'
        assert result.total == 0.0

    @given(evidences=mixed_evidences())
    @hyp_settings(max_examples=100, deadline=None)
    def test_competency_is_all_or_nothing(self, evidences):
        """
        Test that competency is strictly all-or-nothing.
        """
        config = {'type': 'competency'}
        strategy = CompetencyGradingStrategy()
        result = strategy.calculate(evidences, config)
        
        # Check if all evidences pass
        passing_values = {'pass', 'present', 1, 1.0, True, 'true', 'Pass', 'Present'}
        all_pass = all(v in passing_values for v in evidences.values())
        
        if all_pass:
            assert result.status == 'Competent'
            assert result.total == 1.0
        else:
            assert result.status == 'Not Yet Competent'
            assert result.total == 0.0

    def test_empty_evidences_is_competent(self):
        """Empty evidence set (vacuously true) should be Competent."""
        config = {'type': 'competency'}
        strategy = CompetencyGradingStrategy()
        result = strategy.calculate({}, config)
        
        # Empty set - all() returns True for empty iterables
        assert result.status == 'Competent'
        assert result.total == 1.0


class TestCustomCompetencyLabels:
    """
    Property 8: Custom Competency Labels
    
    *For any* blueprint with custom competency_labels, the result status
    SHALL use those custom labels instead of defaults.
    """

    @given(
        pass_label=st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=('L', 'N', 'Zs'))),
        fail_label=st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=('L', 'N', 'Zs')))
    )
    @hyp_settings(max_examples=100, deadline=None)
    def test_custom_labels_for_passing(self, pass_label, fail_label):
        """
        **Feature: assessment-engine, Property 8: Custom Competency Labels**
        **Validates: Requirements 4.4**
        
        Custom pass label is used when all evidences pass.
        """
        pass_label = pass_label.strip() or "CustomPass"
        fail_label = fail_label.strip() or "CustomFail"
        
        config = {
            'type': 'competency',
            'competency_labels': {
                'pass': pass_label,
                'fail': fail_label
            }
        }
        
        evidences = {'practical': 'pass', 'portfolio': 'pass'}
        strategy = CompetencyGradingStrategy()
        result = strategy.calculate(evidences, config)
        
        assert result.status == pass_label

    @given(
        pass_label=st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=('L', 'N', 'Zs'))),
        fail_label=st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=('L', 'N', 'Zs')))
    )
    @hyp_settings(max_examples=100, deadline=None)
    def test_custom_labels_for_failing(self, pass_label, fail_label):
        """
        **Feature: assessment-engine, Property 8: Custom Competency Labels**
        **Validates: Requirements 4.4**
        
        Custom fail label is used when any evidence fails.
        """
        pass_label = pass_label.strip() or "CustomPass"
        fail_label = fail_label.strip() or "CustomFail"
        
        config = {
            'type': 'competency',
            'competency_labels': {
                'pass': pass_label,
                'fail': fail_label
            }
        }
        
        evidences = {'practical': 'pass', 'portfolio': 'fail'}
        strategy = CompetencyGradingStrategy()
        result = strategy.calculate(evidences, config)
        
        assert result.status == fail_label

    def test_cdacc_labels(self):
        """Test CDACC-specific labels (Kenya TVET standard)."""
        config = {
            'type': 'competency',
            'competency_labels': {
                'pass': 'Competent',
                'fail': 'Not Yet Competent'
            }
        }
        
        strategy = CompetencyGradingStrategy()
        
        # All pass
        result = strategy.calculate({'practical': 'pass', 'portfolio': 'pass'}, config)
        assert result.status == 'Competent'
        
        # One fail
        result = strategy.calculate({'practical': 'pass', 'portfolio': 'fail'}, config)
        assert result.status == 'Not Yet Competent'

    def test_default_labels_when_not_specified(self):
        """Test default labels are used when not specified in config."""
        config = {'type': 'competency'}
        strategy = CompetencyGradingStrategy()
        
        # All pass - should use default 'Competent'
        result = strategy.calculate({'practical': 'pass'}, config)
        assert result.status == 'Competent'
        
        # One fail - should use default 'Not Yet Competent'
        result = strategy.calculate({'practical': 'fail'}, config)
        assert result.status == 'Not Yet Competent'
