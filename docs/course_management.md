# Course Management Module

## Overview
The Course Management module enables teachers and administrators to create, manage, and organize courses, including their structure (sections), content (lessons of various types), and associated assessments (quizzes, assignments). It is designed for scalability, maintainability, and strict access control.

---

## Core Features
- **Course CRUD**: Create, read, update, delete courses with settings, pricing, drip content, FAQs, and notices.
- **Curriculum Builder**: Organize courses into sections, and sections into lessons, quizzes, and assignments. Supports drag-and-drop reordering.
- **Lesson Management**: Multiple lesson types (text, video, stream, quiz link, assignment link) with rich content editing and file attachments.
- **Quiz & Assignment Management**: Full CRUD for quizzes, questions, answers, and assignments, including grading and feedback.
- **Access Control**: Robust policy-based authorization ensures teachers manage only their own content, while admins have full access.
- **Drip Content**: Supports absolute and relative unlock dates for sections and lessons.
- **Extensible UI**: Modular, tabbed interface for course management (Settings, Pricing, Drip, FAQ, Notices, Curriculum, etc.).

---

## Main Models & Relationships
- **Course**: The root entity. Belongs to a category, subject, and grade level. Has many sections.
- **CourseSection**: Belongs to a course. Has many lessons, quizzes, and assignments.
- **Lesson**: Belongs to a section. Supports multiple types (text, video, stream, quiz link, assignment link). Can have attachments and Q&A.
- **Quiz**: Belongs to a section. Has many questions.
- **Assignment**: Belongs to a section. Has many submissions.
- **Question**: Belongs to a quiz. Has options, matching pairs, gap/keyword answers.
- **AssignmentSubmission**: Belongs to an assignment and a student.

Refer to `database_schema.md` for detailed schema and relationships.

---

## Controllers
- **Admin/CourseController**: Full CRUD for courses (admin scope).
- **Teacher/CourseController**: CRUD for teacher's own courses.
- **Teacher/CourseCurriculumController**: Handles curriculum structure and reordering.
- **Teacher/LessonController**: CRUD for lessons, file uploads, and attachments.
- **Teacher/QuizController**: CRUD for quizzes, questions, and answers.
- **Teacher/AssignmentController**: CRUD for assignments and grading submissions.

---

## Authorization & Access Control
- **Policies**: Each main model (Course, CourseSection, Lesson, Quiz, Assignment, AssignmentSubmission, Question) has a dedicated policy.
- **Teacher Access**: Teachers can only manage their own courses and related content.
- **Admin Access**: Admins have full access to all courses and content.
- **Student Access**: Students can only view published content for courses they are enrolled in.
- **Policy Registration**: All policies are registered in `AppServiceProvider`.

---

## UI & User Experience
- **Tabbed Course Management**: Settings, Pricing, Drip, FAQ, Notices, Curriculum, etc.
- **Curriculum Builder**: Drag-and-drop for sections and content items. Modal dialogs for adding lessons/quizzes/assignments.
- **Lesson Editor**: Dynamic form based on lesson type. Rich text editing (TinyMCE/CKEditor 5), file uploads, and video embedding.
- **Quiz Builder**: Interactive question/answer management, question library, and category tagging.
- **Assignment Grading**: Teacher interface for grading and feedback on student submissions.

---

## Drip Content Logic
- **Absolute Unlock**: `unlock_date` fields on sections/lessons.
- **Relative Unlock**: `unlock_after_days` (sections) and `unlock_after_purchase_days` (lessons).
- **Combined Logic**: Content unlocks when both absolute and relative conditions are met (latest date wins).

---

## Extensibility & Best Practices
- **SOLID Principles**: All code follows SOLID and Laravel best practices.
- **Strict Typing**: All PHP code uses `declare(strict_types=1);`.
- **Service Layer**: Business logic is separated into services for maintainability.
- **Form Requests**: All input validation is handled via custom FormRequest classes.
- **Testing**: Feature and unit tests are required for all major flows.
- **Soft Deletes**: Courses and content support soft deletion for safety.

---

## References
- See `database_schema.md` for schema details.
- See `database_documentation.md` for additional context on data flows.
- See `notifications.md` and `subscription_system.md` for related modules.

---

## Future Improvements
- **Lesson Q&A**: Add threaded Q&A for lessons.
- **Deep Copy/Import**: Allow deep copying of lessons/quizzes/assignments across courses.
- **Bulk Operations**: Support for bulk import/export and batch actions.
- **Advanced Drip Logic**: More granular scheduling and unlock conditions.
- **API Versioning**: Expose course management via RESTful API for integrations. 