"""
Tenant-aware managers and querysets for automatic query scoping.
Requirements: 2.1
"""
import logging
from django.db import models

from .context import TenantContext

logger = logging.getLogger(__name__)


class TenantQuerySet(models.QuerySet):
    """
    QuerySet that automatically filters by current tenant.
    Requirements: 2.1
    """
    
    def _filter_by_tenant(self):
        """Apply tenant filter if context is set."""
        tenant_id = TenantContext.id()
        if tenant_id is not None:
            return self.filter(tenant_id=tenant_id)
        return self


class TenantManager(models.Manager):
    """
    Manager that automatically scopes queries to current tenant.
    Requirements: 2.1
    """
    
    def get_queryset(self):
        """Return queryset filtered by current tenant."""
        qs = TenantQuerySet(self.model, using=self._db)
        tenant_id = TenantContext.id()
        if tenant_id is not None:
            return qs.filter(tenant_id=tenant_id)
        return qs


class AllTenantsManager(models.Manager):
    """
    Manager that bypasses tenant filtering.
    Use for admin operations that need to access all tenants' data.
    """
    
    def get_queryset(self):
        return super().get_queryset()
