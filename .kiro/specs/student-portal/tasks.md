# Implementation Plan: Student Portal

## Overview

This implementation plan covers the student portal for Crossview LMS including the dashboard, program navigation, session viewer, assessment results, practicum submissions, certificates, and profile management. The implementation follows a backend-first approach, establishing API endpoints before building the React frontend components.

## Tasks

-   [ ] 1. Set up student dashboard API endpoints

    -   [ ] 1.1 Create dashboard endpoint

        -   Implement GET `/api/student/dashboard/`
        -   Return enrollments summary, recent activity, upcoming deadlines
        -   _Requirements: 1.1, 1.2, 1.3, 1.4_

    -   [ ] 1.2 Create enrollments list endpoint

        -   Implement GET `/api/student/enrollments/`
        -   Support filtering by status (active, completed, withdrawn)
        -   Include progress percentage calculation
        -   _Requirements: 2.1, 2.2, 2.3, 2.5_

    -   [ ] 1.3 Write property tests for dashboard and enrollments
        -   **Property 4: Enrollment Status Filtering**
        -   **Property 7: Progress Percentage Calculation**
        -   **Validates: Requirements 2.3, 2.5**

-   [ ] 2. Set up curriculum and progress API endpoints

    -   [ ] 2.1 Create program with curriculum endpoint

        -   Implement GET `/api/student/programs/:id/`
        -   Return program details with full curriculum tree
        -   Include blueprint hierarchy labels
        -   _Requirements: 3.1, 3.3_

    -   [ ] 2.2 Create node completions endpoint

        -   Implement GET `/api/student/enrollments/:id/completions/`
        -   Return all node completions for enrollment
        -   _Requirements: 3.2_

    -   [ ] 2.3 Create mark complete endpoint

        -   Implement POST `/api/student/enrollments/:id/complete/:nodeId/`
        -   Create NodeCompletion record
        -   Validate node is unlocked before allowing completion
        -   _Requirements: 4.3, 4.4_

    -   [ ] 2.4 Create unlock status endpoint

        -   Implement GET `/api/student/enrollments/:id/unlock-status/:nodeId/`
        -   Check prerequisites and sequential completion rules
        -   Return unlock status with reason if locked
        -   _Requirements: 3.5, 3.6, 4.7_

    -   [ ] 2.5 Write property tests for curriculum and progress
        -   **Property 6: Node Unlock Logic**
        -   **Property 10: Node Completion Record Creation**
        -   **Validates: Requirements 3.5, 3.6, 4.4**

-   [ ] 3. Set up assessment results API endpoint

    -   [ ] 3.1 Create assessment results endpoint

        -   Implement GET `/api/student/assessments/`
        -   Return only published results
        -   Support filtering by program and status
        -   Include component scores and comments
        -   _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

    -   [ ] 3.2 Write property tests for assessment results
        -   **Property 11: Published Results Filtering**
        -   **Validates: Requirements 5.1, 5.6**

-   [ ] 4. Set up practicum API endpoints

    -   [ ] 4.1 Create practicum submissions list endpoint

        -   Implement GET `/api/student/practicum/`
        -   Return all submissions with reviews
        -   Support filtering by program and status
        -   _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

    -   [ ] 4.2 Create practicum upload endpoint

        -   Implement POST `/api/student/practicum/upload/`
        -   Validate file type and size against node configuration
        -   Create PracticumSubmission with pending status
        -   Handle versioning for revision uploads
        -   _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

    -   [ ] 4.3 Create practicum download endpoint

        -   Implement GET `/api/student/practicum/:id/download/`
        -   Return signed URL for file download
        -   _Requirements: 7.6_

    -   [ ] 4.4 Write property tests for practicum
        -   **Property 13: Practicum File Validation**
        -   **Property 14: Practicum Submission Creation**
        -   **Validates: Requirements 6.2, 6.3, 6.4**

-   [ ] 5. Set up certificates API endpoints

    -   [ ] 5.1 Create certificates list endpoint

        -   Implement GET `/api/student/certificates/`
        -   Return all certificates with revoked status
        -   _Requirements: 8.1, 8.2, 8.5_

    -   [ ] 5.2 Create certificate download endpoint
        -   Implement GET `/api/student/certificates/:id/download/`
        -   Return signed URL for PDF download
        -   Block download for revoked certificates
        -   _Requirements: 8.3, 8.5_

-   [ ] 6. Set up profile API endpoints

    -   [ ] 6.1 Create profile get/update endpoint

        -   Implement GET/PUT `/api/student/profile/`
        -   Return user info with tenant name
        -   Allow updating name and phone only
        -   _Requirements: 9.1, 9.2, 9.5, 9.6_

    -   [ ] 6.2 Create password change endpoint

        -   Implement POST `/api/student/profile/password/`
        -   Verify current password before change
        -   Validate new password strength
        -   _Requirements: 9.3, 9.4_

    -   [ ] 6.3 Write property tests for profile
        -   **Property 17: Profile Update Persistence**
        -   **Property 18: Password Change Security**
        -   **Validates: Requirements 9.2, 9.3, 9.4**

-   [ ] 7. Checkpoint - Backend API complete

    -   Ensure all API tests pass
    -   Ask the user if questions arise

-   [ ] 8. Create frontend shared components

    -   [ ] 8.1 Create StudentLayout component

        -   Sidebar navigation with active state
        -   Header with user info
        -   Responsive design for mobile
        -   _Requirements: All student pages_

    -   [ ] 8.2 Create CurriculumTree component

        -   Recursive tree rendering with expand/collapse
        -   Node status indicators (completed, in-progress, locked)
        -   Custom hierarchy labels from blueprint
        -   Click handler for navigation
        -   _Requirements: 3.1, 3.2, 3.3, 3.4_

    -   [ ] 8.3 Create ProgressBar component

        -   Reusable progress indicator
        -   Percentage display
        -   _Requirements: 1.2, 2.3_

    -   [ ] 8.4 Create FileUpload component
        -   Drag and drop support
        -   File type and size validation
        -   Upload progress indicator
        -   _Requirements: 6.1, 6.2, 6.3_

-   [ ] 9. Create student dashboard page

    -   [ ] 9.1 Create Dashboard component

        -   Enrollment cards with progress
        -   Recent activity list
        -   Upcoming deadlines section
        -   Empty state for no enrollments
        -   _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

    -   [ ] 9.2 Write property tests for dashboard
        -   **Property 1: Dashboard Enrollment Display Completeness**
        -   **Property 2: Dashboard Activity and Deadline Display**
        -   **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

-   [ ] 10. Create program pages

    -   [ ] 10.1 Create ProgramList component

        -   Program cards with status and progress
        -   Status filter controls
        -   Navigation to program view
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
        -   Breadcrumb navigation
        -   Previous/next sibling navigation
        -   Mark as complete button
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
        -   Filter by program and status
        -   Lecturer comments display
        -   _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

    -   [ ] 12.2 Write property tests for assessment results
        -   **Property 12: Assessment Result Display Completeness**
        -   **Validates: Requirements 5.2, 5.3, 5.4**

-   [ ] 13. Create practicum pages

    -   [ ] 13.1 Create PracticumHistory component

        -   Submissions list with status
        -   Review comments and scores display
        -   Download functionality
        -   Filter by program and status
        -   _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

    -   [ ] 13.2 Create PracticumUpload component

        -   FileUpload integration
        -   Current submission status display
        -   Rubric criteria display
        -   Version handling for revisions
        -   _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

    -   [ ] 13.3 Write property tests for practicum pages
        -   **Property 15: Submission Display Completeness**
        -   **Validates: Requirements 7.2, 7.3, 7.4**

-   [ ] 14. Create certificates page

    -   [ ] 14.1 Create Certificates component

        -   Certificate cards with details
        -   Download and share buttons
        -   Revoked status handling
        -   Empty state
        -   _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

    -   [ ] 14.2 Write property tests for certificates
        -   **Property 16: Certificate Display and Actions**
        -   **Validates: Requirements 8.2, 8.3, 8.4, 8.5**

-   [ ] 15. Create profile settings page

    -   [ ] 15.1 Create ProfileSettings component
        -   Profile form with name, email (read-only), phone
        -   Password change form
        -   Tenant name display
        -   _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

-   [ ] 16. Set up routing

    -   [ ] 16.1 Configure React Router for student portal
        -   Set up all student routes
        -   Protected route wrapper for authentication
        -   _Requirements: All student pages_

-   [ ] 17. Final checkpoint - Integration complete
    -   Ensure all tests pass
    -   Verify all pages render correctly
    -   Ask the user if questions arise

## Notes

-   All tasks including property tests are required for comprehensive coverage
-   Backend tasks (1-6) should be completed before frontend tasks (8-16)
-   Property tests use Hypothesis (Python) for backend and fast-check (JS) for frontend
-   Each property test should run minimum 100 iterations
