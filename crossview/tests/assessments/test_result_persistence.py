"""
Property test for Assessment Result Persistence Integrity.

**Feature: assessment-engine, Property 5: Result Persistence Integrity**
**Validates: Requirements 2.1, 2.4**

Tests that for any assessment result saved with component scores,
retrieving the result returns identical component scores in result_data.
"""
import pytest
from hypothesis import given, strategies as st, settings as hyp_settings, HealthCheck

from apps.assessments.models import AssessmentResult
from apps.progression.models import Enrollment
from apps.curriculum.models import CurriculumNode
from apps.core.models import User, Program
from apps.blueprints.models import AcademicBlueprint


# Strategy for generating component scores
component_scores_strategy = st.dictionaries(
    keys=st.sampled_from(['cat', 'exam', 'assignment', 'practical', 'quiz']),
    values=st.floats(min_value=0, max_value=100, allow_nan=False, allow_infinity=False),
    min_size=1,
    max_size=5
)

# Strategy for generating result data
result_data_strategy = st.fixed_dictionaries({
    'components': component_scores_strategy,
    'total': st.floats(min_value=0, max_value=100, allow_nan=False, allow_infinity=False),
    'status': st.sampled_from(['Pass', 'Fail', 'Referral', 'Competent', 'Not Yet Competent']),
    'letter_grade': st.sampled_from(['A', 'B', 'C', 'D', 'F', None])
})


def create_test_fixtures():
    """Create required test fixtures."""
    # Create blueprint
    blueprint = AcademicBlueprint.objects.create(
        name="Test Blueprint",
        hierarchy_structure=["Year", "Unit", "Session"],
        grading_logic={"type": "weighted", "components": [{"name": "exam", "weight": 1.0}]}
    )
    
    # Create program
    program = Program.objects.create(
        name="Test Program",
        blueprint=blueprint
    )
    
    # Create user with unique username
    import uuid
    unique_id = str(uuid.uuid4())[:8]
    user = User.objects.create_user(
        username=f"testuser_{unique_id}",
        email=f"test_{unique_id}@example.com",
        password="testpass123"
    )
    
    # Create enrollment
    enrollment = Enrollment.objects.create(
        user=user,
        program=program
    )
    
    # Create curriculum node
    node = CurriculumNode.objects.create(
        program=program,
        node_type="Session",
        title="Test Session",
        position=0
    )
    
    return {
        'blueprint': blueprint,
        'program': program,
        'user': user,
        'enrollment': enrollment,
        'node': node
    }


@pytest.mark.django_db(transaction=True)
class TestResultPersistence:
    """
    Property 5: Result Persistence Integrity
    
    *For any* assessment result saved with component scores,
    retrieving the result SHALL return identical component scores in result_data.
    """

    @given(result_data=result_data_strategy)
    @hyp_settings(
        max_examples=100, 
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    def test_result_round_trip_persistence(self, result_data):
        """
        **Feature: assessment-engine, Property 5: Result Persistence Integrity**
        **Validates: Requirements 2.1, 2.4**
        
        For any result_data, save then retrieve should preserve all fields.
        """
        fixtures = create_test_fixtures()
        enrollment = fixtures['enrollment']
        node = fixtures['node']
        
        # Create and save result
        result = AssessmentResult.objects.create(
            enrollment=enrollment,
            node=node,
            result_data=result_data
        )
        
        # Retrieve from database
        retrieved = AssessmentResult.objects.get(pk=result.pk)
        
        # Assert result_data matches exactly
        assert retrieved.result_data == result_data
        assert retrieved.get_total() == result_data['total']
        assert retrieved.get_status() == result_data['status']
        assert retrieved.get_letter_grade() == result_data['letter_grade']
        assert retrieved.get_components() == result_data['components']

    @given(
        components=component_scores_strategy,
        total=st.floats(min_value=0, max_value=100, allow_nan=False, allow_infinity=False)
    )
    @hyp_settings(
        max_examples=50, 
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    def test_component_scores_preserved(self, components, total):
        """
        Test that individual component scores are preserved exactly.
        """
        fixtures = create_test_fixtures()
        enrollment = fixtures['enrollment']
        node = fixtures['node']
        
        result_data = {
            'components': components,
            'total': total,
            'status': 'Pass'
        }
        
        result = AssessmentResult.objects.create(
            enrollment=enrollment,
            node=node,
            result_data=result_data
        )
        
        retrieved = AssessmentResult.objects.get(pk=result.pk)
        
        # Each component score should match exactly
        for key, value in components.items():
            assert retrieved.get_components()[key] == value

    def test_accessor_methods_with_empty_result_data(self):
        """
        Test accessor methods handle missing fields gracefully.
        """
        fixtures = create_test_fixtures()
        enrollment = fixtures['enrollment']
        node = fixtures['node']
        
        result = AssessmentResult.objects.create(
            enrollment=enrollment,
            node=node,
            result_data={}
        )
        
        assert result.get_total() is None
        assert result.get_status() is None
        assert result.get_letter_grade() is None
        assert result.get_components() == {}
