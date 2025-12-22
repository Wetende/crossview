# Dashboard Architecture

> Unified dashboard layout system for all user roles in Crossview LMS.

---

## Overview

Crossview LMS uses a **single unified `DashboardLayout` component** that adapts its navigation and appearance based on user role. This approach ensures:

- Consistent UI/UX across all roles
- Single source of truth for navigation structure
- Easy maintenance and updates
- Role-based menu customization

---

## Supported Roles

| Role | Dashboard Path | Description |
|------|----------------|-------------|
| `student` | `/dashboard/` | Student learning portal |
| `instructor` | `/dashboard/` | Teaching and practicum review |
| `admin` | `/dashboard/` | Tenant administration |
| `superadmin` | `/superadmin/` | Platform-wide management |

---

## DashboardLayout Component

Located at: `frontend/src/components/layouts/DashboardLayout.jsx`

### Usage

```jsx
import DashboardLayout from '../../components/layouts/DashboardLayout';

export default function MyPage({ data }) {
  return (
    <DashboardLayout role="student" breadcrumbs={[{ label: 'My Page' }]}>
      <Head title="My Page" />
      {/* Page content */}
    </DashboardLayout>
  );
}
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `children` | ReactNode | Page content |
| `role` | string | User role: `student`, `instructor`, `admin`, `superadmin` |
| `breadcrumbs` | array | Optional breadcrumb trail `[{ label, href? }]` |

---

## Navigation Structure

### Student Navigation
```
Dashboard
My Programs
Assessments
Practicum
Certificates
Profile
```

### Instructor Navigation
```
Dashboard
─── Teaching
    My Programs
    Practicum Review
```

### Admin Navigation
```
Dashboard
─── Academic
    Blueprints
    Programs
    Curriculum
    Rubrics
─── Management
    Users
    Enrollments
    Certificates
─── Settings
    Branding
    General
```

### Super Admin Navigation
```
Dashboard
─── Platform
    Tenants
    Subscription Tiers
    Preset Blueprints
─── System
    Settings
    Logs
```

---

## Page Structure

All dashboard pages follow this pattern:

```jsx
import { Head } from '@inertiajs/react';
import DashboardLayout from '../../components/layouts/DashboardLayout';

export default function PageName({ prop1, prop2 }) {
  return (
    <DashboardLayout role="student">
      <Head title="Page Title" />
      
      {/* Page header */}
      <Typography variant="h4">Page Title</Typography>
      
      {/* Page content */}
      <Stack spacing={3}>
        {/* ... */}
      </Stack>
    </DashboardLayout>
  );
}
```

---

## Features

### Responsive Sidebar
- Desktop: Permanent drawer (260px width)
- Mobile: Temporary drawer with hamburger menu

### Breadcrumb Navigation
- Automatic "Dashboard" root link
- Custom breadcrumbs via props
- Last item shown as current page (no link)

### User Menu
- Avatar with role-based color
- Profile/Settings link (role-dependent)
- Logout action

### Role Indicator
- Colored chip showing current role
- Tenant name display

---

## File Locations

### Layout Component
```
frontend/src/components/layouts/DashboardLayout.jsx
```

### Student Pages
```
frontend/src/Pages/Student/
├── Dashboard.jsx
├── Profile.jsx
├── Assessments.jsx
├── Certificates.jsx
├── Session.jsx
├── Programs/
│   ├── Index.jsx
│   └── Show.jsx
└── Practicum/
    ├── Index.jsx
    └── Upload.jsx
```

### Instructor Pages
```
frontend/src/Pages/Instructor/
├── Dashboard.jsx
├── Programs/
│   ├── Index.jsx
│   └── Show.jsx
└── Practicum/
    ├── Index.jsx
    └── Review.jsx
```

### Admin Pages
```
frontend/src/Pages/Admin/
├── Dashboard.jsx
├── Blueprints/
├── Programs/
├── Curriculum/
├── Users/
├── Enrollments/
├── Certificates/
└── Settings/
```

### Super Admin Pages
```
frontend/src/Pages/SuperAdmin/
├── Dashboard.jsx
├── Tenants/
│   ├── Index.jsx
│   ├── Create.jsx
│   └── Edit.jsx
├── Tiers/
│   ├── Index.jsx
│   └── Edit.jsx
├── Presets/
│   ├── Index.jsx
│   └── Edit.jsx
├── Settings/
│   └── Index.jsx
└── Logs.jsx
```

---

## Public Pages

Public pages (landing, login, register) use a separate `PublicLayout` component, not the dashboard layout.

```
frontend/src/Pages/Public/
├── Landing.jsx
├── Login.jsx
├── Register.jsx
└── CertificateVerify.jsx
```

---

## Services Layer

Backend business logic is organized in services files:

### Tenant Services
```python
# apps/tenants/services.py
- PlatformStatsService    # Platform-wide statistics
- TenantService           # Tenant CRUD operations
- SubscriptionTierService # Tier management
- PresetBlueprintService  # Blueprint presets
```

### Views Pattern
Views are thin controllers that delegate to services:

```python
# apps/tenants/views.py
@inertia('SuperAdmin/Dashboard')
def superadmin_dashboard(request):
    return {
        'stats': PlatformStatsService.get_stats(),
        'recentTenants': TenantService.get_recent(limit=5),
        'growthData': PlatformStatsService.get_growth_data(),
    }
```

---

## Testing

Dashboard views and services have comprehensive tests:

```bash
# Run super admin tests
pytest apps/tenants/tests/test_superadmin_views.py -v

# Run all tests
pytest
```

Test coverage includes:
- View authentication/authorization
- Service layer business logic
- Tenant isolation
- Permission checks
