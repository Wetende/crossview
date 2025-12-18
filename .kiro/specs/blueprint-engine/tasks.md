# Implementation Plan

> **🔄 Migration Notice:** This implementation plan is for migrating from PHP/Laravel to Python/Django. All tasks reference Django-specific implementations (Django models, migrations, pytest/Hypothesis for testing, management commands).

- [x] 1. Set up database schema and models

  - [x] 1.1 Create Django migration for academic_blueprints table
    - Create migration file with all columns: name, description, hierarchy_structure (JSONField), grading_logic (JSONField), progression_rules (JSONField), gamification_enabled, certificate_enabled
    - Add indexes on name column
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Create Django migration for curriculum_nodes table
    - Create migration file with columns: program_id, parent_id (self-referencing), node_type, title, code, description, properties (JSONField), completion_rules (JSONField), position, is_published
    - Add foreign keys to programs and self-reference for parent_id with CASCADE delete
    - Add composite index on (program_id, parent_id) and index on node_type
    - _Requirements: 2.1, 2.4_

  - [x] 1.3 Create Django migration to add blueprint_id to existing programs table
    - Add nullable blueprint_id column to programs table
    - Add foreign key constraint to academic_blueprints
    - _Requirements: 4.1_

  - [x] 1.4 Create AcademicBlueprint Django model
    - Define fields and JSONField for hierarchy_structure, grading_logic, progression_rules
    - Add programs relationship via ForeignKey on Program model
    - Implement get_hierarchy_depth() and get_label_for_depth(depth) methods
    - _Requirements: 1.1, 1.2, 4.2_

  - [x] 1.5 Write property test for blueprint persistence
    - **Property 1: Blueprint Persistence Integrity**
    - **Validates: Requirements 1.1, 1.2**

  - [x] 1.6 Create CurriculumNode Django model
    - Define fields and JSONField for properties, completion_rules
    - Add program, parent, children relationships
    - Implement get_depth() and get_label() methods
    - _Requirements: 2.1, 2.2_

  - [x] 1.7 Write property test for node parent reference integrity
    - **Property 4: Node Parent Reference Integrity**
    - **Validates: Requirements 2.1**

- [x] 2. Implement blueprint validation logic

  - [x] 2.1 Create BlueprintValidationService
    - Implement validate_hierarchy_structure(structure): validates non-empty list of strings
    - Implement validate_grading_logic(logic): validates type field and required fields per type
    - Raise InvalidHierarchyStructureException and InvalidGradingLogicException on failures
    - _Requirements: 1.3, 1.4_

  - [x] 2.2 Write property test for blueprint validation
    - **Property 2: Blueprint Validation Rejects Invalid Configurations**
    - **Validates: Requirements 1.3, 1.4**

  - [x] 2.3 Add validation to AcademicBlueprint model save method
    - Override save() or use Django signals to run validation
    - Prevent save if validation fails
    - _Requirements: 1.3, 1.4_

  - [x] 2.4 Implement blueprint deletion protection
    - Override delete() or use pre_delete signal to check for associated programs
    - Raise BlueprintInUseException if programs exist
    - _Requirements: 1.5_

  - [x] 2.5 Write property test for blueprint deletion protection
    - **Property 3: Blueprint Deletion Protection**
    - **Validates: Requirements 1.5**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement curriculum node tree operations

  - [x] 4.1 Create CurriculumNodeRepository
    - Implement get_tree_for_program(program_id) using recursive CTE with raw SQL
    - Implement get_subtree(node_id) using recursive CTE
    - Implement get_ancestors(node_id) for breadcrumb paths
    - _Requirements: 2.3, 5.2_

  - [x] 4.2 Write property test for recursive tree retrieval
    - **Property 6: Recursive Tree Retrieval Completeness**
    - **Validates: Requirements 2.3**

  - [x] 4.3 Implement node type validation against blueprint
    - Add validation in CurriculumNode save() method or pre_save signal
    - Check node_type against program's blueprint hierarchy_structure
    - Raise InvalidNodeTypeException if not found
    - _Requirements: 2.2_

  - [x] 4.4 Write property test for node type validation
    - **Property 5: Node Type Validation Against Blueprint**
    - **Validates: Requirements 2.2**

  - [x] 4.5 Implement node move with depth validation
    - Add move_node(node_id, new_parent_id) to repository
    - Calculate new depth after move
    - Raise MaxDepthExceededException if exceeds blueprint hierarchy depth
    - _Requirements: 2.5_

  - [x] 4.6 Write property test for node move depth validation
    - **Property 8: Node Move Depth Validation**
    - **Validates: Requirements 2.5**

  - [x] 4.7 Implement sibling reordering
    - Add reorder_siblings(node_ids) to repository
    - Update position field for each node
    - _Requirements: 5.2_

  - [x] 4.8 Write property test for node ordering
    - **Property 10: Node Ordering Consistency**
    - **Validates: Requirements 5.2**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement node properties handling

  - [x] 6.1 Create NodePropertiesService
    - Implement merge_properties(node, new_properties)
    - Ensure existing keys not in update are preserved
    - _Requirements: 3.2_

  - [x] 6.2 Write property test for properties merge behavior
    - **Property 9: Properties JSON Merge Behavior**
    - **Validates: Requirements 3.2**

  - [x] 6.3 Implement required properties validation per node_type
    - Define required fields per node_type in Django settings
    - Validate on save
    - _Requirements: 3.4_

- [x] 7. Implement cascade delete verification

  - [x] 7.1 Verify cascade delete works via foreign key
    - Test that deleting parent removes all descendants
    - _Requirements: 2.4_

  - [x] 7.2 Write property test for cascade delete
    - **Property 7: Cascade Delete Removes All Descendants**
    - **Validates: Requirements 2.4**

- [x] 8. Implement blueprint serialization

  - [x] 8.1 Create BlueprintSerializationService
    - Implement serialize_to_json(blueprint) -> str
    - Implement deserialize_from_json(json_str) -> AcademicBlueprint
    - Raise validation exception on invalid JSON
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 8.2 Write property test for serialization round-trip
    - **Property 13: Blueprint Serialization Round-Trip**
    - **Validates: Requirements 7.1, 7.2**

  - [x] 8.3 Write property test for invalid JSON deserialization
    - **Property 14: Invalid JSON Deserialization Throws Exception**
    - **Validates: Requirements 7.3**

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement legacy data migration

  - [x] 10.1 Create LegacyMigrationService
    - Implement create_default_theology_blueprint() with hierarchy ["Course", "Section", "Lesson"]
    - _Requirements: 6.1_

  - [x] 10.2 Implement course migration
    - Implement migrate_courses_to_nodes() to convert Course records to root CurriculumNodes
    - Map course fields to node properties JSON
    - _Requirements: 6.2_

  - [x] 10.3 Implement section migration
    - Implement migrate_sections_to_nodes() to convert CourseSection records to child nodes
    - Link to parent course node
    - _Requirements: 6.3_

  - [x] 10.4 Implement lesson migration
    - Implement migrate_lessons_to_nodes() to convert Lesson records to child nodes
    - Preserve video_url, content, attachments in properties JSON
    - _Requirements: 6.4, 6.5_

  - [x] 10.5 Write property test for migration structure preservation
    - **Property 11: Migration Structure Preservation**
    - **Validates: Requirements 6.2, 6.3, 6.4**

  - [x] 10.6 Write property test for migration content preservation
    - **Property 12: Migration Content Preservation**
    - **Validates: Requirements 6.5**

  - [x] 10.7 Implement migration report generation
    - Generate report with counts of migrated courses, sections, lessons
    - Include any errors encountered
    - _Requirements: 6.6_

  - [x] 10.8 Create Django management command for migration
    - Create `python manage.py migrate_legacy_blueprint` command
    - Add --dry-run option to preview changes
    - Add --rollback option
    - _Requirements: 6.1, 6.6_

- [x] 11. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
