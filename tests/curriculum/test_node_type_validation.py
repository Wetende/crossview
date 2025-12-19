"""
Property test for Node Type Validation.

**Feature: blueprint-engine, Property 5: Node Type Validation Against Blueprint**
**Validates: Requirements 2.2**

Tests that node types are validated against the blueprint hierarchy.
"""
import pytest
from hypothesis import given, strategies as st, settings as hyp_settings

from apps.blueprints.models import AcademicBlueprint
from apps.core.models import Program
from apps.curriculum.models import CurriculumNode
from apps.curriculum.exceptions import InvalidNodeTypeException


@pytest.mark.django_db(transaction=True)
class TestNodeTypeValidation:
    """
    Property 5: Node Type Validation Against Blueprint
    
    *For any* node type not in the blueprint hierarchy, saving should raise
    InvalidNodeTypeException.
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

    @given(node_type=st.sampled_from(["Year", "Unit", "Session"]))
    @hyp_settings(max_examples=30, deadline=None)
    def test_valid_node_types_accepted(self, node_type):
        """
        **Feature: blueprint-engine, Property 5: Node Type Validation Against Blueprint**
        **Validates: Requirements 2.2**
        
        For any valid node type in the hierarchy, creation should succeed.
        """
        node = CurriculumNode(
            program=self.program,
            node_type=node_type,
            title=f"Test {node_type}"
        )
        node.save()
        
        assert node.pk is not None
        node.delete()

    @given(
        invalid_type=st.text(min_size=1, max_size=20).filter(
            lambda x: x not in ["Year", "Unit", "Session"]
        )
    )
    @hyp_settings(max_examples=30, deadline=None)
    def test_invalid_node_types_rejected(self, invalid_type):
        """
        **Feature: blueprint-engine, Property 5: Node Type Validation Against Blueprint**
        **Validates: Requirements 2.2**
        
        For any node type NOT in the hierarchy, creation should fail.
        """
        from django.core.exceptions import ValidationError
        
        node = CurriculumNode(
            program=self.program,
            node_type=invalid_type,
            title="Invalid Node"
        )
        
        # The validation error wraps our custom exception
        with pytest.raises((InvalidNodeTypeException, ValidationError)):
            node.save()

    def test_node_without_blueprint_accepts_any_type(self):
        """Nodes in programs without blueprints should accept any type."""
        program_no_blueprint = Program.objects.create(
            name="No Blueprint Program",
            blueprint=None
        )
        
        node = CurriculumNode(
            program=program_no_blueprint,
            node_type="CustomType",
            title="Custom Node"
        )
        node.save()
        
        assert node.pk is not None
        
        # Cleanup
        node.delete()
        program_no_blueprint.delete()
