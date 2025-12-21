# Implementation Plan: Public Pages

## Overview

This implementation plan covers the public-facing pages for Crossview LMS including the landing page, authentication flows, certificate verification, and tenant branding. The implementation follows a backend-first approach, establishing API endpoints before building the React frontend components.

## Tasks

-   [ ] 1. Set up authentication API endpoints

    -   [ ] 1.1 Create auth app views for login endpoint

        -   Implement POST `/api/auth/login/` with email/password validation
        -   Return JWT token, user info, and role-based redirect URL
        -   _Requirements: 2.2_

    -   [ ] 1.2 Create auth app views for registration endpoint

        -   Implement POST `/api/auth/register/` with validation
        -   Create user with student role, associate with tenant
        -   Check tenant registration settings before allowing
        -   _Requirements: 3.2, 3.5_

    -   [ ] 1.3 Create password reset endpoints

        -   Implement POST `/api/auth/forgot-password/`
        -   Implement POST `/api/auth/reset-password/`
        -   Generate secure tokens with expiration
        -   _Requirements: 4.1, 4.2, 4.5_

    -   [ ] 1.4 Write property tests for auth endpoints
        -   **Property 2: Role-Based Authentication Redirect**
        -   **Property 3: Login Error Message Security**
        -   **Property 6: Student Role Assignment on Registration**
        -   **Property 7: Duplicate Email Rejection**
        -   **Property 8: Password Strength Validation**
        -   **Property 10: Password Reset Email Enumeration Prevention**
        -   **Validates: Requirements 2.2, 2.3, 3.2, 3.3, 3.4, 4.2**

-   [ ] 2. Set up tenant branding API endpoints

    -   [ ] 2.1 Create tenant branding endpoint

        -   Implement GET `/api/tenants/branding/` with subdomain parameter
        -   Return branding config (logo, colors, settings)
        -   Handle inactive tenant and not found cases
        -   _Requirements: 6.1, 6.2, 6.5, 6.6_

    -   [ ] 2.2 Create subscription tiers endpoint
        -   Implement GET `/api/tenants/tiers/` for landing page
        -   Return active tiers with pricing and features
        -   _Requirements: 1.2_

-   [ ] 3. Set up certificate verification API endpoint

    -   [ ] 3.1 Create certificate verification endpoint

        -   Implement POST `/api/certificates/verify/`
        -   Return certificate details or not found
        -   Handle revoked certificates
        -   _Requirements: 5.2, 5.3, 5.4_

    -   [ ] 3.2 Implement verification audit logging

        -   Create VerificationLog on each verification attempt
        -   Capture IP address, user agent, result, timestamp
        -   _Requirements: 5.5_

    -   [ ] 3.3 Write property tests for certificate verification
        -   **Property 12: Certificate Verification Detail Display**
        -   **Property 13: Verification Audit Logging**
        -   **Validates: Requirements 5.2, 5.3, 5.5**

-   [ ] 4. Checkpoint - Backend API complete

    -   Ensure all API tests pass
    -   Ask the user if questions arise

-   [ ] 5. Create frontend shared components

    -   [ ] 5.1 Create TenantBrandingProvider context

        -   Fetch branding based on subdomain
        -   Apply CSS variables for colors
        -   Inject custom CSS if present
        -   _Requirements: 2.6, 3.6, 6.1, 6.2, 6.4_

    -   [ ] 5.2 Create AuthForm component

        -   Support login, register, forgot-password, reset-password modes
        -   Handle form validation and error display
        -   _Requirements: 2.1, 3.1_

    -   [ ] 5.3 Create AlertMessage and LoadingSpinner components
        -   Reusable UI components for feedback
        -   _Requirements: 2.3, 3.3, 3.4_

-   [ ] 6. Create public page components

    -   [ ] 6.1 Create Landing Page component

        -   Display platform features and subscription tiers
        -   Call-to-action buttons for registration
        -   _Requirements: 1.1, 1.2, 1.3_

    -   [ ] 6.2 Create Login Page component

        -   Use AuthForm in login mode
        -   Apply tenant branding
        -   Conditional registration link based on tenant settings
        -   _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

    -   [ ] 6.3 Create Register Page component

        -   Use AuthForm in register mode
        -   Check registration enabled setting
        -   Display closed message if disabled
        -   _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

    -   [ ] 6.4 Create Password Reset pages

        -   Forgot password page with email form
        -   Reset password page with token validation
        -   _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

    -   [ ] 6.5 Create Certificate Verification Page

        -   Search form for serial number
        -   Display certificate details or not found
        -   Show revoked status when applicable
        -   _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_

    -   [ ] 6.6 Create Tenant Landing Page

        -   Display tenant branding
        -   Navigation with conditional registration link
        -   _Requirements: 6.1, 6.2, 6.3, 6.4_

    -   [ ] 6.7 Write property tests for frontend components
        -   **Property 1: Subscription Tier Display Completeness**
        -   **Property 4: Registration Link Conditional Visibility**
        -   **Property 5: Tenant Branding Application**
        -   **Property 9: Registration Disabled Access Control**
        -   **Property 14: Tenant Navigation Conditional Display**
        -   **Validates: Requirements 1.2, 2.5, 2.6, 3.5, 6.3**

-   [ ] 7. Set up routing and navigation

    -   [ ] 7.1 Configure React Router for public pages

        -   Set up routes for all public pages
        -   Handle subdomain-based routing
        -   _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_

    -   [ ] 7.2 Create public layout wrapper
        -   Apply tenant branding context
        -   Handle error states (tenant not found, inactive)
        -   _Requirements: 6.5, 6.6_

-   [ ] 8. Final checkpoint - Integration complete
    -   Ensure all tests pass
    -   Verify all pages render correctly
    -   Ask the user if questions arise

## Notes

-   Backend tasks (1-3) should be completed before frontend tasks (5-7)
-   Property tests use Hypothesis (Python) for backend and fast-check (JS) for frontend
-   Each property test should run minimum 100 iterations
