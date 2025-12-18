"""
Property test for Recursive Tree Retrieval.

**Feature: blueprint-engine, Property 6: Recursive Tree Retrieval Completeness**
**Validates: Requirements 2.3**

Tests that tree retrieval returns all nodes in the correct structure.
"""
import pytest
from hypothesis import given, strategies as st, settings as hyp_settings

from apps.blueprints.models import AcademicBlueprint
from apps.core.models import Program
from apps.curriculum.models import CurriculumNode
from apps.curriculum.repositories import CurriculumNodeRepository


@pytest.mark.django_db(transaction=True)
class TestTreeRetrieval:
    """
    Property 6: Recursive Tree Retrieval Completeness
    
    *For any* program with curriculum nodes, get_tree_for_program should return
    all nodes belonging to that program.
    """

    @given(
        num_roots=st.integers(min_value=1, max_value=3),
        children_per_node=st.integers(min_value=0, max_value=2)
    )
    @hyp_settings(max_examples=20, deadline=None)
    def test_tree_retrieval_returns_all_nodes(self, num_roots, children_per_node):
        """
        **Feature: blueprint-engine, Property 6: Recursive Tree Retrieval Completeness**
        **Validates: Requirements 2.3**
        
        For any tree structure, retrieval should return all nodes.
        """
        # Setup for each hypothesis example
        blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Year", "Unit", "Session"],
            grading_logic={"type": "weighted", "components": [{"name": "test", "weight": 100}]}
        )
        program = Program.objects.create(
            name="Test Program",
            blueprint=blueprint
        )
        repo = CurriculumNodeRepository()
        
        try:
            created_nodes = []
            
            # Create root nodes
            for i in range(num_roots):
                root = CurriculumNode.objects.create(
                    program=program,
                    node_type="Year",
                    title=f"Year {i+1}",
                    position=i
                )
                created_nodes.append(root)
                
                # Create children
                for j in range(children_per_node):
                    child = CurriculumNode.objects.create(
                        program=program,
                        node_type="Unit",
                        title=f"Unit {i+1}.{j+1}",
                        parent=root,
                        position=j
                    )
                    created_nodes.append(child)
            
            # Retrieve tree
            tree = repo.get_tree_for_program(program.id)
            
            # Flatten tree for counting
            def count_nodes(nodes):
                count = len(nodes)
                for node in nodes:
                    if hasattr(node, '_children_cache'):
                        count += count_nodes(node._children_cache)
                return count
            
            # Verify all nodes are returned
            assert count_nodes(tree) == len(created_nodes)
        finally:
            CurriculumNode.objects.filter(program=program).delete()
            program.delete()
            blueprint.delete()

    def test_get_subtree_returns_node_and_descendants(self):
        """get_subtree should return the node and all its descendants."""
        blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Year", "Unit", "Session"],
            grading_logic={"type": "weighted", "components": [{"name": "test", "weight": 100}]}
        )
        program = Program.objects.create(
            name="Test Program",
            blueprint=blueprint
        )
        repo = CurriculumNodeRepository()
        
        try:
            root = CurriculumNode.objects.create(
                program=program,
                node_type="Year",
                title="Year 1"
            )
            child1 = CurriculumNode.objects.create(
                program=program,
                node_type="Unit",
                title="Unit 1",
                parent=root
            )
            child2 = CurriculumNode.objects.create(
                program=program,
                node_type="Unit",
                title="Unit 2",
                parent=root
            )
            grandchild = CurriculumNode.objects.create(
                program=program,
                node_type="Session",
                title="Session 1",
                parent=child1
            )
            
            subtree = repo.get_subtree(root.id)
            
            assert len(subtree) == 4
            assert root in subtree
            assert child1 in subtree
            assert child2 in subtree
            assert grandchild in subtree
        finally:
            CurriculumNode.objects.filter(program=program).delete()
            program.delete()
            blueprint.delete()

    def test_get_ancestors_returns_path_to_root(self):
        """get_ancestors should return path from root to parent."""
        blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Year", "Unit", "Session"],
            grading_logic={"type": "weighted", "components": [{"name": "test", "weight": 100}]}
        )
        program = Program.objects.create(
            name="Test Program",
            blueprint=blueprint
        )
        repo = CurriculumNodeRepository()
        
        try:
            root = CurriculumNode.objects.create(
                program=program,
                node_type="Year",
                title="Year 1"
            )
            child = CurriculumNode.objects.create(
                program=program,
                node_type="Unit",
                title="Unit 1",
                parent=root
            )
            grandchild = CurriculumNode.objects.create(
                program=program,
                node_type="Session",
                title="Session 1",
                parent=child
            )
            
            ancestors = repo.get_ancestors(grandchild.id)
            
            assert len(ancestors) == 2
            assert ancestors[0].pk == root.pk
            assert ancestors[1].pk == child.pk
        finally:
            CurriculumNode.objects.filter(program=program).delete()
            program.delete()
            blueprint.delete()
