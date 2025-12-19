"""
Property tests for template placeholder validation.
**Property 2: Template Placeholder Validation**
**Validates: Requirements 1.2, 1.3**
"""
import pytest
from hypothesis import given, strategies as st, settings

from apps.certifications.services import TemplateGenerator, TemplateValidationError
from apps.certifications.models import CertificateTemplate


# Strategy for generating HTML content with optional placeholders
def html_with_placeholders(include_placeholders: list) -> st.SearchStrategy:
    """Generate HTML content with specified placeholders."""
    base_html = "<html><body><h1>Certificate</h1>"
    for p in include_placeholders:
        base_html += f"<p>{p}</p>"
    base_html += "</body></html>"
    return st.just(base_html)


# Strategy for random HTML without required placeholders
random_html_without_placeholders = st.text(
    alphabet=st.characters(whitelist_categories=('L', 'N', 'P', 'S', 'Z')),
    min_size=10,
    max_size=500
).filter(lambda x: '{{' not in x)


class TestTemplateValidation:
    """
    Property tests for template placeholder validation.
    Feature: certification-engine, Property 2: Template Placeholder Validation
    """

    @given(random_html_without_placeholders)
    @settings(max_examples=100)
    def test_template_missing_all_placeholders_is_invalid(self, html_content):
        """
        Property: For any template missing required placeholders, validation SHALL fail.
        **Validates: Requirements 1.2, 1.3**
        """
        generator = TemplateGenerator()
        result = generator.validate_template(html_content)
        
        assert result['valid'] is False
        assert len(result['missing']) == 4
        assert '{{student_name}}' in result['missing']
        assert '{{program_title}}' in result['missing']
        assert '{{completion_date}}' in result['missing']
        assert '{{serial_number}}' in result['missing']

    def test_template_with_all_placeholders_is_valid(self):
        """
        Property: For any template with all required placeholders, validation SHALL pass.
        **Validates: Requirements 1.2, 1.3**
        """
        generator = TemplateGenerator()
        valid_html = """
        <html>
        <body>
            <h1>Certificate of Completion</h1>
            <p>This certifies that {{student_name}}</p>
            <p>has completed {{program_title}}</p>
            <p>on {{completion_date}}</p>
            <p>Serial: {{serial_number}}</p>
        </body>
        </html>
        """
        result = generator.validate_template(valid_html)
        
        assert result['valid'] is True
        assert result['missing'] == []

    @given(st.sampled_from([
        ['{{student_name}}'],
        ['{{program_title}}'],
        ['{{completion_date}}'],
        ['{{serial_number}}'],
        ['{{student_name}}', '{{program_title}}'],
        ['{{student_name}}', '{{completion_date}}', '{{serial_number}}'],
    ]))
    @settings(max_examples=100)
    def test_template_with_partial_placeholders_is_invalid(self, included_placeholders):
        """
        Property: For any template missing at least one required placeholder, validation SHALL fail.
        **Validates: Requirements 1.2, 1.3**
        """
        generator = TemplateGenerator()
        all_placeholders = ['{{student_name}}', '{{program_title}}', '{{completion_date}}', '{{serial_number}}']
        
        html_content = "<html><body>"
        for p in included_placeholders:
            html_content += f"<p>{p}</p>"
        html_content += "</body></html>"
        
        result = generator.validate_template(html_content)
        
        # Should be invalid if not all placeholders are present
        if set(included_placeholders) != set(all_placeholders):
            assert result['valid'] is False
            expected_missing = set(all_placeholders) - set(included_placeholders)
            assert set(result['missing']) == expected_missing

    def test_model_has_required_placeholders_method(self):
        """
        Test that CertificateTemplate model has_required_placeholders method works.
        **Validates: Requirements 1.2, 1.3**
        """
        # Template with all placeholders
        valid_template = CertificateTemplate(
            name="Valid Template",
            template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}"
        )
        assert valid_template.has_required_placeholders() is True
        
        # Template missing placeholders
        invalid_template = CertificateTemplate(
            name="Invalid Template",
            template_html="<html><body>No placeholders</body></html>"
        )
        assert invalid_template.has_required_placeholders() is False
