#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

# Default port for runserver
DEFAULT_PORT = "8001"


def main():
    """Run administrative tasks."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc

    # Auto-set port 8001 for runserver if no port specified
    if len(sys.argv) == 2 and sys.argv[1] == "runserver":
        sys.argv.append(DEFAULT_PORT)

    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
