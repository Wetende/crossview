"""
Property-based tests for PDF extraction.

**Feature: content-parser, Property 1: PDF Extraction Completeness**
**Validates: Requirements 1.1, 1.2, 1.3**

**Feature: content-parser, Property 2: Processing Report Accuracy**
**Validates: Requirements 1.4**
"""
import io
import tempfile
import pytest
from hypothesis import given, strategies as st, settings, assume, HealthCheck
import fitz  # PyMuPDF

from apps.content.services import PdfExtractor, ExtractedContent


def create_test_pdf(num_pages: int, text_per_page: str = "Test content") -> bytes:
    """Create a simple test PDF with specified number of pages."""
    doc = fitz.open()
    
    for i in range(num_pages):
        page = doc.new_page()
        page.insert_text((72, 72), f"Page {i + 1}: {text_per_page}")
    
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def create_pdf_with_headings(headings: list[str]) -> bytes:
    """Create a test PDF with headings on different pages."""
    doc = fitz.open()
    
    for i, heading in enumerate(headings):
        page = doc.new_page()
        # Insert heading with larger font
        page.insert_text((72, 72), heading, fontsize=18)
        page.insert_text((72, 120), f"Content for section {i + 1}", fontsize=12)
    
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


class TestPdfExtractionCompleteness:
    """
    **Feature: content-parser, Property 1: PDF Extraction Completeness**
    **Validates: Requirements 1.1, 1.2, 1.3**
    
    For any PDF with N pages, extraction SHALL return content from all N pages.
    """
    
    @given(num_pages=st.integers(min_value=1, max_value=20))
    @settings(max_examples=50, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_extracts_all_pages(self, num_pages: int):
        """Property: Extraction returns content from all N pages."""
        # Create test PDF
        pdf_bytes = create_test_pdf(num_pages)
        
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
            f.write(pdf_bytes)
            pdf_path = f.name
        
        try:
            # Extract
            extractor = PdfExtractor()
            content = extractor.extract(pdf_path)
            
            # Verify all pages extracted
            assert content.page_count == num_pages
            assert len(content.pages) == num_pages
            
            # Verify each page has content
            for i, page in enumerate(content.pages):
                assert page['page'] == i + 1
                assert 'text' in page
                assert len(page['text']) > 0
        finally:
            import os
            os.unlink(pdf_path)
    
    @given(
        num_pages=st.integers(min_value=2, max_value=10),
        start_offset=st.integers(min_value=0, max_value=5),
        range_size=st.integers(min_value=1, max_value=5)
    )
    @settings(max_examples=50, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_extract_pages_returns_correct_range(
        self, num_pages: int, start_offset: int, range_size: int
    ):
        """Property: extract_pages returns exactly the requested page range."""
        # Ensure valid range
        assume(start_offset < num_pages)
        start_page = start_offset + 1
        end_page = min(start_page + range_size - 1, num_pages)
        expected_count = end_page - start_page + 1
        
        # Create test PDF
        pdf_bytes = create_test_pdf(num_pages)
        
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
            f.write(pdf_bytes)
            pdf_path = f.name
        
        try:
            # Extract range
            extractor = PdfExtractor()
            content = extractor.extract_pages(pdf_path, start_page, end_page)
            
            # Verify correct number of pages
            assert content.page_count == expected_count
            assert len(content.pages) == expected_count
            
            # Verify page numbers are correct
            for i, page in enumerate(content.pages):
                assert page['page'] == start_page + i
        finally:
            import os
            os.unlink(pdf_path)


class TestProcessingReportAccuracy:
    """
    **Feature: content-parser, Property 2: Processing Report Accuracy**
    **Validates: Requirements 1.4**
    
    For any parsed PDF, the report SHALL contain the correct page_count.
    """
    
    @given(num_pages=st.integers(min_value=1, max_value=20))
    @settings(max_examples=50, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_page_count_matches_actual_pages(self, num_pages: int):
        """Property: page_count in result matches actual PDF pages."""
        # Create test PDF
        pdf_bytes = create_test_pdf(num_pages)
        
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
            f.write(pdf_bytes)
            pdf_path = f.name
        
        try:
            # Extract
            extractor = PdfExtractor()
            content = extractor.extract(pdf_path)
            
            # Verify page count accuracy
            assert content.page_count == num_pages
            
            # Verify metadata exists
            assert isinstance(content.metadata, dict)
        finally:
            import os
            os.unlink(pdf_path)


class TestSectionDetection:
    """Tests for section/chapter detection."""
    
    def test_detect_sections_with_no_headings(self):
        """When no headings, returns single section spanning all pages."""
        pdf_bytes = create_test_pdf(5)
        
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
            f.write(pdf_bytes)
            pdf_path = f.name
        
        try:
            extractor = PdfExtractor()
            content = extractor.extract(pdf_path)
            sections = extractor.detect_sections(content)
            
            # Should return at least one section
            assert len(sections) >= 1
            assert sections[0]['start'] == 1
            assert sections[0]['end'] == content.page_count
        finally:
            import os
            os.unlink(pdf_path)
    
    @given(num_headings=st.integers(min_value=1, max_value=5))
    @settings(max_examples=20, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_detect_sections_with_headings(self, num_headings: int):
        """Property: Section detection creates sections based on headings."""
        headings = [f"Chapter {i + 1}" for i in range(num_headings)]
        pdf_bytes = create_pdf_with_headings(headings)
        
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
            f.write(pdf_bytes)
            pdf_path = f.name
        
        try:
            extractor = PdfExtractor()
            content = extractor.extract(pdf_path)
            sections = extractor.detect_sections(content)
            
            # Should have at least one section
            assert len(sections) >= 1
            
            # First section should start at page 1
            assert sections[0]['start'] == 1
            
            # Last section should end at last page
            assert sections[-1]['end'] == content.page_count
        finally:
            import os
            os.unlink(pdf_path)
