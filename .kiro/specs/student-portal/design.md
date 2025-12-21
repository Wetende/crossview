# Design Document: Student Portal

## Overview

The Student Portal provides authenticated students with access to their enrolled programs, course content, progress tracking, assessment results, practicum submissions, and certificates. The portal is built as a React SPA with Django REST API backend, featuring real-time progress updates and responsive design.

## Architecture

### Page Structure

-   `/student/dashboard` → Student Dashboard
-   `/student/programs` → Program List
-   `/student/programs/:id` → Program View with Curriculum Tree
-   `/student/programs/:id/session/:nodeId` → Session/Lesson Viewer
-   `/student/assessments` → Assessment Results
-   `/student/practicum` → Practicum History
-   `/student/practicum/:nodeId/upload` → Practicum Upload
-   `/student/certificates` → My Certificates
-   `/student/profile` → Profile Settings

### Component Hierarchy

```
StudentLayout
├── Sidebar (navigation)
├── Header (user info, notifications)
└── Content Area
    ├── Dashboard
    ├── ProgramList
    ├── ProgramView
    │   └── CurriculumTree
    ├── SessionViewer
    ├── AssessmentResults
    ├── PracticumUpload
    ├── PracticumHistory
    ├── Certificates
    └── ProfileSettings
```

## Components and Interfaces

### StudentLayout

Main layout wrapper for all student portal pages.

```typescript
interface StudentLayoutProps {
    children: React.ReactNode;
}
```

### Dashboard Component

```typescript
interface DashboardData {
    enrollments: EnrollmentSummary[];
    recentActivity: ActivityItem[];
    upcomingDeadlines: Deadline[];
}

interface EnrollmentSummary {
    id: string;
    programId: string;
    programName: string;
    programCode: string;
    progressPercent: number;
    status: "active" | "completed" | "withdrawn";
    lastAccessedAt: string;
}

interface ActivityItem {
    id: string;
    type: "completion" | "submission" | "result";
    title: string;
    programName: string;
    timestamp: string;
}
```

### CurriculumTree Component

```typescript
interface CurriculumTreeProps {
    programId: string;
    nodes: CurriculumNode[];
    completions: NodeCompletion[];
    onNodeClick: (nodeId: string) => void;
}

interface CurriculumNode {
    id: string;
    parentId: string | null;
    nodeType: string;
    title: string;
    code: string | null;
    position: number;
    isPublished: boolean;
    properties: Record<string, any>;
    completionRules: CompletionRules;
    children: CurriculumNode[];
}

interface NodeCompletion {
    nodeId: string;
    completedAt: string;
    completionType: "view" | "quiz_pass" | "upload" | "manual";
}

interface CompletionRules {
    type: "all_children" | "percentage" | "manual";
    threshold?: number;
    prerequisites?: string[];
    sequential?: boolean;
}
```

### SessionViewer Component

```typescript
interface SessionViewerProps {
    node: CurriculumNode;
    enrollment: Enrollment;
    isCompleted: boolean;
    isLocked: boolean;
    lockReason?: string;
    onMarkComplete: () => Promise<void>;
}
```

### PracticumUpload Component

```typescript
interface PracticumUploadProps {
    node: CurriculumNode;
    enrollment: Enrollment;
    currentSubmission: PracticumSubmission | null;
    rubric: Rubric | null;
    onUpload: (file: File) => Promise<void>;
}

interface PracticumSubmission {
    id: string;
    version: number;
    status: "pending" | "approved" | "revision_required" | "rejected";
    fileType: string;
    fileSize: number;
    submittedAt: string;
    reviews: SubmissionReview[];
}

interface SubmissionReview {
    id: string;
    status: string;
    dimensionScores: Record<string, number> | null;
    totalScore: number | null;
    comments: string | null;
    reviewedAt: string;
}
```

### API Service Interfaces

```typescript
interface StudentAPI {
    // Dashboard
    getDashboard(): Promise<DashboardData>;

    // Programs
    getEnrollments(filters?: EnrollmentFilters): Promise<Enrollment[]>;
    getProgramWithCurriculum(programId: string): Promise<ProgramWithCurriculum>;

    // Progress
    getNodeCompletions(enrollmentId: string): Promise<NodeCompletion[]>;
    markNodeComplete(
        enrollmentId: string,
        nodeId: string
    ): Promise<NodeCompletion>;
    getNodeUnlockStatus(
        enrollmentId: string,
        nodeId: string
    ): Promise<UnlockStatus>;

    // Assessments
    getAssessmentResults(filters?: ResultFilters): Promise<AssessmentResult[]>;

    // Practicum
    getPracticumSubmissions(
        filters?: SubmissionFilters
    ): Promise<PracticumSubmission[]>;
    uploadPracticum(
        enrollmentId: string,
        nodeId: string,
        file: File
    ): Promise<PracticumSubmission>;
    getSubmissionDownloadUrl(submissionId: string): Promise<string>;

    // Certificates
    getCertificates(): Promise<Certificate[]>;
    getCertificateDownloadUrl(certificateId: string): Promise<string>;

    // Profile
    getProfile(): Promise<UserProfile>;
    updateProfile(data: ProfileUpdateData): Promise<UserProfile>;
    changePassword(data: PasswordChangeData): Promise<void>;
}
```

## Data Models

### Backend API Endpoints

| Endpoint                                              | Method  | Description                 |
| ----------------------------------------------------- | ------- | --------------------------- |
| `/api/student/dashboard/`                             | GET     | Get dashboard data          |
| `/api/student/enrollments/`                           | GET     | List student enrollments    |
| `/api/student/programs/:id/`                          | GET     | Get program with curriculum |
| `/api/student/enrollments/:id/completions/`           | GET     | Get node completions        |
| `/api/student/enrollments/:id/complete/:nodeId/`      | POST    | Mark node complete          |
| `/api/student/enrollments/:id/unlock-status/:nodeId/` | GET     | Check node unlock status    |
| `/api/student/assessments/`                           | GET     | List assessment results     |
| `/api/student/practicum/`                             | GET     | List practicum submissions  |
| `/api/student/practicum/upload/`                      | POST    | Upload practicum file       |
| `/api/student/practicum/:id/download/`                | GET     | Get signed download URL     |
| `/api/student/certificates/`                          | GET     | List certificates           |
| `/api/student/certificates/:id/download/`             | GET     | Get signed download URL     |
| `/api/student/profile/`                               | GET/PUT | Get/update profile          |
| `/api/student/profile/password/`                      | POST    | Change password             |

### Response Models

```typescript
interface ProgramWithCurriculum {
    id: string;
    name: string;
    code: string;
    description: string;
    blueprint: {
        hierarchyLabels: string[];
        gradingConfig: Record<string, any>;
    };
    curriculumTree: CurriculumNode[];
    enrollment: {
        id: string;
        status: string;
        enrolledAt: string;
        progressPercent: number;
    };
}

interface UnlockStatus {
    isUnlocked: boolean;
    reason?: "prerequisite" | "sequential" | "not_published";
    prerequisiteNodes?: { id: string; title: string; isCompleted: boolean }[];
    previousNode?: { id: string; title: string; isCompleted: boolean };
}

interface AssessmentResult {
    id: string;
    nodeId: string;
    nodeTitle: string;
    programName: string;
    resultData: {
        total: number;
        status: string;
        letterGrade?: string;
        components: Record<string, number>;
    };
    lecturerComments: string | null;
    publishedAt: string;
}

interface Certificate {
    id: string;
    serialNumber: string;
    programTitle: string;
    completionDate: string;
    issueDate: string;
    isRevoked: boolean;
    verificationUrl: string;
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
