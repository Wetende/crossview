# Security Rules

> Critical security practices for building a secure multi-tenant SaaS application. Based on OWASP guidelines and Django security best practices.

## Authentication & Authorization

### Authentication
- Use Django's built-in authentication system
- Implement JWT tokens for API authentication (via djangorestframework-simplejwt)
- Enforce strong passwords (min 8 chars, mixed case, numbers)
- Implement account lockout after 5 failed attempts (django-axes)
- Use HTTPS in production (never HTTP)

```python
# settings/production.py
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

### Authorization
- Use Django's permission system for role-based access
- Check permissions in EVERY view (never assume)
- Use `@permission_required` decorator or DRF permissions
- Implement object-level permissions for tenant data

```python
# ✅ Good - Explicit permission check
class ProgramViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsTenantMember]
    
    def get_queryset(self):
        # Automatically filtered by tenant via TenantManager
        return Program.objects.filter(is_published=True)

# ❌ Bad - No permission check
class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all()  # Exposes all tenants!
```

## Tenant Isolation (CRITICAL)

### Data Isolation
- EVERY query must be tenant-scoped (except super-admin)
- Use TenantManager as default manager on all tenant models
- Derive tenant from authenticated user, NEVER from request params
- Test tenant isolation explicitly in every feature

```python
# ✅ Good - Tenant derived from user
def get_queryset(self):
    return Program.objects.filter(tenant=self.request.user.tenant)

# ❌ DANGEROUS - Tenant from request (can be spoofed!)
def get_queryset(self):
    tenant_id = self.request.query_params.get('tenant_id')
    return Program.objects.filter(tenant_id=tenant_id)
```

### Cross-Tenant Access Prevention
- Validate object ownership before any operation
- Use `get_object_or_404` with tenant filter
- Log and alert on cross-tenant access attempts

```python
# ✅ Good - Validates ownership
def get_object(self):
    obj = get_object_or_404(
        Program,
        pk=self.kwargs['pk'],
        tenant=self.request.user.tenant  # Ensures tenant match
    )
    return obj
```

## Input Validation

### Server-Side Validation
- NEVER trust client-side validation alone
- Validate ALL input in serializers/forms
- Use Django's built-in validators
- Sanitize file uploads (check type, size, content)

```python
# ✅ Good - Comprehensive validation
class EnrollmentSerializer(serializers.ModelSerializer):
    def validate_program(self, value):
        # Ensure program belongs to user's tenant
        if value.tenant != self.context['request'].user.tenant:
            raise serializers.ValidationError("Invalid program")
        return value
    
    def validate(self, data):
        # Business rule validation
        if Enrollment.objects.filter(
            user=self.context['request'].user,
            program=data['program']
        ).exists():
            raise serializers.ValidationError("Already enrolled")
        return data
```

### SQL Injection Prevention
- ALWAYS use Django ORM (parameterized queries)
- NEVER use raw SQL with string formatting
- If raw SQL needed, use parameterized queries

```python
# ✅ Good - ORM (safe)
users = User.objects.filter(email=user_input)

# ✅ Good - Parameterized raw SQL (if absolutely needed)
User.objects.raw('SELECT * FROM users WHERE email = %s', [user_input])

# ❌ DANGEROUS - String formatting (SQL injection!)
User.objects.raw(f'SELECT * FROM users WHERE email = "{user_input}"')
```

## XSS Prevention

### Output Encoding
- Django templates auto-escape by default - don't disable
- Use `mark_safe()` only for trusted content
- Sanitize user-generated HTML with DOMPurify (frontend)
- Use `bleach` library for server-side HTML sanitization

```python
# ✅ Good - Let Django escape
{{ user_input }}  # Auto-escaped

# ❌ DANGEROUS - Disabling escaping
{{ user_input|safe }}  # Only for trusted content!
```

```jsx
// ✅ Good - Sanitize before rendering
import DOMPurify from 'dompurify';

<div dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(userContent) 
}} />

// ❌ DANGEROUS - Unsanitized HTML
<div dangerouslySetInnerHTML={{ __html: userContent }} />
```

## CSRF Protection

### Django CSRF
- Keep CSRF middleware enabled (default)
- Include CSRF token in all forms
- For API: use session auth or exempt with token auth

```python
# settings.py - Keep enabled
MIDDLEWARE = [
    'django.middleware.csrf.CsrfViewMiddleware',
    # ...
]

# For DRF with JWT - CSRF not needed (token-based)
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}
```

## File Upload Security

### Validation Rules
- Validate file type by content (not just extension)
- Limit file size (e.g., 10MB for documents, 100MB for videos)
- Store uploads outside web root
- Generate random filenames (prevent path traversal)
- Scan for malware if possible

```python
# ✅ Good - Secure file handling
import uuid
from django.core.validators import FileExtensionValidator

class PracticumSubmission(models.Model):
    file = models.FileField(
        upload_to=get_upload_path,  # Custom path generator
        validators=[
            FileExtensionValidator(allowed_extensions=['mp3', 'mp4', 'pdf']),
        ]
    )
    
def get_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    return f'practicum/{instance.enrollment.tenant_id}/{uuid.uuid4()}.{ext}'
```

## Rate Limiting

### Implementation
- Rate limit authentication endpoints (prevent brute force)
- Rate limit API endpoints (prevent abuse)
- Use django-ratelimit or DRF throttling

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'login': '5/minute',  # Strict for auth
    }
}
```

## Sensitive Data

### Secrets Management
- NEVER commit secrets to git
- Use environment variables for all secrets
- Rotate secrets regularly
- Use different secrets per environment

```python
# ✅ Good - Environment variable
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
DATABASE_URL = os.environ.get('DATABASE_URL')

# ❌ DANGEROUS - Hardcoded secret
SECRET_KEY = 'my-super-secret-key-12345'
```

### Data Protection
- Hash passwords (Django does this automatically)
- Encrypt sensitive data at rest if required
- Mask sensitive data in logs
- Implement data retention policies

```python
# ✅ Good - Mask sensitive data in logs
import logging
logger = logging.getLogger(__name__)

def process_payment(user, amount):
    logger.info(f"Processing payment for user {user.id}, amount: {amount}")
    # NOT: logger.info(f"Card: {card_number}")  # Never log sensitive data!
```

## Security Headers

```python
# settings/production.py
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# Content Security Policy (use django-csp)
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'",)
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")  # MUI needs inline styles
```

## Audit Logging

### What to Log
- Authentication events (login, logout, failed attempts)
- Authorization failures (access denied)
- Data modifications (create, update, delete)
- Admin actions
- Cross-tenant access attempts

```python
# ✅ Good - Audit logging
import logging
audit_logger = logging.getLogger('audit')

class EnrollmentService:
    @staticmethod
    def enroll_student(user: User, program: Program, enrolled_by: User) -> Enrollment:
        enrollment = Enrollment.objects.create(user=user, program=program)
        audit_logger.info(
            f"ENROLLMENT_CREATED | "
            f"tenant={program.tenant_id} | "
            f"student={user.id} | "
            f"program={program.id} | "
            f"by={enrolled_by.id}"
        )
        return enrollment
```

## Security Checklist

### Before Every Release
- [ ] No secrets in code or git history
- [ ] All inputs validated server-side
- [ ] Tenant isolation tested
- [ ] Authentication required on all protected endpoints
- [ ] File uploads validated and sanitized
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] Dependencies updated (check for vulnerabilities)
- [ ] HTTPS enforced in production
