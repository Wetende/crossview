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
            hierarchy_structure=["Year", "Unit", "Session"],
            grading_logic={"type": "weighted", "components": [{"name": "test", "weight": 100}]}
        )
        self.program = Program.objects.create(
            name="Test Program",
            blueprint=self.blueprint
        )
        yield
        CurriculumNode.objects.filter(program=self.program).delete()
        self.program.delete()
        self.blueprint.delete()

    @given(
        num_children=st.integers(min_value=1, max_value=5),
        num_grandchildren=st.integers(min_value=0, max_value=3)
    )
    @hyp_settings(max_examples=20, deadline=None)
    def test_delete_parent_removes_all_descendants(self, num_children, num_grandchildren):
        """
        **Feature: blueprint-engine, Property 7: Cascade Delete Removes All Descendants**
        **Validates: Requirements 2.4**
        
        For any tree structure, deleting root should remove all descendants.
        """
        # Create root
        root = CurriculumNode.objects.create(
            program=self.program,
            node_type="Year",
            title="Year 1"
        )
        
        # Track all created node IDs
        all_ids = [root.id]
        
        # Create children
        for i in range(num_children):
            child = CurriculumNode.objects.create(
                program=self.program,
                node_type="Unit",
                title=f"Unit {i+1}",
                parent=root
            )
            all_ids.append(child.id)
            
            # Create grandchildren
            for j in range(num_grandchildren):
                grandchild = CurriculumNode.objects.create(
                    program=self.program,
                    node_type="Session",
                    title=f"Session {i+1}.{j+1}",
                    parent=child
                )
                all_ids.append(grandchild.id)
        
        # Verify all nodes exist
        assert CurriculumNode.objects.filter(id__in=all_ids).count() == len(all_ids)
        
        # Delete root
        root.delete()
        
        # Verify all nodes are deleted
        assert CurriculumNode.objects.filter(id__in=all_ids).count() == 0

    def test_delete_middle_node_removes_subtree_only(self):
        """Deleting a middle node should only remove its subtree."""
        root = CurriculumNode.objects.create(
            program=self.program,
            node_type="Year",
            title="Year 1"
        )
        child1 = CurriculumNode.objects.create(
            program=self.program,
            node_type="Unit",
            title="Unit 1",
            parent=root
        )
        child2 = CurriculumNode.objects.create(
            program=self.program,
            node_type="Unit",
            title="Unit 2",
            parent=root
        )
        grandchild = CurriculumNode.objects.create(
            program=self.program,
            node_type="Session",
            title="Session 1",
            parent=child1
        )
        
        # Delete child1 (should remove grandchild too)
        child1.delete()
        
        # Root and child2 should still exist
        assert CurriculumNode.objects.filter(pk=root.pk).exists()
        assert CurriculumNode.objects.filter(pk=child2.pk).exists()
        
        # child1 and grandchild should be deleted
        assert not CurriculumNode.objects.filter(pk=child1.pk).exists()
        assert not CurriculumNode.objects.filter(pk=grandchild.pk).exists()

    def test_delete_leaf_node_only_removes_itself(self):
        """Deleting a leaf node should only remove that node."""
        root = CurriculumNode.objects.create(
            program=self.program,
            node_type="Year",
            title="Year 1"
        )
        child = CurriculumNode.objects.create(
            program=self.program,
            node_type="Unit",
            title="Unit 1",
            parent=root
        )
        
        child.delete()
        
        assert CurriculumNode.objects.filter(pk=root.pk).exists()
        assert not CurriculumNode.objects.filter(pk=child.pk).exists()
