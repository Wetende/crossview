# Requirements Document

## Introduction

This document defines the requirements for the Crossview LMS Frontend - a blueprint-driven, adaptive user interface that connects to the Django backend via Inertia.js. The frontend must dynamically adapt its terminology, navigation, and assessment interfaces based on the active Blueprint configuration, supporting multiple educational modes (Theology, TVET, Vocational, Online Courses) from a single codebase.

## Glossary

-   **Blueprint**: A JSON configuration that defines academic hierarchy labels, grading modes, and structural rules for a specific educational context
-   **Node**: A curriculum element in the recursive tree structure (can represent a Program, Year, Unit, Session, Competency, etc. depending on Blueprint)
-   **Inertia_Adapter**: The integration layer connecting Django views to React components via @inertiajs/react
-   **Theme_Provider**: The MUI theme configuration component that applies Crossview branding
-   **Dashboard_Layout**: The main application shell with sidebar navigation and header
-   **Session_Viewer**: The content display component for reading course materials
-   **Assessment_Form**: A dynamic form component that renders based on grading_config.mode
-   **Practicum_Uploader**: Media capture and file upload component for evidence submissions
-   **Progress_Tracker**: Visual representation of student completion status across nodes

## Requirements

### Requirement 1: Project Foundation & Theme System

**User Story:** As a developer, I want a properly configured React + MUI + Inertia.js foundation, so that I can build consistent, branded UI components that integrate seamlessly with Django.

#### Acceptance Criteria

1. THE Project_Foundation SHALL use React 18+, MUI 7, and @inertiajs/react as core dependencies
2. THE Project_Foundation SHALL configure Vite with path aliases (@/) for clean imports
3. THE Theme_Provider SHALL define a default Crossview color palette:
    - Primary: Deep Blue (#2563EB) for trust and professionalism
    - Secondary: Vibrant Teal (#14B8A6) for innovation and digital learning
    - Success: Fresh Green (#10B981) for progress, achievements, and completion states
    - Warning/Action: Warm Coral (#F97316) for CTAs and important notifications
    - Info: Soft Sky Blue (#3B82F6) for backgrounds and hover states
    - Text: Slate Gray (#475569) for body content
    - Background: Light (#F8FAFC) for clean canvas
4. THE Theme_Provider SHALL support configurable color palettes per tenant via theme configuration
5. THE Theme_Provider SHALL configure Archivo font for headings and Figtree font for body text
6. THE Theme_Provider SHALL define responsive breakpoints matching MUI standards (xs: 0, sm: 768, md: 1024, lg: 1266, xl: 1440)
7. WHEN the application loads, THE Inertia_Adapter SHALL resolve page components from the Pages directory structure
8. THE Project_Foundation SHALL include ConfigContext for storing user preferences, active Blueprint reference, and theme configuration
9. WHEN a tenant has custom branding configured, THE Theme_Provider SHALL apply tenant-specific colors while maintaining accessibility contrast ratios

### Requirement 2: Dashboard Layout & Navigation

**User Story:** As a user, I want a consistent layout with sidebar navigation, so that I can easily access different sections of the LMS.

#### Acceptance Criteria

1. THE Dashboard_Layout SHALL render a collapsible sidebar (260px expanded, 72px collapsed) on desktop
2. WHEN the viewport is below 1024px (md breakpoint), THE Dashboard_Layout SHALL convert the sidebar to a temporary drawer
3. THE Sidebar SHALL display navigation items based on the user's role (student, instructor, admin)
4. THE Sidebar SHALL highlight the currently active route with primary color background
5. THE Header SHALL display the application logo, notification bell, and user avatar with dropdown menu
6. THE Header SHALL include a menu toggle button that controls sidebar expansion state
7. WHEN a user clicks the avatar dropdown, THE Header SHALL show Profile, Settings, and Logout options
8. THE Dashboard_Layout SHALL pass page props from Inertia to child components via Outlet

### Requirement 3: Blueprint-Aware Navigation

**User Story:** As a user, I want the navigation labels to match my institution's terminology, so that the interface feels familiar to my educational context.

#### Acceptance Criteria

1. WHEN a Blueprint is active, THE Sidebar SHALL display navigation labels derived from hierarchy_labels (e.g., "My Programs" vs "My Qualifications")
2. THE Breadcrumb component SHALL render path segments using Blueprint hierarchy_labels for each depth level
3. WHEN navigating the curriculum tree, THE Breadcrumb SHALL update to show the current path (e.g., "Diploma > Year 1 > Homiletics > Session 3")
4. THE Navigation_Service SHALL provide a function to translate generic terms to Blueprint-specific labels
5. IF no Blueprint is active, THE Navigation SHALL fall back to default labels ("Courses", "Modules", "Lessons")

### Requirement 4: Student Dashboard

**User Story:** As a student, I want to see my learning progress at a glance, so that I can track my academic journey and know what to do next.

#### Acceptance Criteria

1. THE Student_Dashboard SHALL display progress cards showing overall completion percentage per enrolled program
2. THE Student_Dashboard SHALL show a "Continue Learning" section with the last accessed node
3. THE Student_Dashboard SHALL display upcoming assessments with due dates (if applicable to Blueprint)
4. THE Student_Dashboard SHALL show recent activity feed (completed sessions, submitted practicums, grades received)
5. WHEN a program reaches 100% completion and certificate_enabled is true, THE Student_Dashboard SHALL display a certificate download card
6. THE Progress_Card component SHALL show a circular progress ring with percentage and node count (e.g., "12/20 Sessions")

### Requirement 5: Curriculum Browser

**User Story:** As a student, I want to browse the curriculum tree, so that I can navigate to specific content and understand the course structure.

#### Acceptance Criteria

1. THE Curriculum_Browser SHALL fetch and display the node tree for the selected program via Inertia page props
2. THE Curriculum_Browser SHALL render nodes as expandable tree items or card grid (user preference)
3. WHEN a node has children, THE Node_Card SHALL display an expand/collapse indicator
4. THE Node_Card SHALL show completion status with visual indicators (locked, in-progress, completed)
5. WHEN a node has completion_rules.requires_upload set to true, THE Node_Card SHALL display a practicum badge
6. THE Node_Card SHALL display the node title and node_type label (derived from Blueprint hierarchy)
7. WHEN a user clicks a leaf node (no children), THE Curriculum_Browser SHALL navigate to the Session_Viewer

### Requirement 6: Session/Content Viewer

**User Story:** As a student, I want to read course content in a clean, mobile-friendly format, so that I can learn effectively on any device.

#### Acceptance Criteria

1. THE Session_Viewer SHALL display text content in a readable format with proper typography (max-width 720px, comfortable line-height)
2. WHEN the node properties contain video_url, THE Session_Viewer SHALL render an embedded video player
3. WHEN the node properties contain audio_url, THE Session_Viewer SHALL render an audio player with playback controls
4. THE Session_Viewer SHALL display a progress bar showing scroll position within the content
5. THE Session_Viewer SHALL provide Previous/Next navigation buttons to move between sibling nodes
6. WHEN the current node has completion_rules.requires_upload, THE Next button SHALL be disabled until practicum is submitted
7. WHEN a student completes reading (scrolls to bottom or watches video), THE Session_Viewer SHALL mark the node as viewed via Inertia form submission
8. THE Session_Viewer SHALL be fully responsive and optimized for mobile viewing

### Requirement 7: Assessment Interface

**User Story:** As an instructor, I want to grade students using the appropriate method for my program type, so that assessments align with regulatory requirements.

#### Acceptance Criteria

1. THE Assessment_Form SHALL dynamically render input fields based on grading_config.mode from the Blueprint
2. WHEN grading_config.mode is "summative", THE Assessment_Form SHALL display percentage inputs for each component (e.g., CAT, Exam) with weight labels
3. WHEN grading_config.mode is "cbet", THE Assessment_Form SHALL display Competent/Not Yet Competent toggle buttons
4. WHEN grading_config.mode is "rubric", THE Assessment_Form SHALL display a 4-point scale selector for each criterion
5. WHEN grading_config.mode is "visual_review", THE Assessment_Form SHALL display a checklist with Pass/Fail toggles per item
6. WHEN grading_config.mode is "instructor_checklist", THE Assessment_Form SHALL display checkboxes for each required component
7. THE Assessment_Form SHALL calculate and display the final result based on weights and pass_mark threshold
8. WHEN the form is submitted, THE Assessment_Form SHALL send data via Inertia form submission to the Django backend
9. IF validation fails, THE Assessment_Form SHALL display inline error messages

### Requirement 8: Practicum Upload System

**User Story:** As a student, I want to upload evidence of my practical work, so that instructors can verify my competency.

#### Acceptance Criteria

1. THE Practicum_Uploader SHALL support file upload for images, documents, audio, and video files
2. THE Practicum_Uploader SHALL provide in-browser audio recording using MediaRecorder API
3. THE Practicum_Uploader SHALL provide in-browser video recording using MediaRecorder API with camera preview
4. WHEN recording, THE Practicum_Uploader SHALL display recording duration and a stop button
5. THE Practicum_Uploader SHALL display the rubric criteria that the submission will be graded against
6. WHEN a file is selected or recorded, THE Practicum_Uploader SHALL show a preview before submission
7. THE Practicum_Uploader SHALL display upload progress with a progress bar
8. WHEN submission is complete, THE Practicum_Uploader SHALL show a success message with "Pending Review" status
9. THE Practicum_Uploader SHALL validate file size (max 50MB) and type before upload

### Requirement 9: Practicum Review Interface

**User Story:** As an instructor, I want to review student practicum submissions against a rubric, so that I can provide structured feedback.

#### Acceptance Criteria

1. THE Practicum_Review page SHALL display the student's uploaded media with playback controls
2. THE Practicum_Review page SHALL display the rubric criteria as a scoring form
3. WHEN the Blueprint uses rubric grading, THE Practicum_Review SHALL show score selectors (1-4 or custom scale) per criterion
4. THE Practicum_Review page SHALL provide a text area for instructor feedback comments
5. WHEN all criteria are scored, THE Practicum_Review SHALL calculate and display the overall result
6. THE Practicum_Review page SHALL allow saving as draft before final submission
7. WHEN the review is submitted, THE System SHALL update the node completion status and notify the student

### Requirement 10: Progress Tracking & Visualization

**User Story:** As a student, I want to see my progress visually across the curriculum tree, so that I understand how far I've come and what remains.

#### Acceptance Criteria

1. THE Progress_View SHALL display the curriculum tree with color-coded completion status per node
2. THE Progress_View SHALL use distinct colors for status: locked (gray), available (blue), in-progress (amber), completed (green)
3. THE Progress_View SHALL display aggregate statistics: total nodes, completed nodes, percentage complete
4. WHEN a node requires practicum, THE Progress_View SHALL show practicum status (not submitted, pending review, graded)
5. THE Progress_View SHALL calculate and display estimated time remaining based on average session duration
6. THE Progress_View SHALL be printable as a progress report

### Requirement 11: Certificate Display & Download

**User Story:** As a student, I want to view and download my certificates, so that I have proof of my achievements.

#### Acceptance Criteria

1. THE Certificate_Page SHALL list all earned certificates with program name and completion date
2. THE Certificate_Card SHALL display a preview thumbnail of the certificate
3. WHEN a user clicks download, THE System SHALL fetch the PDF certificate from the backend
4. THE Certificate_Card SHALL display the unique verification serial number
5. WHEN a certificate is shared, THE System SHALL provide a verification URL that third parties can use

### Requirement 12: Instructor Dashboard

**User Story:** As an instructor, I want to see pending reviews and class statistics, so that I can manage my teaching responsibilities efficiently.

#### Acceptance Criteria

1. THE Instructor_Dashboard SHALL display a count of pending practicum reviews requiring attention
2. THE Instructor_Dashboard SHALL show a list of recent submissions with student name, node title, and submission date
3. THE Instructor_Dashboard SHALL display class statistics: enrolled students, average progress, completion rate
4. THE Instructor_Dashboard SHALL provide quick links to grade book and assessment entry
5. WHEN clicking a pending review, THE Instructor_Dashboard SHALL navigate to the Practicum_Review page

### Requirement 13: Admin Dashboard

**User Story:** As an admin, I want to see tenant-wide statistics and manage system settings, so that I can oversee the institution's LMS usage.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display total active students, instructors, and programs
2. THE Admin_Dashboard SHALL show enrollment trends over time (chart)
3. THE Admin_Dashboard SHALL display the active Blueprint name and allow switching presets
4. THE Admin_Dashboard SHALL provide links to user management, program management, and system settings
5. WHEN the Blueprint is changed, THE System SHALL update all terminology across the interface

### Requirement 14: Authentication Flow

**User Story:** As a user, I want to log in securely and have my session managed, so that my data is protected.

#### Acceptance Criteria

1. THE Login_Page SHALL display email and password fields with validation
2. WHEN credentials are invalid, THE Login_Page SHALL display an error message without revealing which field is incorrect
3. WHEN login succeeds, THE Inertia_Adapter SHALL redirect to the appropriate dashboard based on user role
4. THE Auth_Context SHALL store the authenticated user and provide logout functionality
5. WHEN a user clicks logout, THE System SHALL clear the session and redirect to the login page
6. WHEN an unauthenticated user accesses a protected route, THE System SHALL redirect to the login page

### Requirement 15: Responsive Design & Accessibility

**User Story:** As a user on any device, I want the interface to be usable and accessible, so that I can learn regardless of my device or abilities.

#### Acceptance Criteria

1. THE Application SHALL be fully functional on mobile devices (320px minimum width)
2. THE Application SHALL use semantic HTML elements and ARIA labels for screen reader compatibility
3. THE Application SHALL maintain WCAG 2.1 AA color contrast ratios
4. THE Application SHALL support keyboard navigation for all interactive elements
5. THE Application SHALL display loading states during Inertia page transitions
6. WHEN network errors occur, THE Application SHALL display user-friendly error messages with retry options
