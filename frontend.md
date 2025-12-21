Let me analyze the backend to understand what pages and dashboards are needed:

Now I have a complete picture of the backend. Here's my analysis:

---

## Crossview LMS - Page Structure Analysis

Based on the backend models, here's what pages/dashboards are needed:

### **PUBLIC PAGES** (No authentication required)

| Page                         | Purpose                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| **Landing Page**             | Marketing page for the SaaS platform                        |
| **Login**                    | Authentication for all users                                |
| **Register**                 | Student self-registration (if enabled)                      |
| **Forgot Password**          | Password reset flow                                         |
| **Certificate Verification** | Public page to verify certificate by serial number          |
| **Tenant Subdomain Landing** | Custom branded landing per tenant (e.g., crossview.lms.com) |

---

### **STUDENT PORTAL** (Role: Student)

| Page                    | Backend Models Used                                           |
| ----------------------- | ------------------------------------------------------------- |
| **Dashboard**           | Enrollment, NodeCompletion, Program                           |
| **My Programs**         | Enrollment (list enrolled programs)                           |
| **Program View**        | CurriculumNode tree, NodeCompletion (progress)                |
| **Session/Lesson View** | CurriculumNode (content_html from properties), ContentVersion |
| **Assessment Results**  | AssessmentResult (view grades, status)                        |
| **Practicum Upload**    | PracticumSubmission (upload audio/video/files)                |
| **Practicum History**   | PracticumSubmission, SubmissionReview (feedback)              |
| **My Certificates**     | Certificate (download, share)                                 |
| **Profile Settings**    | User                                                          |

---

### **INSTRUCTOR DASHBOARD** (Role: Instructor/Lecturer)

| Page                 | Backend Models Used                                                     |
| -------------------- | ----------------------------------------------------------------------- |
| **Dashboard**        | Program, Enrollment (stats)                                             |
| **My Programs**      | Program (assigned programs)                                             |
| **Student List**     | Enrollment (students in program)                                        |
| **Student Progress** | NodeCompletion (per student)                                            |
| **Gradebook**        | AssessmentResult (enter/edit grades) - adapts to blueprint grading mode |
| **Practicum Review** | PracticumSubmission, SubmissionReview, Rubric                           |
| **Publish Results**  | AssessmentResult (bulk publish)                                         |

---

### **ADMIN DASHBOARD** (Role: Admin - Tenant Admin)

| Page                      | Backend Models Used                                      |
| ------------------------- | -------------------------------------------------------- |
| **Dashboard**             | TenantLimits (usage stats), Enrollment (counts)          |
| **Blueprint Management**  | AcademicBlueprint, PresetBlueprint (create from presets) |
| **Program Management**    | Program (CRUD)                                           |
| **Curriculum Builder**    | CurriculumNode (tree editor, drag-drop)                  |
| **Content Upload**        | ContentVersion, ParsedImage (PDF parsing)                |
| **User Management**       | User (CRUD, role assignment)                             |
| **Enrollment Management** | Enrollment (enroll/withdraw students)                    |
| **Certificate Templates** | CertificateTemplate (design templates)                   |
| **Issued Certificates**   | Certificate (view, revoke)                               |
| **Rubric Management**     | Rubric (create grading rubrics)                          |
| **Branding Settings**     | TenantBranding (logo, colors)                            |
| **Tenant Settings**       | Tenant, TenantLimits                                     |

---

### **SUPER ADMIN** (Platform Owner - manages all tenants)

| Page                   | Backend Models Used                       |
| ---------------------- | ----------------------------------------- |
| **Platform Dashboard** | Tenant (all tenants stats)                |
| **Tenant Management**  | Tenant, TenantLimits, SubscriptionTier    |
| **Preset Blueprints**  | PresetBlueprint (manage TVET, NITA, etc.) |
| **Subscription Tiers** | SubscriptionTier (pricing plans)          |

---

## Recommended Spec Breakdown

I'd suggest breaking this into these specs:

1. **`student-portal`** - Student dashboard, program view, session viewer, practicum upload
2. **`instructor-dashboard`** - Gradebook, practicum review, student progress
3. **`admin-dashboard`** - Blueprint management, curriculum builder, user management
4. **`public-pages`** - Landing, login, certificate verification
5. **`super-admin`** - Platform-level tenant management (if needed)

Which one would you like to start with?
