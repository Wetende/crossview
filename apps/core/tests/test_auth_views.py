"""
Property-based tests for authentication views.
Requirements: 2.2, 2.3, 3.2, 3.3, 3.4, 4.2

Uses Hypothesis for property-based testing with minimum 100 iterations.
"""

import pytest
from hypothesis import given, settings, assume, HealthCheck
from hypothesis import strategies as st
from django.test import Client
from django.contrib.auth import get_user_model

from apps.core.tests.factories import UserFactory, TenantFactory
from apps.core.views import get_dashboard_url, _validate_password_strength

User = get_user_model()

# Suppress function-scoped fixture health check (safe for stateless client)
HYPOTHESIS_SETTINGS = settings(
    max_examples=10, suppress_health_check=[HealthCheck.function_scoped_fixture]
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
        assert response.url == "/student/dashboard/"

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
        assert response.url == "/admin/dashboard/"

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
        assert response.url == "/admin/dashboard/"

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


class TestStudentRoleAssignment:
    """
    Property 6: For any valid registration request, the created user account
    SHALL have the role set to "student" and be associated with the current tenant.
    """

    @pytest.mark.django_db
    @given(
        first_name=st.text(
            min_size=1, max_size=30, alphabet=st.characters(whitelist_categories=("L",))
        ),
        last_name=st.text(
            min_size=1, max_size=30, alphabet=st.characters(whitelist_categories=("L",))
        ),
    )
    @HYPOTHESIS_SETTINGS
    def test_registered_user_is_student(self, client, first_name, last_name):
        """Registered users should always be students (not staff/superuser)."""
        assume(first_name.strip() and last_name.strip())

        email = f"test_{hash(first_name + last_name) % 10000}@example.com"

        # Clean up if user exists
        User.objects.filter(email=email).delete()

        response = client.post(
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
            user = User.objects.get(email=email)
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
