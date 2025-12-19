"""
Blueprint services - Validation and serialization.
"""
import json
from typing import List, Dict, Any
from .exceptions import InvalidHierarchyStructureException, InvalidGradingLogicException


class BlueprintValidationService:
    """Service for validating blueprint configurations."""

    def validate_hierarchy_structure(self, structure: List[str]) -> bool:
        """Validate that hierarchy_structure is a non-empty list of strings."""
        if not structure or not isinstance(structure, list):
            raise InvalidHierarchyStructureException("Hierarchy structure must be a non-empty list")
        
        for item in structure:
            if not isinstance(item, str) or not item.strip():
                raise InvalidHierarchyStructureException("All hierarchy items must be non-empty strings")
        
        return True

    VALID_GRADING_TYPES = ['weighted', 'points', 'percentage', 'competency', 'pass_fail']

    def validate_grading_logic(self, logic: Dict[str, Any]) -> bool:
        """Validate grading logic has required fields for its type."""
        if not logic or 'type' not in logic:
            raise InvalidGradingLogicException("Grading logic must have a 'type' field")
        
        grading_type = logic['type']
        
        if grading_type not in self.VALID_GRADING_TYPES:
            raise InvalidGradingLogicException(f"Unknown grading type: {grading_type}")
        
        if grading_type == 'weighted':
            if 'components' not in logic:
                raise InvalidGradingLogicException("Weighted grading requires 'components'")
        # Other types have optional fields
        
        return True


class BlueprintSerializationService:
    """Service for serializing/deserializing blueprints."""

    def serialize_to_json(self, blueprint) -> str:
        """Serialize blueprint to JSON string."""
        return json.dumps({
            'name': blueprint.name,
            'description': blueprint.description,
            'hierarchy_structure': blueprint.hierarchy_structure,
            'grading_logic': blueprint.grading_logic,
            'progression_rules': blueprint.progression_rules,
            'gamification_enabled': blueprint.gamification_enabled,
            'certificate_enabled': blueprint.certificate_enabled,
        })

    def deserialize_from_json(self, json_str: str):
        """Deserialize JSON string to blueprint data."""
        from .exceptions import InvalidBlueprintJsonException
        
        try:
            data = json.loads(json_str)
        except json.JSONDecodeError as e:
            raise InvalidBlueprintJsonException(f"Invalid JSON: {e}")
        
        # Ensure data is a dictionary
        if not isinstance(data, dict):
            raise InvalidBlueprintJsonException("JSON must be an object, not a primitive value")
        
        required_fields = ['name', 'hierarchy_structure', 'grading_logic']
        for field in required_fields:
            if field not in data:
                raise InvalidBlueprintJsonException(f"Missing required field: {field}")
        
        return data
