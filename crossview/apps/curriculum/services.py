"""
Curriculum services - Node properties handling and validation.
"""
from typing import Dict, Any
from django.conf import settings

from .models import CurriculumNode


class NodePropertiesService:
    """Service for handling node properties."""

    def merge_properties(self, node: CurriculumNode, new_properties: Dict[str, Any]) -> Dict[str, Any]:
        """
        Merge new properties with existing properties.
        Existing keys not in the update are preserved.
        
        Args:
            node: The curriculum node to update
            new_properties: New properties to merge
            
        Returns:
            The merged properties dictionary
        """
        existing = node.properties or {}
        merged = {**existing, **new_properties}
        node.properties = merged
        return merged

    def get_required_properties(self, node_type: str) -> list:
        """
        Get required properties for a node type.
        Configured in Django settings.
        """
        required_props = getattr(settings, 'CURRICULUM_NODE_REQUIRED_PROPERTIES', {})
        return required_props.get(node_type, [])

    def validate_required_properties(self, node: CurriculumNode) -> bool:
        """
        Validate that a node has all required properties for its type.
        
        Raises:
            ValidationError: If required properties are missing
        """
        from django.core.exceptions import ValidationError
        
        required = self.get_required_properties(node.node_type)
        properties = node.properties or {}
        
        missing = [prop for prop in required if prop not in properties]
        
        if missing:
            raise ValidationError(
                f"Missing required properties for {node.node_type}: {missing}"
            )
        
        return True
