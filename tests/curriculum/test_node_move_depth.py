"""
Property test for Node Move Depth Validation.

**Feature: blueprint-engine, Property 8: Node Move Depth Validation**
**Validates: Requirements 2.5**

Tests that moving nodes validates against maximum hierarchy depth.
"""
import pytest
from hypothesis import given, strategies as st, settings as hyp_settings

from apps.blueprints.models import AcademicBlueprint
from apps.core.models import Program
from apps.curriculum.models import CurriculumNode
from apps.curriculum.repositories import CurriculumNodeRepository
from apps.curriculum.exceptions import MaxDepthExceededException


@pytest.mark.django_db(transaction=True)
class TestNodeMoveDepthValidation:
    """
    Property 8: Node Move Depth Validation
    
    *For any* node move that would exceed the blueprint hierarchy depth,
    the operation should raise MaxDepthExceededException.
    """

    @pytest.fixture(autouse=True)
    def setup(self):
        self.blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Year", "Unit", "Session"],  # Max depth = 2 (0-indexed)
            grading_logic={"type": "weighted", "components": [{"name": "test", "weight": 100}]}
        )
        self.program = Program.objects.create(
            name="Test Program",
            blueprint=self.blueprint
        )
        self.repo = CurriculumNodeRepository()
        yield
        CurriculumNode.objects.filter(program=self.program).delete()
        self.program.delete()
        self.blueprint.delete()

    def test_move_within_depth_limit_succeeds(self):
        """
        **Feature: blueprint-engine, Property 8: Node Move Depth Validation**
        **Validates: Requirements 2.5**
        
        Moving a node within depth limits should succeed.
        """
        root1 = CurriculumNode.objects.create(
            program=self.program,
            node_type="Year",
            title="Year 1"
        )
        root2 = CurriculumNode.objects.create(
            program=self.program,
            node_type="Year",
            title="Year 2"
        )
        child = CurriculumNode.objects.create(
            program=self.program,
            node_type="Unit",
            title="Unit 1",
            parent=root1
        )
        
        # Move child from root1 to root2 (same depth)
        moved = self.repo.move_node(child.id, root2.id)
        
        moved.refresh_from_db()
        assert moved.parent_id == root2.id

    def test_move_exceeding_depth_fails(self):
        """
        **Feature: blueprint-engine, Property 8: Node Move Depth Validation**
        **Validates: Requirements 2.5**
        
        Moving a node that would exceed max depth should fail.
        """
        root = CurriculumNode.objects.create(
            program=self.program,
            node_type="Year",
            title="Year 1"
        )
        unit = CurriculumNode.objects.create(
            program=self.program,
            node_type="Unit",
            title="Unit 1",
            parent=root
        )
        session = CurriculumNode.objects.create(
            program=self.program,
            node_type="Session",
            title="Session 1",
            parent=unit
        )
        
        # Create another branch
        another_session = CurriculumNode.objects.create(
            program=self.program,
            node_type="Session",
            title="Session 2",
            parent=unit
        )
        
        # Try to move unit under session (would exceed depth)
        # This would make: root -> session -> unit -> session (depth 3, max is 2)
        with pytest.raises(MaxDepthExceededException):
            self.repo.move_node(unit.id, session.id)

    def test_move_subtree_considers_subtree_depth(self):
        """Moving a subtree should consider the depth of the entire subtree."""
        root = CurriculumNode.objects.create(
            program=self.program,
            node_type="Year",
            title="Year 1"
        )
        unit = CurriculumNode.objects.create(
            program=self.program,
            node_type="Unit",
            title="Unit 1",
            parent=root
        )
        session = CurriculumNode.objects.create(
            program=self.program,
            node_type="Session",
            title="Session 1",
            parent=unit
        )
        
        # Create another root
        root2 = CurriculumNode.objects.create(
            program=self.program,
            node_type="Year",
            title="Year 2"
        )
        unit2 = CurriculumNode.objects.create(
            program=self.program,
            node_type="Unit",
            title="Unit 2",
            parent=root2
        )
        
        # Try to move unit (with session child) under unit2
        # Would result in: root2 -> unit2 -> unit -> session (depth 3, max is 2)
        with pytest.raises(MaxDepthExceededException):
            self.repo.move_node(unit.id, unit2.id)

    def test_move_to_root_succeeds(self):
        """Moving a node to root level should always succeed."""
        root = CurriculumNode.objects.create(
            program=self.program,
            node_type="Year",
            title="Year 1"
        )
        unit = CurriculumNode.objects.create(
            program=self.program,
            node_type="Unit",
            title="Unit 1",
            parent=root
        )
        
        # Move unit to root
        moved = self.repo.move_node(unit.id, None)
        
        moved.refresh_from_db()
        assert moved.parent_id is None
