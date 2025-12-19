"""
Content Parser Exceptions.
"""


class ContentParserException(Exception):
    """Base exception for content parser errors."""
    pass


class ManuallyEditedWarning(ContentParserException):
    """Raised when attempting to re-parse manually edited content."""
    pass


class PdfExtractionError(ContentParserException):
    """Raised when PDF extraction fails."""
    pass


class InvalidPageRangeError(ContentParserException):
    """Raised when page range is invalid."""
    pass
