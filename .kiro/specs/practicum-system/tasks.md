# Implementation Plan

- [ ] 1. Set up database schema and models
  - [ ] 1.1 Create migration for rubrics table
    - Create table with name, description, dimensions (JSON), max_score
    - _Requirements: 1.4, 3.1_

  - [ ] 1.2 Create migration for practicum_submissions table
    - Create table with enrollment_id, node_id, version, status, file_path, file_type, file_size, duration_seconds, metadata, submitted_at
    - Add foreign keys and indexes
    - _Requirements: 2.5, 4.1_

  - [ ] 1.3 Create migration for submission_reviews table
    - Create table with submission_id, reviewer_id, status, dimension_scores, total_score, comments, reviewed_at
    - Add foreign keys
    - _Requirements: 3.3_

  - [ ] 1.4 Create Rubric Eloquent model
    - Define fillable fields and JSON cast for dimensions
    - Implement calculateScore() method
    - _Requirements: 3.2_

  - [ ] 1.5 Create PracticumSubmission Eloquent model
    - Define fillable fields and relationships
    - Add getSignedUrl() method
    - _Requirements: 2.5_

  - [ ] 1.6 Create SubmissionReview Eloquent model
    - Define fillable fields and relationships
    - _Requirements: 3.3_

- [ ] 2. Implement practicum configuration
  - [ ] 2.1 Extend CurriculumNode completion_rules for practicum type
    - Support evidence_types, max_file_size_mb, max_duration_seconds, rubric_id
    - _Requirements: 1.2, 1.3, 1.4_

  - [ ] 2.2 Write property test for practicum configuration storage
    - **Property 2: Practicum Configuration Storage**
    - **Validates: Requirements 1.2, 1.3, 1.4**

- [ ] 3. Implement file validation and storage
  - [ ] 3.1 Create MediaStorageService
    - Implement store() for secure file storage
    - Implement getSignedUrl() with expiration
    - Implement validateAccess() for permission checks
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 3.2 Create FileValidator
    - Validate file type against evidence_types
    - Validate file size against max_file_size_mb
    - Validate duration against max_duration_seconds
    - _Requirements: 2.3, 2.4_

  - [ ] 3.3 Write property test for file validation
    - **Property 3: File Validation Against Config**
    - **Validates: Requirements 2.3, 2.4**

  - [ ] 3.4 Write property test for secure media storage
    - **Property 12: Secure Media Storage**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement submission creation
  - [ ] 5.1 Create PracticumService
    - Implement createSubmission() with file validation and storage
    - Set default status to "pending"
    - _Requirements: 2.5, 4.1_

  - [ ] 5.2 Write property test for submission record creation
    - **Property 4: Submission Record Creation**
    - **Validates: Requirements 2.5**

  - [ ] 5.3 Write property test for default pending status
    - **Property 7: Default Pending Status**
    - **Validates: Requirements 4.1**

  - [ ] 5.4 Implement resubmission with version increment
    - Create new submission with incremented version
    - Reset status to pending
    - _Requirements: 4.5_

  - [ ] 5.5 Write property test for resubmission versioning
    - **Property 10: Resubmission Creates New Version**
    - **Validates: Requirements 4.5**

- [ ] 6. Implement rubric scoring
  - [ ] 6.1 Create RubricService
    - Implement calculateScore() with weighted dimensions
    - Implement validateDimensionScores()
    - _Requirements: 3.2, 3.4_

  - [ ] 6.2 Write property test for rubric score calculation
    - **Property 5: Rubric Score Calculation**
    - **Validates: Requirements 3.2, 3.4**

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement review workflow
  - [ ] 8.1 Implement reviewSubmission() in PracticumService
    - Create SubmissionReview record
    - Update submission status
    - Store dimension scores and comments
    - _Requirements: 3.3, 4.2, 4.3, 4.4_

  - [ ] 8.2 Write property test for review persistence
    - **Property 6: Review Persistence**
    - **Validates: Requirements 3.3**

  - [ ] 8.3 Write property test for review status transitions
    - **Property 8: Review Status Transitions**
    - **Validates: Requirements 4.2, 4.3, 4.4**

  - [ ] 8.4 Integrate with Progression Engine for approval completion
    - Trigger node completion when submission approved
    - _Requirements: 4.2_

  - [ ] 8.5 Write property test for approval triggers completion
    - **Property 9: Approval Triggers Completion**
    - **Validates: Requirements 4.2**

  - [ ] 8.6 Write property test for practicum blocks completion
    - **Property 1: Practicum Blocks Completion Without Submission**
    - **Validates: Requirements 1.1**

- [ ] 9. Implement submission history
  - [ ] 9.1 Implement getSubmissionHistory() in PracticumService
    - Return all submissions for enrollment-node pair
    - Order by submitted_at chronologically
    - Include reviews with feedback
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 9.2 Write property test for submission history ordering
    - **Property 11: Submission History Ordering**
    - **Validates: Requirements 5.2**

- [ ] 10. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
