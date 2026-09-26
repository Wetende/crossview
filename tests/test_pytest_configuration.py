import os
from importlib import import_module

from django.contrib.auth.hashers import get_hasher


def test_tests_hash_passwords_with_a_fast_hasher():
    """Django's real hasher is deliberately slow; test accounts are throwaway."""
    assert get_hasher().algorithm == "md5"


def test_project_settings_keep_djangos_secure_default_hasher():
    project_settings = import_module(os.environ["DJANGO_SETTINGS_MODULE"])

    assert not hasattr(project_settings, "PASSWORD_HASHERS")
