"""
Property tests for AssessmentResultSerializer.

**Feature: assessment-engine, Property 13: Serialization Completeness**
**Validates: Requirements 7.1, 7.2**
"""
import pytest
import uuid
import json
from hypothesis import given, strategies as st, settings as hyp_settings, HealthCheck

from apps.assessments.serializers import AssessmentResultSerializer, AssessmentResultListSerializer
from apps.assessments.models import AssessmentResult
from apps.progression.models import Enrollment
from apps.curriculum.models import CurriculumNode
from apps.core.models import User, Program
from apps.blueprints.models import AcademicBlueprint


def create_test_fixtures():
    """Create required test fixtures with unique identifiers."""
    unique_id = str(uuid.uuid4())[:8]
    
    blueprint = AcademicBlueprint.objects.create(
        name=f"Test Blueprint {unique_id}",
        hierarchy_structure=["Year", "Unit", "Session"],
        grading_logic={
            "type": "weighted",
            "components": [
                {"name": "cat", "weight": 0.3},
                {"name": "exam", "weight": 0.7}
            ],
            "pass_mark": 40
        }
    )
    
    program = Program.objects.create(
        name=f"Test Program {unique_id}",
        blueprint=blueprint
    )
    
    user = User.objects.create_user(
        username=f"testuser_{unique_id}",
        email=f"test_{unique_id}@example.com",
        password="testpass123",
        first_name="Test",
        last_name="User"
    )
    
    enrollment = Enrollment.objects.create(
        user=user,
        program=program
    )
    
    node = CurriculumNode.objects.create(
        program=program,
        node_type="Session",
        title=f"Test Session {unique_id}",
        position=0
    )
    
    return {
        'blueprint': blueprint,
        'program': program,
        'user': user,
        'enrollment': enrollment,
        'node': node
    }


# Strategy for generating result data
result_data_strategy = st.fixed_dictionaries({
    'components': st.fixed_dictionaries({
        'cat': st.floats(min_value=0, max_value=100, allow_nan=False, allow_infinity=False),
        'exam': st.floats(min_value=0, max_value=100, allow_nan=False, allow_infinity=False)
    }),
    'total': st.floats(min_value=0, max_value=100, allow_nan=False, allow_infinity=False),
    'status': st.sampled_from(['Pass', 'Fail', 'Referral']),
    'letter_grade': st.sampled_from(['A', 'B', 'C', 'D', 'F'])
})


@pytest.mark.django_db(transaction=True)
class TestSerializationCompleteness:
    """
    Property 13: Serialization Completeness
    
    *For any* assessment result, serialization SHALL produce JSON containing
    all component scores, total, status, and letter_grade (if applicable).
    """

    @given(result_data=result_data_strategy)
    @hyp_settings(
        max_examples=50,
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    def test_serialization_contains_all_fields(self, result_data):
        """
        **Feature: assessment-engine, Property 13: Serialization Completeness**
        **Validates: Requirements 7.1, 7.2**
        
        Serialized output should contain all required fields.
        """
        fixtures = create_test_fixtures()
        
        result = AssessmentResult.objects.create(
            enrollment=fixtures['enrollment'],
            node=fixtures['node'],
            result_data=result_data
        )
        
        serializer = AssessmentResultSerializer(result)
        data = serializer.to_dict()
        
        # Check all required fields are present
        assert 'components' in data
        assert 'total' in data
        assert 'status' in data
        assert 'letter_grade' in data
        
        # Check values match
        assert data['components'] == result_data['components']
        assert data['total'] == result_data['total']
        assert data['status'] == result_data['status']
        assert data['letter_grade'] == result_data['letter_grade']

    @given(result_data=result_data_strategy)
    @hyp_settings(
        max_examples=50,
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    def test_json_serialization_is_valid(self, result_data):
        """
        Test that to_json produces valid JSON.
        """
        fixtures = create_test_fixtures()
        
        result = AssessmentResult.objects.create(
            enrollment=fixtures['enrollment'],
            node=fixtures['node'],
            result_data=result_data
        )
        
        serializer = AssessmentResultSerializer(result)
        json_str = serializer.to_json()
        
        # Should be valid JSON
        parsed = json.loads(json_str)
        
        # Should contain all fields
        assert 'components' in parsed
        assert 'total' in parsed
        assert 'status' in parsed

    @given(result_data=result_data_strategy)
    @hyp_settings(
        max_examples=50,
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    def test_transcript_format_contains_required_fields(self, result_data):
        """
        **Feature: assessment-engine, Property 13: Serialization Completeness**
        **Validates: Requirements 7.1, 7.2**
        
        Transcript format should include student name, node title, and grades.
        """
        fixtures = create_test_fixtures()
        
        result = AssessmentResult.objects.create(
            enrollment=fixtures['enrollment'],
            node=fixtures['node'],
            result_data=result_data
        )
        
        serializer = AssessmentResultSerializer(result)
        transcript = serializer.to_transcript_format()
        
        # Check required transcript fields
        assert 'student_name' in transcript
        assert 'node_title' in transcript
        assert 'components' in transcript
        assert 'total' in transcript
        assert 'letter_grade' in transcript
        
        # Check values
        assert transcript['student_name'] == "Test User"
        assert transcript['node_title'] == fixtures['node'].title
        assert transcript['components'] == result_data['components']
        assert transcript['total'] == result_data['total']
        assert transcript['letter_grade'] == result_data['letter_grade']

    def test_list_serialization(self):
        """
        Test serialization of multiple results.
        """
        fixtures = create_test_fixtures()
        program = fixtures['program']
        enrollment = fixtures['enrollment']
        
        # Create multiple results
        results = []
        for i in range(3):
            node = CurriculumNode.objects.create(
                program=program,
                node_type="Session",
                title=f"Session {i}",
                position=i
            )
            result = AssessmentResult.objects.create(
                enrollment=enrollment,
                node=node,
                result_data={
                    'components': {'cat': 50 + i, 'exam': 60 + i},
                    'total': 55 + i,
                    'status': 'Pass',
                    'letter_grade': 'C'
                }
            )
            results.append(result)
        
        serializer = AssessmentResultListSerializer(results)
        data = serializer.to_list()
        
        assert len(data) == 3
        for item in data:
            assert 'components' in item
            assert 'total' in item
            assert 'status' in item

    def test_transcript_list_serialization(self):
        """
        Test transcript serialization of multiple results.
        """
        fixtures = create_test_fixtures()
        program = fixtures['program']
        enrollment = fixtures['enrollment']
        
        # Create multiple results
        results = []
        for i in range(3):
            node = CurriculumNode.objects.create(
                program=program,
                node_type="Session",
                title=f"Session {i}",
                position=i
            )
            result = AssessmentResult.objects.create(
                enrollment=enrollment,
                node=node,
                result_data={
                    'components': {'cat': 50 + i, 'exam': 60 + i},
                    'total': 55 + i,
                    'status': 'Pass',
                    'letter_grade': 'C'
                }
            )
            results.append(result)
        
        serializer = AssessmentResultListSerializer(results)
        transcript_data = serializer.to_transcript_list()
        
        assert len(transcript_data) == 3
        for item in transcript_data:
            assert 'student_name' in item
            assert 'node_title' in item
            assert 'components' in item
            assert 'total' in item
