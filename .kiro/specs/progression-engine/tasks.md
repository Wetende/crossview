# Implementation Plan

- [ ] 1. Set up database schema and models
  - [ ] 1.1 Create migration for node_completions table
    - Create table with enrollment_id, node_id, completed_at, completion_type, metadata (JSON)
    - Add unique constraint on (enrollment_id, node_id)
    - Add foreign keys with CASCADE delete
    - _Requirements: 3.1, 3.5_

  - [ ] 1.2 Create NodeCompletion Eloquent model
    - Define fillable fields and casts
    - Add relationships: enrollment(), node()
    - _Requirements: 3.1_

  - [ ] 1.3 Write property test for completion record creation
    - **Property 6: Completion Record Creation**
    - **Validates: Requirements 3.1**

  - [ ] 1.4 Write property test for completion idempotency
    - **Property 8: Completion Idempotency**
    - **Validates: Requirements 3.5**

- [ ] 2. Implement sequential locking
  - [ ] 2.1 Create SequentialLockChecker service
    - Implement isUnlocked() checking if node is first uncompleted sibling
    - Implement getFirstUncompletedSibling()
    - _Requirements: 1.1, 1.2_

  - [ ] 2.2 Write property test for sequential unlock progression
    - **Property 1: Sequential Unlock Progression**
    - **Validates: Requirements 1.1, 1.2**

  - [ ] 2.3 Write property test for sequential lock denial
    - **Property 2: Sequential Lock Denial**
    - **Validates: Requirements 1.3**

  - [ ] 2.4 Write property test for sequential disabled
    - **Property 3: Sequential Disabled Allows All**
    - **Validates: Requirements 1.4**

- [ ] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement prerequisite locking
  - [ ] 4.1 Create PrerequisiteLockChecker service
    - Implement arePrerequisitesMet() checking all prerequisites completed
    - Implement getIncompletePrerequisites()
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 4.2 Write property test for prerequisite unlock
    - **Property 4: Prerequisite Unlock**
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [ ] 4.3 Implement prerequisite re-lock detection
    - Check prerequisites on each access, not just once
    - _Requirements: 2.4_

  - [ ] 4.4 Write property test for prerequisite re-lock
    - **Property 5: Prerequisite Re-lock**
    - **Validates: Requirements 2.4**

- [ ] 5. Implement completion type handling
  - [ ] 5.1 Create CompletionTriggerHandler
    - Handle "view" completion type
    - Handle "quiz_pass" completion type (integrate with Assessment Engine)
    - Handle "upload" completion type
    - _Requirements: 3.2, 3.3, 3.4_

  - [ ] 5.2 Write property test for completion type triggers
    - **Property 7: Completion Type Triggers**
    - **Validates: Requirements 3.2, 3.3, 3.4**

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement progress calculation
  - [ ] 7.1 Create ProgressCalculator service
    - Implement calculate() with formula: (completed / total) × 100
    - Implement getCompletableNodes() to filter out containers
    - _Requirements: 4.1, 4.3_

  - [ ] 7.2 Write property test for progress calculation formula
    - **Property 9: Progress Calculation Formula**
    - **Validates: Requirements 4.1**

  - [ ] 7.3 Implement subtree progress calculation
    - Filter nodes to only those in subtree
    - _Requirements: 4.2_

  - [ ] 7.4 Write property test for subtree scoping
    - **Property 10: Progress Subtree Scoping**
    - **Validates: Requirements 4.2**

  - [ ] 7.5 Write property test for container exclusion
    - **Property 11: Container Node Exclusion**
    - **Validates: Requirements 4.3**

  - [ ] 7.6 Implement program completion detection
    - Mark enrollment as completed when progress reaches 100%
    - _Requirements: 4.4_

  - [ ] 7.7 Write property test for program completion
    - **Property 12: Program Completion at 100%**
    - **Validates: Requirements 4.4**

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement ProgressionEngine service
  - [ ] 9.1 Create ProgressionEngine service
    - Implement canAccess() combining sequential and prerequisite checks
    - Implement markComplete() with completion type handling
    - _Requirements: 1.3, 3.1_

  - [ ] 9.2 Implement getUnlockStatus() for all nodes
    - Return status for each node in single query
    - Include lock_reason and blocking_nodes for locked nodes
    - _Requirements: 5.1, 5.2_

  - [ ] 9.3 Write property test for unlock status completeness
    - **Property 13: Unlock Status Completeness**
    - **Validates: Requirements 5.1**

  - [ ] 9.4 Write property test for lock reason included
    - **Property 14: Lock Reason Included**
    - **Validates: Requirements 5.2**

- [ ] 10. Implement completion rules validation
  - [ ] 10.1 Create CompletionRulesValidator
    - Validate quiz_id present for quiz_pass type
    - Validate prerequisite node IDs exist
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 10.2 Write property test for completion rules validation
    - **Property 15: Completion Rules Validation**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [ ] 11. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
