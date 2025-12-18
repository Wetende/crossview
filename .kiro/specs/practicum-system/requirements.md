# Requirements Document

## Introduction

The Practicum System enables students to submit media evidence (audio, video, images) for practical assessments. It supports the "Field Work Logbook" feature where Theology students upload preaching recordings and TVET students submit portfolio evidence. Lecturers review submissions against configurable rubrics and provide graded feedback.

## Glossary

- **Practicum**: A practical assessment requiring student-submitted media evidence.
- **Submission**: A student's uploaded media file(s) for a practicum node.
- **Rubric**: A grading criteria matrix with dimensions (e.g., Introduction, Body, Conclusion) and score levels.
- **Evidence Type**: The required media format (audio, video, image, document).
- **Review Status**: The state of a submission (pending, approved, revision_required, rejected).
- **Browser Recording**: In-browser audio/video capture without requiring file upload.

## Requirements

### Requirement 1: Practicum Node Configuration

**User Story:** As a lecturer, I want to configure nodes as practicums with specific evidence requirements, so that students know what to submit.

#### Acceptance Criteria

1. WHEN a node has completion_rules.type set to "practicum" THEN the Practicum System SHALL require media submission before marking complete.
2. WHEN configuring a practicum THEN the Practicum System SHALL allow specifying required evidence types (audio, video, image, document).
3. WHEN configuring a practicum THEN the Practicum System SHALL allow setting maximum file size and duration limits.
4. WHEN a practicum is configured THEN the Practicum System SHALL allow attaching a rubric for grading criteria.

### Requirement 2: Media Submission

**User Story:** As a student, I want to upload or record media directly in the browser, so that I can submit evidence from my phone without external apps.

#### Acceptance Criteria

1. WHEN a student accesses a practicum node THEN the Practicum System SHALL display upload controls for the required evidence types.
2. WHEN evidence type is audio or video THEN the Practicum System SHALL provide in-browser recording capability.
3. WHEN a student uploads a file THEN the Practicum System SHALL validate file type and size against node configuration.
4. WHEN a file exceeds size limits THEN the Practicum System SHALL reject the upload with a clear error message.
5. WHEN a submission is saved THEN the Practicum System SHALL store the file securely and create a submission record.

### Requirement 3: Rubric-Based Grading

**User Story:** As a lecturer, I want to grade submissions against a rubric, so that assessment is consistent and transparent.

#### Acceptance Criteria

1. WHEN a lecturer reviews a submission THEN the Practicum System SHALL display the rubric with all dimensions and score levels.
2. WHEN a lecturer selects scores for each dimension THEN the Practicum System SHALL calculate the total score automatically.
3. WHEN a lecturer submits a review THEN the Practicum System SHALL store scores, comments, and update the submission status.
4. WHEN a rubric has weighted dimensions THEN the Practicum System SHALL apply weights to the total calculation.

### Requirement 4: Submission Review Workflow

**User Story:** As a lecturer, I want to approve, request revision, or reject submissions, so that students receive clear feedback.

#### Acceptance Criteria

1. WHEN a submission is created THEN the Practicum System SHALL set status to "pending".
2. WHEN a lecturer approves a submission THEN the Practicum System SHALL set status to "approved" and trigger node completion.
3. WHEN a lecturer requests revision THEN the Practicum System SHALL set status to "revision_required" and notify the student.
4. WHEN a lecturer rejects a submission THEN the Practicum System SHALL set status to "rejected" with required feedback.
5. WHEN a student resubmits THEN the Practicum System SHALL create a new submission version and reset status to "pending".

### Requirement 5: Submission History

**User Story:** As a student, I want to see my submission history and feedback, so that I can track my progress and improve.

#### Acceptance Criteria

1. WHEN a student views a practicum node THEN the Practicum System SHALL display all previous submissions with status and feedback.
2. WHEN multiple submission versions exist THEN the Practicum System SHALL show them in chronological order.
3. WHEN a submission has lecturer feedback THEN the Practicum System SHALL display rubric scores and comments.

### Requirement 6: Media Storage and Retrieval

**User Story:** As a system administrator, I want media files stored securely with efficient retrieval, so that the system performs well and data is protected.

#### Acceptance Criteria

1. WHEN a file is uploaded THEN the Practicum System SHALL store it in a secure location with access control.
2. WHEN a file is requested THEN the Practicum System SHALL verify the requester has permission to view it.
3. WHEN generating file URLs THEN the Practicum System SHALL use signed URLs with expiration for security.
