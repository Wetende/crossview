"""
Practicum exceptions.
"""
from typing import List


class InvalidFileException(Exception):
    """Raised when file validation fails."""
    
    def __init__(self, errors: List[str]):
        self.errors = errors
        super().__init__(f"File validation failed: {', '.join(errors)}")


class InvalidReviewException(Exception):
    """Raised when review data is invalid."""
    pass
