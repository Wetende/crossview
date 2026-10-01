"""
Inertia validation-error contract.

A POST that rejects input must not render a page. It stores field errors with
``flash_inertia_errors`` and redirects to a GET route. ``InertiaShareMiddleware``
then shares them exactly once as ``page.props.errors``; a non-empty errors
object makes the Inertia client call the visit's ``onError`` instead of
``onSuccess``.
"""

INERTIA_ERRORS_SESSION_KEY = "_inertia_errors"


def flash_inertia_errors(request, errors: dict) -> None:
    """Store ``{field: message}`` errors for the next Inertia page render."""
    cleaned = {
        str(field): str(message) for field, message in (errors or {}).items() if message
    }
    if not cleaned:
        return
    existing = request.session.get(INERTIA_ERRORS_SESSION_KEY) or {}
    request.session[INERTIA_ERRORS_SESSION_KEY] = {**existing, **cleaned}


def pop_inertia_errors(request) -> dict:
    """Return and clear the errors flashed by the previous request."""
    session = getattr(request, "session", None)
    if session is None:
        return {}
    return session.pop(INERTIA_ERRORS_SESSION_KEY, None) or {}
