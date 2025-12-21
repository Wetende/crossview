"""Core views."""

from inertia import render


def home(request):
    """Home page - redirects to dashboard or login."""
    return render(
        request,
        "Dashboard",
        props={
            "stats": {
                "programs": 0,
                "students": 0,
                "certificates": 0,
                "completionRate": 0,
            }
        },
    )


def dashboard(request):
    """Dashboard page."""
    return render(
        request,
        "Dashboard",
        props={
            "stats": {
                "programs": 12,
                "students": 156,
                "certificates": 45,
                "completionRate": 78,
            }
        },
    )


def login_page(request):
    """Login page."""
    return render(request, "Auth/Login", props={})
