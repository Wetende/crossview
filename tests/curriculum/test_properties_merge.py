"""
Property test for Properties JSON Merge Behavior.

**Feature: blueprint-engine, Property 9: Properties JSON Merge Behavior**
**Validates: Requirements 3.2**

Tests that merging properties preserves existing keys not in the update.
"""
import pytest
from hypothesis import given, strategies as st, settings as hyp_settings

from apps.blueprints.models import AcademicBlueprint
from apps.core.models import Program
from apps.curriculum.models import CurriculumNode
from apps.curriculum.services import NodePropertiesService


# Strategy for generating property dictionaries
property_strategy = st.dictionaries(
    keys=st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=('L',))),
    values=st.one_of(
        st.text(max_size=100),
        st.integers(),
        st.booleans(),
        st.none()
    ),
    min_size=0,
    max_size=10
)


@pytest.mark.django_db(transaction=True)
class TestPropertiesMerge:
    """
    Property 9: Properties JSON Merge Behavior
    
    *For any* existing properties and new properties, merging should:
    - Add new keys from the update
    - Update existing keys with new values
    - Preserve existing keys not in the update
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
        self.service = NodePropertiesService()
        yield
        CurriculumNode.objects.filter(program=self.program).delete()
        self.program.delete()
        self.blueprint.delete()

    @given(
        existing=property_strategy,
        new_props=property_strategy
    )
    @hyp_settings(max_examples=50, deadline=None)
    def test_merge_preserves_non_updated_keys(self, existing, new_props):
        """
        **Feature: blueprint-engine, Property 9: Properties JSON Merge Behavior**
        **Validates: Requirements 3.2**
        
        For any merge, keys not in the update should be preserved.
        """
        node = CurriculumNode.objects.create(
            program=self.program,
            node_type="Year",
            title="Test Node",
            properties=existing
        )
        
        merged = self.service.merge_properties(node, new_props)
        
        # All existing keys not in new_props should be preserved
        for key, value in existing.items():
            if key not in new_props:
                assert key in merged
                assert merged[key] == value
        
        # All new keys should be present
        for key, value in new_props.items():
            assert key in merged
            assert merged[key] == value
        
        node.delete()

    @given(
        existing=property_strategy,
        new_props=property_strategy
    )
    @hyp_settings(max_examples=50, deadline=None)
    def test_merge_updates_existing_keys(self, existing, new_props):
        """
        **Feature: blueprint-engine, Property 9: Properties JSON Merge Behavior**
        **Validates: Requirements 3.2**
        
        For any merge, existing keys in the update should be overwritten.
        """
        node = CurriculumNode.objects.create(
            program=self.program,
            node_type="Year",
            title="Test Node",
            properties=existing
        )
        
        merged = self.service.merge_properties(node, new_props)
        
        # Keys in both should have new value
        for key in set(existing.keys()) & set(new_props.keys()):
            assert merged[key] == new_props[key]
        
        node.delete()

    def test_merge_with_empty_existing(self):
        """Merging into empty properties should just set new properties."""
        node = CurriculumNode.objects.create(
            program=self.program,
            node_type="Year",
            title="Test Node",
            properties={}
        )
        
        new_props = {"key1": "value1", "key2": 42}
        merged = self.service.merge_properties(node, new_props)
        
        assert merged == new_props
        node.delete()

    def test_merge_with_empty_update(self):
        """Merging empty update should preserve all existing."""
        existing = {"key1": "value1", "key2": 42}
        node = CurriculumNode.objects.create(
            program=self.program,
            node_type="Year",
            title="Test Node",
            properties=existing
        )
        
        merged = self.service.merge_properties(node, {})
        
        assert merged == existing
        node.delete()
