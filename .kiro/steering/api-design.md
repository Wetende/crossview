# API & Data Flow Standards

> Crossview LMS uses **Inertia.js as the primary data layer** for page rendering, with REST API reserved for specific use cases.

## Inertia-First Architecture

### When to Use What

| Use Case | Approach | Verdict | Notes |
|----------|----------|---------|-------|
| Page rendering | **Inertia** | ✅ Perfect | Keeps backend logic simple |
| Form submissions | **Inertia** | ✅ Perfect | Handles validation errors/flash messages automatically |
| Navigation | **Inertia** | ✅ Perfect | The "SPA feel" is the main selling point |
| Real-time updates | **REST API** | ✅ Correct | Use Django Channels (WebSockets) for this |
| Infinite scroll | **Inertia** | ⚠️ Optimized | Don't use REST for this. Use **Inertia Partial Reloads** |
| Mobile app | **REST API** | ✅ Mandatory | Inertia cannot power a Native Mobile App (Flutter/Kotlin) |
| Third-party integrations | **REST API** | ✅ Mandatory | External devs need standard JSON endpoints |

### Decision Rule
> **If it happens in the Browser, try to use Inertia first.** Only use REST if you are building a Native Mobile App or need WebSockets.

---

## Inertia Partial Reloads (For Infinite Scroll/Pagination)

Inertia allows you to request only specific data from the same page endpoint without re-fetching the whole page. This is the **preferred approach** for infinite scroll and pagination.

### Scenario
You are on the "Student Feed" and scroll down.
- ❌ **Old Plan (REST)**: Fetch `GET /api/feed?page=2` → Append to React state
- ✅ **Better Plan (Inertia)**: Fetch `GET /feed?page=2` but tell Inertia to only give you the `feed` prop, keeping the header, sidebar, and user props unchanged

### Django Implementation
```python
# views.py
def student_feed(request):
    page_number = request.GET.get('page', 1)
    posts = Post.objects.paginate(page=page_number, per_page=10)
    
    # Inertia automatically handles the "Partial Reload" if the header is present
    return render(request, 'Student/Feed', props={
        'posts': posts,  # This updates on scroll
        'user': request.user,  # This stays cached on scroll
        'sidebar': get_sidebar_tree()  # This stays cached on scroll
    })
```

### React Implementation
```jsx
import { router } from '@inertiajs/react'

function loadMore() {
    router.visit(url, {
        only: ['posts'],  // <--- The Magic. Only fetches new posts.
        preserveState: true,  // Keeps your current scroll position and React state
        preserveScroll: true,
    })
}
```

### Key Benefits
- Single endpoint for initial load AND pagination
- No duplicate data fetching logic
- Automatic caching of unchanged props
- Simpler backend (no separate API endpoint needed)

---

## ⚠️ Critical Warning: Dual Authentication

This is the biggest headache you will face with this Hybrid Architecture.

### The Problem
- **Inertia** relies on **Session Auth** (Cookies)
- **REST API** (Mobile) relies on **Token Auth** (JWT/DRF Tokens)

### The Trap
If you try to use your REST API endpoints inside your Inertia React components (e.g., for real-time polling), standard axios might fail because:
1. It doesn't automatically attach the **CSRF token** that Django expects for Sessions
2. Or the **Auth Token** that DRF expects for APIs

### The Solution: Strict Separation

```jsx
// ✅ CORRECT - Inside Browser Dashboard (Inertia)
import { router } from '@inertiajs/react'
router.post('/programs/create/', data)  // Uses session auth automatically

// ✅ CORRECT - Mobile App (REST API)
import axios from 'axios'
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
axios.post('/api/v1/programs/', data)  // Uses token auth

// ❌ WRONG - Mixing approaches in Browser
axios.post('/api/v1/programs/', data)  // Will fail without proper auth setup!
```

### Rules
1. Use `router.post()` (Inertia) for everything inside the Browser Dashboard
2. Use `axios + Token` only for the separate Mobile App
3. If you MUST call REST API from browser (e.g., real-time polling), configure axios with CSRF:

```jsx
// Only if absolutely necessary for real-time features
import axios from 'axios'
axios.defaults.xsrfCookieName = 'csrftoken'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'
axios.defaults.withCredentials = true
```

---

## Inertia Views (Primary)

### Basic Pattern
```python
# apps/core/views.py
from inertia import render, inertia

# Option 1: render function
def programs_list(request):
    programs = Program.objects.filter(tenant=request.user.tenant)
    return render(request, 'Programs/Index', {
        'programs': list(programs.values('id', 'name', 'code')),
    })

# Option 2: decorator (preferred for simple views)
@inertia('Programs/Show')
def program_detail(request, pk):
    program = get_object_or_404(Program, pk=pk, tenant=request.user.tenant)
    return {
        'program': serialize_program(program),
        'curriculum': get_curriculum_tree(program),
    }
```

### URL Structure (Server-Side Routing)
```python
# apps/core/urls.py
urlpatterns = [
    # Inertia pages (no /api/ prefix)
    path('programs/', views.programs_list, name='programs.index'),
    path('programs/<int:pk>/', views.program_detail, name='programs.show'),
    path('programs/create/', views.program_create, name='programs.create'),
    path('programs/<int:pk>/edit/', views.program_edit, name='programs.edit'),
]
```

### Form Handling
```python
def program_create(request):
    if request.method == 'POST':
        form = ProgramForm(request.POST)
        if form.is_valid():
            program = form.save(commit=False)
            program.tenant = request.user.tenant
            program.save()
            return redirect('programs.show', pk=program.pk)
        
        # Errors returned as props
        return render(request, 'Programs/Create', {'errors': form.errors})
    
    return render(request, 'Programs/Create', {
        'blueprints': list(AcademicBlueprint.objects.values('id', 'name')),
    })
```

### Shared Data (Every Page)
```python
# apps/core/middleware.py
from inertia import share

class InertiaShareMiddleware:
    def __call__(self, request):
        if request.user.is_authenticated:
            share(request, auth={
                'user': {
                    'id': request.user.id,
                    'name': request.user.get_full_name(),
                    'role': request.user.role,
                },
                'tenant': {
                    'id': request.user.tenant.id,
                    'name': request.user.tenant.name,
                } if request.user.tenant else None,
            })
        return self.get_response(request)
```

---

## REST API (When Needed)

### URL Structure
```python
# REST endpoints use /api/ prefix
urlpatterns = [
    path('api/v1/dashboard/stats/', views.DashboardStatsAPI.as_view()),
    path('api/v1/notifications/', views.NotificationsAPI.as_view()),
    path('api/v1/curriculum-nodes/<int:pk>/reorder/', views.ReorderNodesAPI.as_view()),
]
```

### RESTful Conventions
```python
# ✅ Good URLs
GET    /api/v1/programs/                    # List
POST   /api/v1/programs/                    # Create
GET    /api/v1/programs/{id}/               # Detail
PUT    /api/v1/programs/{id}/               # Update
DELETE /api/v1/programs/{id}/               # Delete

# ❌ Bad URLs
GET    /api/v1/getPrograms/                 # Verb in URL
GET    /api/v1/program/                     # Singular
```

### HTTP Methods & Status Codes
| Method | Purpose | Success Code |
|--------|---------|--------------|
| GET | Retrieve | 200 OK |
| POST | Create | 201 Created |
| PUT/PATCH | Update | 200 OK |
| DELETE | Remove | 204 No Content |

| Error Code | Meaning |
|------------|---------|
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | Not authorized |
| 404 | Not found (or tenant mismatch) |
| 409 | Conflict (duplicate) |

### Response Format
```json
// Success
{
  "id": 123,
  "name": "Diploma in Theology",
  "createdAt": "2024-01-15T10:30:00Z"
}

// Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [{"field": "name", "message": "Required"}]
  }
}
```

### Pagination
```json
{
  "results": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 100,
    "hasNext": true
  }
}
```

---

## Frontend Patterns

### Inertia Navigation
```jsx
import { Link, router, useForm } from '@inertiajs/react';

// Links
<Link href="/programs/">Programs</Link>

// Programmatic
router.visit('/programs/');
router.post('/programs/create/', data);

// Forms
const { data, setData, post, errors } = useForm({ name: '' });
const submit = () => post('/programs/create/');
```

### REST API (TanStack Query)
```jsx
import { useQuery, useMutation } from '@tanstack/react-query';

// Polling for real-time data
const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/api/v1/dashboard/stats/'),
    refetchInterval: 30000,
});

// Mutations
const reorder = useMutation({
    mutationFn: (nodeIds) => api.post('/api/v1/curriculum-nodes/reorder/', { nodeIds }),
});
```

### Hybrid Pattern
```jsx
// Page loads with Inertia props, API for live updates
export default function Dashboard({ initialStats }) {
    const [stats, setStats] = useState(initialStats);
    
    const { data: liveStats } = useQuery({
        queryKey: ['stats'],
        queryFn: () => api.get('/api/v1/dashboard/stats/'),
        refetchInterval: 30000,
    });
    
    useEffect(() => {
        if (liveStats) setStats(liveStats);
    }, [liveStats]);
    
    return <StatsDisplay stats={stats} />;
}
```

---

## Serialization

### Inertia Props (InertiaMeta)
```python
class Program(TenantModel):
    name = models.CharField(max_length=255)
    
    class InertiaMeta:
        fields = ['id', 'name', 'code', 'is_published']
```

### REST API (DRF Serializers)
```python
class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = ['id', 'name', 'code', 'created_at']
```

---

## Checklist

### For Inertia Views
- [ ] Returns component name + props dict
- [ ] Filters by tenant
- [ ] Handles form errors as props
- [ ] Uses redirect after successful POST
- [ ] Uses Partial Reloads for pagination/infinite scroll (not REST)

### For REST Endpoints
- [ ] Uses /api/v1/ prefix
- [ ] Returns proper status codes
- [ ] Has consistent error format
- [ ] Includes pagination for lists
- [ ] Filters by tenant
- [ ] Documented in OpenAPI
- [ ] Only created when Inertia can't handle the use case (mobile, WebSockets, 3rd party)

### Authentication
- [ ] Browser uses Inertia + Session Auth (automatic)
- [ ] Mobile uses REST API + Token Auth (JWT)
- [ ] Never mix auth approaches without proper CSRF setup
