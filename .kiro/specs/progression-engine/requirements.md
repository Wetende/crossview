# Requirements Document

## Introduction

The Progression Engine controls student access to curriculum content through sequential locking and prerequisite enforcement. It ensures students complete Session 1 before accessing Session 2 (sequential), and complete foundational courses before advanced ones (prerequisites). The engine reads progression rules from the Academic Blueprint and curriculum node completion_rules.

## Glossary

- **Sequential Locking**: A progression rule where nodes must be completed in order (Session 1 → Session 2 → Session 3).
- **Prerequisite Locking**: A progression rule where specific nodes must be completed before accessing another node.
- **Node Completion**: The state where a student has fulfilled all completion requirements for a curriculum node.
- **Completion Rules**: JSON configuration on a node defining what constitutes completion (view, quiz pass, upload, etc.).
- **Unlock Status**: Whether a student can access a specific node (locked, unlocked, completed).
- **Progress Percentage**: The ratio of completed nodes to total nodes in a program or subtree.

## Requirements

### Requirement 1: Sequential Locking

**User Story:** As a student, I want to complete sessions in order, so that I build knowledge progressively as designed by the instructor.

#### Acceptance Criteria

1. WHEN a blueprint has progression_rules.sequential set to true THEN the Progression Engine SHALL lock all sibling nodes except the first uncompleted one.
2. WHEN a student completes a node THEN the Progression Engine SHALL unlock the next sibling node in position order.
3. WHEN a student attempts to access a locked node THEN the Progression Engine SHALL deny access and indicate which node must be completed first.
4. WHEN sequential locking is disabled THEN the Progression Engine SHALL allow access to all published nodes regardless of completion order.

### Requirement 2: Prerequisite Locking

**User Story:** As a registrar, I want to define course prerequisites, so that students complete foundational courses before advanced ones.

#### Acceptance Criteria

1. WHEN a node has completion_rules.prerequisites defined THEN the Progression Engine SHALL check if all prerequisite nodes are completed.
2. WHEN all prerequisites are completed THEN the Progression Engine SHALL unlock the dependent node.
3. WHEN any prerequisite is incomplete THEN the Progression Engine SHALL lock the dependent node and list the incomplete prerequisites.
4. WHEN a prerequisite node is un-completed (e.g., grade revoked) THEN the Progression Engine SHALL re-lock dependent nodes.

### Requirement 3: Node Completion Tracking

**User Story:** As a student, I want my progress saved automatically, so that I can resume where I left off.

#### Acceptance Criteria

1. WHEN a student marks a node as complete THEN the Progression Engine SHALL create a completion record with timestamp.
2. WHEN a node has completion_rules.type set to "view" THEN the Progression Engine SHALL mark complete when the student views the content.
3. WHEN a node has completion_rules.type set to "quiz_pass" THEN the Progression Engine SHALL mark complete only when the student passes the associated quiz.
4. WHEN a node has completion_rules.type set to "upload" THEN the Progression Engine SHALL mark complete only when the student uploads required content.
5. WHEN a completion record exists THEN the Progression Engine SHALL not create a duplicate record.

### Requirement 4: Progress Calculation

**User Story:** As a student, I want to see my progress percentage, so that I know how much of the program I have completed.

#### Acceptance Criteria

1. WHEN calculating progress for a program THEN the Progression Engine SHALL compute (completed nodes / total completable nodes) × 100.
2. WHEN calculating progress for a subtree THEN the Progression Engine SHALL only count nodes within that subtree.
3. WHEN a node is not completable (e.g., a container node like "Year") THEN the Progression Engine SHALL exclude it from progress calculation.
4. WHEN progress reaches 100% THEN the Progression Engine SHALL mark the program enrollment as completed.

### Requirement 5: Unlock Status Query

**User Story:** As a frontend developer, I want to query unlock status for all nodes, so that I can render locked/unlocked UI states.

#### Acceptance Criteria

1. WHEN querying unlock status for a program THEN the Progression Engine SHALL return each node with status: locked, unlocked, or completed.
2. WHEN a node is locked THEN the Progression Engine SHALL include the reason (sequential or prerequisite) and blocking node(s).
3. WHEN querying status THEN the Progression Engine SHALL execute in a single efficient query, not N+1 queries.

### Requirement 6: Completion Rules Validation

**User Story:** As a content administrator, I want completion rules validated on save, so that invalid configurations are caught early.

#### Acceptance Criteria

1. WHEN completion_rules.type is "quiz_pass" THEN the Progression Engine SHALL validate that a quiz_id is specified.
2. WHEN completion_rules.prerequisites references node IDs THEN the Progression Engine SHALL validate those nodes exist.
3. WHEN completion_rules contains invalid configuration THEN the Progression Engine SHALL reject the save with a descriptive error.
