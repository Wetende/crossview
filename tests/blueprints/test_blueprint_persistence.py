"""
Property test for Blueprint Persistence Integrity.

**Feature: blueprint-engine, Property 1: Blueprint Persistence Integrity**
**Validates: Requirements 1.1, 1.2**

Tests that for any valid blueprint configuration, saving and retrieving
from the database preserves all data exactly.
"""
import pytest
from hypothesis import given, strategies as st, settings as hyp_settings
from hypothesis.extra.django import TestCase as HypothesisTestCase

from apps.blueprints.models import AcademicBlueprint


# Strategy for generating valid hierarchy structures
hierarchy_strategy = st.lists(
    st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=('L', 'N'))),
    min_size=1,
    max_size=10
)

# Strategy for generating valid grading logic
grading_component_strategy = st.fixed_dictionaries({
    'name': st.text(min_size=1, max_size=30, alphabet=st.characters(whitelist_categories=('L',))),
    'weight': st.integers(min_value=1, max_value=100)
})

grading_logic_strategy = st.fixed_dictionaries({
    'type': st.sampled_from(['weighted', 'points', 'percentage']),
    'components': st.lists(grading_component_strategy, min_size=1, max_size=5)
})


@pytest.mark.django_db(transaction=True)
class TestBlueprintPersistence:
    """
    Property 1: Blueprint Persistence Integrity
    
    *For any* valid blueprint configuration (hierarchy_structure, grading_logic),
    saving to the database and retrieving should return identical data.
    """

    @given(
        name=st.text(min_size=1, max_size=100, alphabet=st.characters(whitelist_categories=('L', 'N', 'Zs'))),
        hierarchy=hierarchy_strategy,
        grading=grading_logic_strategy
    )
    @hyp_settings(max_examples=100, deadline=None)
    def test_blueprint_round_trip_persistence(self, name, hierarchy, grading):
        """
        **Feature: blueprint-engine, Property 1: Blueprint Persistence Integrity**
        **Validates: Requirements 1.1, 1.2**
        
        For any valid blueprint, save then retrieve should preserve all fields.
        """
        # Clean name to avoid empty after strip
        name = name.strip() or "TestBlueprint"
        
        # Create and save blueprint
        blueprint = AcademicBlueprint(
            name=name,
            description="Test description",
            hierarchy_structure=hierarchy,
            grading_logic=grading,
            gamification_enabled=True,
            certificate_enabled=False
        )
        blueprint.save()
        
        # Retrieve from database
        retrieved = AcademicBlueprint.objects.get(pk=blueprint.pk)
        
        # Assert all fields match
        assert retrieved.name == name
        assert retrieved.hierarchy_structure == hierarchy
        assert retrieved.grading_logic == grading
        assert retrieved.gamification_enabled == True
        assert retrieved.certificate_enabled == False
        
        # Cleanup
        blueprint.delete()

    @given(hierarchy=hierarchy_strategy)
    @hyp_settings(max_examples=50, deadline=None)
    def test_hierarchy_depth_calculation(self, hierarchy):
        """
        Test that get_hierarchy_depth returns correct count.
        """
        blueprint = AcademicBlueprint(
            name="Test",
            hierarchy_structure=hierarchy,
            grading_logic={"type": "weighted", "components": [{"name": "test", "weight": 100}]}
        )
        
        assert blueprint.get_hierarchy_depth() == len(hierarchy)

    @given(
        hierarchy=hierarchy_strategy,
        depth=st.integers(min_value=0, max_value=9)
    )
    @hyp_settings(max_examples=50, deadline=None)
    def test_label_for_depth_returns_correct_label(self, hierarchy, depth):
        """
        Test that get_label_for_depth returns the correct label for valid depths.
        """
        blueprint = AcademicBlueprint(
            name="Test",
            hierarchy_structure=hierarchy,
            grading_logic={"type": "weighted", "components": [{"name": "test", "weight": 100}]}
        )
        
        if depth < len(hierarchy):
            assert blueprint.get_label_for_depth(depth) == hierarchy[depth]
        else:
            with pytest.raises(ValueError):
                blueprint.get_label_for_depth(depth)
