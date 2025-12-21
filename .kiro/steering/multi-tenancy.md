# Multi-Tenancy Rules

> Critical rules for maintaining data isolation between tenants in the Crossview LMS SaaS platform.

## Architecture Overview

Crossview uses **Shared Database, Shared Schema** multi-tenancy:
- All tenants share the same database
- Data is isolated via `tenant_id` foreign key
- Tenant is resolved from subdomain or authenticated user

## Tenant Resolution

### From Subdomain
```python
# middleware/tenant.py
class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        host = request.get_host().split(':')[0]
        subdomain = host.split('.')[0]
        
        if subdomain and subdomain != 'www':
            try:
                request.tenant = Tenant.objects.get(
                    subdomain=subdomain,
                    is_active=True
                )
            except Tenant.DoesNotExist:
                request.tenant = None
        else:
            request.tenant = None
        
        return self.get_response(request)
```

### From Authenticated User
```python
# ✅ ALWAYS derive tenant from user, never from request params
def get_tenant(request) -> Tenant:
    if request.user.is_authenticated:
        return request.user.tenant
    return request.tenant  # From subdomain middleware
```

## Model Design

### Tenant-Scoped Models
Every model that contains tenant-specific data MUST have:
1. `tenant` ForeignKey
2. `TenantManager` as default manager
3. Index on tenant field

```python
# apps/core/models.py
from apps.tenants.managers import TenantManager, AllTenantsManager

class Program(models.Model):
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        null=True,  # Null for super-admin created templates
        blank=True,
        related_name='programs'
    )
    name = models.CharField(max_length=255)
    
    # Tenant-aware managers
    objects = TenantManager()          # Default - filters by tenant
    all_objects = AllTenantsManager()  # For super-admin only
    
    class Meta:
        db_table = 'programs'
        indexes = [
            models.Index(fields=['tenant']),
        ]
```

### TenantManager Implementation
```python
# apps/tenants/managers.py
from django.db import models
from threading import local

_thread_locals = local()

def get_current_tenant():
    return getattr(_thread_locals, 'tenant', None)

def set_current_tenant(tenant):
    _thread_locals.tenant = tenant

class TenantQuerySet(models.QuerySet):
    def for_tenant(self, tenant):
        return self.filter(tenant=tenant)

class TenantManager(models.Manager):
    def get_queryset(self):
        queryset = TenantQuerySet(self.model, using=self._db)
        tenant = get_current_tenant()
        if tenant:
            return queryset.for_tenant(tenant)
        return queryset
    
    def for_tenant(self, tenant):
        return self.get_queryset().for_tenant(tenant)

class AllTenantsManager(models.Manager):
    """Bypasses tenant filtering - USE WITH CAUTION."""
    def get_queryset(self):
        return TenantQuerySet(self.model, using=self._db)
```

### Setting Tenant Context
```python
# apps/tenants/middleware.py
from apps.tenants.managers import set_current_tenant

class TenantContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Set tenant from authenticated user
        if request.user.is_authenticated:
            set_current_tenant(request.user.tenant)
        elif hasattr(request, 'tenant'):
            set_current_tenant(request.tenant)
        else:
            set_current_tenant(None)
        
        response = self.get_response(request)
        
        # Clear tenant context
        set_current_tenant(None)
        return response
```

## View Layer Rules

### ViewSet Pattern
```python
# ✅ Good - Tenant automatically filtered via TenantManager
class ProgramViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # TenantManager automatically filters by current tenant
        return Program.objects.filter(is_published=True)
    
    def perform_create(self, serializer):
        # Always set tenant on create
        serializer.save(tenant=self.request.user.tenant)
```

### Object-Level Access
```python
# ✅ Good - Validates tenant ownership
def get_object(self):
    obj = get_object_or_404(
        self.get_queryset(),  # Already tenant-filtered
        pk=self.kwargs['pk']
    )
    self.check_object_permissions(self.request, obj)
    return obj
```

### Cross-Tenant Access (Super-Admin Only)
```python
# ⚠️ Only for super-admin views
class SuperAdminProgramViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    
    def get_queryset(self):
        # Explicitly use all_objects to bypass tenant filter
        return Program.all_objects.all()
```

## Serializer Rules

### Validate Tenant Ownership
```python
class EnrollmentSerializer(serializers.ModelSerializer):
    def validate_program(self, value):
        request = self.context.get('request')
        if value.tenant != request.user.tenant:
            raise serializers.ValidationError("Invalid program")
        return value
    
    def create(self, validated_data):
        # Ensure tenant is set
        validated_data['tenant'] = self.context['request'].user.tenant
        return super().create(validated_data)
```

### Hide Tenant Field from API
```python
class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = ['id', 'name', 'code', 'description']
        # Note: 'tenant' is NOT in fields - never expose
```

## Query Rules

### ALWAYS Filter by Tenant
```python
# ✅ Good - Uses TenantManager (automatic filtering)
programs = Program.objects.filter(is_published=True)

# ✅ Good - Explicit tenant filter
programs = Program.objects.filter(
    tenant=request.user.tenant,
    is_published=True
)

# ❌ DANGEROUS - Bypasses tenant isolation
programs = Program.all_objects.filter(is_published=True)

# ❌ DANGEROUS - Tenant from user input
tenant_id = request.data.get('tenant_id')
programs = Program.objects.filter(tenant_id=tenant_id)
```

### Related Object Queries
```python
# ✅ Good - Filter related objects by tenant too
enrollments = Enrollment.objects.filter(
    program__tenant=request.user.tenant
)

# ✅ Good - Use select_related with tenant check
enrollment = Enrollment.objects.select_related('program').get(
    pk=enrollment_id,
    program__tenant=request.user.tenant
)
```

## Testing Tenant Isolation

### Required Tests for Every Feature
```python
@pytest.mark.django_db
class TestTenantIsolation:
    def test_list_only_shows_own_tenant_data(self, authenticated_client):
        tenant_a = TenantFactory()
        tenant_b = TenantFactory()
        user_a = UserFactory(tenant=tenant_a)
        program_a = ProgramFactory(tenant=tenant_a)
        program_b = ProgramFactory(tenant=tenant_b)
        
        authenticated_client.force_authenticate(user=user_a)
        response = authenticated_client.get('/api/programs/')
        
        ids = [p['id'] for p in response.data['results']]
        assert program_a.id in ids
        assert program_b.id not in ids  # CRITICAL
    
    def test_detail_returns_404_for_other_tenant(self, authenticated_client):
        tenant_a = TenantFactory()
        tenant_b = TenantFactory()
        user_a = UserFactory(tenant=tenant_a)
        program_b = ProgramFactory(tenant=tenant_b)
        
        authenticated_client.force_authenticate(user=user_a)
        response = authenticated_client.get(f'/api/programs/{program_b.id}/')
        
        # Should be 404, not 403 (don't reveal existence)
        assert response.status_code == 404
    
    def test_create_assigns_user_tenant(self, authenticated_client, user):
        authenticated_client.force_authenticate(user=user)
        response = authenticated_client.post('/api/programs/', {
            'name': 'New Program'
        })
        
        assert response.status_code == 201
        program = Program.objects.get(pk=response.data['id'])
        assert program.tenant == user.tenant
    
    def test_cannot_update_other_tenant_resource(self, authenticated_client):
        tenant_a = TenantFactory()
        tenant_b = TenantFactory()
        user_a = UserFactory(tenant=tenant_a)
        program_b = ProgramFactory(tenant=tenant_b)
        
        authenticated_client.force_authenticate(user=user_a)
        response = authenticated_client.patch(
            f'/api/programs/{program_b.id}/',
            {'name': 'Hacked'}
        )
        
        assert response.status_code == 404
```

## Tenant Limits

### Enforcing Limits
```python
# apps/tenants/services.py
class TenantLimitService:
    @staticmethod
    def check_student_limit(tenant: Tenant) -> bool:
        limits = tenant.limits
        return limits.current_students < limits.max_students
    
    @staticmethod
    def check_program_limit(tenant: Tenant) -> bool:
        limits = tenant.limits
        return limits.current_programs < limits.max_programs
    
    @staticmethod
    def increment_student_count(tenant: Tenant):
        TenantLimits.objects.filter(tenant=tenant).update(
            current_students=F('current_students') + 1
        )
```

### Using in Views
```python
class EnrollmentViewSet(viewsets.ModelViewSet):
    def perform_create(self, serializer):
        tenant = self.request.user.tenant
        
        if not TenantLimitService.check_student_limit(tenant):
            raise PermissionDenied("Student limit reached for your plan")
        
        enrollment = serializer.save(tenant=tenant)
        TenantLimitService.increment_student_count(tenant)
```

## Checklist

### For Every New Model
- [ ] Has `tenant` ForeignKey
- [ ] Uses `TenantManager` as default manager
- [ ] Has index on `tenant` field
- [ ] `tenant` not exposed in serializer

### For Every New View
- [ ] Uses `get_queryset()` (not class-level `queryset`)
- [ ] Sets tenant on `perform_create()`
- [ ] Has tenant isolation tests

### For Every New Feature
- [ ] Test: List only shows own tenant data
- [ ] Test: Detail returns 404 for other tenant
- [ ] Test: Create assigns correct tenant
- [ ] Test: Update/Delete fails for other tenant
