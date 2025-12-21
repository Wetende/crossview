"""
Custom authentication backends for Crossview LMS.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

User = get_user_model()


class EmailBackend(ModelBackend):
    """
    Custom authentication backend that allows login with email.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Authenticate user by email address.

        Args:
            request: The HTTP request
            username: The email address (named username for compatibility)
            password: The password

        Returns:
            User instance if authentication succeeds, None otherwise
        """
        email = username or kwargs.get("email")

        if email is None or password is None:
            return None

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # Run the default password hasher to prevent timing attacks
            User().set_password(password)
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user

        return None

    def get_user(self, user_id):
        """Get user by ID."""
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
