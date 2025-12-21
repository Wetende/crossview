# Performance Rules

> Guidelines for building a fast, scalable SaaS application that handles growth gracefully.

## Database Performance

### Query Optimization

#### Use select_related for ForeignKey
```python
# ✅ Good - Single query with JOIN
enrollments = Enrollment.objects.select_related(
    'user', 'program', 'program__blueprint'
).filter(status='active')

# ❌ Bad - N+1 queries (1 + N additional queries)
enrollments = Enrollment.objects.filter(status='active')
for e in enrollments:
    print(e.user.email)  # Each access = new query!
```

#### Use prefetch_related for Reverse FK / M2M
```python
# ✅ Good - 2 queries total
programs = Program.objects.prefetch_related(
    'curriculum_nodes',
    'enrollments'
).all()

# ✅ Good - Prefetch with filtering
from django.db.models import Prefetch

programs = Program.objects.prefetch_related(
    Prefetch(
        'curriculum_nodes',
        queryset=CurriculumNode.objects.filter(is_published=True)
    )
).all()
```

#### Use only() and defer() for Large Models
```python
# ✅ Good - Only fetch needed fields
programs = Program.objects.only('id', 'name', 'code').all()

# ✅ Good - Defer large fields
nodes = CurriculumNode.objects.defer('properties', 'completion_rules').all()
```

#### Use values() for Aggregations
```python
# ✅ Good - Returns dicts, not model instances
stats = Enrollment.objects.values('program_id').annotate(
    count=Count('id'),
    completed=Count('id', filter=Q(status='completed'))
)
```

### Indexing Strategy

#### Index Frequently Filtered Fields
```python
class CurriculumNode(models.Model):
    program = models.ForeignKey(...)
    parent = models.ForeignKey(...)
    node_type = models.CharField(max_length=50)
    is_published = models.BooleanField(default=False)
    
    class Meta:
        indexes = [
            # Composite index for common query pattern
            models.Index(fields=['program', 'parent', 'is_published']),
            # Single field index
            models.Index(fields=['node_type']),
        ]
```

#### Index Foreign Keys (Django does this automatically)
```python
# Django automatically creates index on ForeignKey fields
# But add composite indexes for common query patterns
```

### Pagination (REQUIRED)

#### Never Return Unbounded QuerySets
```python
# ✅ Good - Paginated
class ProgramViewSet(viewsets.ModelViewSet):
    pagination_class = StandardPagination  # Always set
    
    def get_queryset(self):
        return Program.objects.all()  # Pagination handles limit

# ❌ Bad - Returns all records
def list_all_programs(request):
    programs = Program.objects.all()
    return Response(ProgramSerializer(programs, many=True).data)
```

#### Use Cursor Pagination for Large Datasets
```python
# For datasets > 10,000 records
from rest_framework.pagination import CursorPagination

class LargeDatasetPagination(CursorPagination):
    page_size = 100
    ordering = '-created_at'
```

### Bulk Operations

#### Use bulk_create for Multiple Inserts
```python
# ✅ Good - Single query
nodes = [
    CurriculumNode(program=program, title=f"Session {i}")
    for i in range(100)
]
CurriculumNode.objects.bulk_create(nodes, batch_size=100)

# ❌ Bad - 100 queries
for i in range(100):
    CurriculumNode.objects.create(program=program, title=f"Session {i}")
```

#### Use bulk_update for Multiple Updates
```python
# ✅ Good - Single query
nodes = CurriculumNode.objects.filter(program=program)
for node in nodes:
    node.is_published = True
CurriculumNode.objects.bulk_update(nodes, ['is_published'], batch_size=100)
```

#### Use update() for Simple Updates
```python
# ✅ Good - Single query, no model instantiation
CurriculumNode.objects.filter(program=program).update(is_published=True)
```

## Caching

### Cache Expensive Computations
```python
from django.core.cache import cache

def get_program_stats(program_id: int) -> dict:
    cache_key = f'program_stats_{program_id}'
    stats = cache.get(cache_key)
    
    if stats is None:
        stats = calculate_program_stats(program_id)  # Expensive
        cache.set(cache_key, stats, timeout=300)  # 5 minutes
    
    return stats
```

### Cache Blueprint Configurations
```python
# Blueprints rarely change - cache aggressively
def get_blueprint_config(blueprint_id: int) -> dict:
    cache_key = f'blueprint_config_{blueprint_id}'
    config = cache.get(cache_key)
    
    if config is None:
        blueprint = AcademicBlueprint.objects.get(pk=blueprint_id)
        config = {
            'hierarchy': blueprint.hierarchy_structure,
            'grading': blueprint.grading_logic,
        }
        cache.set(cache_key, config, timeout=3600)  # 1 hour
    
    return config
```

### Invalidate Cache on Updates
```python
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

@receiver([post_save, post_delete], sender=AcademicBlueprint)
def invalidate_blueprint_cache(sender, instance, **kwargs):
    cache_key = f'blueprint_config_{instance.id}'
    cache.delete(cache_key)
```

## Frontend Performance

### Code Splitting
```jsx
// ✅ Good - Lazy load routes
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./Pages/Dashboard'));
const Programs = lazy(() => import('./Pages/Programs'));

function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/programs" element={<Programs />} />
      </Routes>
    </Suspense>
  );
}
```

### Memoization
```jsx
// ✅ Good - Memoize expensive computations
const filteredStudents = useMemo(() => 
  students.filter(s => s.name.toLowerCase().includes(search.toLowerCase())),
  [students, search]
);

// ✅ Good - Memoize callbacks passed to children
const handleSelect = useCallback((id) => {
  setSelectedId(id);
}, []);

// ✅ Good - Memoize components
const StudentCard = memo(function StudentCard({ student, onSelect }) {
  return <Card onClick={() => onSelect(student.id)}>{student.name}</Card>;
});
```

### Virtual Lists for Large Data
```jsx
// For lists > 100 items, use virtualization
import { FixedSizeList } from 'react-window';

function StudentList({ students }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={students.length}
      itemSize={72}
    >
      {({ index, style }) => (
        <StudentRow style={style} student={students[index]} />
      )}
    </FixedSizeList>
  );
}
```

### Image Optimization
```jsx
// ✅ Good - Lazy load images
<img 
  src={imageUrl} 
  loading="lazy" 
  alt={description}
  width={300}
  height={200}
/>

// ✅ Good - Use appropriate image sizes
<img 
  srcSet={`${imageUrl}?w=300 300w, ${imageUrl}?w=600 600w`}
  sizes="(max-width: 600px) 300px, 600px"
  alt={description}
/>
```

### Bundle Size
```bash
# Analyze bundle size
npm run build -- --analyze

# Keep main bundle < 200KB gzipped
# Lazy load anything > 50KB
```

## API Performance

### Use Efficient Serializers
```python
# ✅ Good - Only include needed fields
class ProgramListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = ['id', 'name', 'code']  # Minimal for list view

class ProgramDetailSerializer(serializers.ModelSerializer):
    curriculum_nodes = CurriculumNodeSerializer(many=True, read_only=True)
    
    class Meta:
        model = Program
        fields = ['id', 'name', 'code', 'description', 'curriculum_nodes']
```

### Optimize ViewSet Queries
```python
class ProgramViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        queryset = Program.objects.all()
        
        # Only prefetch for detail view
        if self.action == 'retrieve':
            queryset = queryset.prefetch_related('curriculum_nodes')
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProgramListSerializer
        return ProgramDetailSerializer
```

### Async Tasks for Heavy Operations
```python
# Use Celery for:
# - PDF generation
# - Email sending
# - Large data exports
# - Certificate generation

from celery import shared_task

@shared_task
def generate_certificate_pdf(certificate_id: int):
    certificate = Certificate.objects.get(pk=certificate_id)
    # ... generate PDF
    certificate.pdf_path = path
    certificate.save()
```

## Monitoring

### Log Slow Queries
```python
# settings.py
LOGGING = {
    'handlers': {
        'slow_queries': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': 'logs/slow_queries.log',
        },
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['slow_queries'],
            'level': 'DEBUG',
        },
    },
}

# Or use django-debug-toolbar in development
```

### Track Response Times
```python
# middleware/timing.py
import time
import logging

logger = logging.getLogger('performance')

class ResponseTimeMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        start = time.time()
        response = self.get_response(request)
        duration = time.time() - start
        
        if duration > 1.0:  # Log slow requests
            logger.warning(
                f"Slow request: {request.method} {request.path} "
                f"took {duration:.2f}s"
            )
        
        return response
```

## Performance Checklist

### Database
- [ ] Uses select_related for ForeignKey access
- [ ] Uses prefetch_related for reverse relations
- [ ] Has indexes on filtered fields
- [ ] Uses pagination for list endpoints
- [ ] Uses bulk operations for multiple records

### Frontend
- [ ] Routes are lazy loaded
- [ ] Expensive computations are memoized
- [ ] Large lists use virtualization
- [ ] Images are lazy loaded
- [ ] Bundle size < 200KB gzipped

### API
- [ ] List serializers are minimal
- [ ] Detail views prefetch related data
- [ ] Heavy operations use async tasks
- [ ] Response times are monitored
