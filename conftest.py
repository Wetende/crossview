"""
Pytest configuration for Crossview LMS.
"""
import os
import django
import pytest

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')


@pytest.fixture
def valid_hierarchy_structure():
    """Return a valid hierarchy structure for testing."""
    return ["Year", "Unit", "Session"]


@pytest.fixture
def valid_grading_logic():
    """Return valid grading logic for testing."""
    return {
        "type": "weighted",
        "components": [
            {"name": "assignments", "weight": 40},
            {"name": "exams", "weight": 60}
        ]
    }
