"""
Property-based tests for ContentParserService.

**Feature: content-parser, Property 9: Edit Persistence with Modified Flag**
**Validates: Requirements 4.1, 4.2**

**Feature: content-parser, Property 10: Re-parse Warning for Edited Content**
**Validates: Requirements 4.3**
"""
import pytest
from hypothesis import given, strategies as st, settings, assume
from unittest.mock import MagicMock, patch, PropertyMock

from apps.content.services import ContentParserService, ExtractedContent
from apps.content.exceptions import ManuallyEditedWarning


def create_mock_session():
    """Create a mock session node."""
    session = MagicMock()
    session.properties = {'content_html': '<p>Original content</p>'}
    session.parent = MagicMock()
    return session


def create_mock_version(is_manually_edited: bool = False):
    """Create a mock ContentVersion."""
    version = MagicMock()
    version.is_manually_edited = is_manually_edited
    version.node = MagicMock()
    version.source_file_path = '/path/to/test.pdf'
    version.source_file_name = 'test.pdf'
    return version


class TestEditPersistenceWithModifiedFlag:
    """
    **Feature: content-parser, Property 9: Edit Persistence with Modified Flag**
    **Validates: Requirements 4.1, 4.2**
    
    For any edited session, the content SHALL be saved and marked as manually modified.
    """
    
    @given(new_html=st.text(min_size=1, max_size=1000, alphabet=st.characters(whitelist_categories=('L', 'N', 'P', 'S'))))
    @settings(max_examples=50, deadline=None)
    def test_edit_content_saves_new_html(self, new_html: str):
        """Property: edit_content saves the new HTML content."""
        assume(new_html.strip())
        
        session = create_mock_session()
        
        with patch('apps.content.services.ContentVersion') as MockVersion:
            MockVersion.objects.filter.return_value.update.return_value = 1
            
            service = ContentParserService()
            result = service.edit_content(session, new_html)
        
        # Content should be updated
        assert session.properties['content_html'] == new_html
        session.save.assert_called()
    
    @given(new_html=st.text(min_size=1, max_size=500))
    @settings(max_examples=30, deadline=None)
    def test_edit_content_marks_version_as_edited(self, new_html: str):
        """Property: edit_content marks the content version as manually edited."""
        assume(new_html.strip())
        
        session = create_mock_session()
        mock_queryset = MagicMock()
        
        with patch('apps.content.services.ContentVersion') as MockVersion:
            MockVersion.objects.filter.return_value = mock_queryset
            
            service = ContentParserService()
            service.edit_content(session, new_html)
        
        # Should update is_manually_edited flag
        mock_queryset.update.assert_called_with(is_manually_edited=True)


class TestReparseWarningForEditedContent:
    """
    **Feature: content-parser, Property 10: Re-parse Warning for Edited Content**
    **Validates: Requirements 4.3**
    
    For any manually edited content, re-parsing SHALL warn before overwriting.
    """
    
    def test_reparse_raises_warning_for_edited_content(self):
        """Property: re_parse raises ManuallyEditedWarning for edited content."""
        version = create_mock_version(is_manually_edited=True)
        
        service = ContentParserService()
        
        with pytest.raises(ManuallyEditedWarning):
            service.re_parse(version)
    
    def test_reparse_allows_force_override(self):
        """Property: re_parse with force=True bypasses the warning."""
        version = create_mock_version(is_manually_edited=True)
        version.node.children.filter.return_value.delete.return_value = None
        
        # Mock the parse_pdf method to avoid actual PDF processing
        with patch.object(ContentParserService, 'parse_pdf') as mock_parse:
            mock_parse.return_value = MagicMock()
            
            service = ContentParserService()
            # Should not raise with force=True
            result = service.re_parse(version, force=True)
            
            mock_parse.assert_called_once()
    
    @given(is_edited=st.booleans())
    @settings(max_examples=20, deadline=None)
    def test_reparse_behavior_depends_on_edited_flag(self, is_edited: bool):
        """Property: re_parse behavior depends on is_manually_edited flag."""
        version = create_mock_version(is_manually_edited=is_edited)
        version.node.children.filter.return_value.delete.return_value = None
        
        service = ContentParserService()
        
        if is_edited:
            # Should raise warning
            with pytest.raises(ManuallyEditedWarning):
                service.re_parse(version)
        else:
            # Should proceed (mock parse_pdf)
            with patch.object(ContentParserService, 'parse_pdf') as mock_parse:
                mock_parse.return_value = MagicMock()
                result = service.re_parse(version)
                mock_parse.assert_called_once()
