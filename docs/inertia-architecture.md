U[# Inertia.js Architecture Guide

> How Django communicates with React in Crossview LMS - No separate API needed for page rendering.

---

## Overview

Inertia.js is **NOT** an API framework. It's a **view layer replacement** that lets you build SPAs without building a separate API.

### The Key Insight

| Traditional SPA | Inertia.js |
|-----------------|------------|
| Django API → JSON → React fetches → Renders | Django View → Inertia Response → React renders directly |
| Need REST endpoints for every page | Views return components + props |
| Client-side routing (React Router) | Server-side routing (Django URLs) |
| Manual state management | Props passed directly to components |

**With Inertia, you write Django views that return React components with data as props.**

---

## How It Works

### 1. First Page Load (Full HTML)
```
Browser → GET /programs/ → Django View → Full HTML with React app + initial props
```

The HTML includes a `<div id="app" data-page="{...}">` with JSON-encoded page data.

### 2. Subsequent Navigation (XHR)
```
Click Link → Inertia intercepts → XHR with X-Inertia header → Django returns JSON → React swaps component
```

No full page reload. Inertia swaps the component and updates browser history.

---

## Django Side

### Installation
```bash
pip install inertia-django
```

### Settings
```python
# config/settings/base.py
INSTALLED_APPS = [
    'inertia',
    # ...
]

MIDDLEWARE = [
    # ...
    'inertia.middleware.InertiaMiddleware',
]

INERTIA_LAYOUT = 'base.html'  # Your root template
```

### Root Template
```html
<!-- templates/base.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    {% vite_hmr_client %}
    {% vite_asset 'src/main.jsx' %}
</head>
<body>
    {% block inertia %}{% endblock %}
</body>
</html>
```

### Views (The Core Pattern)
```python
# apps/core/views.py
from inertia import render, inertia

# Option 1: Using render function
def programs_list(request):
    programs = Program.objects.filter(tenant=request.user.tenant)
    
    return render(request, 'Programs/Index', {
        'programs': list(programs.values('id', 'name', 'code', 'is_published')),
        'canCreate': request.user.has_perm('core.add_program'),
    })

# Option 2: Using decorator (simpler)
@inertia('Programs/Show')
def program_detail(request, pk):
    program = get_object_or_404(Program, pk=pk, tenant=request.user.tenant)
    
    return {
        'program': {
            'id': program.id,
            'name': program.name,
            'code': program.code,
            'description': program.description,
            'blueprint': {
                'id': program.blueprint.id,
                'name': program.blueprint.name,
            },
        },
        'curriculum': get_curriculum_tree(program),
    }
```

### URLs (Server-Side Routing)
```python
# apps/core/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('programs/', views.programs_list, name='programs.index'),
    path('programs/<int:pk>/', views.program_detail, name='programs.show'),
    path('programs/create/', views.program_create, name='programs.create'),
    path('programs/<int:pk>/edit/', views.program_edit, name='programs.edit'),
]
```

### Form Handling
```python
# apps/core/views.py
from django.shortcuts import redirect
from inertia import render

def program_create(request):
    if request.method == 'POST':
        form = ProgramForm(request.POST)
        if form.is_valid():
            program = form.save(commit=False)
            program.tenant = request.user.tenant
            program.save()
            return redirect('programs.show', pk=program.pk)
        
        # Return with errors - Inertia handles this
        return render(request, 'Programs/Create', {
            'errors': form.errors,
        })
    
    return render(request, 'Programs/Create', {
        'blueprints': list(AcademicBlueprint.objects.values('id', 'name')),
    })
```

### Shared Data (Available on Every Page)
```python
# apps/core/middleware.py
from inertia import share

class InertiaShareMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        if request.user.is_authenticated:
            share(request, 
                auth={
                    'user': {
                        'id': request.user.id,
                        'email': request.user.email,
                        'name': request.user.get_full_name(),
                        'role': request.user.role,
                    },
                    'tenant': {
                        'id': request.user.tenant.id,
                        'name': request.user.tenant.name,
                    } if request.user.tenant else None,
                },
            )
        
        # Flash messages
        if hasattr(request, '_messages'):
            share(request, flash=list(request._messages))
        
        return self.get_response(request)
```

---

## React Side

### Entry Point
```jsx
// frontend/src/main.jsx
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';

createInertiaApp({
    resolve: name => {
        const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
        return pages[`./Pages/${name}.jsx`];
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <ThemeProvider theme={theme}>
                <App {...props} />
            </ThemeProvider>
        );
    },
});
```

### Page Components
```jsx
// frontend/src/Pages/Programs/Index.jsx
import { Head, Link } from '@inertiajs/react';
import { Box, Button, Card, Stack, Typography } from '@mui/material';
import { motion } from 'framer-motion';

export default function ProgramsIndex({ programs, canCreate }) {
    return (
        <>
            <Head title="Programs" />
            
            <Stack spacing={3}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h4">Programs</Typography>
                    {canCreate && (
                        <Button 
                            component={Link} 
                            href="/programs/create/"
                            variant="contained"
                        >
                            Create Program
                        </Button>
                    )}
                </Box>
                
                {programs.map((program, index) => (
                    <motion.div
                        key={program.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card sx={{ p: 3 }}>
                            <Link href={`/programs/${program.id}/`}>
                                <Typography variant="h6">{program.name}</Typography>
                            </Link>
                            <Typography color="text.secondary">{program.code}</Typography>
                        </Card>
                    </motion.div>
                ))}
            </Stack>
        </>
    );
}
```

### Forms with Inertia
```jsx
// frontend/src/Pages/Programs/Create.jsx
import { useForm, Head } from '@inertiajs/react';
import { Box, Button, TextField, MenuItem, Stack } from '@mui/material';

export default function ProgramCreate({ blueprints, errors }) {
    const { data, setData, post, processing } = useForm({
        name: '',
        code: '',
        blueprint_id: '',
        description: '',
    });
    
    const handleSubmit = (e) => {
        e.preventDefault();
        post('/programs/create/');
    };
    
    return (
        <>
            <Head title="Create Program" />
            
            <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={3}>
                    <TextField
                        label="Program Name"
                        value={data.name}
                        onChange={e => setData('name', e.target.value)}
                        error={!!errors?.name}
                        helperText={errors?.name}
                        required
                    />
                    
                    <TextField
                        label="Code"
                        value={data.code}
                        onChange={e => setData('code', e.target.value)}
                        error={!!errors?.code}
                        helperText={errors?.code}
                        required
                    />
                    
                    <TextField
                        select
                        label="Blueprint"
                        value={data.blueprint_id}
                        onChange={e => setData('blueprint_id', e.target.value)}
                        error={!!errors?.blueprint_id}
                        helperText={errors?.blueprint_id}
                        required
                    >
                        {blueprints.map(bp => (
                            <MenuItem key={bp.id} value={bp.id}>{bp.name}</MenuItem>
                        ))}
                    </TextField>
                    
                    <Button 
                        type="submit" 
                        variant="contained" 
                        disabled={processing}
                    >
                        {processing ? 'Creating...' : 'Create Program'}
                    </Button>
                </Stack>
            </Box>
        </>
    );
}
```

### Navigation with Link
```jsx
import { Link, router } from '@inertiajs/react';

// Declarative navigation
<Link href="/programs/">Programs</Link>
<Link href="/programs/1/" method="delete" as="button">Delete</Link>

// Programmatic navigation
router.visit('/programs/');
router.post('/programs/create/', data);
router.delete(`/programs/${id}/`);

// With options
router.visit('/programs/', {
    preserveScroll: true,
    preserveState: true,
    only: ['programs'],  // Partial reload
});
```

---

## When to Use API vs Inertia

| Use Case | Approach | Verdict | Notes |
|----------|----------|---------|-------|
| Page rendering | **Inertia** | ✅ Perfect | Keeps backend logic simple |
| Form submissions | **Inertia** | ✅ Perfect | Handles validation errors/flash messages automatically |
| Navigation | **Inertia** | ✅ Perfect | The "SPA feel" is the main selling point |
| Real-time updates | **REST API** | ✅ Correct | Use Django Channels (WebSockets) for this |
| Infinite scroll | **Inertia** | ⚠️ Optimized | Don't use REST for this. Use **Partial Reloads** |
| Mobile app | **REST API** | ✅ Mandatory | Inertia cannot power a Native Mobile App (Flutter/Kotlin) |
| Third-party integrations | **REST API** | ✅ Mandatory | External devs need standard JSON endpoints |

### The Golden Rule
> **If it happens in the Browser, try to use Inertia first.** Only use REST if you are building a Native Mobile App or need WebSockets.

---

## Partial Reloads (For Infinite Scroll/Pagination)

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

## Hybrid Pattern (When REST is Necessary)

Use this pattern ONLY for real-time features that require polling or WebSockets.

```jsx
// Page loads with Inertia props, then uses API for live updates
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Configure axios for CSRF (required when mixing with session auth)
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

export default function Dashboard({ initialStats }) {
    // Initial data from Inertia
    const [stats, setStats] = useState(initialStats);
    
    // Live updates via API (only for real-time features)
    const { data: liveStats } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: () => axios.get('/api/v1/dashboard/stats/').then(r => r.data),
        refetchInterval: 30000,  // Poll every 30s
    });
    
    useEffect(() => {
        if (liveStats) setStats(liveStats);
    }, [liveStats]);
    
    return <StatsDisplay stats={stats} />;
}
```

> ⚠️ **Remember**: For pagination/infinite scroll, use Partial Reloads instead of this pattern!
```

---

## Prop Serialization

### Using InertiaMeta (Recommended)
```python
# apps/core/models.py
class Program(TenantModel):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)
    # ...
    
    class InertiaMeta:
        fields = ['id', 'name', 'code', 'description', 'is_published']
```

### Manual Serialization
```python
# For complex data, serialize manually
def program_detail(request, pk):
    program = get_object_or_404(Program, pk=pk)
    
    return render(request, 'Programs/Show', {
        'program': {
            'id': program.id,
            'name': program.name,
            'blueprint': {
                'id': program.blueprint.id,
                'name': program.blueprint.name,
                'hierarchy': program.blueprint.hierarchy_structure,
            },
            'stats': {
                'enrollments': program.enrollments.count(),
                'completions': program.enrollments.filter(status='completed').count(),
            },
        },
    })
```

---

## File Structure

```
frontend/src/
├── Pages/                    # Inertia page components (match Django views)
│   ├── Auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── Dashboard.jsx
│   ├── Programs/
│   │   ├── Index.jsx        # programs_list view
│   │   ├── Show.jsx         # program_detail view
│   │   ├── Create.jsx       # program_create view
│   │   └── Edit.jsx         # program_edit view
│   └── Admin/
│       └── Curriculum/
│           └── Builder.jsx
├── components/               # Reusable components
├── layouts/                  # Page layouts
└── main.jsx                  # Inertia entry point
```

---

## Summary

| Aspect | Inertia Approach |
|--------|------------------|
| Routing | Django URLs (server-side) |
| Data Fetching | Props from Django views |
| Forms | `useForm` hook → POST to Django |
| Navigation | `<Link>` component or `router.visit()` |
| State | Props + local React state |
| Pagination | Partial Reloads (`only: ['items']`) |
| Real-time | REST API with CSRF config (rare) |
| Mobile App | REST API with Token Auth |

### Quick Reference

```jsx
// ✅ Page navigation
router.visit('/programs/')

// ✅ Form submission
router.post('/programs/create/', data)

// ✅ Pagination / Infinite scroll
router.visit(url, { only: ['posts'], preserveState: true })

// ⚠️ Real-time polling (configure CSRF first!)
axios.get('/api/v1/stats/')
```

**Bottom Line**: For Crossview LMS, use Inertia for all page rendering and pagination. Only create REST API endpoints for real-time features, mobile apps, or third-party integrations.
