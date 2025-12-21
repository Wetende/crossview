# Implementation Plan: Public Pages

## Overview

This implementation plan covers the public-facing pages for Crossview LMS including the landing page, authentication flows, certificate verification, and tenant branding. The implementation follows an **Inertia-first approach** - Django views return React components with props directly, no separate REST API needed.

## Architecture Notes

> **Inertia-First**: All page rendering uses Django views with `inertia.render()`. Forms use `router.post()` which submits to the same URL and returns updated props with errors.

## Tasks

-   [x] 1. Set up Inertia middleware and shared data

    -   [x] 1.1 Create TenantMiddleware

        -   Extract subdomain from request host
        -   Load tenant and set `request.tenant`
        -   Handle inactive tenant and not found cases
        -   _Requirements: 6.1, 6.5, 6.6_

    -   [x] 1.2 Create InertiaShareMiddleware

        -   Share tenant branding on every page (logo, colors, settings)
        -   Share flash messages for feedback
        -   _Requirements: 2.6, 3.6, 6.1, 6.2, 6.4_

-   [x] 2. Set up authentication Inertia views

    -   [x] 2.1 Create login view

        -   GET: Render `Auth/Login` component with `registrationEnabled` prop
        -   POST: Authenticate user, redirect to role-based dashboard on success
        -   POST: Return same component with `errors` prop on failure
        -   _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6_

    -   [x] 2.2 Create registration view

        -   GET: Render `Auth/Register` component (or closed message if disabled)
        -   POST: Create user with student role, associate with tenant
        -   POST: Return with `errors` prop on validation failure
        -   _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

    -   [x] 2.3 Create password reset views

        -   GET `/forgot-password/`: Render `Auth/ForgotPassword` component
        -   POST `/forgot-password/`: Send reset email, return success message
        -   GET `/reset-password/<token>/`: Render `Auth/ResetPassword` with token validation
        -   POST `/reset-password/<token>/`: Reset password, redirect to login
        -   _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

    -   [x] 2.4 Write property tests for auth views
        -   **Property 2: Role-Based Authentication Redirect**
        -   **Property 3: Login Error Message Security**
        -   **Property 6: Student Role Assignment on Registration**
        -   **Property 7: Duplicate Email Rejection**
        -   **Property 8: Password Strength Validation**
        -   **Property 10: Password Reset Email Enumeration Prevention**
        -   **Validates: Requirements 2.2, 2.3, 3.2, 3.3, 3.4, 4.2**

-   [x] 3. Set up public page Inertia views

    -   [x] 3.1 Create landing page view

        -   Render `Public/Landing` with subscription tiers
        -   _Requirements: 1.1, 1.2, 1.3_

    -   [x] 3.2 Create certificate verification view

        -   GET: Render `Public/VerifyCertificate` with empty form
        -   POST: Verify certificate, return result as prop
        -   Log verification attempt (IP, user agent, result)
        -   _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

    -   [x] 3.3 Write property tests for public views
        -   **Property 12: Certificate Verification Detail Display**
        -   **Property 13: Verification Audit Logging**
        -   **Validates: Requirements 5.2, 5.3, 5.5**

-   [x] 4. Checkpoint - Backend views complete

    -   Ensure all view tests pass
    -   Ask the user if questions arise

-   [x] 5. Create frontend page components (Inertia Pages)

    -   [x] 5.1 Create Landing Page component

        -   Display platform features and subscription tiers from props
        -   Call-to-action buttons using `<Link href="/register/">`
        -   Apply MUI theme, Framer Motion animations
        -   _Requirements: 1.1, 1.2, 1.3, 1.4_

    -   [x] 5.2 Create Login Page component

        -   Use `useForm` hook from `@inertiajs/react`
        -   Display errors from props
        -   Conditional registration link based on `registrationEnabled` prop
        -   Apply tenant branding from shared props
        -   _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

    -   [x] 5.3 Create Register Page component

        -   Use `useForm` hook for form submission
        -   Display password strength requirements
        -   Show "registration closed" if `registrationEnabled` is false
        -   _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

    -   [x] 5.4 Create Password Reset pages

        -   ForgotPassword: Email form with `useForm`
        -   ResetPassword: New password form with token from URL
        -   _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

    -   [x] 5.5 Create Certificate Verification Page

        -   Search form using `useForm` and `router.post()`
        -   Display certificate details from `result` prop
        -   Show revoked status when applicable
        -   _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_

    -   [x] 5.6 Create Tenant Landing Page component

        -   Display tenant branding from shared props
        -   Navigation with conditional registration link
        -   _Requirements: 6.1, 6.2, 6.3, 6.4_

    -   [ ] 5.7 Write property tests for frontend components
        -   **Property 1: Subscription Tier Display Completeness**
        -   **Property 4: Registration Link Conditional Visibility**
        -   **Property 5: Tenant Branding Application**
        -   **Property 9: Registration Disabled Access Control**
        -   **Property 14: Tenant Navigation Conditional Display**
        -   **Validates: Requirements 1.2, 2.5, 2.6, 3.5, 6.3**

-   [x] 6. Create shared components

    -   [x] 6.1 Create AuthForm component

        -   Reusable form with MUI TextField components
        -   Support login, register, forgot-password, reset-password modes
        -   Error display from props
        -   _Requirements: 2.1, 3.1_

    -   [x] 6.2 Create PublicLayout component

        -   Apply tenant branding CSS variables
        -   Inject custom CSS if present
        -   Handle error states (tenant not found, inactive)
        -   _Requirements: 6.5, 6.6_

-   [x] 7. Configure Django URLs (Server-Side Routing)

    -   [x] 7.1 Set up public page URLs

        -   Configure all public routes in `apps/core/urls.py`
        -   No `/api/` prefix - these are Inertia pages
        -   _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_

-   [ ] 8. Final checkpoint - Integration complete
    -   Ensure all tests pass
    -   Verify all pages render correctly with Inertia
    -   Test form submissions work with `router.post()`
    -   Ask the user if questions arise

## Notes

-   **No REST API endpoints** - All data flows through Inertia views
-   Forms use `useForm` hook and `router.post()` - errors returned as props
-   Tenant branding passed via `InertiaShareMiddleware` (available on every page)
-   Property tests use Hypothesis (Python) for backend and fast-check (JS) for frontend
-   Each property test should run minimum 100 iterations
