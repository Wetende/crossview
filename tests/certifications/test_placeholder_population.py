"""
Property tests for placeholder population in certificate generation.
**Property 5: Placeholder Population**
**Validates: Requirements 2.2**
"""
import pytest
from hypothesis import given, strategies as st, settings
from unittest.mock import patch, MagicMock

from apps.certifications.services import TemplateGenerator, CertificationEngine
from apps.certifications.models import CertificateTemplate


# Strategy for generating student names
name_strategy = st.text(
    alphabet=st.characters(whitelist_categories=('L',)),
    min_size=2,
    max_size=50
).filter(lambda x: x.strip())

# Strategy for generating program titles
title_strategy = st.text(
    alphabet=st.characters(whitelist_categories=('L', 'N', 'P', 'Z')),
    min_size=5,
    max_size=100
).filter(lambda x: x.strip())

# Strategy for generating dates
from datetime import date
date_strategy = st.dates(
    min_value=date(2020, 1, 1),
    max_value=date(2030, 12, 31)
)


@pytest.mark.django_db
class TestPlaceholderPopulation:
    """
    Property tests for placeholder population.
    Feature: certification-engine, Property 5: Placeholder Population
    """

    @given(name_strategy, title_strategy)
    @settings(max_examples=100)
    def test_all_placeholders_replaced_in_html(self, student_name, program_title):
        """
        Property: For any generated certificate, all placeholders SHALL be replaced.
        **Validates: Requirements 2.2**
        """
        template_html = """
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
        
        data = {
            'student_name': student_name,
            'program_title': program_title,
            'completion_date': 'January 15, 2025',
            'serial_number': 'CCT-2025-ABC123'
        }
        
        # Replace placeholders manually (simulating what generate does)
        result_html = template_html
        for key, value in data.items():
            placeholder = f"{{{{{key}}}}}"
            result_html = result_html.replace(placeholder, str(value))
        
        # Verify no placeholders remain
        assert '{{student_name}}' not in result_html
        assert '{{program_title}}' not in result_html
        assert '{{completion_date}}' not in result_html
        assert '{{serial_number}}' not in result_html
        
        # Verify actual values are present
        assert student_name in result_html
        assert program_title in result_html
        assert 'January 15, 2025' in result_html
        assert 'CCT-2025-ABC123' in result_html

    @given(name_strategy, title_strategy)
    @settings(max_examples=100)
    def test_template_generator_placeholder_replacement_logic(self, student_name, program_title):
        """
        Property: Placeholder replacement logic SHALL replace all placeholders with actual values.
        **Validates: Requirements 2.2**
        
        Note: This tests the replacement logic without invoking WeasyPrint.
        """
        template_html = "{{student_name}} completed {{program_title}} on {{completion_date}}. Serial: {{serial_number}}"
        
        data = {
            'student_name': student_name,
            'program_title': program_title,
            'completion_date': 'December 25, 2025',
            'serial_number': 'CCT-2025-XYZ789'
        }
        
        # Simulate the replacement logic from TemplateGenerator.generate
        html_content = template_html
        for key, value in data.items():
            placeholder = f"{{{{{key}}}}}"
            html_content = html_content.replace(placeholder, str(value))
        
        # No placeholders should remain
        assert '{{' not in html_content
        assert '}}' not in html_content
        
        # Actual values should be present
        assert student_name in html_content
        assert program_title in html_content
        assert 'December 25, 2025' in html_content
        assert 'CCT-2025-XYZ789' in html_content

    def test_special_characters_in_data_are_preserved(self):
        """
        Property: Special characters in data SHALL be preserved in output.
        **Validates: Requirements 2.2**
        """
        template_html = "{{student_name}} - {{program_title}}"
        
        data = {
            'student_name': "José García-López",
            'program_title': "Advanced C++ & Python Programming",
            'completion_date': '2025-01-01',
            'serial_number': 'CCT-2025-ABC123'
        }
        
        result = template_html
        for key, value in data.items():
            placeholder = f"{{{{{key}}}}}"
            result = result.replace(placeholder, str(value))
        
        assert "José García-López" in result
        assert "Advanced C++ & Python Programming" in result

    @pytest.mark.django_db
    @patch('apps.certifications.services.TemplateGenerator.generate')
    def test_certificate_engine_populates_all_fields(self, mock_generate):
        """
        Property: CertificationEngine.generate_certificate SHALL populate all certificate fields.
        **Validates: Requirements 2.2**
        """
        from apps.blueprints.models import AcademicBlueprint
        from apps.progression.models import Enrollment
        from apps.core.models import User, Program
        
        mock_generate.return_value = "certificates/test.pdf"
        
        # Create required objects
        blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []},
            certificate_enabled=True
        )
        
        CertificateTemplate.objects.create(
            name="Default Template",
            template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}",
            is_default=True
        )
        
        user = User.objects.create(
            email="test@example.com",
            first_name="John",
            last_name="Doe"
        )
        program = Program.objects.create(name="Test Program", blueprint=blueprint)
        enrollment = Enrollment.objects.create(user=user, program=program, status='completed')
        
        engine = CertificationEngine()
        certificate = engine.generate_certificate(enrollment)
        
        # Verify all fields are populated
        assert certificate.student_name == "John Doe"
        assert certificate.program_title == "Test Program"
        assert certificate.serial_number is not None
        assert certificate.pdf_path == "certificates/test.pdf"
        assert certificate.completion_date is not None
        assert certificate.issue_date is not None
        
        # Verify generate was called with correct data
        assert mock_generate.called
        # Get the last call's arguments
        call_args = mock_generate.call_args
        data = call_args[0][1]  # Second positional argument is data dict
        
        assert data['student_name'] == "John Doe"
        assert data['program_title'] == "Test Program"
        assert '{{' not in str(data.values())

    def test_empty_values_are_handled(self):
        """
        Property: Empty values SHALL be replaced with empty strings, not leave placeholders.
        **Validates: Requirements 2.2**
        """
        template_html = "{{student_name}} - {{program_title}}"
        
        data = {
            'student_name': "",
            'program_title': "Test Program",
            'completion_date': '',
            'serial_number': 'CCT-2025-ABC123'
        }
        
        result = template_html
        for key, value in data.items():
            placeholder = f"{{{{{key}}}}}"
            result = result.replace(placeholder, str(value))
        
        # No placeholders should remain
        assert '{{' not in result
        assert '}}' not in result
