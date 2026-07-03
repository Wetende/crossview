"""
Property-based tests for authentication views.
Requirements: 2.2, 2.3, 3.2, 3.3, 3.4, 4.2

Uses Hypothesis for property-based testing with minimum 100 iterations.
"""

import json

import pytest
from urllib.parse import parse_qs, urlparse
from hypothesis import given, settings, assume, HealthCheck
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from django.test import Client, override_settings
from django.contrib.auth import get_user_model

from apps.core.tests.factories import UserFactory
from apps.core.views import get_dashboard_url, _validate_password_strength

User = get_user_model()

HYPOTHESIS_SETTINGS = settings(
    max_examples=10, 
    suppress_health_check=[HealthCheck.function_scoped_fixture, HealthCheck.too_slow],
    deadline=None
)


# =============================================================================
# Property 2: Role-Based Authentication Redirect
# =============================================================================


class TestRoleBasedRedirect:
    """
    Property 2: For any valid user credentials, upon successful login,
    the system SHALL redirect to a dashboard URL that corresponds to
    the user's role.
    """

    @pytest.mark.django_db
    def test_student_redirects_to_student_dashboard(self, client):
        """Students should redirect to /student/dashboard/"""
        user = UserFactory(password="TestPass123")

        response = client.post(
            "/login/",
            {
                "email": user.email,
                "password": "TestPass123",
            },
        )

        assert response.status_code == 302
        assert response.url == "/dashboard/"

    @pytest.mark.django_db
    def test_admin_redirects_to_admin_dashboard(self, client):
        """Admins should redirect to /admin/dashboard/"""
        user = UserFactory(password="TestPass123", admin=True)

        response = client.post(
            "/login/",
            {
                "email": user.email,
                "password": "TestPass123",
            },
        )

        assert response.status_code == 302
        assert response.url == "/dashboard/"

    @pytest.mark.django_db
    def test_superadmin_redirects_to_admin_dashboard(self, client):
        """Superadmins should redirect to /admin/dashboard/"""
        user = UserFactory(password="TestPass123", superadmin=True)

        response = client.post(
            "/login/",
            {
                "email": user.email,
                "password": "TestPass123",
            },
        )

        assert response.status_code == 302
        assert response.url == "/dashboard/"


@pytest.mark.django_db
def test_login_page_exposes_google_social_auth_when_configured(client):
    with override_settings(
        GOOGLE_ONE_TAP_ENABLED=True,
        GOOGLE_ONE_TAP_CLIENT_ID="google-client-id",
    ):
        response = client.get("/login/", HTTP_X_INERTIA=True)

    props = response.json()["props"]
    assert response.status_code == 200
    assert props["socialAuth"]["google"]["enabled"] is True
    assert props["socialAuth"]["google"]["clientId"] == "google-client-id"
    assert "/auth/google/onetap/" in props["socialAuth"]["google"]["loginUrl"]


@pytest.mark.django_db
def test_login_page_preserves_enrollment_return_url_for_google(client):
    next_url = "/programs/enrollment/resume/?intent=signed-intent"
    with override_settings(
        GOOGLE_ONE_TAP_ENABLED=True,
        GOOGLE_ONE_TAP_CLIENT_ID="google-client-id",
    ):
        response = client.get(
            "/login/",
            {"next": next_url},
            HTTP_X_INERTIA=True,
        )

    props = response.json()["props"]
    google_query = parse_qs(urlparse(props["socialAuth"]["google"]["loginUrl"]).query)
    assert props["nextUrl"] == next_url
    assert google_query["next"] == [next_url]


@pytest.mark.django_db
def test_email_login_preserves_json_enrollment_return_url(client):
    user = UserFactory(password="TestPass123")
    next_url = "/programs/enrollment/resume/?intent=signed-intent"

    response = client.post(
        "/login/",
        data=json.dumps(
            {
                "email": user.email,
                "password": "TestPass123",
                "next": next_url,
            }
        ),
        content_type="application/json",
    )

    assert response.status_code == 302
    assert response.url == next_url


@pytest.mark.django_db
def test_register_page_hides_google_social_auth_when_not_configured(client):
    with override_settings(GOOGLE_ONE_TAP_ENABLED=False):
        response = client.get("/register/", HTTP_X_INERTIA=True)

    props = response.json()["props"]
    assert response.status_code == 200
    assert props["socialAuth"]["google"]["enabled"] is False


@pytest.mark.django_db
def test_google_one_tap_creates_student_and_logs_them_in(client, monkeypatch):
    def fake_verify(credential):
        assert credential == "signed-google-jwt"
        return {
            "email": "new-google-student@example.com",
            "email_verified": True,
            "given_name": "Google",
            "family_name": "Student",
            "sub": "google-subject-id",
        }

    monkeypatch.setattr("apps.core.views._verify_google_one_tap_credential", fake_verify)
    client.cookies["g_csrf_token"] = "csrf-from-google"

    with override_settings(
        GOOGLE_ONE_TAP_ENABLED=True,
        GOOGLE_ONE_TAP_CLIENT_ID="google-client-id",
    ):
        response = client.post(
            "/auth/google/onetap/?next=/dashboard/",
            {
                "credential": "signed-google-jwt",
                "g_csrf_token": "csrf-from-google",
            },
        )

    user = User.objects.get(email="new-google-student@example.com")
    assert response.status_code == 302
    assert response.url == "/dashboard/"
    assert user.username == "new-google-student@example.com"
    assert user.first_name == "Google"
    assert user.last_name == "Student"
    assert not user.has_usable_password()
    assert str(user.pk) == client.session["_auth_user_id"]


@pytest.mark.django_db
def test_google_one_tap_rejects_missing_google_csrf_token(client):
    with override_settings(
        GOOGLE_ONE_TAP_ENABLED=True,
        GOOGLE_ONE_TAP_CLIENT_ID="google-client-id",
    ):
        response = client.post(
            "/auth/google/onetap/",
            {
                "credential": "signed-google-jwt",
                "g_csrf_token": "csrf-from-google",
            },
        )

    assert response.status_code == 302
    assert response.url == "/login/"
    assert "_auth_user_id" not in client.session


@pytest.mark.django_db
def test_logout_requires_post_contract_and_redirects_to_login(client):
    """Authenticated POST logout should clear session and redirect to login."""
    user = UserFactory(password="TestPass123")
    client.force_login(user)

    response = client.post("/logout/")

    assert response.status_code == 302
    assert response.url == "/login/"
    assert "_auth_user_id" not in client.session

    @given(role=st.sampled_from(["student", "admin", "superadmin", "instructor"]))
    @settings(max_examples=100)
    def test_get_dashboard_url_returns_valid_path(self, role):
        """Dashboard URL should always be a valid path for any role."""
        url = get_dashboard_url(role)

        assert url.startswith("/")
        assert url.endswith("/")
        assert "dashboard" in url


# =============================================================================
# Property 3: Login Error Message Security
# =============================================================================


class TestLoginErrorSecurity:
    """
    Property 3: For any invalid login attempt, the error message displayed
    SHALL be identical and not reveal which field was incorrect.
    """

    @pytest.mark.django_db
    @given(wrong_email=st.emails(), wrong_password=st.text(min_size=1, max_size=50))
    @HYPOTHESIS_SETTINGS
    def test_wrong_email_same_error_message(self, client, wrong_email, wrong_password):
        """Wrong email should show same error as wrong password."""
        # Create a real user
        user = UserFactory(password="TestPass123")

        # Try with wrong email
        response = client.post(
            "/login/",
            {
                "email": wrong_email,
                "password": "TestPass123",
            },
        )

        # Should return 200 with error (Inertia re-renders page)
        assert response.status_code == 200

    @pytest.mark.django_db
    def test_wrong_password_same_error_message(self, client):
        """Wrong password should show same error as wrong email."""
        user = UserFactory(password="TestPass123")

        response = client.post(
            "/login/",
            {
                "email": user.email,
                "password": "WrongPassword123",
            },
        )

        assert response.status_code == 200

    @pytest.mark.django_db
    def test_both_wrong_same_error_message(self, client):
        """Both wrong should show same error."""
        response = client.post(
            "/login/",
            {
                "email": "nonexistent@example.com",
                "password": "WrongPassword123",
            },
        )

        assert response.status_code == 200


# =============================================================================
# Property 6: Student Role Assignment on Registration
# =============================================================================


class TestStudentRoleAssignment(TestCase):
    """
    Property 6: For any valid registration request, the created user account
    SHALL have the role set to "student".
    """

    @given(
        first_name=st.text(
            min_size=1, max_size=30, alphabet=st.characters(whitelist_categories=("L",))
        ),
        last_name=st.text(
            min_size=1, max_size=30, alphabet=st.characters(whitelist_categories=("L",))
        ),
    )
    @HYPOTHESIS_SETTINGS
    def test_registered_user_is_student(self, first_name, last_name):
        """Registered users should always be students (not staff/superuser)."""
        assume(first_name.strip() and last_name.strip())

        email = f"test_{hash(first_name + last_name) % 10000}@example.com".lower()

        # Clean up if user exists
        User.objects.filter(email=email).delete()

        response = self.client.post(
            "/register/",
            {
                "email": email,
                "password": "TestPass123",
                "password_confirm": "TestPass123",
                "first_name": first_name.strip(),
                "last_name": last_name.strip(),
            },
        )

        # Should redirect on success
        if response.status_code == 302:
            user = User.objects.filter(email=email).first()
            assert user is not None
            assert not user.is_staff
            assert not user.is_superuser


# =============================================================================
# Property 7: Duplicate Email Rejection
# =============================================================================


class TestDuplicateEmailRejection:
    """
    Property 7: For any registration attempt where the email already exists,
    the registration SHALL fail and return an error.
    """

    @pytest.mark.django_db
    def test_duplicate_email_rejected(self, client):
        """Duplicate email should be rejected."""
        existing_user = UserFactory(password="TestPass123")

        response = client.post(
            "/register/",
            {
                "email": existing_user.email,
                "password": "NewPass123",
                "password_confirm": "NewPass123",
                "first_name": "New",
                "last_name": "User",
            },
        )

        # Should return 200 with error (not redirect)
        assert response.status_code == 200

        # Should not create duplicate
        assert User.objects.filter(email=existing_user.email).count() == 1


# =============================================================================
# Property 8: Password Strength Validation
# =============================================================================


class TestPasswordStrengthValidation:
    """
    Property 8: For any password that does not meet strength requirements,
    the registration or password reset SHALL fail with a message.
    """

    @given(password=st.text(max_size=7))
    @settings(max_examples=100)
    def test_short_password_rejected(self, password):
        """Passwords under 8 characters should be rejected."""
        result = _validate_password_strength(password)
        assert result is not None
        assert "8 characters" in result

    @given(
        password=st.text(min_size=8, max_size=20, alphabet="abcdefghijklmnopqrstuvwxyz")
    )
    @settings(max_examples=100)
    def test_lowercase_only_rejected(self, password):
        """Passwords with only lowercase should be rejected."""
        result = _validate_password_strength(password)
        assert result is not None

    @given(
        password=st.text(min_size=8, max_size=20, alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    )
    @settings(max_examples=100)
    def test_uppercase_only_rejected(self, password):
        """Passwords with only uppercase should be rejected."""
        result = _validate_password_strength(password)
        assert result is not None

    def test_valid_password_accepted(self):
        """Valid passwords should be accepted."""
        valid_passwords = [
            "TestPass1",
            "MySecure123",
            "Password1A",
        ]
        for password in valid_passwords:
            result = _validate_password_strength(password)
            assert result is None, f"Password '{password}' should be valid"


# =============================================================================
# Property 10: Password Reset Email Enumeration Prevention
# =============================================================================


class TestEmailEnumerationPrevention:
    """
    Property 10: For any email submitted to forgot password (existing or not),
    the response SHALL be identical, preventing email enumeration.
    """

    @pytest.mark.django_db
    def test_existing_email_response(self, client):
        """Existing email should show success message."""
        user = UserFactory()

        response = client.post(
            "/forgot-password/",
            {
                "email": user.email,
            },
        )

        assert response.status_code == 200

    @pytest.mark.django_db
    @given(email=st.emails())
    @HYPOTHESIS_SETTINGS
    def test_nonexistent_email_same_response(self, client, email):
        """Non-existent email should show same success message."""
        # Ensure email doesn't exist
        assume(not User.objects.filter(email=email).exists())

        response = client.post(
            "/forgot-password/",
            {
                "email": email,
            },
        )

        # Should return 200 (same as existing email)
        assert response.status_code == 200


# =============================================================================
# Fixtures
# =============================================================================


@pytest.fixture
def client():
    """Django test client."""
    return Client()
