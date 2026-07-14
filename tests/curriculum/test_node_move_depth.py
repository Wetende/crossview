"""
Property test for Node Move Depth Validation.

**Feature: blueprint-engine, Property 8: Node Move Depth Validation**
**Validates: Requirements 2.5**

Tests that moving nodes validates against maximum hierarchy depth.
"""
import pytest

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
            hierarchy_structure=["Section", "Lesson"],  # Max depth = 1 (0-indexed)
            grading_logic={"type": "weighted", "components": [{"name": "test", "weight": 100}]}
        )
        self.program = Program.objects.create(
            name="Test Program",
            code="CURR-MOVE",
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
            node_type="Section",
            title="Section 1"
        )
        root2 = CurriculumNode.objects.create(
            program=self.program,
            node_type="Section",
            title="Section 2"
        )
        child = CurriculumNode.objects.create(
            program=self.program,
            node_type="Lesson",
            title="Lesson 1",
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
            node_type="Section",
            title="Section 1"
        )
        lesson = CurriculumNode.objects.create(
            program=self.program,
            node_type="Lesson",
            title="Lesson 1",
            parent=root
        )
        another_root = CurriculumNode.objects.create(
            program=self.program,
            node_type="Section",
            title="Section 2"
        )

        # A root moved under a lesson would land at depth 2, past the
        # two-level builder's maximum depth of 1.
        with pytest.raises(MaxDepthExceededException):
            self.repo.move_node(another_root.id, lesson.id)

    def test_move_subtree_considers_subtree_depth(self):
        """Moving a subtree should consider the depth of the entire subtree."""
        root = CurriculumNode.objects.create(
            program=self.program,
            node_type="Section",
            title="Section 1"
        )
        CurriculumNode.objects.create(
            program=self.program,
            node_type="Lesson",
            title="Lesson 1",
            parent=root
        )
        
        # Create another root
        root2 = CurriculumNode.objects.create(
            program=self.program,
            node_type="Section",
            title="Section 2"
        )
        
        # Moving a container with a lesson under another container would push
        # the lesson to depth 2.
        with pytest.raises(MaxDepthExceededException):
            self.repo.move_node(root.id, root2.id)

    def test_root_move_to_root_succeeds(self):
        """Keeping a root node at root level should succeed."""
        root = CurriculumNode.objects.create(
            program=self.program,
            node_type="Section",
            title="Section 1"
        )
        
        moved = self.repo.move_node(root.id, None)
        
        moved.refresh_from_db()
        assert moved.parent_id is None
