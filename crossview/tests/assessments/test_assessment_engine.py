"""
Property tests for AssessmentEngine service.

Tests Properties 6, 10, 11, and 12 from the design document.
"""
import pytest
import uuid
from hypothesis import given, strategies as st, settings as hyp_settings, HealthCheck
from django.utils import timezone

from apps.assessments.services import AssessmentEngine
from apps.assessments.models import AssessmentResult
from apps.assessments.strategies import GradingStrategyFactory
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
        password="testpass123"
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


# Strategy for generating component scores
component_scores_strategy = st.fixed_dictionaries({
    'cat': st.floats(min_value=0, max_value=100, allow_nan=False, allow_infinity=False),
    'exam': st.floats(min_value=0, max_value=100, allow_nan=False, allow_infinity=False)
})


@pytest.mark.django_db(transaction=True)
class TestUpsertBehavior:
    """
    Property 6: Upsert Behavior
    
    *For any* enrollment-node combination, saving a result twice
    SHALL result in exactly one record with the latest data.
    """

    @given(
        scores1=component_scores_strategy,
        scores2=component_scores_strategy
    )
    @hyp_settings(
        max_examples=50,
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    def test_upsert_creates_single_record(self, scores1, scores2):
        """
        **Feature: assessment-engine, Property 6: Upsert Behavior**
        **Validates: Requirements 2.3**
        
        Saving twice should result in exactly one record.
        """
        fixtures = create_test_fixtures()
        enrollment = fixtures['enrollment']
        node = fixtures['node']
        
        engine = AssessmentEngine()
        
        # Save first result
        result1 = engine.calculate_and_save(enrollment, node, scores1)
        
        # Save second result
        result2 = engine.calculate_and_save(enrollment, node, scores2)
        
        # Should be exactly one record
        count = AssessmentResult.objects.filter(
            enrollment=enrollment,
            node=node
        ).count()
        assert count == 1
        
        # Should have the latest data
        latest = AssessmentResult.objects.get(enrollment=enrollment, node=node)
        assert latest.result_data['components'] == scores2

    @given(scores=component_scores_strategy)
    @hyp_settings(
        max_examples=30,
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    def test_upsert_preserves_id(self, scores):
        """
        Test that upsert updates existing record rather than creating new.
        """
        fixtures = create_test_fixtures()
        enrollment = fixtures['enrollment']
        node = fixtures['node']
        
        engine = AssessmentEngine()
        
        # Create initial result
        result1 = engine.calculate_and_save(enrollment, node, {'cat': 50, 'exam': 60})
        original_id = result1.id
        
        # Update with new scores
        result2 = engine.calculate_and_save(enrollment, node, scores)
        
        # Should have same ID
        assert result2.id == original_id


@pytest.mark.django_db(transaction=True)
class TestPublishWorkflow:
    """
    Property 10: Publish Workflow
    
    *For any* newly created assessment result, is_published SHALL be false;
    after publishing, is_published SHALL be true with a non-null published_at timestamp.
    """

    @given(scores=component_scores_strategy)
    @hyp_settings(
        max_examples=50,
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    def test_new_result_is_unpublished(self, scores):
        """
        **Feature: assessment-engine, Property 10: Publish Workflow**
        **Validates: Requirements 6.1, 6.2**
        
        New results should be unpublished by default.
        """
        fixtures = create_test_fixtures()
        enrollment = fixtures['enrollment']
        node = fixtures['node']
        
        engine = AssessmentEngine()
        result = engine.calculate_and_save(enrollment, node, scores)
        
        assert result.is_published is False
        assert result.published_at is None

    @given(scores=component_scores_strategy)
    @hyp_settings(
        max_examples=50,
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    def test_publish_sets_timestamp(self, scores):
        """
        **Feature: assessment-engine, Property 10: Publish Workflow**
        **Validates: Requirements 6.1, 6.2**
        
        Publishing should set is_published and published_at.
        """
        fixtures = create_test_fixtures()
        enrollment = fixtures['enrollment']
        node = fixtures['node']
        
        engine = AssessmentEngine()
        result = engine.calculate_and_save(enrollment, node, scores)
        
        before_publish = timezone.now()
        engine.publish_result(result)
        after_publish = timezone.now()
        
        # Refresh from database
        result.refresh_from_db()
        
        assert result.is_published is True
        assert result.published_at is not None
        assert before_publish <= result.published_at <= after_publish


@pytest.mark.django_db(transaction=True)
class TestPublishedResultsFilter:
    """
    Property 11: Published Results Filter
    
    *For any* student query, the returned results SHALL only include
    results where is_published is true.
    """

    def test_student_sees_only_published(self):
        """
        **Feature: assessment-engine, Property 11: Published Results Filter**
        **Validates: Requirements 6.3**
        
        Students should only see published results.
        """
        fixtures = create_test_fixtures()
        enrollment = fixtures['enrollment']
        user = fixtures['user']
        program = fixtures['program']
        
        # Create multiple nodes
        node1 = CurriculumNode.objects.create(
            program=program, node_type="Session", title="Session 1", position=1
        )
        node2 = CurriculumNode.objects.create(
            program=program, node_type="Session", title="Session 2", position=2
        )
        
        engine = AssessmentEngine()
        
        # Create results
        result1 = engine.calculate_and_save(enrollment, node1, {'cat': 50, 'exam': 60})
        result2 = engine.calculate_and_save(enrollment, node2, {'cat': 70, 'exam': 80})
        
        # Publish only one
        engine.publish_result(result1)
        
        # Query as student (published_only=True)
        student_results = engine.get_student_results(user, published_only=True)
        
        assert student_results.count() == 1
        assert student_results.first().node == node1

    def test_lecturer_sees_all(self):
        """
        Test that lecturers can see all results (published_only=False).
        """
        fixtures = create_test_fixtures()
        enrollment = fixtures['enrollment']
        user = fixtures['user']
        program = fixtures['program']
        
        node1 = CurriculumNode.objects.create(
            program=program, node_type="Session", title="Session 1", position=1
        )
        node2 = CurriculumNode.objects.create(
            program=program, node_type="Session", title="Session 2", position=2
        )
        
        engine = AssessmentEngine()
        
        result1 = engine.calculate_and_save(enrollment, node1, {'cat': 50, 'exam': 60})
        result2 = engine.calculate_and_save(enrollment, node2, {'cat': 70, 'exam': 80})
        
        # Publish only one
        engine.publish_result(result1)
        
        # Query as lecturer (published_only=False)
        all_results = engine.get_student_results(user, published_only=False)
        
        assert all_results.count() == 2


@pytest.mark.django_db(transaction=True)
class TestBulkPublish:
    """
    Property 12: Bulk Publish
    
    *For any* bulk publish operation on a node, all unpublished results
    for that node SHALL become published.
    """

    def test_bulk_publish_all_unpublished(self):
        """
        **Feature: assessment-engine, Property 12: Bulk Publish**
        **Validates: Requirements 6.4**
        
        Bulk publish should publish all unpublished results for a node.
        """
        # Create multiple users and enrollments
        unique_id = str(uuid.uuid4())[:8]
        
        blueprint = AcademicBlueprint.objects.create(
            name=f"Test Blueprint {unique_id}",
            hierarchy_structure=["Year", "Unit", "Session"],
            grading_logic={
                "type": "weighted",
                "components": [{"name": "cat", "weight": 0.3}, {"name": "exam", "weight": 0.7}],
                "pass_mark": 40
            }
        )
        
        program = Program.objects.create(name=f"Test Program {unique_id}", blueprint=blueprint)
        node = CurriculumNode.objects.create(
            program=program, node_type="Session", title="Test Session", position=0
        )
        
        engine = AssessmentEngine()
        
        # Create multiple students with results
        for i in range(5):
            user = User.objects.create_user(
                username=f"student_{unique_id}_{i}",
                email=f"student_{unique_id}_{i}@example.com",
                password="testpass123"
            )
            enrollment = Enrollment.objects.create(user=user, program=program)
            engine.calculate_and_save(enrollment, node, {'cat': 50 + i, 'exam': 60 + i})
        
        # Verify all unpublished
        unpublished_count = AssessmentResult.objects.filter(node=node, is_published=False).count()
        assert unpublished_count == 5
        
        # Bulk publish
        published_count = engine.bulk_publish(node)
        
        assert published_count == 5
        
        # Verify all published
        all_published = AssessmentResult.objects.filter(node=node, is_published=True).count()
        assert all_published == 5
        
        # Verify all have timestamps
        for result in AssessmentResult.objects.filter(node=node):
            assert result.published_at is not None

    def test_bulk_publish_skips_already_published(self):
        """
        Test that bulk publish doesn't affect already published results.
        """
        unique_id = str(uuid.uuid4())[:8]
        
        blueprint = AcademicBlueprint.objects.create(
            name=f"Test Blueprint {unique_id}",
            hierarchy_structure=["Year", "Unit", "Session"],
            grading_logic={
                "type": "weighted",
                "components": [{"name": "cat", "weight": 0.3}, {"name": "exam", "weight": 0.7}],
                "pass_mark": 40
            }
        )
        
        program = Program.objects.create(name=f"Test Program {unique_id}", blueprint=blueprint)
        node = CurriculumNode.objects.create(
            program=program, node_type="Session", title="Test Session", position=0
        )
        
        engine = AssessmentEngine()
        
        # Create 3 students
        results = []
        for i in range(3):
            user = User.objects.create_user(
                username=f"student_{unique_id}_{i}",
                email=f"student_{unique_id}_{i}@example.com",
                password="testpass123"
            )
            enrollment = Enrollment.objects.create(user=user, program=program)
            result = engine.calculate_and_save(enrollment, node, {'cat': 50, 'exam': 60})
            results.append(result)
        
        # Publish first one manually
        engine.publish_result(results[0])
        first_publish_time = results[0].published_at
        
        # Bulk publish
        published_count = engine.bulk_publish(node)
        
        # Should only publish 2 (the unpublished ones)
        assert published_count == 2
        
        # First result's timestamp should be unchanged
        results[0].refresh_from_db()
        assert results[0].published_at == first_publish_time
