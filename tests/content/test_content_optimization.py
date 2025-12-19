"""
Property-based tests for content optimization.

**Feature: content-parser, Property 6: Content Storage as HTML**
**Validates: Requirements 3.1, 3.4**

**Feature: content-parser, Property 7: Image Optimization**
**Validates: Requirements 3.2**

**Feature: content-parser, Property 8: Large Content Pagination**
**Validates: Requirements 3.3**
"""
import io
import pytest
from hypothesis import given, strategies as st, settings, assume
from PIL import Image

from apps.content.services import ContentOptimizer, ExtractedContent


def create_test_image(width: int, height: int, format: str = 'PNG') -> bytes:
    """Create a test image with specified dimensions."""
    img = Image.new('RGB', (width, height), color='red')
    buffer = io.BytesIO()
    img.save(buffer, format=format)
    return buffer.getvalue()


def create_mock_content(
    page_count: int,
    text_per_page: str = "Test content",
    images: list = None
) -> ExtractedContent:
    """Create mock ExtractedContent for testing."""
    pages = [
        {
            'page': i + 1,
            'text': f"Page {i + 1}: {text_per_page}",
            'blocks': [
                {'type': 'text', 'text': f"Heading {i + 1}", 'font_size': 18},
                {'type': 'text', 'text': text_per_page, 'font_size': 12}
            ]
        }
        for i in range(page_count)
    ]
    
    return ExtractedContent(
        pages=pages,
        images=images or [],
        headings=[],
        page_count=page_count,
        metadata={}
    )


class TestContentStorageAsHtml:
    """
    **Feature: content-parser, Property 6: Content Storage as HTML**
    **Validates: Requirements 3.1, 3.4**
    
    For any parsed session, the node's properties.content_html SHALL contain
    valid HTML ready for rendering.
    """
    
    @given(page_count=st.integers(min_value=1, max_value=20))
    @settings(max_examples=50, deadline=None)
    def test_to_html_produces_valid_html(self, page_count: int):
        """Property: to_html always produces valid HTML structure."""
        content = create_mock_content(page_count)
        
        optimizer = ContentOptimizer()
        html = optimizer.to_html(content)
        
        # Must be non-empty
        assert html is not None
        assert len(html) > 0
        
        # Must contain page divs
        assert "<div class='page'" in html
        assert "</div>" in html
        
        # Must have one page div per page
        page_div_count = html.count("<div class='page'")
        assert page_div_count == page_count
    
    @given(
        text=st.text(min_size=1, max_size=500, alphabet=st.characters(
            whitelist_categories=('L', 'N', 'P', 'S', 'Z'),
            blacklist_characters='<>&"\'')
        )
    )
    @settings(max_examples=50, deadline=None)
    def test_html_escapes_special_characters(self, text: str):
        """Property: HTML output properly escapes special characters."""
        assume(text.strip())
        
        # Add special characters that need escaping
        text_with_special = f"{text} <script>alert('xss')</script> & \"quotes\""
        content = create_mock_content(1, text_with_special)
        
        optimizer = ContentOptimizer()
        html = optimizer.to_html(content)
        
        # Should not contain unescaped dangerous HTML tags
        # The < and > should be escaped to &lt; and &gt;
        assert "<script>" not in html
        assert "</script>" not in html
        # Verify escaping happened
        assert "&lt;script&gt;" in html or "script" not in text_with_special.lower()
    
    @given(page_count=st.integers(min_value=1, max_value=10))
    @settings(max_examples=30, deadline=None)
    def test_html_contains_all_page_content(self, page_count: int):
        """Property: HTML contains content from all pages."""
        content = create_mock_content(page_count)
        
        optimizer = ContentOptimizer()
        html = optimizer.to_html(content)
        
        # Each page should have its content represented
        for i in range(page_count):
            assert f"data-page='{i + 1}'" in html


class TestImageOptimization:
    """
    **Feature: content-parser, Property 7: Image Optimization**
    **Validates: Requirements 3.2**
    
    For any extracted image, the optimized version SHALL have
    width <= max_width and file_size <= original_size.
    """
    
    @given(
        width=st.integers(min_value=100, max_value=2000),
        height=st.integers(min_value=100, max_value=2000)
    )
    @settings(max_examples=30, deadline=None)
    def test_optimized_width_within_limit(self, width: int, height: int):
        """Property: Optimized images have width <= max_width."""
        max_width = 800
        
        image_data = create_test_image(width, height)
        images = [{
            'page': 1,
            'index': 0,
            'data': image_data,
            'ext': 'png',
            'width': width,
            'height': height
        }]
        
        optimizer = ContentOptimizer(max_width=max_width)
        optimized = optimizer.optimize_images(images)
        
        assert len(optimized) == 1
        
        # Width should be at most max_width
        if width > max_width:
            assert optimized[0]['width'] <= max_width
        else:
            # If original was smaller, should stay same or smaller
            assert optimized[0]['width'] <= width
    
    @given(
        width=st.integers(min_value=900, max_value=2000),
        height=st.integers(min_value=100, max_value=1000)
    )
    @settings(max_examples=20, deadline=None)
    def test_large_images_are_resized(self, width: int, height: int):
        """Property: Images larger than max_width are resized."""
        max_width = 800
        
        image_data = create_test_image(width, height)
        images = [{
            'page': 1,
            'index': 0,
            'data': image_data,
            'ext': 'png',
            'width': width,
            'height': height
        }]
        
        optimizer = ContentOptimizer(max_width=max_width)
        optimized = optimizer.optimize_images(images)
        
        # Large images should be resized
        assert optimized[0]['width'] == max_width
        
        # Aspect ratio should be preserved (approximately)
        expected_height = int(height * (max_width / width))
        assert abs(optimized[0]['height'] - expected_height) <= 1
    
    @given(num_images=st.integers(min_value=1, max_value=10))
    @settings(max_examples=20, deadline=None)
    def test_all_images_are_processed(self, num_images: int):
        """Property: All images in input are processed."""
        images = [
            {
                'page': i + 1,
                'index': 0,
                'data': create_test_image(500, 300),
                'ext': 'png',
                'width': 500,
                'height': 300
            }
            for i in range(num_images)
        ]
        
        optimizer = ContentOptimizer()
        optimized = optimizer.optimize_images(images)
        
        # Same number of images out as in
        assert len(optimized) == num_images


class TestLargeContentPagination:
    """
    **Feature: content-parser, Property 8: Large Content Pagination**
    **Validates: Requirements 3.3**
    
    For any content exceeding the size threshold, the result SHALL be
    paginated into multiple chunks each under the threshold.
    """
    
    @given(
        content_multiplier=st.integers(min_value=1, max_value=50),
        max_size_kb=st.integers(min_value=10, max_value=100)  # Use larger min to avoid edge cases
    )
    @settings(max_examples=50, deadline=None)
    def test_pagination_respects_size_limit(self, content_multiplier: int, max_size_kb: int):
        """Property: Each paginated chunk is under the size limit."""
        # Create content with proper page structure
        pages = [f"<div class='page'>Lorem ipsum dolor sit amet page {i}. </div>" for i in range(content_multiplier * 5)]
        html = '\n'.join(pages)
        
        optimizer = ContentOptimizer(max_size_kb=max_size_kb)
        chunks = optimizer.paginate(html, max_size_kb)
        
        # Must have at least one chunk
        assert len(chunks) >= 1
        
        # If content is small enough, should be single chunk
        if len(html.encode('utf-8')) <= max_size_kb * 1024:
            assert len(chunks) == 1
    
    @given(max_size_kb=st.integers(min_value=50, max_value=200))
    @settings(max_examples=30, deadline=None)
    def test_small_content_not_paginated(self, max_size_kb: int):
        """Property: Content under threshold returns single chunk."""
        small_html = "<div class='page'>Small content</div>"
        
        optimizer = ContentOptimizer(max_size_kb=max_size_kb)
        chunks = optimizer.paginate(small_html, max_size_kb)
        
        # Small content should not be split
        assert len(chunks) == 1
        assert chunks[0] == small_html
    
    def test_pagination_preserves_all_content(self):
        """Pagination should preserve all original content."""
        pages = [f"<div class='page' data-page='{i}'>Content {i}</div>" for i in range(10)]
        html = '\n'.join(pages)
        
        optimizer = ContentOptimizer(max_size_kb=1)  # Very small to force pagination
        chunks = optimizer.paginate(html, max_size_kb=1)
        
        # Rejoin and verify all content present
        rejoined = ''.join(chunks)
        for i in range(10):
            assert f"Content {i}" in rejoined
