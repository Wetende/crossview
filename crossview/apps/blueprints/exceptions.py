"""
Blueprint exceptions.
"""


class BlueprintException(Exception):
    """Base exception for Blueprint Engine."""
    pass


class InvalidHierarchyStructureException(BlueprintException):
    """Thrown when hierarchy_structure is empty or contains non-string values."""
    pass


class InvalidGradingLogicException(BlueprintException):
    """Thrown when grading_logic is missing required fields for its type."""
    pass


class InvalidBlueprintJsonException(BlueprintException):
    """Thrown when JSON deserialization fails."""
    pass


class BlueprintInUseException(BlueprintException):
    """Thrown when attempting to delete a blueprint with associated programs."""
    pass
