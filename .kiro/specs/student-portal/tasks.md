# Implementation Plan: Student Portal

## Overview

This implementation plan covers the student portal for Crossview LMS including the dashboard, program navigation, session viewer, assessment results, practicum submissions, certificates, and profile management. The implementation follows an **Inertia-first approach** - Django views return React components with props directly.

## Architecture Notes

> **Inertia-First**: All page rendering uses Django views with `inertia.render()`. Forms use `router.post()`. Only file uploads and downloads use REST API endpoints.

> **Partial Reloads**: For pagination and filtering, use `router.visit({ only: ['items'] })` to fetch only the changed data without re-rendering the entire page.

## Tasks

-   [-] 1. Set up student Inertia views - Dashboard & Programs

    -   [-] 1.1 Create dashboard view

        -   Render `Student/Dashboard` with enrollments, activity, deadlines
        -   Calculate progress percentage for each enrollment
        -   _Requirements: 1.1, 1.2, 1.3, 1.4_

    -   [ ] 1.2 Create program list view

        -   Render `Student/Programs/Index` with enrollments
        -   Support filtering by status via query params
        -   Use Partial Reloads for filter changes
        -   _Requirements: 2.1, 2.2, 2.3, 2.5_

    -   [ ] 1.3 Create program view with curriculum

        -   Render `Student/Programs/Show` with curriculum tree
        -   Include blueprint hierarchy labels
        -   Include node completions for status display
        -   _Requirements: 3.1, 3.2, 3.3_

    -   [ ] 1.4 Write property tests for dashboard and programs
        -   **Property 4: Enrollment Status Filtering**
        -   **Property 7: Progress Percentage Calculation**
        -   **Validates: Requirements 2.3, 2.5**

-   [ ] 2. Set up session viewer and progress views

    -   [ ] 2.1 Create session viewer view

        -   GET: Render `Student/Session` with node content, breadcrumbs, siblings
        -   POST: Handle mark-as-complete, return updated props
        -   Check unlock status (prerequisites, sequential)
        -   _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

    -   [ ] 2.2 Write property tests for session viewer
        -   **Property 6: Node Unlock Logic**
        -   **Property 10: Node Completion Record Creation**
        -   **Validates: Requirements 3.5, 3.6, 4.4**

-   [ ] 3. Set up assessment results view

    -   [ ] 3.1 Create assessment results view

        -   Render `Student/Assessments` with published results only
        -   Support filtering by program via query params
        -   Use Partial Reloads for pagination (`only: ['results', 'pagination']`)
        -   _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

    -   [ ] 3.2 Write property tests for assessment results
        -   **Property 11: Published Results Filtering**
        -   **Validates: Requirements 5.1, 5.6**

-   [ ] 4. Set up practicum views and API

    -   [ ] 4.1 Create practicum history view

        -   Render `Student/Practicum/Index` with submissions and reviews
        -   Support filtering by program and status
        -   Use Partial Reloads for pagination
        -   _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

    -   [ ] 4.2 Create practicum upload view

        -   Render `Student/Practicum/Upload` with node config, rubric
        -   Display current submission status
        -   _Requirements: 6.1, 6.5, 6.6, 6.7_

    -   [ ] 4.3 Create practicum upload REST API endpoint

        -   POST `/api/v1/student/practicum/upload/` (multipart/form-data)
        -   Validate file type and size against node configuration
        -   Create PracticumSubmission with pending status
        -   Handle versioning for revision uploads
        -   _Requirements: 6.2, 6.3, 6.4_

    -   [ ] 4.4 Create practicum download REST API endpoint

        -   GET `/api/v1/student/practicum/<id>/download/`
        -   Return signed URL for file download
        -   _Requirements: 7.6_

    -   [ ] 4.5 Write property tests for practicum
        -   **Property 13: Practicum File Validation**
        -   **Property 14: Practicum Submission Creation**
        -   **Validates: Requirements 6.2, 6.3, 6.4**

-   [ ] 5. Set up certificates view and API

    -   [ ] 5.1 Create certificates view

        -   Render `Student/Certificates` with all certificates
        -   Include revoked status handling
        -   _Requirements: 8.1, 8.2, 8.5, 8.6_

    -   [ ] 5.2 Create certificate download REST API endpoint

        -   GET `/api/v1/student/certificates/<id>/download/`
        -   Return signed URL for PDF download
        -   Block download for revoked certificates
        -   _Requirements: 8.3, 8.5_

-   [ ] 6. Set up profile view

    -   [ ] 6.1 Create profile settings view

        -   GET: Render `Student/Profile` with user info
        -   POST: Handle profile update (name, phone only)
        -   POST: Handle password change with current password verification
        -   Return errors as props on validation failure
        -   _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

    -   [ ] 6.2 Write property tests for profile
        -   **Property 17: Profile Update Persistence**
        -   **Property 18: Password Change Security**
        -   **Validates: Requirements 9.2, 9.3, 9.4**

-   [ ] 7. Checkpoint - Backend views complete

    -   Ensure all view tests pass
    -   Ask the user if questions arise

-   [ ] 8. Create frontend shared components

    -   [ ] 8.1 Create StudentLayout component

        -   Sidebar navigation with active state from URL
        -   Header with user info from shared props
        -   Responsive design for mobile
        -   _Requirements: All student pages_

    -   [ ] 8.2 Create CurriculumTree component

        -   Recursive tree rendering with expand/collapse
        -   Node status indicators (completed, in-progress, locked)
        -   Custom hierarchy labels from blueprint
        -   Uses `<Link>` for navigation
        -   _Requirements: 3.1, 3.2, 3.3, 3.4_

    -   [ ] 8.3 Create ProgressBar component

        -   Reusable progress indicator with MUI LinearProgress
        -   Percentage display
        -   _Requirements: 1.2, 2.3_

    -   [ ] 8.4 Create FileUpload component

        -   Drag and drop support
        -   File type and size validation (client-side)
        -   Upload progress indicator
        -   Uses axios for REST API upload
        -   _Requirements: 6.1, 6.2, 6.3_

-   [ ] 9. Create student dashboard page

    -   [ ] 9.1 Create Dashboard component

        -   Enrollment cards with progress using `<Link>`
        -   Recent activity list
        -   Upcoming deadlines section
        -   Empty state for no enrollments
        -   Framer Motion entrance animations
        -   _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

    -   [ ] 9.2 Write property tests for dashboard
        -   **Property 1: Dashboard Enrollment Display Completeness**
        -   **Property 2: Dashboard Activity and Deadline Display**
        -   **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

-   [ ] 10. Create program pages

    -   [ ] 10.1 Create ProgramList component

        -   Program cards with status and progress
        -   Status filter using `router.visit({ only: ['enrollments'] })`
        -   Navigation using `<Link>`
        -   _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

    -   [ ] 10.2 Create ProgramView component

        -   Program header with details
        -   CurriculumTree integration
        -   Progress summary
        -   _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

    -   [ ] 10.3 Write property tests for program pages
        -   **Property 3: Program List Display Completeness**
        -   **Property 5: Curriculum Tree Hierarchical Rendering**
        -   **Validates: Requirements 2.2, 2.3, 3.1, 3.2, 3.3**

-   [ ] 11. Create session viewer page

    -   [ ] 11.1 Create SessionViewer component

        -   Content HTML rendering with media
        -   Breadcrumb navigation using `<Link>`
        -   Previous/next sibling navigation
        -   Mark as complete using `router.post()`
        -   Locked state display
        -   _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

    -   [ ] 11.2 Write property tests for session viewer
        -   **Property 8: Session Content Rendering**
        -   **Property 9: Breadcrumb Path Generation**
        -   **Validates: Requirements 4.1, 4.2, 4.5**

-   [ ] 12. Create assessment results page

    -   [ ] 12.1 Create AssessmentResults component

        -   Results list with scores and status
        -   Component scores breakdown
        -   Filter using `router.visit({ only: ['results'] })`
        -   Pagination using Partial Reloads
        -   Lecturer comments display
        -   _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

    -   [ ] 12.2 Write property tests for assessment results
        -   **Property 12: Assessment Result Display Completeness**
        -   **Validates: Requirements 5.2, 5.3, 5.4**

-   [ ] 13. Create practicum pages

    -   [ ] 13.1 Create PracticumHistory component

        -   Submissions list with status
        -   Review comments and scores display
        -   Download using REST API signed URL
        -   Filter using Partial Reloads
        -   _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

    -   [ ] 13.2 Create PracticumUpload component

        -   FileUpload integration with axios
        -   Current submission status display
        -   Rubric criteria display
        -   Version handling for revisions
        -   Refresh page after upload with `router.reload()`
        -   _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

    -   [ ] 13.3 Write property tests for practicum pages
        -   **Property 15: Submission Display Completeness**
        -   **Validates: Requirements 7.2, 7.3, 7.4**

-   [ ] 14. Create certificates page

    -   [ ] 14.1 Create Certificates component

        -   Certificate cards with details
        -   Download using REST API signed URL
        -   Share button with verification URL
        -   Revoked status handling
        -   Empty state
        -   _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

    -   [ ] 14.2 Write property tests for certificates
        -   **Property 16: Certificate Display and Actions**
        -   **Validates: Requirements 8.2, 8.3, 8.4, 8.5**

-   [ ] 15. Create profile settings page

    -   [ ] 15.1 Create ProfileSettings component

        -   Profile form using `useForm` hook
        -   Email (read-only), name, phone fields
        -   Password change form with current password
        -   Submit using `router.post()`
        -   Tenant name display from shared props
        -   _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

-   [ ] 16. Configure Django URLs (Server-Side Routing)

    -   [ ] 16.1 Set up student portal URLs

        -   Configure all Inertia routes in `apps/student/urls.py`
        -   Configure REST API routes for file operations
        -   Add authentication decorator to all views
        -   _Requirements: All student pages_

-   [ ] 17. Final checkpoint - Integration complete

    -   Ensure all tests pass
    -   Verify all pages render correctly with Inertia
    -   Test Partial Reloads work for pagination/filtering
    -   Test file uploads work with REST API
    -   Ask the user if questions arise

## Notes

-   **Inertia for pages**: All page rendering uses Django views with `inertia.render()`
-   **Inertia for forms**: Use `router.post()` - errors returned as props
-   **Inertia Partial Reloads**: Use `router.visit({ only: ['items'] })` for pagination/filtering
-   **REST API only for files**: Practicum uploads and certificate/submission downloads
-   **CSRF for REST API**: Configure axios with CSRF token when calling REST endpoints from browser
-   Property tests use Hypothesis (Python) for backend and fast-check (JS) for frontend
-   Each property test should run minimum 100 iterations
