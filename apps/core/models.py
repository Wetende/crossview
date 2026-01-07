"""
Core models - Custom User model and base classes.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom User model for LMS."""
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.email or self.username


class Program(models.Model):
    """
    Program model - represents an academic program/course.
    Links to AcademicBlueprint for structure configuration.
    """
    blueprint = models.ForeignKey(
        'blueprints.AcademicBlueprint',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='programs'
    )
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'programs'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['is_published']),
        ]

    def __str__(self):
        return self.name
