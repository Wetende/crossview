"""
Property-based tests for session generation.

**Feature: content-parser, Property 3: Session Generation from Ranges**
**Validates: Requirements 2.1, 2.4**

**Feature: content-parser, Property 4: Auto-Detection Creates Sessions**
**Validates: Requirements 2.2**

**Feature: content-parser, Property 5: Session Title Generation**
**Validates: Requirements 2.3**
"""
import pytest
from hypothesis import given, strategies as st, settings, assume
from unittest.mock import MagicMock, patch

from apps.content.services import SessionGenerator, ExtractedContent, PdfExtractor


# Strategies for generating test data
page_range_strategy = st.fixed_dictionaries({
    'start': st.integers(min_value=1, max_value=50),
    'end': st.integers(min_value=1, max_value=50),
    'title': st.one_of(st.none(), st.text(min_size=1, max_size=100, alphabet=st.characters(whitelist_categories=('L', 'N', 'P', 'S'))))
}).filter(lambda x: x['start'] <= x['end'])


def create_mock_content(page_count: int, headings: list[str] = None) -> ExtractedContent:
    """Create mock ExtractedContent for testing."""
    pages = [
        {
            'page': i + 1,
            'text': f"Content for page {i + 1}",
            'blocks': [{'type': 'text', 'text': f"Content for page {i + 1}", 'font_size': 12}]
        }
        for i in range(page_count)
    ]
    
    return ExtractedContent(
        pages=pages,
        images=[],
        headings=headings or [],
        page_count=page_count,
        metadata={}
    )


def create_mock_parent_node():
    """Create a mock parent node for session generation."""
    mock_program = MagicMock()
    mock_program.id = 1
    
    mock_parent = MagicMock()
    mock_parent.program = mock_program
    mock_parent.id = 1
    
    return mock_parent


@pytest.mark.django_db
class TestSessionGenerationFromRanges:
    """
    **Feature: content-parser, Property 3: Session Generation from Ranges**
    **Validates: Requirements 2.1, 2.4**
    
    For any set of N page ranges, exactly N session nodes SHALL be created
    with correct position ordering (0, 1, 2...).
    """
    
    @given(num_ranges=st.integers(min_value=1, max_value=10))
    @settings(max_examples=50, deadline=None)
    def test_creates_correct_number_of_sessions(self, num_ranges: int):
        """Property: N page ranges creates exactly N sessions."""
        # Create non-overlapping page ranges
        page_ranges = []
        current_start = 1
        for i in range(num_ranges):
            end = current_start + 5
            page_ranges.append({
                'start': current_start,
                'end': end,
                'title': f"Session {i + 1}"
            })
            current_start = end + 1
        
        total_pages = current_start - 1
        content = create_mock_content(total_pages)
        
        generator = SessionGenerator()
        
        # Mock CurriculumNode.objects.create
        created_sessions = []
        with patch('apps.content.services.CurriculumNode') as MockNode:
            def create_session(**kwargs):
                session = MagicMock()
                session.properties = kwargs.get('properties', {})
                session.position = kwargs.get('position', 0)
                session.title = kwargs.get('title', '')
                created_sessions.append(session)
                return session
            
            MockNode.objects.create.side_effect = create_session
            
            sessions = generator.generate(
                create_mock_parent_node(),
                content,
                page_ranges
            )
        
        # Verify correct number of sessions
        assert len(sessions) == num_ranges
    
    @given(num_ranges=st.integers(min_value=2, max_value=10))
    @settings(max_examples=50, deadline=None)
    def test_sessions_have_correct_position_ordering(self, num_ranges: int):
        """Property: Sessions have sequential position ordering (0, 1, 2...)."""
        page_ranges = [
            {'start': i * 5 + 1, 'end': (i + 1) * 5, 'title': None}
            for i in range(num_ranges)
        ]
        
        total_pages = num_ranges * 5
        content = create_mock_content(total_pages)
        
        generator = SessionGenerator()
        
        positions = []
        with patch('apps.content.services.CurriculumNode') as MockNode:
            def create_session(**kwargs):
                session = MagicMock()
                session.properties = kwargs.get('properties', {})
                session.position = kwargs.get('position', 0)
                positions.append(session.position)
                return session
            
            MockNode.objects.create.side_effect = create_session
            
            generator.generate(create_mock_parent_node(), content, page_ranges)
        
        # Verify sequential ordering
        assert positions == list(range(num_ranges))


class TestAutoDetectionCreatesSessions:
    """
    **Feature: content-parser, Property 4: Auto-Detection Creates Sessions**
    **Validates: Requirements 2.2**
    
    For any PDF parsed without page ranges, at least one session SHALL be created.
    """
    
    @given(page_count=st.integers(min_value=1, max_value=50))
    @settings(max_examples=50, deadline=None)
    def test_auto_generate_creates_at_least_one_range(self, page_count: int):
        """Property: Auto-generation always creates at least one range."""
        content = create_mock_content(page_count)
        
        generator = SessionGenerator()
        ranges = generator.auto_generate_ranges(content)
        
        # Must have at least one range
        assert len(ranges) >= 1
        
        # First range must start at page 1
        assert ranges[0]['start'] == 1
        
        # Last range must end at last page
        assert ranges[-1]['end'] == page_count
    
    @given(num_headings=st.integers(min_value=0, max_value=5))
    @settings(max_examples=30, deadline=None)
    def test_auto_generate_with_headings(self, num_headings: int):
        """Property: Auto-generation handles content with/without headings."""
        headings = [f"Chapter {i + 1}" for i in range(num_headings)]
        page_count = max(num_headings, 1) * 5
        content = create_mock_content(page_count, headings)
        
        generator = SessionGenerator()
        ranges = generator.auto_generate_ranges(content)
        
        # Must have at least one range
        assert len(ranges) >= 1
        
        # Ranges must cover all pages
        assert ranges[0]['start'] == 1
        assert ranges[-1]['end'] == page_count


class TestSessionTitleGeneration:
    """
    **Feature: content-parser, Property 5: Session Title Generation**
    **Validates: Requirements 2.3**
    
    For any created session, the title SHALL be non-empty.
    """
    
    @given(session_number=st.integers(min_value=1, max_value=100))
    @settings(max_examples=50, deadline=None)
    def test_generate_title_never_empty(self, session_number: int):
        """Property: Generated titles are never empty."""
        content = create_mock_content(10)
        range_info = {'start': 1, 'end': 5, 'title': None}
        
        generator = SessionGenerator()
        title = generator.generate_title(content, range_info, session_number)
        
        # Title must be non-empty
        assert title is not None
        assert len(title) > 0
    
    @given(custom_title=st.text(min_size=1, max_size=100, alphabet=st.characters(whitelist_categories=('L', 'N'))))
    @settings(max_examples=50, deadline=None)
    def test_uses_provided_title_when_available(self, custom_title: str):
        """Property: Uses provided title from range_info when available."""
        assume(custom_title.strip())  # Ensure non-whitespace
        
        content = create_mock_content(10)
        range_info = {'start': 1, 'end': 5, 'title': custom_title}
        
        generator = SessionGenerator()
        title = generator.generate_title(content, range_info, 1)
        
        # Should use the provided title
        assert title == custom_title
    
    def test_fallback_to_session_number(self):
        """When no title or heading available, falls back to 'Session N'."""
        content = create_mock_content(5)
        range_info = {'start': 1, 'end': 5, 'title': None}
        
        generator = SessionGenerator()
        title = generator.generate_title(content, range_info, 3)
        
        # Should contain session number
        assert "Session" in title or "3" in title
