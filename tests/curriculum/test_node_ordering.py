"""
Property test for Node Ordering Consistency.

**Feature: blueprint-engine, Property 10: Node Ordering Consistency**
**Validates: Requirements 5.2**

Tests that sibling reordering maintains consistency.
"""
import pytest
from hypothesis import given, strategies as st, settings as hyp_settings
import random

from apps.blueprints.models import AcademicBlueprint
from apps.core.models import Program
from apps.curriculum.models import CurriculumNode
from apps.curriculum.repositories import CurriculumNodeRepository


@pytest.mark.django_db(transaction=True)
class TestNodeOrdering:
    """
    Property 10: Node Ordering Consistency
    
    *For any* reordering of sibling nodes, the position values should be
    sequential and match the requested order.
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
        self.repo = CurriculumNodeRepository()
        yield
        CurriculumNode.objects.filter(program=self.program).delete()
        self.program.delete()
        self.blueprint.delete()

    @given(num_siblings=st.integers(min_value=2, max_value=10))
    @hyp_settings(max_examples=20, deadline=None)
    def test_reorder_siblings_updates_positions(self, num_siblings):
        """
        **Feature: blueprint-engine, Property 10: Node Ordering Consistency**
        **Validates: Requirements 5.2**
        
        For any set of siblings, reordering should update positions correctly.
        """
        # Create siblings
        siblings = []
        for i in range(num_siblings):
            node = CurriculumNode.objects.create(
                program=self.program,
                node_type="Year",
                title=f"Year {i+1}",
                position=i
            )
            siblings.append(node)
        
        # Shuffle the order
        shuffled_ids = [s.id for s in siblings]
        random.shuffle(shuffled_ids)
        
        # Reorder
        reordered = self.repo.reorder_siblings(shuffled_ids)
        
        # Verify positions are sequential and match order
        for i, node_id in enumerate(shuffled_ids):
            node = CurriculumNode.objects.get(pk=node_id)
            assert node.position == i

    def test_reorder_preserves_parent_relationship(self):
        """Reordering should not affect parent relationships."""
        root = CurriculumNode.objects.create(
            program=self.program,
            node_type="Year",
            title="Year 1"
        )
        
        children = []
        for i in range(3):
            child = CurriculumNode.objects.create(
                program=self.program,
                node_type="Unit",
                title=f"Unit {i+1}",
                parent=root,
                position=i
            )
            children.append(child)
        
        # Reverse order
        reversed_ids = [c.id for c in reversed(children)]
        self.repo.reorder_siblings(reversed_ids)
        
        # Verify parent relationships unchanged
        for child in children:
            child.refresh_from_db()
            assert child.parent_id == root.id

    def test_positions_are_zero_indexed(self):
        """Positions should start from 0."""
        nodes = []
        for i in range(3):
            node = CurriculumNode.objects.create(
                program=self.program,
                node_type="Year",
                title=f"Year {i+1}",
                position=i
            )
            nodes.append(node)
        
        node_ids = [n.id for n in nodes]
        self.repo.reorder_siblings(node_ids)
        
        for i, node_id in enumerate(node_ids):
            node = CurriculumNode.objects.get(pk=node_id)
            assert node.position == i
        
        # First position should be 0
        first_node = CurriculumNode.objects.get(pk=node_ids[0])
        assert first_node.position == 0
