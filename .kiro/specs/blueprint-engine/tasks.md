# Implementation Plan

- [ ] 1. Set up database schema and models
  - [ ] 1.1 Create migration for academic_blueprints table
    - Create migration file with all columns: name, description, hierarchy_structure (JSON), grading_logic (JSON), progression_rules (JSON), gamification_enabled, certificate_enabled
    - Add indexes on name column
    - _Requirements: 1.1, 1.2_

  - [ ] 1.2 Create migration for curriculum_nodes table
    - Create migration file with columns: program_id, parent_id (self-referencing), node_type, title, code, description, properties (JSON), completion_rules (JSON), position, is_published
    - Add foreign keys to programs and self-reference for parent_id with CASCADE delete
    - Add composite index on (program_id, parent_id) and index on node_type
    - _Requirements: 2.1, 2.4_

  - [ ] 1.3 Create migration to add blueprint_id to existing programs table
    - Add nullable blueprint_id column to programs table (if exists) or courses table
    - Add foreign key constraint to academic_blueprints
    - _Requirements: 4.1_

  - [ ] 1.4 Create AcademicBlueprint Eloquent model
    - Define fillable fields and JSON casts for hierarchy_structure, grading_logic, progression_rules
    - Add programs() HasMany relationship
    - Implement getHierarchyDepth() and getLabelForDepth(int $depth) methods
    - _Requirements: 1.1, 1.2, 4.2_

  - [ ] 1.5 Write property test for blueprint persistence
    - **Property 1: Blueprint Persistence Integrity**
    - **Validates: Requirements 1.1, 1.2**

  - [ ] 1.6 Create CurriculumNode Eloquent model
    - Define fillable fields and JSON casts for properties, completion_rules
    - Add program(), parent(), children() relationships
    - Implement getDepth() and getLabel() methods
    - _Requirements: 2.1, 2.2_

  - [ ] 1.7 Write property test for node parent reference integrity
    - **Property 4: Node Parent Reference Integrity**
    - **Validates: Requirements 2.1**

- [ ] 2. Implement blueprint validation logic
  - [ ] 2.1 Create BlueprintValidationService
    - Implement validateHierarchyStructure(array $structure): validates non-empty array of strings
    - Implement validateGradingLogic(array $logic): validates type field and required fields per type
    - Throw InvalidHierarchyStructureException and InvalidGradingLogicException on failures
    - _Requirements: 1.3, 1.4_

  - [ ] 2.2 Write property test for blueprint validation
    - **Property 2: Blueprint Validation Rejects Invalid Configurations**
    - **Validates: Requirements 1.3, 1.4**

  - [ ] 2.3 Add validation to AcademicBlueprint model boot method
    - Hook into saving event to run validation
    - Prevent save if validation fails
    - _Requirements: 1.3, 1.4_

  - [ ] 2.4 Implement blueprint deletion protection
    - Add deleting event handler to check for associated programs
    - Throw BlueprintInUseException if programs exist
    - _Requirements: 1.5_

  - [ ] 2.5 Write property test for blueprint deletion protection
    - **Property 3: Blueprint Deletion Protection**
    - **Validates: Requirements 1.5**

- [ ] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement curriculum node tree operations
  - [ ] 4.1 Create CurriculumNodeRepository
    - Implement getTreeForProgram(int $programId) using recursive CTE
    - Implement getSubtree(int $nodeId) using recursive CTE
    - Implement getAncestors(int $nodeId) for breadcrumb paths
    - _Requirements: 2.3, 5.2_

  - [ ] 4.2 Write property test for recursive tree retrieval
    - **Property 6: Recursive Tree Retrieval Completeness**
    - **Validates: Requirements 2.3**

  - [ ] 4.3 Implement node type validation against blueprint
    - Add validation in CurriculumNode saving event
    - Check node_type against program's blueprint hierarchy_structure
    - Throw InvalidNodeTypeException if not found
    - _Requirements: 2.2_

  - [ ] 4.4 Write property test for node type validation
    - **Property 5: Node Type Validation Against Blueprint**
    - **Validates: Requirements 2.2**

  - [ ] 4.5 Implement node move with depth validation
    - Add moveNode(int $nodeId, ?int $newParentId) to repository
    - Calculate new depth after move
    - Throw MaxDepthExceededException if exceeds blueprint hierarchy depth
    - _Requirements: 2.5_

  - [ ] 4.6 Write property test for node move depth validation
    - **Property 8: Node Move Depth Validation**
    - **Validates: Requirements 2.5**

  - [ ] 4.7 Implement sibling reordering
    - Add reorderSiblings(array $nodeIds) to repository
    - Update position field for each node
    - _Requirements: 5.2_

  - [ ] 4.8 Write property test for node ordering
    - **Property 10: Node Ordering Consistency**
    - **Validates: Requirements 5.2**

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement node properties handling
  - [ ] 6.1 Create NodePropertiesService
    - Implement mergeProperties(CurriculumNode $node, array $newProperties)
    - Ensure existing keys not in update are preserved
    - _Requirements: 3.2_

  - [ ] 6.2 Write property test for properties merge behavior
    - **Property 9: Properties JSON Merge Behavior**
    - **Validates: Requirements 3.2**

  - [ ] 6.3 Implement required properties validation per node_type
    - Define required fields per node_type in config
    - Validate on save
    - _Requirements: 3.4_

- [ ] 7. Implement cascade delete verification
  - [ ] 7.1 Verify cascade delete works via foreign key
    - Test that deleting parent removes all descendants
    - _Requirements: 2.4_

  - [ ] 7.2 Write property test for cascade delete
    - **Property 7: Cascade Delete Removes All Descendants**
    - **Validates: Requirements 2.4**

- [ ] 8. Implement blueprint serialization
  - [ ] 8.1 Create BlueprintSerializationService
    - Implement serializeToJson(AcademicBlueprint $blueprint): string
    - Implement deserializeFromJson(string $json): AcademicBlueprint
    - Throw validation exception on invalid JSON
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 8.2 Write property test for serialization round-trip
    - **Property 13: Blueprint Serialization Round-Trip**
    - **Validates: Requirements 7.1, 7.2**

  - [ ] 8.3 Write property test for invalid JSON deserialization
    - **Property 14: Invalid JSON Deserialization Throws Exception**
    - **Validates: Requirements 7.3**

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement legacy data migration
  - [ ] 10.1 Create LegacyMigrationService
    - Implement createDefaultTheologyBlueprint() with hierarchy ["Course", "Section", "Lesson"]
    - _Requirements: 6.1_

  - [ ] 10.2 Implement course migration
    - Implement migrateCoursesToNodes() to convert Course records to root CurriculumNodes
    - Map course fields to node properties JSON
    - _Requirements: 6.2_

  - [ ] 10.3 Implement section migration
    - Implement migrateSectionsToNodes() to convert CourseSection records to child nodes
    - Link to parent course node
    - _Requirements: 6.3_

  - [ ] 10.4 Implement lesson migration
    - Implement migrateLessonsToNodes() to convert Lesson records to child nodes
    - Preserve video_url, content, attachments in properties JSON
    - _Requirements: 6.4, 6.5_

  - [ ] 10.5 Write property test for migration structure preservation
    - **Property 11: Migration Structure Preservation**
    - **Validates: Requirements 6.2, 6.3, 6.4**

  - [ ] 10.6 Write property test for migration content preservation
    - **Property 12: Migration Content Preservation**
    - **Validates: Requirements 6.5**

  - [ ] 10.7 Implement migration report generation
    - Generate report with counts of migrated courses, sections, lessons
    - Include any errors encountered
    - _Requirements: 6.6_

  - [ ] 10.8 Create artisan command for migration
    - Create `php artisan blueprint:migrate-legacy` command
    - Add --dry-run option to preview changes
    - Add --rollback option
    - _Requirements: 6.1, 6.6_

- [ ] 11. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
