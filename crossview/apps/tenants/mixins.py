"""
Tenant-aware model mixins for automatic tenant scoping.
Requirements: 2.1
"""
from django.db import models

from .context import TenantContext
from .managers import TenantManager, AllTenantsManager


class TenantAwareModel(models.Model):
    """
    Abstract base class for models that belong to a tenant.
    Automatically scopes queries and sets tenant_id on save.
    Requirements: 2.1
    """
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='%(class)s_set'
    )
    
    # Default manager scopes to current tenant
    objects = TenantManager()
    
    # Manager to bypass tenant filtering (for admin use)
    all_objects = AllTenantsManager()
    
    class Meta:
        abstract = True
    
    def save(self, *args, **kwargs):
        """Auto-set tenant_id from context if not already set."""
        if not self.tenant_id:
            tenant_id = TenantContext.id()
            if tenant_id:
                self.tenant_id = tenant_id
            else:
                raise ValueError(
                    f"Cannot save {self.__class__.__name__} without tenant context. "
                    "Either set tenant_id explicitly or ensure TenantContext is set."
                )
        super().save(*args, **kwargs)


class OptionalTenantAwareModel(models.Model):
    """
    Abstract base class for models that may optionally belong to a tenant.
    Useful for shared resources that can be global or tenant-specific.
    """
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='%(class)s_set'
    )
    
    objects = TenantManager()
    all_objects = AllTenantsManager()
    
    class Meta:
        abstract = True
    
    def save(self, *args, **kwargs):
        """Auto-set tenant_id from context if not already set and context exists."""
        if not self.tenant_id:
            tenant_id = TenantContext.id()
            if tenant_id:
                self.tenant_id = tenant_id
        super().save(*args, **kwargs)
