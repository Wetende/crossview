# Implementation Plan

- [ ] 1. Set up database schema and models
  - [ ] 1.1 Create migration for assessment_results table
    - Create table with enrollment_id, node_id, result_data (JSON), lecturer_comments, is_published, published_at, graded_by_user_id
    - Add unique constraint on (enrollment_id, node_id)
    - Add foreign keys with CASCADE delete
    - _Requirements: 2.1, 2.3_

  - [ ] 1.2 Create AssessmentResult Eloquent model
    - Define fillable fields and JSON cast for result_data
    - Add relationships: enrollment(), node(), gradedBy()
    - Add accessor methods: getTotal(), getStatus(), getLetterGrade()
    - _Requirements: 2.1, 2.4_

  - [ ] 1.3 Write property test for result persistence
    - **Property 5: Result Persistence Integrity**
    - **Validates: Requirements 2.1, 2.4**

- [ ] 2. Implement grading strategy interface and factory
  - [ ] 2.1 Create GradingStrategyInterface
    - Define calculate(), validateComponents(), getStatus() methods
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 2.2 Create GradingStrategyFactory
    - Implement createFromBlueprint() using match expression
    - Throw InvalidGradingTypeException for unknown types
    - _Requirements: 1.1, 1.2, 1.3_

- [ ] 3. Implement WeightedGradingStrategy
  - [ ] 3.1 Create WeightedGradingStrategy class
    - Implement calculate() with weighted sum formula
    - Implement getStatus() with pass_mark threshold
    - Implement getLetterGrade() with boundary mapping
    - Handle missing components as zero
    - _Requirements: 1.1, 3.1, 3.2, 3.3, 3.4_

  - [ ] 3.2 Write property test for weighted calculation
    - **Property 1: Weighted Calculation Correctness**
    - **Validates: Requirements 1.1, 3.1**

  - [ ] 3.3 Write property test for pass/fail threshold
    - **Property 3: Pass/Fail Threshold**
    - **Validates: Requirements 1.3, 3.2, 3.3**

  - [ ] 3.4 Write property test for missing component
    - **Property 7: Missing Component Treated as Zero**
    - **Validates: Requirements 3.4**

  - [ ] 3.5 Write property test for grade boundary mapping
    - **Property 9: Grade Boundary Mapping**
    - **Validates: Requirements 5.1, 5.3**

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement CompetencyGradingStrategy
  - [ ] 5.1 Create CompetencyGradingStrategy class
    - Implement calculate() checking all required evidences
    - Implement getStatus() returning Competent/Not Yet Competent
    - Support custom competency labels from config
    - _Requirements: 1.2, 4.1, 4.2, 4.3, 4.4_

  - [ ] 5.2 Write property test for competency all-or-nothing
    - **Property 2: Competency All-Or-Nothing**
    - **Validates: Requirements 1.2, 4.2, 4.3**

  - [ ] 5.3 Write property test for custom competency labels
    - **Property 8: Custom Competency Labels**
    - **Validates: Requirements 4.4**

- [ ] 6. Implement PassFailGradingStrategy
  - [ ] 6.1 Create PassFailGradingStrategy class
    - Implement calculate() with simple threshold check
    - Return Pass or Fail status
    - _Requirements: 1.3_

- [ ] 7. Implement grading config validation
  - [ ] 7.1 Create GradingConfigValidator
    - Validate weighted config has components and weights summing to 1.0
    - Validate competency config has required_evidences
    - Validate pass_fail config has threshold
    - _Requirements: 1.4_

  - [ ] 7.2 Write property test for config validation
    - **Property 4: Grading Config Validation**
    - **Validates: Requirements 1.4**

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement AssessmentEngine service
  - [ ] 9.1 Create AssessmentEngine service
    - Implement calculateResult() using strategy from blueprint
    - Implement saveResult() with upsert logic
    - Auto-calculate status on save
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 9.2 Write property test for upsert behavior
    - **Property 6: Upsert Behavior**
    - **Validates: Requirements 2.3**

  - [ ] 9.3 Implement result publishing
    - Implement publishResult() setting is_published and published_at
    - Implement bulkPublish() for all unpublished results on a node
    - _Requirements: 6.1, 6.2, 6.4_

  - [ ] 9.4 Write property test for publish workflow
    - **Property 10: Publish Workflow**
    - **Validates: Requirements 6.1, 6.2**

  - [ ] 9.5 Write property test for bulk publish
    - **Property 12: Bulk Publish**
    - **Validates: Requirements 6.4**

  - [ ] 9.6 Implement student results query
    - Implement getStudentResults() with published filter
    - _Requirements: 6.3_

  - [ ] 9.7 Write property test for published results filter
    - **Property 11: Published Results Filter**
    - **Validates: Requirements 6.3**

- [ ] 10. Implement serialization
  - [ ] 10.1 Create AssessmentResultSerializer
    - Implement toJson() with all scores, status, metadata
    - Implement toTranscriptFormat() with student name, node title
    - _Requirements: 7.1, 7.2_

  - [ ] 10.2 Write property test for serialization completeness
    - **Property 13: Serialization Completeness**
    - **Validates: Requirements 7.1, 7.2**

- [ ] 11. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
