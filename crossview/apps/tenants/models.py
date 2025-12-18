"""
Tenant models - Multi-tenancy support.
"""
from django.db import models


class Tenant(models.Model):
    """Tenant model for multi-tenancy."""
    name = models.CharField(max_length=255)
    subdomain = models.CharField(max_length=100, unique=True)
    admin_email = models.EmailField()
    is_active = models.BooleanField(default=True)
    settings = models.JSONField(blank=True, null=True)
    activated_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tenants'
        indexes = [
            models.Index(fields=['subdomain']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name
