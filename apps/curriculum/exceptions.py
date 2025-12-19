"""
Curriculum exceptions.
"""
from django.core.exceptions import ValidationError


class InvalidNodeTypeException(ValidationError):
    """Raised when a node type is not valid for the blueprint."""
    pass


class MaxDepthExceededException(ValidationError):
    """Raised when node depth exceeds blueprint hierarchy depth."""
    pass
