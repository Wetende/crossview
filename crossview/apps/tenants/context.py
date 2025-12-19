"""
Tenant context management - Thread-local storage for current tenant.
Requirements: 3.3
"""
import threading
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .models import Tenant

_tenant_context = threading.local()


class TenantContext:
    """
    Thread-local singleton for managing current tenant context.
    Requirements: 3.3
    """
    
    @staticmethod
    def set(tenant: 'Tenant') -> None:
        """Set the current tenant for this thread."""
        _tenant_context.tenant = tenant
    
    @staticmethod
    def get() -> Optional['Tenant']:
        """Get the current tenant for this thread."""
        return getattr(_tenant_context, 'tenant', None)
    
    @staticmethod
    def id() -> Optional[int]:
        """Get the current tenant ID for this thread."""
        tenant = TenantContext.get()
        return tenant.id if tenant else None
    
    @staticmethod
    def check() -> bool:
        """Check if a tenant context is set."""
        return TenantContext.get() is not None
    
    @staticmethod
    def clear() -> None:
        """Clear the current tenant context."""
        _tenant_context.tenant = None
    
    @staticmethod
    def require() -> 'Tenant':
        """Get the current tenant, raising an error if not set."""
        tenant = TenantContext.get()
        if tenant is None:
            raise RuntimeError("No tenant context set")
        return tenant
