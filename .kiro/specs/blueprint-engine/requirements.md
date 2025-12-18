# Requirements Document

## Introduction

This specification defines the Blueprint Engine — the core architectural component that transforms the LMS from a rigid, hard-coded structure into a configurable, multi-tenant educational platform. The Blueprint Engine enables Crossview College to run Theology programs, TVET programs, and future SaaS clients using the same codebase with different configurations.

The engine replaces the current fixed `Course → Section → Lesson` hierarchy with a flexible `academic_blueprints` configuration layer and a recursive `curriculum_nodes` content tree.

## Glossary

- **Blueprint**: A JSON-based configuration that defines the academic structure, hierarchy labels, grading logic, and progression rules for a specific type of program (e.g., "CCT Theology Standard", "TVET CDACC Level 6").
- **Curriculum Node**: A single element in the content tree that can represent any level of the hierarchy (Year, Unit, Session, Module, Competency) based on its `node_type`.
- **Hierarchy Structure**: The ordered list of levels in an academic program (e.g., `["Year", "Unit", "Session"]` for Theology or `["Level", "Module", "Competency"]` for TVET).
- **Node Type**: The classification of a curriculum node that determines its behavior and rendering (e.g., `year`, `unit`, `session`, `competency`, `element`).
- **Recursive CTE**: A Common Table Expression in MySQL 8.0+ that allows fetching hierarchical data (parent-child relationships) in a single query.
- **Properties JSON**: A flexible JSON column storing node-specific data like PDF URLs, video links, credit hours, or completion rules.

## Requirements

### Requirement 1: Academic Blueprint Management

**User Story:** As a registrar, I want to define academic structures through configuration, so that I can support different program types (Theology, TVET, Online Courses) without code changes.

#### Acceptance Criteria

1. WHEN a registrar creates a new blueprint THEN the Blueprint Engine SHALL store the hierarchy structure as an ordered JSON array of level labels.
2. WHEN a registrar defines grading logic for a blueprint THEN the Blueprint Engine SHALL store the grading configuration including type (weighted, competency-based), components, weights, and pass thresholds.
3. WHEN a blueprint is saved THEN the Blueprint Engine SHALL validate that the hierarchy structure contains at least one level label.
4. WHEN a blueprint is saved THEN the Blueprint Engine SHALL validate that grading logic contains a valid type and required fields for that type.
5. IF a registrar attempts to delete a blueprint with associated programs THEN the Blueprint Engine SHALL prevent deletion and display an error message.

### Requirement 2: Curriculum Node Tree Structure

**User Story:** As a content administrator, I want to organize course content in a flexible tree structure, so that the same system can represent Sessions (Theology), Competencies (TVET), or Modules (Online Courses).

#### Acceptance Criteria

1. WHEN a curriculum node is created THEN the Blueprint Engine SHALL store the node with a reference to its parent node (or null for root nodes).
2. WHEN a curriculum node is created THEN the Blueprint Engine SHALL validate that the node_type matches one of the levels defined in the associated blueprint's hierarchy structure.
3. WHEN a curriculum node is queried THEN the Blueprint Engine SHALL return the complete subtree using a recursive CTE query.
4. WHEN a parent node is deleted THEN the Blueprint Engine SHALL cascade delete all descendant nodes.
5. WHEN a curriculum node is moved to a new parent THEN the Blueprint Engine SHALL validate that the move maintains valid hierarchy depth according to the blueprint.

### Requirement 3: Node Properties and Content Storage

**User Story:** As a lecturer, I want to attach different types of content (PDFs, videos, audio) to curriculum nodes, so that students can access learning materials appropriate to each session or competency.

#### Acceptance Criteria

1. WHEN content is attached to a node THEN the Blueprint Engine SHALL store the content metadata in the node's properties JSON column.
2. WHEN a node's properties are updated THEN the Blueprint Engine SHALL merge new properties with existing ones rather than replacing the entire JSON.
3. WHEN a node with content is rendered THEN the Blueprint Engine SHALL parse the properties JSON and display appropriate UI components based on content type.
4. WHEN properties JSON is saved THEN the Blueprint Engine SHALL validate that required fields for the node_type are present.

### Requirement 4: Program-Blueprint Association

**User Story:** As a registrar, I want to associate programs with blueprints, so that each program inherits the correct academic structure and grading rules.

#### Acceptance Criteria

1. WHEN a program is created THEN the Blueprint Engine SHALL require association with exactly one blueprint.
2. WHEN a program's blueprint is queried THEN the Blueprint Engine SHALL return the complete blueprint configuration including hierarchy structure and grading logic.
3. WHEN a blueprint is updated THEN the Blueprint Engine SHALL apply the changes to all associated programs.
4. IF a registrar attempts to change a program's blueprint after curriculum nodes exist THEN the Blueprint Engine SHALL warn about potential data inconsistencies.

### Requirement 5: Tree Traversal and Rendering

**User Story:** As a student, I want to navigate course content in a structured hierarchy, so that I can understand my progress through the program.

#### Acceptance Criteria

1. WHEN a student views a program THEN the Blueprint Engine SHALL render the curriculum tree using labels from the associated blueprint's hierarchy structure.
2. WHEN the curriculum tree is fetched THEN the Blueprint Engine SHALL return nodes ordered by their position within each level.
3. WHEN a deep curriculum tree is rendered THEN the Blueprint Engine SHALL fetch all levels in a single database query using recursive CTE.
4. WHEN a node is expanded THEN the Blueprint Engine SHALL display child nodes with the appropriate label from the hierarchy structure.

### Requirement 6: Data Migration from Legacy Structure

**User Story:** As a system administrator, I want to migrate existing Course/Section/Lesson data to the new curriculum_nodes structure, so that current content is preserved during the transition.

#### Acceptance Criteria

1. WHEN migration is executed THEN the Blueprint Engine SHALL create a default "Legacy Theology" blueprint with hierarchy `["Course", "Section", "Lesson"]`.
2. WHEN migration is executed THEN the Blueprint Engine SHALL convert each existing Course to a root curriculum_node with node_type "course".
3. WHEN migration is executed THEN the Blueprint Engine SHALL convert each CourseSection to a child node with node_type "section" under its parent course node.
4. WHEN migration is executed THEN the Blueprint Engine SHALL convert each Lesson to a child node with node_type "lesson" under its parent section node.
5. WHEN migration is executed THEN the Blueprint Engine SHALL preserve all content URLs and metadata in the properties JSON column.
6. WHEN migration completes THEN the Blueprint Engine SHALL generate a report showing the count of migrated items and any errors.

### Requirement 7: Blueprint Serialization and Deserialization

**User Story:** As a developer, I want blueprints to be serializable to JSON and deserializable back to objects, so that configurations can be exported, imported, and version-controlled.

#### Acceptance Criteria

1. WHEN a blueprint is serialized THEN the Blueprint Engine SHALL produce valid JSON containing all configuration fields.
2. WHEN valid blueprint JSON is deserialized THEN the Blueprint Engine SHALL create a valid Blueprint object.
3. WHEN invalid blueprint JSON is deserialized THEN the Blueprint Engine SHALL throw a validation exception with specific error details.
