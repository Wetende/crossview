# Testing Rules

> Quality assurance standards for the Crossview LMS. Tests are not optional - they protect against regressions and ensure tenant isolation.

## Testing Stack

| Tool | Purpose |
|------|---------|
| pytest | Test runner |
| pytest-django | Django integration |
| factory_boy | Test data factories |
| hypothesis | Property-based testing |
| pytest-cov | Coverage reporting |

## Test Organization

```
apps/
└── myapp/
    └── tests/
        ├── __init__.py
        ├── conftest.py      # Shared fixtures
        ├── factories.py     # Factory Boy factories
        ├── test_models.py   # Model unit tests
        ├── test_services.py # Service layer tests
        ├── test_views.py    # API integration tests
        └── test_tenant_isolation.py  # CRITICAL
```

## Factory Boy Standards

### Factory Definition
- Create a factory for EVERY model
- Use `Faker` for realistic test data
- Define `SubFactory` for relationships
- Use `Trait` for common variations

```python
# apps/core/tests/factories.py
import factory
from factory.django import DjangoModelFactory
from apps.core.models import User, Program
from apps.tenants.tests.factories import TenantFactory

class UserFactory(DjangoModelFactory):
    class Meta:
        model = User
    
    tenant = factory.SubFactory(TenantFactory)
    email = factory.Faker('email')
    username = factory.LazyAttribute(lambda o: o.email.split('@')[0])
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    
    class Params:
        admin = factory.Trait(
            is_staff=True,
            is_superuser=True
        )

class ProgramFactory(DjangoModelFactory):
    class Meta:
        model = Program
    
    tenant = factory.SubFactory(TenantFactory)
    name = factory.Faker('sentence', nb_words=3)
    code = factory.Sequence(lambda n: f'PRG-{n:04d}')
    is_published = True
```

### Using Factories in Tests
```python
# ✅ Good - Use factories
def test_enrollment_creates_record(db):
    user = UserFactory()
    program = ProgramFactory(tenant=user.tenant)  # Same tenant!
    
    enrollment = EnrollmentService.enroll_student(user, program)
    
    assert enrollment.user == user
    assert enrollment.program == program

# ❌ Bad - Manual object creation
def test_enrollment_creates_record(db):
    user = User.objects.create(email='test@test.com', ...)  # Verbose, error-prone
```

## Test Categories

### Unit Tests (test_models.py, test_services.py)
- Test single functions/methods in isolation
- Mock external dependencies
- Fast execution (no database if possible)
- High coverage target: 90%+

```python
# apps/blueprints/tests/test_services.py
import pytest
from apps.blueprints.services import BlueprintValidationService

class TestBlueprintValidationService:
    def test_validate_hierarchy_structure_valid(self):
        validator = BlueprintValidationService()
        hierarchy = ["Year", "Unit", "Session"]
        
        # Should not raise
        validator.validate_hierarchy_structure(hierarchy)
    
    def test_validate_hierarchy_structure_empty_raises(self):
        validator = BlueprintValidationService()
        
        with pytest.raises(ValidationError) as exc:
            validator.validate_hierarchy_structure([])
        
        assert "at least one level" in str(exc.value)
```

### Integration Tests (test_views.py)
- Test API endpoints end-to-end
- Use Django test client or DRF's APIClient
- Test authentication, permissions, responses
- Test error cases

```python
# apps/progression/tests/test_views.py
import pytest
from rest_framework.test import APIClient
from rest_framework import status

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client

class TestEnrollmentAPI:
    def test_enroll_student_success(self, authenticated_client, user, program):
        response = authenticated_client.post('/api/enrollments/', {
            'program_id': program.id
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['program']['id'] == program.id
    
    def test_enroll_requires_authentication(self, api_client, program):
        response = api_client.post('/api/enrollments/', {
            'program_id': program.id
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_enroll_duplicate_returns_400(self, authenticated_client, enrollment):
        response = authenticated_client.post('/api/enrollments/', {
            'program_id': enrollment.program.id
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already enrolled' in response.data['detail'].lower()
```

### Tenant Isolation Tests (CRITICAL)
- EVERY feature must have tenant isolation tests
- Test that users cannot access other tenants' data
- Test that queries are properly scoped

```python
# apps/core/tests/test_tenant_isolation.py
import pytest
from apps.core.tests.factories import UserFactory, ProgramFactory
from apps.tenants.tests.factories import TenantFactory

@pytest.mark.django_db
class TestTenantIsolation:
    """Critical tests ensuring data isolation between tenants."""
    
    def test_user_cannot_see_other_tenant_programs(self, authenticated_client):
        # Setup: Two tenants with programs
        tenant_a = TenantFactory()
        tenant_b = TenantFactory()
        user_a = UserFactory(tenant=tenant_a)
        program_a = ProgramFactory(tenant=tenant_a)
        program_b = ProgramFactory(tenant=tenant_b)
        
        # Act: User A requests programs
        authenticated_client.force_authenticate(user=user_a)
        response = authenticated_client.get('/api/programs/')
        
        # Assert: Only sees their tenant's programs
        program_ids = [p['id'] for p in response.data['results']]
        assert program_a.id in program_ids
        assert program_b.id not in program_ids  # CRITICAL
    
    def test_user_cannot_access_other_tenant_program_detail(self, authenticated_client):
        tenant_a = TenantFactory()
        tenant_b = TenantFactory()
        user_a = UserFactory(tenant=tenant_a)
        program_b = ProgramFactory(tenant=tenant_b)
        
        authenticated_client.force_authenticate(user=user_a)
        response = authenticated_client.get(f'/api/programs/{program_b.id}/')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND  # Not 403!
    
    def test_user_cannot_enroll_in_other_tenant_program(self, authenticated_client):
        tenant_a = TenantFactory()
        tenant_b = TenantFactory()
        user_a = UserFactory(tenant=tenant_a)
        program_b = ProgramFactory(tenant=tenant_b)
        
        authenticated_client.force_authenticate(user=user_a)
        response = authenticated_client.post('/api/enrollments/', {
            'program_id': program_b.id
        })
        
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND]
```

### Property-Based Tests (Hypothesis)
- Use for complex business logic
- Test invariants that should always hold
- Catches edge cases you wouldn't think of

```python
# apps/assessments/tests/test_grading.py
from hypothesis import given, strategies as st
import pytest

class TestGradingCalculation:
    @given(
        cat_score=st.floats(min_value=0, max_value=100),
        exam_score=st.floats(min_value=0, max_value=100)
    )
    def test_weighted_grade_always_between_0_and_100(self, cat_score, exam_score):
        """Grade should always be in valid range regardless of inputs."""
        grading_config = {
            'type': 'weighted',
            'components': [
                {'name': 'CAT', 'weight': 0.3},
                {'name': 'Exam', 'weight': 0.7}
            ]
        }
        
        result = calculate_grade(
            grading_config,
            {'CAT': cat_score, 'Exam': exam_score}
        )
        
        assert 0 <= result['total'] <= 100
    
    @given(scores=st.dictionaries(
        keys=st.text(min_size=1, max_size=20),
        values=st.floats(min_value=0, max_value=100),
        min_size=1,
        max_size=5
    ))
    def test_grade_components_sum_correctly(self, scores):
        """Weighted components should sum to total."""
        # Property: sum of (score * weight) == total
        pass
```

## Fixtures (conftest.py)

```python
# conftest.py (project root)
import pytest
from rest_framework.test import APIClient
from apps.tenants.tests.factories import TenantFactory
from apps.core.tests.factories import UserFactory, ProgramFactory

@pytest.fixture
def tenant(db):
    return TenantFactory()

@pytest.fixture
def user(tenant):
    return UserFactory(tenant=tenant)

@pytest.fixture
def program(tenant):
    return ProgramFactory(tenant=tenant)

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client
```

## Coverage Requirements

### Minimum Coverage
- Overall: 80%
- New code: 90%
- Critical paths (auth, tenant isolation): 100%

### Running Coverage
```bash
# Run with coverage
pytest --cov=apps --cov-report=html

# Check coverage threshold
pytest --cov=apps --cov-fail-under=80
```

## Test Naming Conventions

```python
# Pattern: test_<action>_<condition>_<expected_result>

def test_enroll_student_success():  # Happy path
def test_enroll_duplicate_returns_error():  # Error case
def test_enroll_requires_authentication():  # Auth check
def test_enroll_other_tenant_program_forbidden():  # Tenant isolation
```

## What to Test Checklist

### For Every Feature
- [ ] Happy path (success case)
- [ ] Validation errors (invalid input)
- [ ] Authentication required
- [ ] Authorization (permissions)
- [ ] Tenant isolation (CRITICAL)
- [ ] Edge cases (empty, null, max values)
- [ ] Error handling (exceptions)

### Before Merging
- [ ] All tests pass
- [ ] Coverage meets threshold
- [ ] Tenant isolation tests included
- [ ] No skipped tests without reason
