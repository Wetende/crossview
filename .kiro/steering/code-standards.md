# Python & Django Code Standards

> These standards ensure consistent, maintainable, and secure Django code across the Crossview LMS project.

## Python Standards

### Type Hints
- Use type hints on ALL function parameters and return values
- Use `Optional[T]` for nullable types
- Use `list[T]`, `dict[K, V]` (Python 3.9+ syntax)

```python
# ✅ Good
def get_user_by_email(email: str) -> Optional[User]:
    return User.objects.filter(email=email).first()

# ❌ Bad
def get_user_by_email(email):
    return User.objects.filter(email=email).first()
```

### Naming Conventions
- Classes: `PascalCase` (e.g., `CurriculumNode`)
- Functions/methods: `snake_case` (e.g., `get_completion_status`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_UPLOAD_SIZE`)
- Private methods: `_leading_underscore`
- Module names: `snake_case` (e.g., `curriculum_services.py`)

### Imports
- Group imports: stdlib → third-party → Django → local apps
- Use absolute imports for cross-app references
- Avoid wildcard imports (`from x import *`)

```python
# Standard library
from datetime import datetime
from typing import Optional

# Third-party
import factory

# Django
from django.db import models
from django.core.exceptions import ValidationError

# Local apps
from apps.core.models import User
from apps.blueprints.services import BlueprintService
```

## Django Standards

### Models
- Every model MUST have a `__str__` method
- Use explicit `db_table` names
- Add indexes for frequently queried fields
- Use `related_name` on all ForeignKey/OneToOne fields

```python
class CurriculumNode(models.Model):
    program = models.ForeignKey(
        'core.Program',
        on_delete=models.CASCADE,
        related_name='curriculum_nodes'  # Always specify
    )
    title = models.CharField(max_length=255)
    
    class Meta:
        db_table = 'curriculum_nodes'
        indexes = [
            models.Index(fields=['program', 'parent']),
        ]
    
    def __str__(self):  # Required
        return f"{self.node_type}: {self.title}"
```

### QuerySets
- Use `select_related()` for ForeignKey/OneToOne (single query JOIN)
- Use `prefetch_related()` for reverse ForeignKey/ManyToMany
- Never use `.all()` without pagination in views
- Avoid N+1 queries - always check with Django Debug Toolbar

```python
# ✅ Good - Single query with JOIN
enrollments = Enrollment.objects.select_related('user', 'program').filter(status='active')

# ✅ Good - Prefetch reverse relations
programs = Program.objects.prefetch_related('curriculum_nodes').all()

# ❌ Bad - N+1 queries
for enrollment in Enrollment.objects.all():
    print(enrollment.user.email)  # Separate query per iteration!
```

### Services Layer
- Business logic goes in `services.py`, NOT in views or models
- Services should be stateless functions or classes
- Views should only handle HTTP request/response

```python
# apps/progression/services.py
class EnrollmentService:
    @staticmethod
    def enroll_student(user: User, program: Program) -> Enrollment:
        """Enroll a student in a program with validation."""
        if Enrollment.objects.filter(user=user, program=program).exists():
            raise ValidationError("Already enrolled")
        return Enrollment.objects.create(user=user, program=program)

# apps/progression/views.py
class EnrollView(APIView):
    def post(self, request):
        enrollment = EnrollmentService.enroll_student(
            user=request.user,
            program_id=request.data['program_id']
        )
        return Response(EnrollmentSerializer(enrollment).data)
```

### Tenant Isolation
- ALL queries must filter by tenant (except super-admin views)
- Use `TenantManager` as default manager on tenant-scoped models
- Never trust user input for tenant_id - derive from authenticated user

```python
# ✅ Good - Uses tenant-aware manager
programs = Program.objects.filter(is_published=True)  # TenantManager auto-filters

# ❌ Bad - Bypasses tenant isolation
programs = Program.all_objects.filter(is_published=True)  # Only for super-admin!
```

### Validation
- Validate in model's `clean()` method for business rules
- Use serializer validation for API input
- Raise `ValidationError` with user-friendly messages

### Error Handling
- Create custom exceptions in `exceptions.py` per app
- Use Django REST Framework's exception handling
- Log errors with context (user, tenant, action)

```python
# apps/blueprints/exceptions.py
class BlueprintInUseException(Exception):
    """Raised when attempting to delete a blueprint with associated programs."""
    pass
```

## File Organization

```
apps/
└── myapp/
    ├── __init__.py
    ├── models.py          # Database models
    ├── services.py        # Business logic
    ├── serializers.py     # DRF serializers
    ├── views.py           # API views
    ├── urls.py            # URL routing
    ├── exceptions.py      # Custom exceptions
    ├── managers.py        # Custom QuerySet managers
    ├── signals.py         # Django signals (if needed)
    └── tests/
        ├── __init__.py
        ├── factories.py   # Factory Boy factories
        ├── test_models.py
        ├── test_services.py
        └── test_views.py
```
