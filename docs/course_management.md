# Curriculum Management Module

> This document describes the curriculum management system in Crossview LMS, built on Django 5.0+ with the Blueprint-driven architecture.

---

## Overview

The Curriculum Management module enables administrators and instructors to create, manage, and organize academic programs using the **Blueprint System**. Unlike traditional LMS platforms with rigid structures, Crossview uses a recursive node tree that adapts to any educational model.

**Key Principle**: Structure is configuration, not code. The same codebase powers Theology programs, TVET qualifications, and vocational training.

---

## Core Concepts

### Blueprint System
Blueprints define the academic structure and grading rules:

```python
# Example: Theology Blueprint
{
    "hierarchy_structure": ["Year", "Unit", "Session"],
    "grading_logic": {
        "type": "weighted",
        "components": [
            {"name": "CAT", "weight": 0.3},
            {"name": "Exam", "weight": 0.7}
        ]
    }
}

# Example: TVET Blueprint (CDACC)
{
    "hierarchy_structure": ["Module", "Unit of Competency", "Element"],
    "grading_logic": {
        "type": "competency",
        "scale": ["Competent", "Not Yet Competent"],
        "pass_mark": 50
    }
}
```

### Curriculum Tree
A recursive `CurriculumNode` model replaces traditional Course → Lesson hierarchies:

```
Program (Root Node)
├── Year 1
│   ├── Unit: Basic Homiletics
│   │   ├── Session 1: Introduction
│   │   ├── Session 2: Sermon Structure
│   │   └── Session 3: Practicum (requires upload)
│   └── Unit: Hermeneutics
└── Year 2
    └── ...
```

---

## Django Models

### AcademicBlueprint
```python
# apps/blueprints/models.py
class AcademicBlueprint(TenantModel):
    name = models.CharField(max_length=100)
    hierarchy_structure = models.JSONField()  # ["Year", "Unit", "Session"]
    grading_logic = models.JSONField()
    gamification_enabled = models.BooleanField(default=False)
    certificate_enabled = models.BooleanField(default=True)
```

### Program
```python
# apps/core/models.py
class Program(TenantModel):
    blueprint = models.ForeignKey(AcademicBlueprint, on_delete=models.PROTECT)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    is_published = models.BooleanField(default=False)
```

### CurriculumNode
```python
# apps/curriculum/models.py
class CurriculumNode(TenantModel):
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='curriculum_nodes')
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='children')
    node_type = models.CharField(max_length=50)  # 'year', 'unit', 'session'
    title = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)
    properties = models.JSONField(default=dict)  # Flexible metadata
    completion_rules = models.JSONField(default=dict)  # {"requires_upload": true}
    content_html = models.TextField(blank=True)  # Parsed content
    is_published = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['order']
        indexes = [
            models.Index(fields=['program', 'parent']),
        ]
```

### ContentVersion
```python
# apps/content/models.py
class ContentVersion(TenantModel):
    node = models.ForeignKey(CurriculumNode, on_delete=models.CASCADE, related_name='versions')
    version_number = models.PositiveIntegerField()
    source_file = models.FileField(upload_to='content/')
    parsed_content = models.TextField()  # HTML from PDF parsing
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
```

---

## Services Layer

Business logic lives in services, not views:

### CurriculumService
```python
# apps/curriculum/services.py
class CurriculumService:
    @staticmethod
    def create_node(program: Program, parent: CurriculumNode | None, data: dict) -> CurriculumNode:
        """Create a curriculum node with validation."""
        blueprint = program.blueprint
        hierarchy = blueprint.hierarchy_structure
        
        # Validate node_type matches hierarchy level
        depth = CurriculumService._get_depth(parent)
        if depth >= len(hierarchy):
            raise ValidationError("Maximum hierarchy depth reached")
        
        expected_type = hierarchy[depth].lower()
        if data.get('node_type', '').lower() != expected_type:
            raise ValidationError(f"Expected node type: {expected_type}")
        
        return CurriculumNode.objects.create(
            program=program,
            parent=parent,
            tenant=program.tenant,
            **data
        )
    
    @staticmethod
    def reorder_nodes(node_ids: list[int]) -> None:
        """Bulk update node order."""
        for index, node_id in enumerate(node_ids):
            CurriculumNode.objects.filter(pk=node_id).update(order=index)
    
    @staticmethod
    def get_tree(program: Program) -> list[dict]:
        """Get full curriculum tree using recursive CTE."""
        # Uses Django's recursive query or raw SQL with CTE
        pass
```

### ContentParsingService
```python
# apps/content/services.py
class ContentParsingService:
    @staticmethod
    def parse_pdf(file_path: str) -> list[dict]:
        """Parse PDF into session nodes."""
        # Uses PyMuPDF to extract text
        # Splits by headers/page breaks into sessions
        pass
    
    @staticmethod
    def create_nodes_from_pdf(program: Program, parent: CurriculumNode, file) -> list[CurriculumNode]:
        """Parse PDF and create session nodes."""
        sessions = ContentParsingService.parse_pdf(file.path)
        nodes = []
        for i, session in enumerate(sessions):
            node = CurriculumService.create_node(
                program=program,
                parent=parent,
                data={
                    'node_type': 'session',
                    'title': session['title'],
                    'content_html': session['content'],
                    'order': i,
                }
            )
            nodes.append(node)
        return nodes
```

---

## API Endpoints

### Programs
```
GET    /api/programs/                    # List programs (tenant-filtered)
POST   /api/programs/                    # Create program
GET    /api/programs/{id}/               # Get program with curriculum tree
PUT    /api/programs/{id}/               # Update program
DELETE /api/programs/{id}/               # Delete program
```

### Curriculum Nodes
```
GET    /api/programs/{id}/curriculum/           # Get curriculum tree
POST   /api/programs/{id}/curriculum/           # Create root node
POST   /api/curriculum-nodes/{id}/children/     # Create child node
PUT    /api/curriculum-nodes/{id}/              # Update node
DELETE /api/curriculum-nodes/{id}/              # Delete node (cascades)
POST   /api/curriculum-nodes/reorder/           # Bulk reorder
```

### Content
```
POST   /api/curriculum-nodes/{id}/upload-pdf/   # Parse PDF into sessions
POST   /api/curriculum-nodes/{id}/content/      # Create content version
GET    /api/curriculum-nodes/{id}/content/      # Get latest content
```

---

## ViewSets

```python
# apps/curriculum/views.py
class CurriculumNodeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsTenantMember]
    serializer_class = CurriculumNodeSerializer
    
    def get_queryset(self):
        return CurriculumNode.objects.filter(
            program__tenant=self.request.user.tenant
        ).select_related('program', 'parent')
    
    def perform_create(self, serializer):
        program = serializer.validated_data['program']
        if program.tenant != self.request.user.tenant:
            raise PermissionDenied()
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['post'])
    def upload_pdf(self, request, pk=None):
        node = self.get_object()
        file = request.FILES.get('file')
        nodes = ContentParsingService.create_nodes_from_pdf(
            program=node.program,
            parent=node,
            file=file
        )
        return Response(CurriculumNodeSerializer(nodes, many=True).data)
    
    @action(detail=False, methods=['post'])
    def reorder(self, request):
        node_ids = request.data.get('node_ids', [])
        CurriculumService.reorder_nodes(node_ids)
        return Response({'status': 'reordered'})
```

---

## Frontend: Curriculum Builder

### Component Structure
```
Pages/Admin/
├── Programs/
│   ├── ProgramList.jsx
│   ├── ProgramCreate.jsx
│   └── ProgramEdit.jsx
└── Curriculum/
    ├── CurriculumBuilder.jsx      # Main tree editor
    ├── NodeTreeView.jsx           # Recursive tree display
    ├── NodeEditDialog.jsx         # Create/edit node modal
    ├── ContentUploader.jsx        # PDF upload & parsing
    └── NodeReorderDnd.jsx         # Drag-and-drop reordering
```

### CurriculumBuilder Component
```jsx
// Pages/Admin/Curriculum/CurriculumBuilder.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Button, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import NodeTreeView from './NodeTreeView';
import NodeEditDialog from './NodeEditDialog';

export default function CurriculumBuilder({ programId }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: curriculum, refetch } = useQuery({
    queryKey: ['curriculum', programId],
    queryFn: () => api.get(`/programs/${programId}/curriculum/`),
  });
  
  const createNode = useMutation({
    mutationFn: (data) => api.post(`/curriculum-nodes/${selectedNode?.id}/children/`, data),
    onSuccess: () => {
      refetch();
      setDialogOpen(false);
    },
  });
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h4">Curriculum Builder</Typography>
          <Button variant="contained" onClick={() => setDialogOpen(true)}>
            Add Node
          </Button>
        </Box>
        
        <NodeTreeView
          nodes={curriculum?.data || []}
          onSelect={setSelectedNode}
          selectedId={selectedNode?.id}
        />
        
        <NodeEditDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSave={(data) => createNode.mutate(data)}
          parentNode={selectedNode}
          blueprint={curriculum?.blueprint}
        />
      </Stack>
    </motion.div>
  );
}
```

---

## Drip Content & Completion Rules

### Completion Rules Schema
```python
# Stored in CurriculumNode.completion_rules
{
    "type": "standard",           # or "practicum", "assessment", "timed"
    "requires_upload": false,
    "upload_type": null,          # "audio", "video", "document"
    "min_time_seconds": null,     # For timed content
    "unlock_after_days": null,    # Relative unlock
    "unlock_date": null,          # Absolute unlock
}
```

### ProgressionService
```python
# apps/progression/services.py
class ProgressionService:
    @staticmethod
    def can_access_node(user: User, node: CurriculumNode) -> bool:
        """Check if user can access this node based on completion rules."""
        # Check enrollment
        enrollment = Enrollment.objects.filter(
            user=user, program=node.program
        ).first()
        if not enrollment:
            return False
        
        # Check drip content
        rules = node.completion_rules
        if rules.get('unlock_date'):
            if timezone.now() < rules['unlock_date']:
                return False
        
        # Check prerequisite completion
        if node.parent:
            siblings = node.parent.children.filter(order__lt=node.order)
            for sibling in siblings:
                if not ProgressionService.is_completed(user, sibling):
                    return False
        
        return True
    
    @staticmethod
    def mark_completed(user: User, node: CurriculumNode) -> NodeCompletion:
        """Mark a node as completed."""
        return NodeCompletion.objects.create(
            user=user,
            node=node,
            tenant=user.tenant,
            completed_at=timezone.now()
        )
```

---

## Authorization & Access Control

### Policies
- **Tenant Isolation**: All queries filtered by `tenant_id`
- **Role-Based Access**:
  - `Admin`: Full CRUD on all tenant content
  - `Instructor`: Manage assigned programs only
  - `Student`: View enrolled programs, submit practicums

### Permission Classes
```python
# apps/core/permissions.py
class IsTenantMember(BasePermission):
    def has_permission(self, request, view):
        return request.user.tenant is not None

class CanManageProgram(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin:
            return obj.tenant == request.user.tenant
        # Instructors can only manage assigned programs
        return obj.instructors.filter(pk=request.user.pk).exists()
```

---

## Testing

### Factory Setup
```python
# apps/curriculum/tests/factories.py
class CurriculumNodeFactory(DjangoModelFactory):
    class Meta:
        model = CurriculumNode
    
    program = factory.SubFactory(ProgramFactory)
    tenant = factory.LazyAttribute(lambda o: o.program.tenant)
    node_type = 'session'
    title = factory.Faker('sentence', nb_words=3)
    order = factory.Sequence(lambda n: n)
```

### Test Cases
```python
# apps/curriculum/tests/test_services.py
@pytest.mark.django_db
class TestCurriculumService:
    def test_create_node_validates_hierarchy(self, program):
        # Program blueprint: ["Year", "Unit", "Session"]
        with pytest.raises(ValidationError):
            CurriculumService.create_node(
                program=program,
                parent=None,
                data={'node_type': 'session', 'title': 'Test'}  # Should be 'year'
            )
    
    def test_create_node_success(self, program):
        node = CurriculumService.create_node(
            program=program,
            parent=None,
            data={'node_type': 'year', 'title': 'Year 1'}
        )
        assert node.node_type == 'year'
        assert node.tenant == program.tenant
```

---

## References

- `understand` - Business context and Blueprint philosophy
- `frontend.md` - Frontend design system
- `.kiro/steering/multi-tenancy.md` - Tenant isolation rules
- `.kiro/steering/api-design.md` - API conventions
