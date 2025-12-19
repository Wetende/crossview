"""
Property-based tests for content versioning.

**Feature: content-parser, Property 11: Version Creation and Retrieval**
**Validates: Requirements 5.1, 5.2**

**Feature: content-parser, Property 12: Version Publishing**
**Validates: Requirements 5.3**
"""
import pytest
from hypothesis import given, strategies as st, settings
from unittest.mock import MagicMock, patch
from django.utils import timezone

from apps.content.services import ContentParserService
from apps.content.models import ContentVersion


def create_mock_node():
    """Create a mock curriculum node."""
    node = MagicMock()
    node.id = 1
    return node


@pytest.mark.django_db
class TestVersionCreationAndRetrieval:
    """
    **Feature: content-parser, Property 11: Version Creation and Retrieval**
    **Validates: Requirements 5.1, 5.2**
    
    For any new PDF upload, a new version SHALL be created with incremented version number.
    All versions SHALL be retrievable for a node.
    """
    
    @given(existing_versions=st.integers(min_value=0, max_value=10))
    @settings(max_examples=30, deadline=None)
    def test_version_number_increments(self, existing_versions: int):
        """Property: New version number = existing count + 1."""
        node = create_mock_node()
        
        # Mock existing versions
        mock_queryset = MagicMock()
        mock_queryset.count.return_value = existing_versions
        
        with patch('apps.content.services.ContentVersion') as MockVersion:
            MockVersion.objects.filter.return_value = mock_queryset
            
            # Mock the create to capture the version number
            created_version = MagicMock()
            MockVersion.objects.create.return_value = created_version
            
            # Mock PDF extraction
            with patch('apps.content.services.PdfExtractor') as MockExtractor:
                mock_content = MagicMock()
                mock_content.page_count = 5
                mock_content.pages = []
                mock_content.images = []
                mock_content.metadata = {}
                MockExtractor.return_value.extract.return_value = mock_content
                
                with patch('apps.content.services.SessionGenerator') as MockGenerator:
                    MockGenerator.return_value.auto_generate_ranges.return_value = []
                    MockGenerator.return_value.generate.return_value = []
                    
                    service = ContentParserService()
                    service.parse_pdf(node, '/path/to/test.pdf', 'test.pdf')
            
            # Verify version number
            call_kwargs = MockVersion.objects.create.call_args[1]
            assert call_kwargs['version'] == existing_versions + 1
    
    def test_get_versions_returns_all_versions(self):
        """Property: get_versions returns all versions for a node."""
        node = create_mock_node()
        
        # Create mock versions
        mock_versions = [MagicMock(version=i) for i in range(1, 4)]
        mock_queryset = MagicMock()
        mock_queryset.order_by.return_value = mock_versions
        mock_queryset.__iter__ = lambda self: iter(mock_versions)
        
        with patch('apps.content.services.ContentVersion') as MockVersion:
            MockVersion.objects.filter.return_value = mock_queryset
            
            service = ContentParserService()
            versions = service.get_versions(node)
        
        # Should return all versions
        assert len(versions) == 3
    
    @given(num_versions=st.integers(min_value=1, max_value=10))
    @settings(max_examples=20, deadline=None)
    def test_versions_ordered_by_version_number(self, num_versions: int):
        """Property: Versions are returned ordered by version number."""
        node = create_mock_node()
        
        mock_versions = [MagicMock(version=i) for i in range(1, num_versions + 1)]
        mock_queryset = MagicMock()
        mock_queryset.order_by.return_value = mock_versions
        
        with patch('apps.content.services.ContentVersion') as MockVersion:
            MockVersion.objects.filter.return_value = mock_queryset
            
            service = ContentParserService()
            versions = service.get_versions(node)
        
        # Verify order_by was called with 'version'
        mock_queryset.order_by.assert_called_with('version')


@pytest.mark.django_db
class TestVersionPublishing:
    """
    **Feature: content-parser, Property 12: Version Publishing**
    **Validates: Requirements 5.3**
    
    For any published version, it SHALL become the active version for students,
    and other versions SHALL be unpublished.
    """
    
    def test_publish_version_sets_is_published(self):
        """Property: publish_version sets is_published=True."""
        version = MagicMock()
        version.is_published = False
        version.node = create_mock_node()
        
        mock_queryset = MagicMock()
        
        with patch('apps.content.services.ContentVersion') as MockVersion:
            MockVersion.objects.filter.return_value = mock_queryset
            
            service = ContentParserService()
            result = service.publish_version(version)
        
        # Version should be published
        assert version.is_published is True
        version.save.assert_called()
    
    def test_publish_version_unpublishes_others(self):
        """Property: Publishing a version unpublishes all other versions for the node."""
        version = MagicMock()
        version.is_published = False
        version.node = create_mock_node()
        
        mock_queryset = MagicMock()
        
        with patch('apps.content.services.ContentVersion') as MockVersion:
            MockVersion.objects.filter.return_value = mock_queryset
            
            service = ContentParserService()
            service.publish_version(version)
        
        # Should unpublish other versions first
        mock_queryset.update.assert_called_with(is_published=False)
    
    def test_publish_version_sets_published_at(self):
        """Property: publish_version sets published_at timestamp."""
        version = MagicMock()
        version.is_published = False
        version.published_at = None
        version.node = create_mock_node()
        
        mock_queryset = MagicMock()
        
        with patch('apps.content.services.ContentVersion') as MockVersion:
            MockVersion.objects.filter.return_value = mock_queryset
            
            with patch('apps.content.services.timezone') as mock_timezone:
                mock_now = timezone.now()
                mock_timezone.now.return_value = mock_now
                
                service = ContentParserService()
                service.publish_version(version)
        
        # published_at should be set
        assert version.published_at is not None
    
    @given(num_versions=st.integers(min_value=2, max_value=5))
    @settings(max_examples=20, deadline=None)
    def test_only_one_version_published_at_a_time(self, num_versions: int):
        """Property: Only one version can be published at a time."""
        node = create_mock_node()
        
        # Create mock versions
        versions = [MagicMock(version=i, is_published=False, node=node) for i in range(1, num_versions + 1)]
        
        mock_queryset = MagicMock()
        
        with patch('apps.content.services.ContentVersion') as MockVersion:
            MockVersion.objects.filter.return_value = mock_queryset
            
            service = ContentParserService()
            
            # Publish each version in sequence
            for version in versions:
                service.publish_version(version)
                
                # Each publish should unpublish others
                mock_queryset.update.assert_called_with(is_published=False)
