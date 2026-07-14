"""
Property test for Cascade Delete.

**Feature: blueprint-engine, Property 7: Cascade Delete Removes All Descendants**
**Validates: Requirements 2.4**

Tests that deleting a parent node removes all descendants.
"""
import pytest
from hypothesis import given, strategies as st, settings as hyp_settings

from apps.blueprints.models import AcademicBlueprint
from apps.core.models import Program
from apps.curriculum.models import CurriculumNode


@pytest.mark.django_db(transaction=True)
class TestCascadeDelete:
    """
    Property 7: Cascade Delete Removes All Descendants
    
    *For any* node with descendants, deleting the node should also delete
    all descendant nodes.
    """

    @pytest.fixture(autouse=True)
    def setup(self):
        self.blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Section", "Lesson"],
            grading_logic={"type": "weighted", "components": [{"name": "test", "weight": 100}]}
        )
        self.program = Program.objects.create(
            name="Test Program",
            code="CURR-CASCADE",
            blueprint=self.blueprint
        )
        yield
        CurriculumNode.objects.filter(program=self.program).delete()
        self.program.delete()
        self.blueprint.delete()

    @given(num_children=st.integers(min_value=1, max_value=5))
    @hyp_settings(max_examples=20, deadline=None)
    def test_delete_parent_removes_all_descendants(self, num_children):
        """
        **Feature: blueprint-engine, Property 7: Cascade Delete Removes All Descendants**
        **Validates: Requirements 2.4**
        
        For any tree structure, deleting root should remove all descendants.
        """
        # Create root
        root = CurriculumNode.objects.create(
            program=self.program,
            node_type="Section",
            title="Section 1"
        )
        
        # Track all created node IDs
        all_ids = [root.id]
        
        # Create children
        for i in range(num_children):
            child = CurriculumNode.objects.create(
                program=self.program,
                node_type="Lesson",
                title=f"Lesson {i+1}",
                parent=root
            )
            all_ids.append(child.id)
        
        # Verify all nodes exist
        assert CurriculumNode.objects.filter(id__in=all_ids).count() == len(all_ids)
        
        # Delete root
        root.delete()
        
        # Verify all nodes are deleted
        assert CurriculumNode.objects.filter(id__in=all_ids).count() == 0

    def test_delete_container_removes_its_subtree_only(self):
        """Deleting one container should leave sibling subtrees intact."""
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
        child1 = CurriculumNode.objects.create(
            program=self.program,
            node_type="Lesson",
            title="Lesson 1",
            parent=root1
        )
        child2 = CurriculumNode.objects.create(
            program=self.program,
            node_type="Lesson",
            title="Lesson 2",
            parent=root2
        )
        
        root1.delete()
        
        assert CurriculumNode.objects.filter(pk=root2.pk).exists()
        assert CurriculumNode.objects.filter(pk=child2.pk).exists()
        assert not CurriculumNode.objects.filter(pk=root1.pk).exists()
        assert not CurriculumNode.objects.filter(pk=child1.pk).exists()

    def test_delete_leaf_node_only_removes_itself(self):
        """Deleting a leaf node should only remove that node."""
        root = CurriculumNode.objects.create(
            program=self.program,
            node_type="Section",
            title="Section 1"
        )
        child = CurriculumNode.objects.create(
            program=self.program,
            node_type="Lesson",
            title="Lesson 1",
            parent=root
        )
        
        child.delete()
        
        assert CurriculumNode.objects.filter(pk=root.pk).exists()
        assert not CurriculumNode.objects.filter(pk=child.pk).exists()
