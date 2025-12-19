# Implementation Plan

> **🔄 Migration Notice:** This implementation plan is for migrating from PHP/Laravel to Python/Django. All tasks reference Django-specific implementations (Django models, migrations, pytest/Hypothesis for testing, management commands).

- [x] 1. Set up database schema and models
  - [x] 1.1 Create Django migration for node_completions table
    - Create table with enrollment_id, node_id, completed_at, completion_type, metadata (JSONField)
    - Add unique constraint on (enrollment_id, node_id)
    - Add foreign keys with CASCADE delete
    - _Requirements: 3.1, 3.5_

  - [x] 1.2 Create NodeCompletion Django model
    - Define fields and JSONField for metadata
    - Add relationships: enrollment, node
    - _Requirements: 3.1_

  - [x] 1.3 Write property test for completion record creation
    - **Property 6: Completion Record Creation**
    - **Validates: Requirements 3.1**

  - [x] 1.4 Write property test for completion idempotency
    - **Property 8: Completion Idempotency**
    - **Validates: Requirements 3.5**

- [x] 2. Implement sequential locking
  - [x] 2.1 Create SequentialLockChecker service
    - Implement is_unlocked() checking if node is first uncompleted sibling
    - Implement get_first_uncompleted_sibling()
    - _Requirements: 1.1, 1.2_

  - [x] 2.2 Write property test for sequential unlock progression
    - **Property 1: Sequential Unlock Progression**
    - **Validates: Requirements 1.1, 1.2**

  - [x] 2.3 Write property test for sequential lock denial
    - **Property 2: Sequential Lock Denial**
    - **Validates: Requirements 1.3**

  - [x] 2.4 Write property test for sequential disabled
    - **Property 3: Sequential Disabled Allows All**
    - **Validates: Requirements 1.4**

- [x] 3. Fix test bug and checkpoint


  - [x] 3.1 Fix function reference bug in test_sequential_locking.py


    - Replace `create_program_with_siblings` with `_make_program_with_siblings` throughout the file
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 3.2 Ensure all tests pass

    - Run pytest for progression tests and verify all pass
    - Ask the user if questions arise

- [x] 4. Implement prerequisite locking


  - [x] 4.1 Create PrerequisiteLockChecker service


    - Implement are_prerequisites_met() checking all prerequisites completed
    - Implement get_incomplete_prerequisites()
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 4.2 Write property test for prerequisite unlock


    - **Property 4: Prerequisite Unlock**
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [x] 4.3 Implement prerequisite re-lock detection

    - Check prerequisites on each access, not just once
    - _Requirements: 2.4_

  - [x] 4.4 Write property test for prerequisite re-lock

    - **Property 5: Prerequisite Re-lock**
    - **Validates: Requirements 2.4**


- [x] 5. Implement completion type handling


  - [x] 5.1 Create CompletionTriggerHandler

    - Handle "view" completion type
    - Handle "quiz_pass" completion type (integrate with Assessment Engine)
    - Handle "upload" completion type
    - _Requirements: 3.2, 3.3, 3.4_

  - [x] 5.2 Write property test for completion type triggers


    - **Property 7: Completion Type Triggers**
    - **Validates: Requirements 3.2, 3.3, 3.4**

- [x] 6. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement progress calculation


  - [x] 7.1 Create ProgressCalculator service

    - Implement calculate() with formula: (completed / total) × 100
    - Implement get_completable_nodes() to filter out containers
    - _Requirements: 4.1, 4.3_

  - [x] 7.2 Write property test for progress calculation formula


    - **Property 9: Progress Calculation Formula**
    - **Validates: Requirements 4.1**

  - [x] 7.3 Implement subtree progress calculation

    - Filter nodes to only those in subtree
    - _Requirements: 4.2_

  - [x] 7.4 Write property test for subtree scoping

    - **Property 10: Progress Subtree Scoping**
    - **Validates: Requirements 4.2**

  - [x] 7.5 Write property test for container exclusion

    - **Property 11: Container Node Exclusion**
    - **Validates: Requirements 4.3**

  - [x] 7.6 Implement program completion detection

    - Mark enrollment as completed when progress reaches 100%
    - _Requirements: 4.4_

  - [x] 7.7 Write property test for program completion

    - **Property 12: Program Completion at 100%**
    - **Validates: Requirements 4.4**

- [x] 8. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement ProgressionEngine service


  - [x] 9.1 Create ProgressionEngine service

    - Implement can_access() combining sequential and prerequisite checks
    - Implement mark_complete() with completion type handling using get_or_create
    - _Requirements: 1.3, 3.1_

  - [x] 9.2 Implement get_unlock_status() for all nodes

    - Return status for each node in single query
    - Include lock_reason and blocking_nodes for locked nodes
    - _Requirements: 5.1, 5.2_

  - [x] 9.3 Write property test for unlock status completeness


    - **Property 13: Unlock Status Completeness**
    - **Validates: Requirements 5.1**

  - [x] 9.4 Write property test for lock reason included

    - **Property 14: Lock Reason Included**
    - **Validates: Requirements 5.2**

- [x] 10. Implement completion rules validation


  - [x] 10.1 Create CompletionRulesValidator

    - Validate quiz_id present for quiz_pass type
    - Validate prerequisite node IDs exist
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 10.2 Write property test for completion rules validation


    - **Property 15: Completion Rules Validation**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 11. Final Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.
