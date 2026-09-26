"""Pytest configuration for the LMS project."""
import os
import django
import pytest

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')


def pytest_configure(config):
    """Hash test passwords quickly; production keeps Django's slow, secure default."""
    from django.conf import settings

    settings.PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']


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
