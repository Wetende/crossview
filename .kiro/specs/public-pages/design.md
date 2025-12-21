# Design Document: Public Pages

## Overview

The public pages module provides the unauthenticated entry points for the Crossview LMS platform. This includes the marketing landing page, authentication flows (login, registration, password reset), certificate verification, and tenant-specific branded landing pages.

The design follows a React-based SPA architecture using the existing frontend stack (React, Vite, TailwindCSS) with Django REST API backend integration. Tenant branding is dynamically applied based on subdomain detection.

## Architecture

### Routing Structure

-   `/` → Landing Page (platform marketing)
-   `/login` → Login Page
-   `/register` → Register Page
-   `/forgot-password` → Forgot Password Page
-   `/reset-password/:token` → Reset Password Page
-   `/verify-certificate` → Certificate Verification Page
-   Tenant subdomains (e.g., `acme.crossview.com`) → Tenant Landing

### Subdomain Detection Strategy

1. Main domain serves platform landing
2. Tenant subdomains serve tenant-branded pages
3. Backend middleware extracts subdomain and loads tenant context
4. Frontend receives tenant branding via API and applies dynamically

## Components and Interfaces

### TenantBrandingProvider

Context provider that fetches and applies tenant branding based on current subdomain.

```typescript
interface TenantBranding {
    tenantId: string;
    institutionName: string;
    tagline: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    customCss: string | null;
    isActive: boolean;
    registrationEnabled: boolean;
}

interface TenantBrandingContextValue {
    branding: TenantBranding | null;
    isLoading: boolean;
    error: string | null;
    isTenantSubdomain: boolean;
}
```

### AuthForm Component

Reusable form component for login, registration, and password reset flows.

```typescript
interface AuthFormProps {
    mode: "login" | "register" | "forgot-password" | "reset-password";
    onSubmit: (data: AuthFormData) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

interface AuthFormData {
    email?: string;
    password?: string;
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    resetToken?: string;
}
```

### API Service Interfaces

```typescript
interface AuthAPI {
    login(email: string, password: string): Promise<LoginResponse>;
    register(data: RegistrationData): Promise<RegistrationResponse>;
    forgotPassword(email: string): Promise<void>;
    resetPassword(token: string, password: string): Promise<void>;
}

interface LoginResponse {
    token: string;
    user: { id: string; email: string; role: string };
    redirectUrl: string;
}

interface CertificateAPI {
    verifyCertificate(
        serialNumber: string
    ): Promise<CertificateVerificationResult>;
}

interface CertificateVerificationResult {
    found: boolean;
    certificate: {
        serialNumber: string;
        studentName: string;
        programTitle: string;
        completionDate: string;
        issueDate: string;
        isRevoked: boolean;
        revokedAt: string | null;
    } | null;
}
```

## Data Models

### Backend API Endpoints

| Endpoint                     | Method | Description                      |
| ---------------------------- | ------ | -------------------------------- |
| `/api/auth/login/`           | POST   | Authenticate user                |
| `/api/auth/register/`        | POST   | Register new student             |
| `/api/auth/forgot-password/` | POST   | Request password reset           |
| `/api/auth/reset-password/`  | POST   | Reset password with token        |
| `/api/tenants/branding/`     | GET    | Get tenant branding by subdomain |
| `/api/tenants/tiers/`        | GET    | Get subscription tiers           |
| `/api/certificates/verify/`  | POST   | Verify certificate by serial     |

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
