"""
Assessment Engine exceptions.
"""


class AssessmentEngineException(Exception):
    """Base exception for Assessment Engine."""
    pass


class InvalidGradingTypeException(AssessmentEngineException):
    """Thrown when grading_logic type is not recognized."""
    pass


class InvalidGradingConfigException(AssessmentEngineException):
    """Thrown when grading_logic is missing required fields."""
    pass
