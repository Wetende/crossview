"""
Property test for Node Parent Reference Integrity.

**Feature: blueprint-engine, Property 4: Node Parent Reference Integrity**
**Validates: Requirements 2.1**

Tests that node parent references are always valid.
"""
import pytest
from hypothesis import given, strategies as st, settings as hyp_settings

from apps.blueprints.models import AcademicBlueprint
from apps.core.models import Program
from apps.curriculum.models import CurriculumNode


@pytest.mark.django_db(transaction=True)
class TestNodeParentReferenceIntegrity:
    """
    Property 4: Node Parent Reference Integrity
    
    *For any* curriculum node with a parent, the parent must exist in the database
    and belong to the same program.
    """

    @pytest.fixture(autouse=True)
    def setup_blueprint_and_program(self):
        """Set up blueprint and program for tests."""
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
        # Cleanup
        CurriculumNode.objects.filter(program=self.program).delete()
        self.program.delete()
        self.blueprint.delete()

    @given(num_children=st.integers(min_value=1, max_value=5))
    @hyp_settings(max_examples=20, deadline=None)
    def test_child_nodes_reference_valid_parent(self, num_children):
        """
        **Feature: blueprint-engine, Property 4: Node Parent Reference Integrity**
        **Validates: Requirements 2.1**
        
        For any node tree, all child nodes must reference a valid parent.
        """
        # Create root node
        root = CurriculumNode.objects.create(
            program=self.program,
            node_type="Year",
            title="Year 1",
            parent=None
        )
        
        # Create child nodes
        children = []
        for i in range(num_children):
            child = CurriculumNode.objects.create(
                program=self.program,
                node_type="Unit",
                title=f"Unit {i+1}",
                parent=root
            )
            children.append(child)
        
        # Verify all children have valid parent reference
        for child in children:
            child.refresh_from_db()
            assert child.parent is not None
            assert child.parent.pk == root.pk
            assert child.parent.program == child.program

    def test_root_node_has_no_parent(self):
        """Root nodes should have null parent."""
        root = CurriculumNode.objects.create(
            program=self.program,
            node_type="Year",
            title="Year 1",
            parent=None
        )
        
        root.refresh_from_db()
        assert root.parent is None

    @given(depth=st.integers(min_value=1, max_value=3))
    @hyp_settings(max_examples=10, deadline=None)
    def test_nested_parent_chain_integrity(self, depth):
        """
        For any depth of nesting, the parent chain should be valid.
        """
        node_types = ["Year", "Unit", "Session"]
        
        # Create chain of nodes
        parent = None
        nodes = []
        for i in range(min(depth, len(node_types))):
            node = CurriculumNode.objects.create(
                program=self.program,
                node_type=node_types[i],
                title=f"{node_types[i]} 1",
                parent=parent
            )
            nodes.append(node)
            parent = node
        
        # Verify chain integrity
        for i, node in enumerate(nodes):
            node.refresh_from_db()
            if i == 0:
                assert node.parent is None
            else:
                assert node.parent is not None
                assert node.parent.pk == nodes[i-1].pk
