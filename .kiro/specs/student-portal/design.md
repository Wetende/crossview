# Design Document: Student Portal

## Overview

The Student Portal provides authenticated students with access to their enrolled programs, course content, progress tracking, assessment results, practicum submissions, and certificates. The portal is built using **Inertia.js** - Django views return React components with props directly, providing an SPA feel with server-side routing.

## Architecture

### Inertia-First Approach

> **Golden Rule**: If it happens in the Browser, use Inertia first. Only use REST API for file uploads (practicum) and real-time features.

| Use Case | Approach | Notes |
|----------|----------|-------|
| Page rendering | **Inertia** | Django views return component + props |
| Navigation | **Inertia** | `<Link>` component, server-side routing |
| Form submissions | **Inertia** | `router.post()` with validation errors as props |
| Mark as complete | **Inertia** | `router.post()` returns updated completions |
| Pagination | **Inertia Partial Reloads** | `router.visit({ only: ['items'] })` |
| File uploads | **REST API** | Practicum uploads need multipart/form-data |
| File downloads | **REST API** | Signed URLs for certificates/submissions |

### Page Structure (Django URLs - Server-Side Routing)

```python
# apps/student/urls.py
urlpatterns = [
    path('student/dashboard/', views.dashboard, name='student.dashboard'),
    path('student/programs/', views.program_list, name='student.programs'),
    path('student/programs/<int:pk>/', views.program_view, name='student.program'),
    path('student/programs/<int:pk>/session/<int:node_id>/', views.session_viewer, name='student.session'),
    path('student/assessments/', views.assessment_results, name='student.assessments'),
    path('student/practicum/', views.practicum_history, name='student.practicum'),
    path('student/practicum/<int:node_id>/upload/', views.practicum_upload, name='student.practicum_upload'),
    path('student/certificates/', views.certificates, name='student.certificates'),
    path('student/profile/', views.profile_settings, name='student.profile'),
]

# REST API endpoints (only for file operations)
api_urlpatterns = [
    path('api/v1/student/practicum/upload/', views.PracticumUploadAPI.as_view()),
    path('api/v1/student/practicum/<int:pk>/download/', views.practicum_download),
    path('api/v1/student/certificates/<int:pk>/download/', views.certificate_download),
]
```

### Component Hierarchy

```
StudentLayout (shared via Inertia layout)
├── Sidebar (navigation with active state from URL)
├── Header (user info from shared props)
└── Content Area (Inertia page component)
    ├── Student/Dashboard
    ├── Student/Programs/Index
    ├── Student/Programs/Show
    ├── Student/Session
    ├── Student/Assessments
    ├── Student/Practicum/Index
    ├── Student/Practicum/Upload
    ├── Student/Certificates
    └── Student/Profile
```

## Django View Patterns (Inertia)

### Dashboard View
```python
# apps/student/views.py
from inertia import render
from django.contrib.auth.decorators import login_required

@login_required
def dashboard(request):
    user = request.user
    enrollments = Enrollment.objects.filter(
        user=user, tenant=user.tenant
    ).select_related('program')
    
    return render(request, 'Student/Dashboard', {
        'enrollments': [
            {
                'id': e.id,
                'programId': e.program.id,
                'programName': e.program.name,
                'programCode': e.program.code,
                'progressPercent': e.calculate_progress(),
                'status': e.status,
                'lastAccessedAt': e.last_accessed_at,
            }
            for e in enrollments
        ],
        'recentActivity': get_recent_activity(user),
        'upcomingDeadlines': get_upcoming_deadlines(user),
    })
```

### Session Viewer with Mark Complete
```python
@login_required
def session_viewer(request, pk, node_id):
    enrollment = get_object_or_404(Enrollment, pk=pk, user=request.user)
    node = get_object_or_404(CurriculumNode, pk=node_id, program=enrollment.program)
    
    # Handle mark as complete POST
    if request.method == 'POST' and 'mark_complete' in request.POST:
        NodeCompletion.objects.get_or_create(
            enrollment=enrollment,
            node=node,
            defaults={'completion_type': 'view'}
        )
        # Return updated props (Inertia handles the update)
    
    unlock_status = check_unlock_status(enrollment, node)
    
    return render(request, 'Student/Session', {
        'node': serialize_node(node),
        'enrollment': serialize_enrollment(enrollment),
        'isCompleted': NodeCompletion.objects.filter(enrollment=enrollment, node=node).exists(),
        'isLocked': not unlock_status['is_unlocked'],
        'lockReason': unlock_status.get('reason'),
        'breadcrumbs': get_breadcrumbs(node),
        'siblings': get_sibling_nodes(node),
    })
```

### Pagination with Partial Reloads
```python
@login_required
def assessment_results(request):
    page = request.GET.get('page', 1)
    program_filter = request.GET.get('program')
    
    results = AssessmentResult.objects.filter(
        enrollment__user=request.user,
        published_at__isnull=False
    ).select_related('node', 'enrollment__program')
    
    if program_filter:
        results = results.filter(enrollment__program_id=program_filter)
    
    paginator = Paginator(results, 20)
    page_obj = paginator.get_page(page)
    
    return render(request, 'Student/Assessments', {
        'results': serialize_results(page_obj),  # Only this updates on pagination
        'pagination': {
            'page': page_obj.number,
            'totalPages': paginator.num_pages,
            'hasNext': page_obj.has_next(),
            'hasPrev': page_obj.has_previous(),
        },
        'programs': get_user_programs(request.user),  # Stays cached
        'filters': {'program': program_filter},
    })
```

## Components and Interfaces

### React Page Components (Inertia)

```jsx
// frontend/src/Pages/Student/Dashboard.jsx
import { Head, Link } from '@inertiajs/react';
import { Box, Card, Stack, Typography, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';

export default function Dashboard({ enrollments, recentActivity, upcomingDeadlines }) {
    return (
        <>
            <Head title="Dashboard" />
            <Stack spacing={3}>
                {enrollments.map((enrollment, index) => (
                    <motion.div
                        key={enrollment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card component={Link} href={`/student/programs/${enrollment.programId}/`}>
                            <Typography variant="h6">{enrollment.programName}</Typography>
                            <LinearProgress 
                                variant="determinate" 
                                value={enrollment.progressPercent} 
                            />
                        </Card>
                    </motion.div>
                ))}
            </Stack>
        </>
    );
}
```

### Session Viewer with Mark Complete
```jsx
// frontend/src/Pages/Student/Session.jsx
import { Head, Link, router } from '@inertiajs/react';
import { Box, Button, Breadcrumbs, Typography } from '@mui/material';

export default function Session({ 
    node, enrollment, isCompleted, isLocked, lockReason, breadcrumbs, siblings 
}) {
    const handleMarkComplete = () => {
        router.post(`/student/programs/${enrollment.id}/session/${node.id}/`, {
            mark_complete: true,
        }, {
            preserveScroll: true,
        });
    };
    
    if (isLocked) {
        return <LockedState reason={lockReason} />;
    }
    
    return (
        <>
            <Head title={node.title} />
            <Breadcrumbs>
                {breadcrumbs.map(crumb => (
                    <Link key={crumb.id} href={crumb.url}>{crumb.title}</Link>
                ))}
            </Breadcrumbs>
            
            <Box dangerouslySetInnerHTML={{ __html: node.contentHtml }} />
            
            {!isCompleted && (
                <Button onClick={handleMarkComplete} variant="contained">
                    Mark as Complete
                </Button>
            )}
            
            <SiblingNavigation siblings={siblings} currentId={node.id} />
        </>
    );
}
```

### Pagination with Partial Reloads
```jsx
// frontend/src/Pages/Student/Assessments.jsx
import { router } from '@inertiajs/react';

export default function Assessments({ results, pagination, programs, filters }) {
    const loadPage = (page) => {
        router.visit(`/student/assessments/?page=${page}`, {
            only: ['results', 'pagination'],  // Partial reload - only fetch results
            preserveState: true,
            preserveScroll: true,
        });
    };
    
    const handleFilter = (programId) => {
        router.visit(`/student/assessments/?program=${programId}`, {
            only: ['results', 'pagination', 'filters'],
            preserveState: true,
        });
    };
    
    return (
        <>
            <FilterControls programs={programs} onFilter={handleFilter} />
            <ResultsList results={results} />
            <Pagination {...pagination} onPageChange={loadPage} />
        </>
    );
}
```

### CurriculumTree Component

```jsx
// frontend/src/components/CurriculumTree.jsx
import { Link } from '@inertiajs/react';
import PropTypes from 'prop-types';

function CurriculumTree({ nodes, completions, enrollmentId, hierarchyLabels }) {
    const getNodeStatus = (nodeId) => {
        const completion = completions.find(c => c.nodeId === nodeId);
        if (completion) return 'completed';
        // Check if locked based on prerequisites
        return 'available';
    };
    
    const renderNode = (node, depth = 0) => (
        <Box key={node.id} sx={{ ml: depth * 2 }}>
            <Link 
                href={`/student/programs/${enrollmentId}/session/${node.id}/`}
                style={{ 
                    opacity: getNodeStatus(node.id) === 'locked' ? 0.5 : 1 
                }}
            >
                <Typography>
                    {hierarchyLabels[depth] || 'Item'}: {node.title}
                </Typography>
                <StatusIndicator status={getNodeStatus(node.id)} />
            </Link>
            {node.children?.map(child => renderNode(child, depth + 1))}
        </Box>
    );
    
    return <Box>{nodes.map(node => renderNode(node))}</Box>;
}

CurriculumTree.propTypes = {
    nodes: PropTypes.array.isRequired,
    completions: PropTypes.array.isRequired,
    enrollmentId: PropTypes.string.isRequired,
    hierarchyLabels: PropTypes.array.isRequired,
};
```

### PracticumUpload Component (Uses REST API for file upload)

```jsx
// frontend/src/Pages/Student/Practicum/Upload.jsx
import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';

// Configure axios for CSRF (required when mixing with session auth)
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

export default function PracticumUpload({ node, enrollment, currentSubmission, rubric }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    
    const handleUpload = async (file) => {
        // Validate file type and size on client
        if (!node.allowedTypes.includes(file.type)) {
            setError('File type not supported');
            return;
        }
        if (file.size > node.maxFileSize) {
            setError('File exceeds maximum size');
            return;
        }
        
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('enrollment_id', enrollment.id);
        formData.append('node_id', node.id);
        
        try {
            await axios.post('/api/v1/student/practicum/upload/', formData);
            // Refresh page to get updated submission status
            router.reload({ only: ['currentSubmission'] });
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };
    
    return (
        <>
            <Head title={`Upload - ${node.title}`} />
            {rubric && <RubricDisplay rubric={rubric} />}
            <FileUpload onUpload={handleUpload} uploading={uploading} error={error} />
            {currentSubmission && <SubmissionStatus submission={currentSubmission} />}
        </>
    );
}
```

## Data Models

### Inertia Views (Primary - No /api/ prefix)

| URL | Method | Django View | React Component |
| --- | ------ | ----------- | --------------- |
| `/student/dashboard/` | GET | `dashboard` | `Student/Dashboard` |
| `/student/programs/` | GET | `program_list` | `Student/Programs/Index` |
| `/student/programs/<id>/` | GET | `program_view` | `Student/Programs/Show` |
| `/student/programs/<id>/session/<node_id>/` | GET/POST | `session_viewer` | `Student/Session` |
| `/student/assessments/` | GET | `assessment_results` | `Student/Assessments` |
| `/student/practicum/` | GET | `practicum_history` | `Student/Practicum/Index` |
| `/student/practicum/<node_id>/upload/` | GET | `practicum_upload` | `Student/Practicum/Upload` |
| `/student/certificates/` | GET | `certificates` | `Student/Certificates` |
| `/student/profile/` | GET/POST | `profile_settings` | `Student/Profile` |

### REST API Endpoints (Only for file operations)

| Endpoint | Method | Description |
| -------- | ------ | ----------- |
| `/api/v1/student/practicum/upload/` | POST | Upload practicum file (multipart) |
| `/api/v1/student/practicum/<id>/download/` | GET | Get signed download URL |
| `/api/v1/student/certificates/<id>/download/` | GET | Get signed PDF download URL |

### Props Passed to Components

```typescript
// Dashboard props
interface DashboardProps {
    enrollments: EnrollmentSummary[];
    recentActivity: ActivityItem[];
    upcomingDeadlines: Deadline[];
}

// Program view props
interface ProgramViewProps {
    program: {
        id: string;
        name: string;
        code: string;
        description: string;
        blueprint: {
            hierarchyLabels: string[];
            gradingConfig: Record<string, any>;
        };
    };
    curriculumTree: CurriculumNode[];
    completions: NodeCompletion[];
    enrollment: {
        id: string;
        status: string;
        progressPercent: number;
    };
}

// Session viewer props
interface SessionProps {
    node: CurriculumNode;
    enrollment: EnrollmentSummary;
    isCompleted: boolean;
    isLocked: boolean;
    lockReason?: string;
    breadcrumbs: Breadcrumb[];
    siblings: { prev?: CurriculumNode; next?: CurriculumNode };
}

// Assessment results props (with pagination)
interface AssessmentsProps {
    results: AssessmentResult[];
    pagination: PaginationInfo;
    programs: ProgramOption[];  // For filter dropdown
    filters: { program?: string };
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do._

### Property 1: Dashboard Enrollment Display Completeness

_For any_ list of enrollments returned by the API, the Student Dashboard SHALL render each enrollment with its program name and progress percentage visible in the DOM.

**Validates: Requirements 1.1, 1.2**

### Property 2: Dashboard Activity and Deadline Display

_For any_ dashboard data containing activity items and deadlines, the Student Dashboard SHALL render all activity items and all deadlines when present, and show appropriate empty states when absent.

**Validates: Requirements 1.3, 1.4**

### Property 3: Program List Display Completeness

_For any_ enrollment displayed in the Program List, the component SHALL render the program name, program code, enrollment status, and progress percentage.

**Validates: Requirements 2.2, 2.3**

### Property 4: Enrollment Status Filtering

_For any_ set of enrollments with mixed statuses (active, completed, withdrawn), applying a status filter SHALL return only enrollments matching that status.

**Validates: Requirements 2.5**

### Property 5: Curriculum Tree Hierarchical Rendering

_For any_ curriculum tree structure, the Program View SHALL render all nodes in correct parent-child hierarchy with completion status (completed, in-progress, locked) and using the blueprint's custom hierarchy labels.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 6: Node Unlock Logic

_For any_ curriculum node with prerequisites or sequential completion rules, the node SHALL be locked if any prerequisite is incomplete OR if sequential completion is required and the previous sibling is incomplete.

**Validates: Requirements 3.5, 3.6**

### Property 7: Progress Percentage Calculation

_For any_ set of curriculum nodes and node completions, the progress percentage SHALL equal (completed nodes / total completable nodes) \* 100.

**Validates: Requirements 2.3**

### Property 8: Session Content Rendering

_For any_ session node with content_html containing text and embedded media (images, videos), the Session Viewer SHALL render the HTML content with media elements properly displayed.

**Validates: Requirements 4.1, 4.2**

### Property 9: Breadcrumb Path Generation

_For any_ node in a curriculum tree, the breadcrumb navigation SHALL display the correct path from program root to the current node, including all ancestor nodes in order.

**Validates: Requirements 4.5**

### Property 10: Node Completion Record Creation

_For any_ mark-as-complete action on an unlocked, incomplete node, the system SHALL create a NodeCompletion record with the correct node ID, enrollment ID, and timestamp.

**Validates: Requirements 4.4**

### Property 11: Published Results Filtering

_For any_ set of assessment results with mixed published states, the Assessment Results Page SHALL display only results where publishedAt is not null.

**Validates: Requirements 5.1, 5.6**

### Property 12: Assessment Result Display Completeness

_For any_ published assessment result, the display SHALL include node title, total score, status, letter grade (if applicable), component scores breakdown, and lecturer comments (if provided).

**Validates: Requirements 5.2, 5.3, 5.4**

### Property 13: Practicum File Validation

_For any_ file selected for upload, the system SHALL reject files with types not in the node's allowed types list OR files exceeding the maximum size limit, and accept files meeting both criteria.

**Validates: Requirements 6.2, 6.3**

### Property 14: Practicum Submission Creation

_For any_ valid file upload, the system SHALL create a PracticumSubmission record with status "pending", correct version number (previous version + 1 or 1 if first), and file metadata.

**Validates: Requirements 6.4**

### Property 15: Submission Display Completeness

_For any_ practicum submission displayed in history, the component SHALL show submission date, version, status, file type, and when reviewed: reviewer comments, dimension scores, and total score.

**Validates: Requirements 7.2, 7.3, 7.4**

### Property 16: Certificate Display and Actions

_For any_ certificate displayed, the component SHALL show program title, completion date, issue date, and serial number. For non-revoked certificates, download and share actions SHALL be available. For revoked certificates, revoked status SHALL be shown and download SHALL be disabled.

**Validates: Requirements 8.2, 8.3, 8.4, 8.5**

### Property 17: Profile Update Persistence

_For any_ valid profile update (name or phone), the changes SHALL be persisted and reflected when the profile is fetched again.

**Validates: Requirements 9.2**

### Property 18: Password Change Security

_For any_ password change request, the system SHALL verify the current password matches before allowing the change, and SHALL validate the new password meets strength requirements.

**Validates: Requirements 9.3, 9.4**

## Error Handling

### API Errors

| Error Scenario           | HTTP Status | User Message                    |
| ------------------------ | ----------- | ------------------------------- |
| Unauthorized             | 401         | "Please log in to continue"     |
| Enrollment not found     | 404         | "Enrollment not found"          |
| Node not found           | 404         | "Content not found"             |
| Node locked              | 403         | "Complete prerequisites first"  |
| File type not allowed    | 400         | "File type not supported"       |
| File too large           | 400         | "File exceeds maximum size"     |
| Invalid current password | 400         | "Current password is incorrect" |
| Weak password            | 400         | "Password requirements not met" |

### Upload Errors

| Error Scenario  | User Message                         |
| --------------- | ------------------------------------ |
| Network failure | "Upload failed. Please try again"    |
| Server error    | "Server error. Please try later"     |
| Timeout         | "Upload timed out. Try smaller file" |

## Testing Strategy

### Unit Tests

-   Component rendering with various props
-   Form validation logic
-   API service functions
-   Utility functions (progress calculation, tree traversal, breadcrumb generation)

### Property-Based Tests

Using **Hypothesis** (Python) for backend and **fast-check** (JavaScript) for frontend.

**Configuration:** Minimum 100 iterations per property test

**Backend Property Tests:**

-   Property 6: Node unlock logic
-   Property 7: Progress percentage calculation
-   Property 10: Node completion creation
-   Property 11: Published results filtering
-   Property 13: File validation
-   Property 14: Submission creation
-   Property 17: Profile update persistence
-   Property 18: Password change security

**Frontend Property Tests:**

-   Property 1: Dashboard enrollment display
-   Property 2: Dashboard activity display
-   Property 3: Program list display
-   Property 4: Enrollment status filtering
-   Property 5: Curriculum tree rendering
-   Property 8: Session content rendering
-   Property 9: Breadcrumb generation
-   Property 12: Assessment result display
-   Property 15: Submission display
-   Property 16: Certificate display

### Integration Tests

-   Full enrollment flow (list → program → session → complete)
-   Practicum upload flow (select → validate → upload → history)
-   Assessment results flow (list → filter → view details)
-   Certificate flow (list → download → share)
-   Profile update flow (view → edit → save → verify)
