"""
Content Parser Services - PDF extraction, session generation, and content optimization.
"""
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
import io
import re

import fitz  # PyMuPDF
from PIL import Image
from django.utils import timezone

from apps.content.models import ContentVersion, ParsedImage
from apps.curriculum.models import CurriculumNode


@dataclass
class ExtractedContent:
    """Data class representing content extracted from a PDF."""
    pages: List[Dict[str, Any]] = field(default_factory=list)
    images: List[Dict[str, Any]] = field(default_factory=list)
    headings: List[str] = field(default_factory=list)
    page_count: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)


class PdfExtractor:
    """
    Extracts text and images from PDF documents using PyMuPDF.
    """
    
    def extract(self, pdf_path: str) -> ExtractedContent:
        """
        Extract all content from a PDF file.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            ExtractedContent with pages, images, headings, and metadata
        """
        doc = fitz.open(pdf_path)
        pages = []
        images = []
        headings = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            pages.append({
                'page': page_num + 1,
                'text': text,
                'blocks': self._extract_blocks(page)
            })
            
            # Extract images from page
            for img_index, img in enumerate(page.get_images(full=True)):
                xref = img[0]
                try:
                    base_image = doc.extract_image(xref)
                    images.append({
                        'page': page_num + 1,
                        'index': img_index,
                        'data': base_image['image'],
                        'ext': base_image['ext'],
                        'width': base_image.get('width', 0),
                        'height': base_image.get('height', 0)
                    })
                except Exception:
                    # Skip images that can't be extracted
                    pass
            
            # Extract headings from text blocks
            page_headings = self._extract_headings(page)
            headings.extend(page_headings)
        
        metadata = {
            'title': doc.metadata.get('title', ''),
            'author': doc.metadata.get('author', ''),
            'subject': doc.metadata.get('subject', ''),
            'creator': doc.metadata.get('creator', ''),
        }
        
        doc.close()
        
        return ExtractedContent(
            pages=pages,
            images=images,
            headings=headings,
            page_count=len(pages),
            metadata=metadata
        )
    
    def extract_pages(self, pdf_path: str, start_page: int, end_page: int) -> ExtractedContent:
        """
        Extract content from a specific page range.
        
        Args:
            pdf_path: Path to the PDF file
            start_page: Starting page number (1-indexed)
            end_page: Ending page number (inclusive)
            
        Returns:
            ExtractedContent for the specified page range
        """
        doc = fitz.open(pdf_path)
        pages = []
        images = []
        headings = []
        
        # Adjust for 0-indexed pages
        start_idx = max(0, start_page - 1)
        end_idx = min(end_page, len(doc))
        
        for page_num in range(start_idx, end_idx):
            page = doc[page_num]
            text = page.get_text()
            pages.append({
                'page': page_num + 1,
                'text': text,
                'blocks': self._extract_blocks(page)
            })
            
            # Extract images
            for img_index, img in enumerate(page.get_images(full=True)):
                xref = img[0]
                try:
                    base_image = doc.extract_image(xref)
                    images.append({
                        'page': page_num + 1,
                        'index': img_index,
                        'data': base_image['image'],
                        'ext': base_image['ext'],
                        'width': base_image.get('width', 0),
                        'height': base_image.get('height', 0)
                    })
                except Exception:
                    pass
            
            page_headings = self._extract_headings(page)
            headings.extend(page_headings)
        
        doc.close()
        
        return ExtractedContent(
            pages=pages,
            images=images,
            headings=headings,
            page_count=len(pages),
            metadata={}
        )
    
    def detect_sections(self, content: ExtractedContent) -> List[Dict[str, Any]]:
        """
        Detect chapter/section boundaries based on headings.
        
        Args:
            content: Previously extracted content
            
        Returns:
            List of section dictionaries with start/end pages and titles
        """
        sections = []
        
        if not content.headings:
            # No headings detected, return single section
            return [{
                'start': 1,
                'end': content.page_count,
                'title': None
            }]
        
        # Group headings by page and create sections
        current_section = None
        for i, heading in enumerate(content.headings):
            if current_section is None:
                current_section = {
                    'start': 1,
                    'title': heading,
                    'end': content.page_count
                }
            else:
                # Find the page for this heading
                heading_page = self._find_heading_page(content, heading)
                if heading_page and heading_page > current_section['start']:
                    current_section['end'] = heading_page - 1
                    sections.append(current_section)
                    current_section = {
                        'start': heading_page,
                        'title': heading,
                        'end': content.page_count
                    }
        
        if current_section:
            sections.append(current_section)
        
        return sections if sections else [{'start': 1, 'end': content.page_count, 'title': None}]
    
    def _extract_blocks(self, page) -> List[Dict[str, Any]]:
        """Extract text blocks with formatting info from a page."""
        blocks = []
        for block in page.get_text("dict")["blocks"]:
            if block.get("type") == 0:  # Text block
                block_text = ""
                max_size = 0
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        block_text += span.get("text", "")
                        max_size = max(max_size, span.get("size", 0))
                    block_text += "\n"
                blocks.append({
                    'type': 'text',
                    'text': block_text.strip(),
                    'font_size': max_size
                })
        return blocks
    
    def _extract_headings(self, page) -> List[str]:
        """Extract potential headings based on font size."""
        headings = []
        blocks = page.get_text("dict")["blocks"]
        
        # Calculate average font size
        all_sizes = []
        for block in blocks:
            if block.get("type") == 0:
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        all_sizes.append(span.get("size", 0))
        
        if not all_sizes:
            return headings
        
        avg_size = sum(all_sizes) / len(all_sizes)
        heading_threshold = avg_size * 1.2  # 20% larger than average
        
        for block in blocks:
            if block.get("type") == 0:
                for line in block.get("lines", []):
                    line_text = ""
                    is_heading = False
                    for span in line.get("spans", []):
                        line_text += span.get("text", "")
                        if span.get("size", 0) >= heading_threshold:
                            is_heading = True
                    
                    line_text = line_text.strip()
                    if is_heading and line_text and len(line_text) < 200:
                        headings.append(line_text)
        
        return headings
    
    def _find_heading_page(self, content: ExtractedContent, heading: str) -> Optional[int]:
        """Find which page contains a specific heading."""
        for page in content.pages:
            if heading in page.get('text', ''):
                return page['page']
        return None


class SessionGenerator:
    """
    Generates session nodes from extracted PDF content.
    """
    
    def generate(
        self,
        parent: CurriculumNode,
        content: ExtractedContent,
        page_ranges: List[Dict[str, Any]]
    ) -> List[CurriculumNode]:
        """
        Create session nodes from content based on page ranges.
        
        Args:
            parent: Parent curriculum node (typically a Unit)
            content: Extracted PDF content
            page_ranges: List of dicts with 'start', 'end', and optional 'title'
            
        Returns:
            List of created session nodes
        """
        sessions = []
        
        for i, range_info in enumerate(page_ranges):
            title = range_info.get('title') or self.generate_title(content, range_info, i + 1)
            
            # Extract content for this page range
            start_page = range_info.get('start', 1)
            end_page = range_info.get('end', content.page_count)
            
            session_content = self._extract_range_content(content, start_page, end_page)
            
            session = CurriculumNode.objects.create(
                program=parent.program,
                parent=parent,
                node_type='Session',
                title=title,
                position=i,
                properties={
                    'page_range': {
                        'start': start_page,
                        'end': end_page
                    },
                    'content_html': '',  # Will be set by optimizer
                }
            )
            session._session_content = session_content  # Temporary storage for optimization
            sessions.append(session)
        
        return sessions
    
    def auto_generate_ranges(self, content: ExtractedContent) -> List[Dict[str, Any]]:
        """
        Auto-detect page ranges based on content structure.
        
        Args:
            content: Extracted PDF content
            
        Returns:
            List of page range dictionaries
        """
        if not content.headings:
            # No headings detected, create single session
            return [{
                'start': 1,
                'end': content.page_count,
                'title': None
            }]
        
        # Use detected sections as ranges
        extractor = PdfExtractor()
        sections = extractor.detect_sections(content)
        
        return sections if sections else [{
            'start': 1,
            'end': content.page_count,
            'title': None
        }]
    
    def generate_title(
        self,
        content: ExtractedContent,
        range_info: Dict[str, Any],
        session_number: int
    ) -> str:
        """
        Generate a title for a session.
        
        Args:
            content: Extracted PDF content
            range_info: Page range information
            session_number: Sequential session number
            
        Returns:
            Generated title string
        """
        # Try to get title from range info
        if range_info.get('title'):
            return range_info['title']
        
        # Try to find first heading in the page range
        start_page = range_info.get('start', 1)
        end_page = range_info.get('end', content.page_count)
        
        for page in content.pages:
            if start_page <= page['page'] <= end_page:
                # Look for headings in this page's blocks
                for block in page.get('blocks', []):
                    if block.get('font_size', 0) > 12:  # Likely a heading
                        text = block.get('text', '').strip()
                        if text and len(text) < 100:
                            return text
        
        # Fallback to session number
        return f"Session {session_number}"
    
    def _extract_range_content(
        self,
        content: ExtractedContent,
        start_page: int,
        end_page: int
    ) -> ExtractedContent:
        """Extract content for a specific page range."""
        pages = [p for p in content.pages if start_page <= p['page'] <= end_page]
        images = [i for i in content.images if start_page <= i['page'] <= end_page]
        
        return ExtractedContent(
            pages=pages,
            images=images,
            headings=[],
            page_count=len(pages),
            metadata={}
        )


class ContentOptimizer:
    """
    Optimizes content for mobile delivery.
    """
    
    DEFAULT_MAX_WIDTH = 800
    DEFAULT_MAX_SIZE_KB = 100
    DEFAULT_IMAGE_QUALITY = 85
    
    def __init__(
        self,
        max_width: int = DEFAULT_MAX_WIDTH,
        max_size_kb: int = DEFAULT_MAX_SIZE_KB,
        image_quality: int = DEFAULT_IMAGE_QUALITY
    ):
        self.max_width = max_width
        self.max_size_kb = max_size_kb
        self.image_quality = image_quality
    
    def optimize(self, content: ExtractedContent) -> ExtractedContent:
        """
        Optimize content for mobile delivery.
        
        Args:
            content: Extracted content to optimize
            
        Returns:
            Optimized ExtractedContent
        """
        optimized_images = self.optimize_images(content.images)
        
        return ExtractedContent(
            pages=content.pages,
            images=optimized_images,
            headings=content.headings,
            page_count=content.page_count,
            metadata=content.metadata
        )
    
    def optimize_images(self, images: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Compress and resize images for mobile.
        
        Args:
            images: List of image dictionaries with 'data' bytes
            
        Returns:
            List of optimized image dictionaries
        """
        optimized = []
        
        for img_data in images:
            if 'data' not in img_data:
                optimized.append(img_data)
                continue
            
            try:
                img = Image.open(io.BytesIO(img_data['data']))
                original_size = len(img_data['data'])
                
                # Resize if too wide
                if img.width > self.max_width:
                    ratio = self.max_width / img.width
                    new_height = int(img.height * ratio)
                    img = img.resize((self.max_width, new_height), Image.Resampling.LANCZOS)
                
                # Convert to RGB if necessary (for JPEG)
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                
                # Compress
                output = io.BytesIO()
                img.save(output, format='JPEG', quality=self.image_quality, optimize=True)
                optimized_data = output.getvalue()
                
                optimized.append({
                    'page': img_data['page'],
                    'index': img_data.get('index', 0),
                    'data': optimized_data,
                    'ext': 'jpeg',
                    'width': img.width,
                    'height': img.height,
                    'original_size': original_size,
                    'optimized_size': len(optimized_data)
                })
            except Exception:
                # Keep original if optimization fails
                optimized.append(img_data)
        
        return optimized
    
    def to_html(self, content: ExtractedContent) -> str:
        """
        Convert extracted content to HTML.
        
        Args:
            content: Extracted content
            
        Returns:
            HTML string ready for rendering
        """
        html_parts = []
        
        for page in content.pages:
            page_html = f"<div class='page' data-page='{page['page']}'>"
            
            # Process blocks if available
            blocks = page.get('blocks', [])
            if blocks:
                for block in blocks:
                    text = block.get('text', '').strip()
                    if not text:
                        continue
                    
                    font_size = block.get('font_size', 12)
                    
                    # Determine element type based on font size
                    if font_size >= 18:
                        page_html += f"<h2>{self._escape_html(text)}</h2>"
                    elif font_size >= 14:
                        page_html += f"<h3>{self._escape_html(text)}</h3>"
                    else:
                        # Convert newlines to paragraphs
                        paragraphs = text.split('\n\n')
                        for para in paragraphs:
                            para = para.strip()
                            if para:
                                page_html += f"<p>{self._escape_html(para)}</p>"
            else:
                # Fallback to raw text
                text = page.get('text', '').strip()
                if text:
                    paragraphs = text.split('\n\n')
                    for para in paragraphs:
                        para = para.strip()
                        if para:
                            page_html += f"<p>{self._escape_html(para)}</p>"
            
            page_html += "</div>"
            html_parts.append(page_html)
        
        return '\n'.join(html_parts)
    
    def paginate(self, html: str, max_size_kb: Optional[int] = None) -> List[str]:
        """
        Split large HTML content into smaller chunks.
        
        Args:
            html: HTML content to paginate
            max_size_kb: Maximum size per chunk in KB
            
        Returns:
            List of HTML chunks
        """
        max_bytes = (max_size_kb or self.max_size_kb) * 1024
        
        if len(html.encode('utf-8')) <= max_bytes:
            return [html]
        
        chunks = []
        current_chunk = ""
        
        # Split by page divs
        page_pattern = r"(<div class='page'[^>]*>.*?</div>)"
        pages = re.split(page_pattern, html, flags=re.DOTALL)
        
        for part in pages:
            if not part.strip():
                continue
            
            part_size = len(part.encode('utf-8'))
            current_size = len(current_chunk.encode('utf-8'))
            
            if current_size + part_size > max_bytes and current_chunk:
                chunks.append(current_chunk)
                current_chunk = part
            else:
                current_chunk += part
        
        if current_chunk:
            chunks.append(current_chunk)
        
        return chunks if chunks else [html]
    
    def _escape_html(self, text: str) -> str:
        """Escape HTML special characters."""
        return (
            text
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;')
            .replace("'", '&#39;')
        )


class ContentParserService:
    """
    Main service orchestrating PDF parsing, session generation, and optimization.
    """
    
    def __init__(
        self,
        pdf_extractor: Optional[PdfExtractor] = None,
        session_generator: Optional[SessionGenerator] = None,
        optimizer: Optional[ContentOptimizer] = None
    ):
        self.pdf_extractor = pdf_extractor or PdfExtractor()
        self.session_generator = session_generator or SessionGenerator()
        self.optimizer = optimizer or ContentOptimizer()
    
    def parse_pdf(
        self,
        parent_node: CurriculumNode,
        pdf_path: str,
        pdf_name: str,
        page_ranges: Optional[List[Dict[str, Any]]] = None
    ) -> ContentVersion:
        """
        Parse a PDF and create session nodes.
        
        Args:
            parent_node: Parent curriculum node (typically a Unit)
            pdf_path: Path to the PDF file
            pdf_name: Original filename
            page_ranges: Optional list of page ranges for sessions
            
        Returns:
            Created ContentVersion record
        """
        from apps.content.exceptions import PdfExtractionError
        
        try:
            # Extract content from PDF
            content = self.pdf_extractor.extract(pdf_path)
        except Exception as e:
            raise PdfExtractionError(f"Failed to extract PDF: {str(e)}")
        
        # Auto-generate ranges if not provided
        if page_ranges is None:
            page_ranges = self.session_generator.auto_generate_ranges(content)
        
        # Determine version number
        existing_versions = ContentVersion.objects.filter(node=parent_node)
        next_version = existing_versions.count() + 1
        
        # Create content version record
        version = ContentVersion.objects.create(
            node=parent_node,
            version=next_version,
            source_file_path=pdf_path,
            source_file_name=pdf_name,
            page_count=content.page_count,
            parsed_at=timezone.now(),
            metadata=content.metadata
        )
        
        # Generate sessions
        sessions = self.session_generator.generate(parent_node, content, page_ranges)
        
        # Optimize and store content for each session
        for session in sessions:
            session_content = getattr(session, '_session_content', None)
            if session_content:
                optimized = self.optimizer.optimize(session_content)
                html_content = self.optimizer.to_html(optimized)
                
                # Paginate if needed
                chunks = self.optimizer.paginate(html_content)
                
                session.properties['content_html'] = chunks[0] if len(chunks) == 1 else chunks
                session.properties['is_paginated'] = len(chunks) > 1
                session.save(skip_validation=True)
                
                # Store images
                self._store_images(version, optimized.images)
        
        return version
    
    def edit_content(
        self,
        session: CurriculumNode,
        new_html: str
    ) -> CurriculumNode:
        """
        Edit session content and mark as manually modified.
        
        Args:
            session: Session node to edit
            new_html: New HTML content
            
        Returns:
            Updated session node
        """
        session.properties['content_html'] = new_html
        session.save(skip_validation=True)
        
        # Mark the content version as manually edited
        parent = session.parent
        if parent:
            versions = ContentVersion.objects.filter(node=parent, is_published=True)
            versions.update(is_manually_edited=True)
        
        return session
    
    def re_parse(
        self,
        version: ContentVersion,
        page_ranges: Optional[List[Dict[str, Any]]] = None,
        force: bool = False
    ) -> ContentVersion:
        """
        Re-parse content from an existing version.
        
        Args:
            version: Existing content version
            page_ranges: Optional new page ranges
            force: Force re-parse even if manually edited
            
        Returns:
            New ContentVersion or raises ManuallyEditedWarning
        """
        from apps.content.exceptions import ManuallyEditedWarning
        
        if version.is_manually_edited and not force:
            raise ManuallyEditedWarning(
                "Content has been manually edited. Use force=True to overwrite."
            )
        
        # Delete existing sessions
        version.node.children.filter(node_type='Session').delete()
        
        # Re-parse with same or new ranges
        return self.parse_pdf(
            version.node,
            version.source_file_path,
            version.source_file_name,
            page_ranges
        )
    
    def get_versions(self, node: CurriculumNode) -> List[ContentVersion]:
        """
        Get all content versions for a node.
        
        Args:
            node: Curriculum node
            
        Returns:
            List of ContentVersion records ordered by version
        """
        return list(ContentVersion.objects.filter(node=node).order_by('version'))
    
    def publish_version(self, version: ContentVersion) -> ContentVersion:
        """
        Publish a content version, making it active for students.
        
        Args:
            version: Version to publish
            
        Returns:
            Updated ContentVersion
        """
        # Unpublish other versions for this node
        ContentVersion.objects.filter(node=version.node).update(is_published=False)
        
        # Publish this version
        version.is_published = True
        version.published_at = timezone.now()
        version.save()
        
        return version
    
    def _store_images(
        self,
        version: ContentVersion,
        images: List[Dict[str, Any]]
    ) -> List[ParsedImage]:
        """Store extracted images in the database."""
        stored = []
        
        for img in images:
            # In a real implementation, we'd save the image to storage
            # and store the paths. For now, we just record metadata.
            parsed_image = ParsedImage.objects.create(
                content_version=version,
                original_path=f"content/{version.id}/original_{img['page']}_{img.get('index', 0)}.{img.get('ext', 'jpg')}",
                optimized_path=f"content/{version.id}/optimized_{img['page']}_{img.get('index', 0)}.jpeg",
                page_number=img['page'],
                width=img.get('width'),
                height=img.get('height'),
                file_size=img.get('optimized_size') or img.get('original_size')
            )
            stored.append(parsed_image)
        
        return stored
