# Course Builder Three-Tier Taxonomy System

## Overview

The Course Builder uses a three-tier hierarchical taxonomy to organize educational content. This system provides flexibility while maintaining consistent structure across different educational modes (TVET, Theology, Online, etc.).

## The Three Tiers

### Tier 1: LEVEL (Admin-Set)

**Set by:** Admin during program creation  
**Stored in:** `program.level` field  
**Immutable:** Yes, cannot be changed after program creation  
**Part of curriculum tree:** No

**Examples:**

- Diploma
- Certificate
- Bachelor's Degree
- Year 1, Year 2, etc.
- Grade 10, Grade 11, etc.

**Purpose:** Defines the academic level or qualification tier of the entire program. This is a program-wide attribute, not part of the navigable curriculum structure.

---

### Tier 2: CONTAINER (Instructor Creates in Builder)

**Set by:** Instructor in Course Builder  
**Stored in:** Curriculum nodes at depth 0  
**Node type:** `blueprint.hierarchy_structure[0]`  
**Multiple allowed:** Yes

**Examples:**

- Module
- Section
- Unit
- Semester
- Chapter

**Purpose:** Organizational units that group related lessons together. Acts as the top-level navigation structure within the curriculum tree.

---

### Tier 3: CONTENT/LESSON TYPES (Instructor Creates in Builder)

**Set by:** Instructor in Course Builder  
**Stored in:** Curriculum nodes at depth 1  
**Node type:** `blueprint.hierarchy_structure[1]`  
**Differentiation:** `properties.lesson_type`  
**Multiple allowed:** Yes (multiple lessons per container)

**Examples:**

- Lesson (generic)
- Session
- Topic

**Lesson Type Variants** (stored in `properties.lesson_type`):

- `video` - Video-based lesson
- `text` - Text/reading-based lesson
- `quiz` - Assessment/quiz
- `assignment` - Assignment/homework
- `live` - Live session/webinar

**Purpose:** The actual content units that students interact with. All lesson types use the same node type but are differentiated by their `lesson_type` property.

---

## Blueprint Configuration

Blueprints define the hierarchy structure for different educational modes. The `hierarchy_structure` array must contain exactly 2 elements:

```python
# Example Blueprint Configurations

# TVET Mode
hierarchy_structure = ["Unit", "Session"]

# Theology Mode
hierarchy_structure = ["Module", "Lesson"]

# Online Course Mode
hierarchy_structure = ["Section", "Lesson"]

# Traditional Academic
hierarchy_structure = ["Chapter", "Topic"]
```

### Blueprint Structure Rules

1. **Array length:** Must be exactly 2 elements (Container, Content)
2. **Index 0:** Container type name (e.g., "Unit", "Module", "Section")
3. **Index 1:** Content type name (e.g., "Session", "Lesson", "Topic")
4. **Validation:** Node types are validated against this structure

---

## Curriculum Tree Structure

```
Program
├─ level: "Diploma" (admin-set, not in tree)
└─ curriculum: [
      {
        id: 1,
        type: "Unit",              ← blueprint.hierarchy_structure[0]
        title: "Introduction",
        children: [
          {
            id: 2,
            type: "Session",       ← blueprint.hierarchy_structure[1]
            title: "Video Lecture",
            properties: {
              lesson_type: "video" ← Differentiator
            }
          },
          {
            id: 3,
            type: "Session",       ← Same node type
            title: "Reading Material",
            properties: {
              lesson_type: "text"  ← Different lesson type
            }
          },
          {
            id: 4,
            type: "Session",       ← Same node type
            title: "Quiz 1",
            properties: {
              lesson_type: "quiz"  ← Different lesson type
            }
          }
        ]
      }
    ]
```

---

## Node Creation Logic

### Backend: `instructor_node_create` Endpoint

```python
# Determine node type based on hierarchy depth

if parent_id:
    # Child node (Content/Lesson)
    parent_depth = parent.get_depth()
    node_type = blueprint.hierarchy_structure[parent_depth + 1]
    # Result: "Session", "Lesson", "Topic", etc.
else:
    # Root node (Container)
    node_type = blueprint.hierarchy_structure[0]
    # Result: "Unit", "Module", "Section", etc.

# Create node with determined type
node = CurriculumNode.objects.create(
    program=program,
    parent=parent,
    title=title,
    node_type=node_type,  # From blueprint
    properties={
        "lesson_type": frontend_type  # "video", "quiz", etc.
    }
)
```

### Frontend: Lesson Type Selection

```javascript
// User selects lesson type in UI
const lessonType = "video"; // or "text", "quiz", "assignment", "live"

// Frontend sends to backend
router.post(`/instructor/programs/${programId}/nodes/create/`, {
    parent_id: containerId,
    title: "My Video Lesson",
    type: "Lesson", // Generic, backend will override
    properties: {
        lesson_type: lessonType, // Stored here
    },
});

// Backend uses blueprint structure for actual node type
// Stores lesson_type in properties for differentiation
```

---

## Validation Rules

### Depth Validation

- **Maximum depth:** 1 (0 for containers, 1 for content)
- **Error if exceeded:** "Maximum taxonomy depth exceeded"

### Parent-Child Validation

- **Containers (depth 0):** Must have no parent (`parent = null`)
- **Content (depth 1):** Must have a Container parent (`parent.depth = 0`)
- **Error if violated:** "Content (lessons) must be direct children of Containers"

### Node Type Validation

- **Validation:** Node type must exist in `blueprint.hierarchy_structure`
- **Automatic:** Backend automatically assigns correct type based on depth
- **No user override:** Frontend cannot override blueprint structure

---

## Frontend Display Logic

### Rendering Lesson Types

```javascript
// Display logic based on lesson_type property
const lessonIcons = {
    video: <VideoIcon />,
    text: <TextIcon />,
    quiz: <QuizIcon />,
    assignment: <AssignmentIcon />,
    live: <LiveIcon />,
};

// Render in curriculum tree
<TreeItem
    icon={lessonIcons[node.properties.lesson_type]}
    label={node.title}
    nodeType={node.type} // "Session", "Lesson", etc.
/>;
```

### Creating Lesson Types

```javascript
// Modal with lesson type selection
<LessonTypeModal>
    <Button onClick={() => createLesson("video")}>Video Lesson</Button>
    <Button onClick={() => createLesson("text")}>Text Lesson</Button>
    <Button onClick={() => createLesson("quiz")}>Quiz</Button>
    <Button onClick={() => createLesson("assignment")}>Assignment</Button>
    <Button onClick={() => createLesson("live")}>Live Session</Button>
</LessonTypeModal>
```

---

## Database Schema

### Program Model

```python
class Program(models.Model):
    level = models.CharField(max_length=100)  # Tier 1: Admin-set
    blueprint = models.ForeignKey('Blueprint')
    # ... other fields
```

### Blueprint Model

```python
class Blueprint(models.Model):
    hierarchy_structure = models.JSONField()
    # Example: ["Unit", "Session"]
    # Index 0: Container type
    # Index 1: Content type
```

### CurriculumNode Model

```python
class CurriculumNode(models.Model):
    program = models.ForeignKey('Program')
    parent = models.ForeignKey('self', null=True)
    node_type = models.CharField(max_length=50)  # From hierarchy_structure
    properties = models.JSONField()  # Contains lesson_type
    position = models.IntegerField()

    def get_depth(self):
        # Returns 0 for containers, 1 for content
        depth = 0
        node = self
        while node.parent:
            depth += 1
            node = node.parent
        return depth
```

---

## Migration Guide

### Updating Existing Programs

If you have existing programs with different node types, you may need to:

1. **Audit existing nodes:**

    ```python
    # Find nodes with non-blueprint types
    invalid_nodes = CurriculumNode.objects.exclude(
        node_type__in=program.blueprint.hierarchy_structure
    )
    ```

2. **Update node types:**

    ```python
    # Containers (depth 0)
    containers = CurriculumNode.objects.filter(
        program=program,
        parent__isnull=True
    )
    containers.update(node_type=blueprint.hierarchy_structure[0])

    # Content (depth 1)
    for container in containers:
        container.children.update(node_type=blueprint.hierarchy_structure[1])
    ```

3. **Preserve lesson types:**
    ```python
    # Ensure lesson_type is in properties
    lessons = CurriculumNode.objects.filter(parent__isnull=False)
    for lesson in lessons:
        if 'lesson_type' not in lesson.properties:
            # Infer from old node_type
            lesson.properties['lesson_type'] = infer_lesson_type(lesson.node_type)
            lesson.save()
    ```

---

## Common Patterns

### Creating a Complete Module

```python
# 1. Create Container
container = CurriculumNode.objects.create(
    program=program,
    parent=None,
    title="Introduction to Python",
    node_type=program.blueprint.hierarchy_structure[0],  # "Unit"
    position=0
)

# 2. Create Video Lesson
video_lesson = CurriculumNode.objects.create(
    program=program,
    parent=container,
    title="Python Basics Video",
    node_type=program.blueprint.hierarchy_structure[1],  # "Session"
    properties={"lesson_type": "video"},
    position=0
)

# 3. Create Quiz
quiz = CurriculumNode.objects.create(
    program=program,
    parent=container,
    title="Python Basics Quiz",
    node_type=program.blueprint.hierarchy_structure[1],  # "Session"
    properties={"lesson_type": "quiz"},
    position=1
)
```

### Querying by Lesson Type

```python
# Get all video lessons in a program
video_lessons = CurriculumNode.objects.filter(
    program=program,
    properties__lesson_type="video"
)

# Get all quizzes in a specific container
quizzes = CurriculumNode.objects.filter(
    parent=container,
    properties__lesson_type="quiz"
)

# Count lesson types
from django.db.models import Count
program.curriculum_nodes.filter(
    parent__isnull=False
).values('properties__lesson_type').annotate(
    count=Count('id')
)
```

---

## Troubleshooting

### Error: "Node type 'X' is not valid for this blueprint"

**Cause:** Node type doesn't match blueprint hierarchy structure

**Solution:** Ensure you're using blueprint types, not custom types

```python
# ❌ Wrong
node_type = "Lesson"  # Hardcoded

# ✅ Correct
node_type = blueprint.hierarchy_structure[depth]
```

### Error: "Maximum taxonomy depth exceeded"

**Cause:** Trying to nest beyond depth 1

**Solution:** Don't create children of content nodes

```python
# ❌ Wrong - Content cannot have children
lesson.children.create(...)

# ✅ Correct - Add to container instead
container.children.create(...)
```

### Error: "Content must be direct children of Containers"

**Cause:** Invalid parent relationship

**Solution:** Ensure content nodes have container parents

```python
# ❌ Wrong - Content has null parent
CurriculumNode.objects.create(parent=None, ...)

# ✅ Correct - Content has container parent
CurriculumNode.objects.create(parent=container, ...)
```

---

## Best Practices

1. **Always use blueprint structure** - Never hardcode node types
2. **Store variants in properties** - Use `lesson_type` for differentiation
3. **Validate depth** - Enforce maximum depth of 1
4. **Preserve lesson types** - When updating node types, keep properties
5. **Use descriptive names** - Make container and lesson titles clear
6. **Test blueprint changes** - Validate before applying to production
7. **Document custom blueprints** - Record rationale for hierarchy choices

---

## Future Enhancements

Potential improvements to consider:

- **Dynamic depth:** Support configurable taxonomy depth in blueprints
- **Lesson type validation:** Validate allowed lesson types per blueprint
- **Type icons:** Associate icons with blueprint types
- **Type permissions:** Control which lesson types instructors can create
- **Type templates:** Provide templates for common lesson type configurations
