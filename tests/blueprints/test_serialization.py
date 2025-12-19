"""
Property tests for Blueprint Serialization.

**Feature: blueprint-engine, Property 13: Blueprint Serialization Round-Trip**
**Feature: blueprint-engine, Property 14: Invalid JSON Deserialization Throws Exception**
**Validates: Requirements 7.1, 7.2, 7.3**

Tests serialization and deserialization of blueprints.
"""
import pytest
import json
from hypothesis import given, strategies as st, settings as hyp_settings

from apps.blueprints.models import AcademicBlueprint
from apps.blueprints.services import BlueprintSerializationService
from apps.blueprints.exceptions import InvalidBlueprintJsonException


# Strategy for generating valid hierarchy structures
hierarchy_strategy = st.lists(
    st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=('L', 'N'))),
    min_size=1,
    max_size=10
)

# Strategy for generating valid grading logic
grading_logic_strategy = st.fixed_dictionaries({
    'type': st.sampled_from(['weighted', 'points', 'percentage']),
    'components': st.lists(
        st.fixed_dictionaries({
            'name': st.text(min_size=1, max_size=30, alphabet=st.characters(whitelist_categories=('L',))),
            'weight': st.integers(min_value=1, max_value=100)
        }),
        min_size=1,
        max_size=5
    )
})


@pytest.mark.django_db(transaction=True)
class TestBlueprintSerializationRoundTrip:
    """
    Property 13: Blueprint Serialization Round-Trip
    
    *For any* valid blueprint, serializing to JSON and deserializing should
    produce equivalent data.
    """

    def setup_method(self):
        self.service = BlueprintSerializationService()

    @given(
        name=st.text(min_size=1, max_size=100, alphabet=st.characters(whitelist_categories=('L', 'N', 'Zs'))),
        hierarchy=hierarchy_strategy,
        grading=grading_logic_strategy
    )
    @hyp_settings(max_examples=50, deadline=None)
    def test_serialize_deserialize_round_trip(self, name, hierarchy, grading):
        """
        **Feature: blueprint-engine, Property 13: Blueprint Serialization Round-Trip**
        **Validates: Requirements 7.1, 7.2**
        
        For any valid blueprint, serialize then deserialize should preserve data.
        """
        name = name.strip() or "TestBlueprint"
        
        blueprint = AcademicBlueprint(
            name=name,
            description="Test description",
            hierarchy_structure=hierarchy,
            grading_logic=grading,
            progression_rules={"min_score": 70},
            gamification_enabled=True,
            certificate_enabled=False
        )
        
        # Serialize
        json_str = self.service.serialize_to_json(blueprint)
        
        # Deserialize
        data = self.service.deserialize_from_json(json_str)
        
        # Verify data matches
        assert data['name'] == name
        assert data['hierarchy_structure'] == hierarchy
        assert data['grading_logic'] == grading
        assert data['gamification_enabled'] == True
        assert data['certificate_enabled'] == False

    def test_serialized_json_is_valid(self):
        """Serialized output should be valid JSON."""
        blueprint = AcademicBlueprint(
            name="Test",
            hierarchy_structure=["Year", "Unit"],
            grading_logic={"type": "weighted", "components": [{"name": "test", "weight": 100}]}
        )
        
        json_str = self.service.serialize_to_json(blueprint)
        
        # Should not raise
        parsed = json.loads(json_str)
        assert isinstance(parsed, dict)


@pytest.mark.django_db
class TestInvalidJsonDeserialization:
    """
    Property 14: Invalid JSON Deserialization Throws Exception
    
    *For any* invalid JSON string, deserialization should raise
    InvalidBlueprintJsonException.
    """

    def setup_method(self):
        self.service = BlueprintSerializationService()

    @given(invalid_json=st.text(min_size=1, max_size=100).filter(lambda x: not x.startswith('{')))
    @hyp_settings(max_examples=30, deadline=None)
    def test_invalid_json_raises_exception(self, invalid_json):
        """
        **Feature: blueprint-engine, Property 14: Invalid JSON Deserialization Throws Exception**
        **Validates: Requirements 7.3**
        
        For any non-JSON string, deserialization should raise exception.
        """
        with pytest.raises(InvalidBlueprintJsonException):
            self.service.deserialize_from_json(invalid_json)

    def test_missing_required_field_raises_exception(self):
        """JSON missing required fields should raise exception."""
        # Missing hierarchy_structure
        json_str = json.dumps({
            "name": "Test",
            "grading_logic": {"type": "weighted"}
        })
        
        with pytest.raises(InvalidBlueprintJsonException):
            self.service.deserialize_from_json(json_str)

    def test_empty_json_object_raises_exception(self):
        """Empty JSON object should raise exception."""
        with pytest.raises(InvalidBlueprintJsonException):
            self.service.deserialize_from_json("{}")

    @given(
        malformed=st.sampled_from([
            '{"name": "test"',  # Missing closing brace
            '{"name": test}',   # Unquoted value
            "{'name': 'test'}", # Single quotes
            '[1, 2, 3]',        # Array instead of object
        ])
    )
    @hyp_settings(max_examples=10, deadline=None)
    def test_malformed_json_raises_exception(self, malformed):
        """Malformed JSON should raise exception."""
        with pytest.raises(InvalidBlueprintJsonException):
            self.service.deserialize_from_json(malformed)
