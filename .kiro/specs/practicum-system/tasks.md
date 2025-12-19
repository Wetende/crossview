# Implementation Plan

> **🔄 Migration Notice:** This implementation plan is for migrating from PHP/Laravel to Python/Django. All tasks reference Django-specific implementations (Django models, migrations, pytest/Hypothesis for testing, management commands).

- [x] 1. Set up database schema and models
  - [x] 1.1 Create Django migration for rubrics table
    - Create table with name, description, dimensions (JSONField), max_score
    - _Requirements: 1.4, 3.1_

  - [x] 1.2 Create Django migration for practicum_submissions table
    - Create table with enrollment_id, node_id, version, status, file_path, file_type, file_size, duration_seconds, metadata, submitted_at
    - Add foreign keys and indexes
    - _Requirements: 2.5, 4.1_

  - [x] 1.3 Create Django migration for submission_reviews table
    - Create table with submission_id, reviewer_id, status, dimension_scores, total_score, comments, reviewed_at
    - Add foreign keys
    - _Requirements: 3.3_

  - [x] 1.4 Create Rubric Django model
    - Define fields and JSONField for dimensions
    - Implement calculate_score() method
    - _Requirements: 3.2_

  - [x] 1.5 Create PracticumSubmission Django model
    - Define fields and relationships
    - Add get_signed_url() method
    - _Requirements: 2.5_

  - [x] 1.6 Create SubmissionReview Django model
    - Define fields and relationships
    - _Requirements: 3.3_

- [x] 2. Implement practicum configuration
  - [x] 2.1 Extend CurriculumNode completion_rules for practicum type
    - Support evidence_types, max_file_size_mb, max_duration_seconds, rubric_id
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 2.2 Write property test for practicum configuration storage
    - **Property 2: Practicum Configuration Storage**
    - **Validates: Requirements 1.2, 1.3, 1.4**

- [x] 3. Implement file validation and storage
  - [x] 3.1 Create MediaStorageService
    - Implement store() for secure file storage using Django storage
    - Implement get_signed_url() with expiration using Django signing
    - Implement validate_access() for permission checks
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 3.2 Create FileValidator
    - Validate file type against evidence_types
    - Validate file size against max_file_size_mb
    - Validate duration against max_duration_seconds
    - _Requirements: 2.3, 2.4_

  - [x] 3.3 Write property test for file validation
    - **Property 3: File Validation Against Config**
    - **Validates: Requirements 2.3, 2.4**

  - [x] 3.4 Write property test for secure media storage
    - **Property 12: Secure Media Storage**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement submission creation
  - [x] 5.1 Create PracticumService
    - Implement create_submission() with file validation and storage
    - Set default status to "pending"
    - _Requirements: 2.5, 4.1_

  - [x] 5.2 Write property test for submission record creation
    - **Property 4: Submission Record Creation**
    - **Validates: Requirements 2.5**

  - [x] 5.3 Write property test for default pending status
    - **Property 7: Default Pending Status**
    - **Validates: Requirements 4.1**

  - [x] 5.4 Implement resubmission with version increment
    - Create new submission with incremented version
    - Reset status to pending
    - _Requirements: 4.5_

  - [x] 5.5 Write property test for resubmission versioning
    - **Property 10: Resubmission Creates New Version**
    - **Validates: Requirements 4.5**

- [x] 6. Implement rubric scoring
  - [x] 6.1 Create RubricService
    - Implement calculate_score() with weighted dimensions
    - Implement validate_dimension_scores()
    - _Requirements: 3.2, 3.4_

  - [x] 6.2 Write property test for rubric score calculation
    - **Property 5: Rubric Score Calculation**
    - **Validates: Requirements 3.2, 3.4**

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement review workflow
  - [x] 8.1 Implement review_submission() in PracticumService
    - Create SubmissionReview record
    - Update submission status
    - Store dimension scores and comments
    - _Requirements: 3.3, 4.2, 4.3, 4.4_

  - [x] 8.2 Write property test for review persistence
    - **Property 6: Review Persistence**
    - **Validates: Requirements 3.3**

  - [x] 8.3 Write property test for review status transitions
    - **Property 8: Review Status Transitions**
    - **Validates: Requirements 4.2, 4.3, 4.4**

  - [x] 8.4 Integrate with Progression Engine for approval completion
    - Trigger node completion when submission approved using Django signals
    - _Requirements: 4.2_

  - [x] 8.5 Write property test for approval triggers completion
    - **Property 9: Approval Triggers Completion**
    - **Validates: Requirements 4.2**

  - [x] 8.6 Write property test for practicum blocks completion
    - **Property 1: Practicum Blocks Completion Without Submission**
    - **Validates: Requirements 1.1**

- [x] 9. Implement submission history
  - [x] 9.1 Implement get_submission_history() in PracticumService
    - Return all submissions for enrollment-node pair
    - Order by submitted_at chronologically
    - Include reviews with feedback
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 9.2 Write property test for submission history ordering
    - **Property 11: Submission History Ordering**
    - **Validates: Requirements 5.2**

- [x] 10. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

