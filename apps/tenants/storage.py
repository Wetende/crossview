"""
Tenant-aware file storage for data isolation.
Requirements: 2.3
"""
import os
from django.core.files.storage import FileSystemStorage
from django.conf import settings

from .context import TenantContext


class TenantAwareStorage(FileSystemStorage):
    """
    File storage that prefixes paths with tenant identifier.
    Requirements: 2.3
    
    Files are stored in: MEDIA_ROOT/tenants/{tenant_id}/...
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
    
    def _get_tenant_prefix(self) -> str:
        """Get the tenant-specific path prefix."""
        tenant_id = TenantContext.id()
        if tenant_id:
            return f"tenants/{tenant_id}"
        return "shared"
    
    def _add_tenant_prefix(self, name: str) -> str:
        """Add tenant prefix to a file path."""
        prefix = self._get_tenant_prefix()
        return os.path.join(prefix, name)
    
    def _save(self, name: str, content) -> str:
        """Save file with tenant prefix."""
        name = self._add_tenant_prefix(name)
        return super()._save(name, content)
    
    def path(self, name: str) -> str:
        """Get full path with tenant prefix."""
        name = self._add_tenant_prefix(name)
        return super().path(name)
    
    def url(self, name: str) -> str:
        """Get URL with tenant prefix."""
        name = self._add_tenant_prefix(name)
        return super().url(name)
    
    def exists(self, name: str) -> bool:
        """Check if file exists with tenant prefix."""
        name = self._add_tenant_prefix(name)
        return super().exists(name)
    
    def delete(self, name: str) -> None:
        """Delete file with tenant prefix."""
        name = self._add_tenant_prefix(name)
        super().delete(name)
    
    def listdir(self, path: str) -> tuple:
        """List directory with tenant prefix."""
        path = self._add_tenant_prefix(path)
        return super().listdir(path)
    
    def size(self, name: str) -> int:
        """Get file size with tenant prefix."""
        name = self._add_tenant_prefix(name)
        return super().size(name)


def get_tenant_upload_path(instance, filename: str) -> str:
    """
    Generate upload path with tenant prefix.
    Use as upload_to parameter in FileField/ImageField.
    
    Example:
        logo = models.ImageField(upload_to=get_tenant_upload_path)
    """
    tenant_id = TenantContext.id()
    if tenant_id:
        return f"tenants/{tenant_id}/{filename}"
    return f"shared/{filename}"


def get_tenant_media_path(subdir: str = "") -> str:
    """
    Get the media path for the current tenant.
    
    Args:
        subdir: Optional subdirectory within tenant's media folder
    
    Returns:
        Full path to tenant's media directory
    """
    tenant_id = TenantContext.id()
    base = settings.MEDIA_ROOT
    
    if tenant_id:
        path = os.path.join(base, "tenants", str(tenant_id))
    else:
        path = os.path.join(base, "shared")
    
    if subdir:
        path = os.path.join(path, subdir)
    
    return path
