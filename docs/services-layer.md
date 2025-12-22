# Services Layer Architecture

> Business logic organization in Crossview LMS - keeping views thin and logic testable.

---

## Overview

Crossview LMS follows a **services layer pattern** where business logic lives in dedicated service classes, not in views or models. This ensures:

- **Testability**: Services can be unit tested without HTTP overhead
- **Reusability**: Same logic can be called from views, management commands, or Celery tasks
- **Clarity**: Views handle HTTP, services handle business rules
- **Maintainability**: Changes to business logic are isolated

---

## Pattern

### Service Class Structure

```python
# apps/{app_name}/services.py

class MyService:
    """Service for handling {domain} operations."""
    
    @staticmethod
    def get_something(param: Type) -> ReturnType:
        """Get something with business logic."""
        # Business logic here
        return result
    
    @staticmethod
    def create_something(data: dict, user: User) -> Model:
        """Create something with validation."""
        # Validation
        # Business rules
        # Database operations
        return instance
```

### View Usage

```python
# apps/{app_name}/views.py
from inertia import inertia
from .services import MyService

@inertia('PageName')
def my_view(request):
    return {
        'data': MyService.get_something(request.user),
    }
```

---

## Implemented Services

### Tenant Services (`apps/tenants/services.py`)

#### PlatformStatsService
Platform-wide statistics for super admin dashboard.

```python
class PlatformStatsService:
    @staticmethod
    def get_stats() -> dict:
        """Get platform-wide statistics."""
        return {
            'totalTenants': Tenant.objects.count(),
            'activeTenants': Tenant.objects.filter(is_active=True).count(),
            'totalUsers': User.objects.count(),
            'totalPrograms': Program.objects.count(),
        }
    
    @staticmethod
    def get_growth_data(months: int = 6) -> list[dict]:
        """Get tenant growth data for charts."""
        # Returns monthly tenant counts
```

#### TenantService
Tenant CRUD and management operations.

```python
class TenantService:
    @staticmethod
    def get_all() -> QuerySet:
        """Get all tenants with related data."""
    
    @staticmethod
    def get_recent(limit: int = 5) -> list[dict]:
        """Get recently created tenants."""
    
    @staticmethod
    def create(data: dict) -> Tenant:
        """Create a new tenant with limits."""
    
    @staticmethod
    def update(tenant: Tenant, data: dict) -> Tenant:
        """Update tenant details."""
    
    @staticmethod
    def toggle_active(tenant: Tenant) -> Tenant:
        """Toggle tenant active status."""
```

#### SubscriptionTierService
Subscription tier management.

```python
class SubscriptionTierService:
    @staticmethod
    def get_all() -> QuerySet:
        """Get all subscription tiers."""
    
    @staticmethod
    def create(data: dict) -> SubscriptionTier:
        """Create a new tier."""
    
    @staticmethod
    def update(tier: SubscriptionTier, data: dict) -> SubscriptionTier:
        """Update tier details."""
```

#### PresetBlueprintService
Blueprint preset management.

```python
class PresetBlueprintService:
    @staticmethod
    def get_all() -> QuerySet:
        """Get all preset blueprints."""
    
    @staticmethod
    def create(data: dict) -> PresetBlueprint:
        """Create a new preset blueprint."""
    
    @staticmethod
    def update(preset: PresetBlueprint, data: dict) -> PresetBlueprint:
        """Update preset blueprint."""
```

---

### Curriculum Services (`apps/curriculum/services.py`)

#### CurriculumService
Curriculum tree management.

```python
class CurriculumService:
    @staticmethod
    def create_node(program: Program, parent: CurriculumNode | None, data: dict) -> CurriculumNode:
        """Create a curriculum node with validation."""
    
    @staticmethod
    def reorder_nodes(node_ids: list[int]) -> None:
        """Bulk update node order."""
    
    @staticmethod
    def get_tree(program: Program) -> list[dict]:
        """Get full curriculum tree."""
```

---

### Progression Services (`apps/progression/services.py`)

#### ProgressionService
Student progress tracking.

```python
class ProgressionService:
    @staticmethod
    def can_access_node(user: User, node: CurriculumNode) -> bool:
        """Check if user can access this node."""
    
    @staticmethod
    def mark_completed(user: User, node: CurriculumNode) -> NodeCompletion:
        """Mark a node as completed."""
    
    @staticmethod
    def get_progress(enrollment: Enrollment) -> dict:
        """Get enrollment progress statistics."""
```

---

### Content Services (`apps/content/services.py`)

#### ContentParsingService
PDF parsing and content extraction.

```python
class ContentParsingService:
    @staticmethod
    def parse_pdf(file_path: str) -> list[dict]:
        """Parse PDF into session nodes."""
    
    @staticmethod
    def create_nodes_from_pdf(program: Program, parent: CurriculumNode, file) -> list[CurriculumNode]:
        """Parse PDF and create session nodes."""
```

---

## Best Practices

### 1. Keep Services Stateless
Services should be stateless - use `@staticmethod` methods.

```python
# ✅ Good - Stateless
class MyService:
    @staticmethod
    def do_something(param):
        return result

# ❌ Bad - Stateful
class MyService:
    def __init__(self, user):
        self.user = user
```

### 2. Type Hints
Always use type hints for clarity and IDE support.

```python
@staticmethod
def create_tenant(data: dict, tier: SubscriptionTier) -> Tenant:
    """Create a new tenant."""
```

### 3. Docstrings
Document what each method does.

```python
@staticmethod
def get_stats() -> dict:
    """
    Get platform-wide statistics.
    
    Returns:
        dict with keys: totalTenants, activeTenants, totalUsers, totalPrograms
    """
```

### 4. Validation in Services
Put validation logic in services, not views.

```python
@staticmethod
def create_tenant(data: dict) -> Tenant:
    # Validate subdomain uniqueness
    if Tenant.objects.filter(subdomain=data['subdomain']).exists():
        raise ValidationError("Subdomain already exists")
    
    # Create tenant
    return Tenant.objects.create(**data)
```

### 5. Transaction Management
Use transactions for multi-step operations.

```python
from django.db import transaction

@staticmethod
def create_tenant_with_limits(data: dict, tier: SubscriptionTier) -> Tenant:
    with transaction.atomic():
        tenant = Tenant.objects.create(**data)
        TenantLimits.objects.create(
            tenant=tenant,
            max_students=tier.max_students,
            max_programs=tier.max_programs,
        )
        return tenant
```

---

## Testing Services

Services are easy to unit test:

```python
# apps/tenants/tests/test_services.py
import pytest
from apps.tenants.services import TenantService

@pytest.mark.django_db
class TestTenantService:
    def test_create_tenant(self, subscription_tier):
        data = {
            'name': 'Test School',
            'subdomain': 'test-school',
        }
        tenant = TenantService.create(data, subscription_tier)
        
        assert tenant.name == 'Test School'
        assert tenant.subdomain == 'test-school'
    
    def test_create_tenant_duplicate_subdomain_raises(self, tenant):
        data = {'name': 'Another', 'subdomain': tenant.subdomain}
        
        with pytest.raises(ValidationError):
            TenantService.create(data)
```

---

## Migration Guide

When adding new business logic:

1. **Create service file** if it doesn't exist:
   ```
   apps/{app_name}/services.py
   ```

2. **Add service class** with static methods:
   ```python
   class NewFeatureService:
       @staticmethod
       def do_something():
           pass
   ```

3. **Use in views**:
   ```python
   from .services import NewFeatureService
   
   def my_view(request):
       result = NewFeatureService.do_something()
   ```

4. **Write tests**:
   ```python
   # apps/{app_name}/tests/test_services.py
   class TestNewFeatureService:
       def test_do_something(self):
           result = NewFeatureService.do_something()
           assert result == expected
   ```
