# Design Document: Public Pages

## Overview

The public pages module provides the unauthenticated entry points for the Crossview LMS platform. This includes the marketing landing page, authentication flows (login, registration, password reset), certificate verification, and tenant-specific branded landing pages.

The design follows an **Inertia.js-first architecture** using Django views that return React components with props. No separate REST API is needed for page rendering - data flows directly from Django views to React components.

## Architecture

### Inertia-First Approach

> **Golden Rule**: If it happens in the Browser, use Inertia first. Only use REST API for mobile apps or WebSockets.

| Use Case | Approach | Notes |
|----------|----------|-------|
| Page rendering | **Inertia** | Django views return component + props |
| Form submissions | **Inertia** | `router.post()` with validation errors as props |
| Navigation | **Inertia** | Server-side routing via Django URLs |
| Certificate verification | **Inertia** | Form POST returns results as props |

### Routing Structure (Django URLs - Server-Side)

```python
# apps/core/urls.py (public routes)
urlpatterns = [
    path('', views.landing_page, name='landing'),
    path('login/', views.login_page, name='login'),
    path('register/', views.register_page, name='register'),
    path('forgot-password/', views.forgot_password_page, name='forgot_password'),
    path('reset-password/<str:token>/', views.reset_password_page, name='reset_password'),
    path('verify-certificate/', views.verify_certificate_page, name='verify_certificate'),
]
```

### Subdomain Detection Strategy

1. Main domain serves platform landing
2. Tenant subdomains serve tenant-branded pages
3. **TenantMiddleware** extracts subdomain and sets `request.tenant`
4. **InertiaShareMiddleware** passes tenant branding as shared props to all pages

## Components and Interfaces

### TenantBrandingProvider (Shared Props via Middleware)

Tenant branding is passed as shared props via `InertiaShareMiddleware`, not fetched via API.

```python
# apps/core/middleware.py
from inertia import share

class InertiaShareMiddleware:
    def __call__(self, request):
        # Tenant branding available on every page
        if hasattr(request, 'tenant') and request.tenant:
            share(request, tenant={
                'id': request.tenant.id,
                'institutionName': request.tenant.name,
                'tagline': request.tenant.branding.tagline,
                'logoUrl': request.tenant.branding.logo_url,
                'primaryColor': request.tenant.branding.primary_color,
                'secondaryColor': request.tenant.branding.secondary_color,
                'customCss': request.tenant.branding.custom_css,
                'registrationEnabled': request.tenant.registration_enabled,
            })
        return self.get_response(request)
```

```typescript
// Props available on every page via usePage()
interface TenantBranding {
    id: string;
    institutionName: string;
    tagline: string | null;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    customCss: string | null;
    registrationEnabled: boolean;
}
```

### AuthForm Component

Reusable form component using Inertia's `useForm` hook for form handling.

```jsx
// frontend/src/components/forms/AuthForm.jsx
import { useForm } from '@inertiajs/react';

export default function AuthForm({ mode, errors }) {
    const { data, setData, post, processing } = useForm({
        email: '',
        password: '',
        // ... other fields based on mode
    });
    
    const handleSubmit = (e) => {
        e.preventDefault();
        post(`/${mode}/`);  // Inertia handles form submission
    };
    
    return (
        <form onSubmit={handleSubmit}>
            {/* Form fields with error display from props */}
        </form>
    );
}
```

### Django View Patterns (Inertia)

```python
# apps/core/views.py
from inertia import render
from django.shortcuts import redirect
from django.contrib.auth import authenticate, login

def landing_page(request):
    """Platform landing page with subscription tiers."""
    tiers = SubscriptionTier.objects.filter(is_active=True)
    return render(request, 'Public/Landing', {
        'tiers': list(tiers.values('id', 'name', 'price', 'features')),
    })

def login_page(request):
    """Login page with form handling."""
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        user = authenticate(request, email=email, password=password)
        
        if user:
            login(request, user)
            # Role-based redirect
            redirect_url = get_dashboard_url(user.role)
            return redirect(redirect_url)
        
        # Return with error (same message for security)
        return render(request, 'Auth/Login', {
            'errors': {'auth': 'Invalid email or password'},
        })
    
    return render(request, 'Auth/Login', {
        'registrationEnabled': getattr(request.tenant, 'registration_enabled', True),
    })

def verify_certificate_page(request):
    """Certificate verification with form POST."""
    result = None
    if request.method == 'POST':
        serial = request.POST.get('serial_number')
        result = CertificateService.verify(serial, request)  # Logs verification
    
    return render(request, 'Public/VerifyCertificate', {
        'result': result,
    })
```

## Data Models

### Inertia Views (Primary - No /api/ prefix)

| URL | Method | Django View | React Component |
| --- | ------ | ----------- | --------------- |
| `/` | GET | `landing_page` | `Public/Landing` |
| `/login/` | GET/POST | `login_page` | `Auth/Login` |
| `/register/` | GET/POST | `register_page` | `Auth/Register` |
| `/forgot-password/` | GET/POST | `forgot_password_page` | `Auth/ForgotPassword` |
| `/reset-password/<token>/` | GET/POST | `reset_password_page` | `Auth/ResetPassword` |
| `/verify-certificate/` | GET/POST | `verify_certificate_page` | `Public/VerifyCertificate` |

### Props Passed to Components

```typescript
// Landing page props
interface LandingPageProps {
    tiers: SubscriptionTier[];
    tenant?: TenantBranding;  // From shared props
}

// Login page props
interface LoginPageProps {
    errors?: { auth?: string };
    registrationEnabled: boolean;
    tenant?: TenantBranding;  // From shared props
}

// Certificate verification props
interface VerifyCertificateProps {
    result?: {
        found: boolean;
        certificate?: {
            serialNumber: string;
            studentName: string;
            programTitle: string;
            completionDate: string;
            issueDate: string;
            isRevoked: boolean;
            revokedAt: string | null;
        };
    };
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do._

### Property 1: Subscription Tier Display Completeness

_For any_ list of subscription tiers returned by the API, the Landing Page SHALL render each tier with its name, price, and feature list visible in the DOM.

**Validates: Requirements 1.2**

### Property 2: Role-Based Authentication Redirect

_For any_ valid user credentials, upon successful login, the system SHALL redirect to a dashboard URL that corresponds to the user's role (student → /student/dashboard, instructor → /instructor/dashboard, admin → /admin/dashboard).

**Validates: Requirements 2.2**

### Property 3: Login Error Message Security

_For any_ invalid login attempt (wrong email, wrong password, or both), the error message displayed SHALL be identical and not reveal which field was incorrect.

**Validates: Requirements 2.3**

### Property 4: Registration Link Conditional Visibility

_For any_ tenant configuration, the registration link on the login page SHALL be visible if and only if the tenant's `registrationEnabled` setting is true.

**Validates: Requirements 2.5**

### Property 5: Tenant Branding Application

_For any_ tenant branding configuration, when a page is accessed via that tenant's subdomain, the page SHALL apply the tenant's primary color, secondary color, logo URL, and custom CSS (if present) to the rendered output.

**Validates: Requirements 2.6, 3.6, 6.1, 6.2, 6.4**

### Property 6: Student Role Assignment on Registration

_For any_ valid registration request, the created user account SHALL have the role set to "student" and be associated with the current tenant.

**Validates: Requirements 3.2**

### Property 7: Duplicate Email Rejection

_For any_ registration attempt where the email already exists in the system, the registration SHALL fail and return an error indicating the email is taken.

**Validates: Requirements 3.3**

### Property 8: Password Strength Validation

_For any_ password that does not meet strength requirements (minimum length, complexity), the registration or password reset SHALL fail with a message listing the unmet requirements.

**Validates: Requirements 3.4**

### Property 9: Registration Disabled Access Control

_For any_ tenant where self-registration is disabled, accessing the registration page SHALL display a "registration closed" message instead of the registration form.

**Validates: Requirements 3.5**

### Property 10: Password Reset Email Enumeration Prevention

_For any_ email submitted to the forgot password endpoint (existing or non-existing), the API response and displayed message SHALL be identical, preventing email enumeration.

**Validates: Requirements 4.2**

### Property 11: Password Reset Token Validity

_For any_ valid reset token and new password meeting strength requirements, the password reset SHALL succeed and the user SHALL be able to login with the new password.

**Validates: Requirements 4.5**

### Property 12: Certificate Verification Detail Display

_For any_ valid certificate serial number, the verification page SHALL display the student name, program title, completion date, and issue date. If the certificate is revoked, it SHALL additionally display the revoked status and revocation date.

**Validates: Requirements 5.2, 5.3**

### Property 13: Verification Audit Logging

_For any_ certificate verification attempt, a VerificationLog record SHALL be created containing the queried serial number, IP address, user agent, result (valid/revoked/not_found), and timestamp.

**Validates: Requirements 5.5**

### Property 14: Tenant Navigation Conditional Display

_For any_ tenant subdomain, the navigation SHALL display login link always, and registration link only if registration is enabled for that tenant.

**Validates: Requirements 6.3**

## Error Handling

### Authentication Errors

| Error Scenario      | HTTP Status | User Message                 |
| ------------------- | ----------- | ---------------------------- |
| Invalid credentials | 401         | "Invalid email or password"  |
| Account locked      | 403         | "Account temporarily locked" |
| Tenant inactive     | 403         | "Institution unavailable"    |

### Registration Errors

| Error Scenario        | HTTP Status | User Message                    |
| --------------------- | ----------- | ------------------------------- |
| Duplicate email       | 400         | "Email already registered"      |
| Weak password         | 400         | "Password requirements not met" |
| Registration disabled | 403         | "Registration is closed"        |
| Tenant limit exceeded | 403         | "Institution at capacity"       |

### Certificate Verification Errors

| Error Scenario | HTTP Status | User Message                         |
| -------------- | ----------- | ------------------------------------ |
| Not found      | 200         | "Certificate not found"              |
| Revoked        | 200         | Certificate details + revoked status |
| Invalid format | 400         | "Invalid serial number format"       |

## Testing Strategy

### Unit Tests

-   Component rendering with various props
-   Form validation logic
-   API service functions
-   Utility functions (subdomain extraction, color application)

### Property-Based Tests

Using **Hypothesis** (Python) for backend and **fast-check** (JavaScript) for frontend.

**Configuration:** Minimum 100 iterations per property test

**Backend Property Tests:**

-   Property 2: Role-based redirect logic
-   Property 3: Error message consistency
-   Property 6: User creation with student role
-   Property 7: Duplicate email detection
-   Property 8: Password strength validation
-   Property 10: Email enumeration prevention
-   Property 11: Password reset flow
-   Property 12: Certificate verification response
-   Property 13: Verification logging

**Frontend Property Tests:**

-   Property 1: Subscription tier rendering
-   Property 4: Registration link visibility
-   Property 5: Branding CSS application
-   Property 9: Registration disabled state
-   Property 14: Navigation conditional display

### Integration Tests

-   Full login flow (form → API → redirect)
-   Full registration flow (form → API → success)
-   Password reset flow (request → email → reset)
-   Certificate verification flow (search → display)
-   Tenant branding flow (subdomain → API → styled page)
