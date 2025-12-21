# Requirements Document

## Introduction

This document defines the requirements for the Student Portal of the Crossview LMS platform. The student portal provides learners with access to their enrolled programs, course content, progress tracking, assessment results, practicum submissions, and certificates.

## Glossary

-   **Student_Dashboard**: The main landing page for authenticated students showing overview of enrollments and progress
-   **Program_List**: Page displaying all programs the student is enrolled in
-   **Program_View**: Detailed view of a single program showing curriculum tree and progress
-   **Session_Viewer**: Page for viewing lesson/session content (HTML, videos, documents)
-   **Assessment_Results_Page**: Page displaying the student's grades and assessment outcomes
-   **Practicum_Upload_Page**: Page for uploading audio/video/file submissions for practicum nodes
-   **Practicum_History_Page**: Page showing submission history and reviewer feedback
-   **Certificates_Page**: Page for viewing, downloading, and sharing earned certificates
-   **Profile_Settings_Page**: Page for managing user profile information
-   **Enrollment**: A record linking a student to a program with status tracking
-   **NodeCompletion**: A record tracking completion of a curriculum node by a student
-   **CurriculumNode**: A node in the curriculum tree (e.g., Year, Unit, Module, Session)
-   **AssessmentResult**: The outcome of a student's assessment including scores and status
-   **PracticumSubmission**: A media file uploaded by a student for evaluation
-   **SubmissionReview**: Feedback and scores from a reviewer on a practicum submission
-   **Certificate**: A generated PDF document awarded upon program completion

## Requirements

### Requirement 1: Student Dashboard

**User Story:** As a student, I want to see an overview of my learning progress, so that I can quickly understand my current status across all programs.

#### Acceptance Criteria

1. WHEN a student accesses the dashboard, THE Student_Dashboard SHALL display a summary of active enrollments with program names
2. WHEN a student accesses the dashboard, THE Student_Dashboard SHALL display overall progress percentage for each enrolled program
3. WHEN a student accesses the dashboard, THE Student_Dashboard SHALL display recent activity (last completed nodes, recent submissions)
4. WHEN a student accesses the dashboard, THE Student_Dashboard SHALL display upcoming deadlines if any exist
5. WHEN a student clicks on a program card, THE Student_Dashboard SHALL navigate to the Program_View for that program
6. IF the student has no enrollments, THEN THE Student_Dashboard SHALL display an empty state with guidance

### Requirement 2: Program List

**User Story:** As a student, I want to see all my enrolled programs, so that I can navigate to any program I'm studying.

#### Acceptance Criteria

1. WHEN a student accesses the program list, THE Program_List SHALL display all programs where the student has an active enrollment
2. WHEN displaying programs, THE Program_List SHALL show program name, code, and enrollment status
3. WHEN displaying programs, THE Program_List SHALL show progress percentage calculated from completed nodes
4. WHEN a student clicks on a program, THE Program_List SHALL navigate to the Program_View
5. THE Program_List SHALL allow filtering by enrollment status (active, completed, withdrawn)

### Requirement 3: Program View with Curriculum Tree

**User Story:** As a student, I want to view the curriculum structure of my program, so that I can navigate through lessons and track my progress.

#### Acceptance Criteria

1. WHEN a student views a program, THE Program_View SHALL display the curriculum tree with all nodes organized hierarchically
2. WHEN displaying nodes, THE Program_View SHALL show completion status (completed, in-progress, locked) for each node
3. WHEN displaying nodes, THE Program_View SHALL use the blueprint's hierarchy labels (e.g., "Level", "Unit", "Module")
4. WHEN a student clicks on a session/lesson node, THE Program_View SHALL navigate to the Session_Viewer
5. IF a node has prerequisites defined, THEN THE Program_View SHALL show locked status until prerequisites are completed
6. IF a node requires sequential completion, THEN THE Program_View SHALL enforce the order
7. WHEN a student completes a node, THE Program_View SHALL update the progress display immediately

### Requirement 4: Session/Lesson Viewer

**User Story:** As a student, I want to view lesson content, so that I can learn the material in my program.

#### Acceptance Criteria

1. WHEN a student opens a session, THE Session_Viewer SHALL display the content_html from the node's properties
2. WHEN a session contains embedded media, THE Session_Viewer SHALL render videos and images inline
3. WHEN a student finishes viewing content, THE Session_Viewer SHALL provide a "Mark as Complete" action
4. WHEN a student marks content as complete, THE Session_Viewer SHALL create a NodeCompletion record
5. THE Session_Viewer SHALL display breadcrumb navigation showing the path from program root to current node
6. THE Session_Viewer SHALL provide navigation to previous and next sibling nodes
7. IF the node is locked due to prerequisites, THEN THE Session_Viewer SHALL display a locked message with prerequisite information

### Requirement 5: Assessment Results

**User Story:** As a student, I want to view my assessment results, so that I can understand my academic performance.

#### Acceptance Criteria

1. WHEN a student accesses assessment results, THE Assessment_Results_Page SHALL display all published results for the student
2. WHEN displaying results, THE Assessment_Results_Page SHALL show node title, total score, status (Pass/Fail/Competent), and letter grade if applicable
3. WHEN displaying results, THE Assessment_Results_Page SHALL show component scores breakdown
4. WHEN displaying results, THE Assessment_Results_Page SHALL show lecturer comments if provided
5. THE Assessment_Results_Page SHALL allow filtering by program and by status
6. IF a result is not yet published, THEN THE Assessment_Results_Page SHALL not display it to the student

### Requirement 6: Practicum Upload

**User Story:** As a student, I want to upload practicum submissions, so that I can complete practical assessments.

#### Acceptance Criteria

1. WHEN a student accesses a practicum node, THE Practicum_Upload_Page SHALL display upload interface for allowed file types
2. WHEN a student selects a file, THE Practicum_Upload_Page SHALL validate file type against node configuration
3. WHEN a student selects a file, THE Practicum_Upload_Page SHALL validate file size against maximum
   a WHEN a student uploads a valid file, THE Practicum_Upload_Page SHALL create a PracticumSubmission with status "pending"
4. WHEN a student has a previous submission requiring revision, THE Practicum_Upload_Page SHALL allow uploading a new version
5. THE Practicum_Upload_Page SHALL display the current submission status and version number
6. IF the node has a rubric attached, THEN THE Practicum_Upload_Page SHALL display the rubric criteria for student reference

### Requirement 7: Practicum History

**User Story:** As a student, I want to view my submission history and feedback, so that I can track my practicum progress and improve.

#### Acceptance Criteria

1. WHEN a student accesses practicum history, THE Practicum_History_Page SHALL display all submissions for the student
2. WHEN displaying submissions, THE Practicum_History_Page SHALL show submission date, version, status, and file type
3. WHEN a submission has been reviewed, THE Practicum_History_Page SHALL display reviewer comments
4. WHEN a submission has been scored, THE Practicum_History_Page SHALL display dimension scores and total score
5. THE Practicum_History_Page SHALL allow filtering by program and by status
6. WHEN a student clicks on a submission, THE Practicum_History_Page SHALL allow downloading the submitted file via signed URL

### Requirement 8: My Certificates

**User Story:** As a student, I want to view and download my certificates, so that I can share my achievements with employers.

#### Acceptance Criteria

1. WHEN a student accesses certificates page, THE Certificates_Page SHALL display all certificates earned by the student
2. WHEN displaying certificates, THE Certificates_Page SHALL show program title, completion date, issue date, and serial number
3. WHEN a student clicks download, THE Certificates_Page SHALL provide the certificate PDF via signed URL
4. WHEN a student clicks share, THE Certificates_Page SHALL provide a public verification URL
5. IF a certificate has been revoked, THEN THE Certificates_Page SHALL display revoked status and not allow download
6. IF the student has no certificates, THEN THE Certificates_Page SHALL display an empty state with encouragement

### Requirement 9: Profile Settings

**User Story:** As a student, I want to manage my profile information, so that I can keep my account details up to date.

#### Acceptance Criteria

1. WHEN a student accesses profile settings, THE Profile_Settings_Page SHALL display current user information (name, email, phone)
2. WHEN a student updates their name or phone, THE Profile_Settings_Page SHALL save the changes
3. WHEN a student wants to change password, THE Profile_Settings_Page SHALL require current password verification
4. WHEN a student submits a new password, THE Profile_Settings_Page SHALL validate password strength
5. THE Profile_Settings_Page SHALL not allow changing email address (requires admin action)
6. THE Profile_Settings_Page SHALL display the tenant name the student belongs to
   llow
