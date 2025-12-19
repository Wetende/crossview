"""
Property tests for serial number uniqueness and format.
**Property 6: Serial Number Uniqueness and Format**
**Validates: Requirements 3.1, 3.2, 3.3**
"""
import re
import pytest
from hypothesis import given, strategies as st, settings, assume

from apps.certifications.services import SerialNumberGenerator
from apps.certifications.models import Certificate


# Strategy for generating valid prefixes
prefix_strategy = st.text(
    alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    min_size=2,
    max_size=5
)


@pytest.mark.django_db
class TestSerialNumberUniquenessAndFormat:
    """
    Property tests for serial number generation.
    Feature: certification-engine, Property 6: Serial Number Uniqueness and Format
    """

    @given(prefix_strategy)
    @settings(max_examples=100)
    def test_serial_number_format_matches_pattern(self, prefix):
        """
        Property: For any generated serial number, it SHALL match PREFIX-YEAR-XXXXXX format.
        **Validates: Requirements 3.1, 3.3**
        """
        generator = SerialNumberGenerator()
        serial = generator.generate(prefix=prefix)
        
        # Pattern: PREFIX-YEAR-XXXXXX (6 alphanumeric chars)
        pattern = rf'^{prefix}-\d{{4}}-[A-Z0-9]{{6}}$'
        assert re.match(pattern, serial), f"Serial {serial} doesn't match expected format"

    @given(st.integers(min_value=1, max_value=50))
    @settings(max_examples=100)
    def test_multiple_serial_numbers_are_unique(self, count):
        """
        Property: For any number of generated serial numbers, all SHALL be unique.
        **Validates: Requirements 3.2**
        """
        generator = SerialNumberGenerator()
        serials = [generator.generate() for _ in range(count)]
        
        # All serials should be unique
        assert len(serials) == len(set(serials)), "Generated serial numbers are not unique"

    def test_serial_number_contains_current_year(self):
        """
        Property: Generated serial numbers SHALL contain the current year.
        **Validates: Requirements 3.3**
        """
        from datetime import datetime
        
        generator = SerialNumberGenerator()
        serial = generator.generate()
        current_year = str(datetime.now().year)
        
        assert current_year in serial, f"Serial {serial} doesn't contain year {current_year}"

    @given(prefix_strategy)
    @settings(max_examples=100)
    def test_parse_extracts_correct_components(self, prefix):
        """
        Property: For any generated serial number, parse SHALL extract correct components.
        **Validates: Requirements 3.3**
        """
        from datetime import datetime
        
        generator = SerialNumberGenerator()
        serial = generator.generate(prefix=prefix)
        
        parsed = generator.parse(serial)
        
        assert parsed['prefix'] == prefix
        assert parsed['year'] == datetime.now().year
        assert len(parsed['code']) == 6
        assert parsed['code'].isalnum()

    def test_default_prefix_is_cct(self):
        """
        Property: Default prefix SHALL be 'CCT'.
        **Validates: Requirements 3.3**
        """
        generator = SerialNumberGenerator()
        serial = generator.generate()
        
        assert serial.startswith('CCT-')

    def test_is_unique_returns_true_for_new_serial(self):
        """
        Property: is_unique SHALL return True for non-existing serial numbers.
        **Validates: Requirements 3.2**
        """
        generator = SerialNumberGenerator()
        serial = generator.generate()
        
        # Before saving to DB, should be unique
        assert generator.is_unique(serial) is True

    def test_is_unique_returns_false_for_existing_serial(self):
        """
        Property: is_unique SHALL return False for existing serial numbers.
        **Validates: Requirements 3.2**
        """
        from apps.certifications.models import CertificateTemplate
        from apps.progression.models import Enrollment
        from apps.core.models import User, Program
        from apps.blueprints.models import AcademicBlueprint
        
        # Create required objects
        blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []}
        )
        template = CertificateTemplate.objects.create(
            name="Test Template",
            template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}",
            is_default=True
        )
        user = User.objects.create(email="test@example.com")
        program = Program.objects.create(name="Test Program", blueprint=blueprint)
        enrollment = Enrollment.objects.create(user=user, program=program)
        
        # Create a certificate with a specific serial
        serial = "CCT-2025-ABC123"
        Certificate.objects.create(
            enrollment=enrollment,
            template=template,
            serial_number=serial,
            student_name="Test User",
            program_title="Test Program",
            completion_date="2025-01-01",
            issue_date="2025-01-01",
            pdf_path="test.pdf"
        )
        
        generator = SerialNumberGenerator()
        
        # Should return False for existing serial
        assert generator.is_unique(serial) is False
        
        # Should return True for new serial
        assert generator.is_unique("CCT-2025-XYZ789") is True

    @given(st.text(min_size=1, max_size=20))
    @settings(max_examples=100)
    def test_validate_format_rejects_invalid_serials(self, invalid_serial):
        """
        Property: validate_format SHALL reject invalid serial number formats.
        **Validates: Requirements 3.1, 3.3**
        """
        # Skip if accidentally generates valid format
        assume(not re.match(r'^[A-Z]{2,5}-\d{4}-[A-Z0-9]{6}$', invalid_serial))
        
        generator = SerialNumberGenerator()
        assert generator.validate_format(invalid_serial) is False

    def test_validate_format_accepts_valid_serials(self):
        """
        Property: validate_format SHALL accept valid serial number formats.
        **Validates: Requirements 3.1, 3.3**
        """
        generator = SerialNumberGenerator()
        
        valid_serials = [
            "CCT-2025-ABC123",
            "XY-2024-123ABC",
            "ABCDE-2030-ZZZZZ0",
        ]
        
        for serial in valid_serials:
            assert generator.validate_format(serial) is True, f"{serial} should be valid"

    def test_parse_raises_for_invalid_format(self):
        """
        Property: parse SHALL raise ValueError for invalid serial formats.
        **Validates: Requirements 3.3**
        """
        generator = SerialNumberGenerator()
        
        with pytest.raises(ValueError):
            generator.parse("invalid-serial")
        
        with pytest.raises(ValueError):
            generator.parse("CCT2025ABC123")  # Missing dashes
