# Crossview College of Theology and Technology LMS: Dashboard Documentation

This document provides an overview of the role-based dashboards implemented in the Crossview College of Theology and Technology Learning Management System.

## 1. Overview

The Crossview College of Theology and Technology LMS features distinct dashboards tailored to the needs of different user roles: Administrators, Teachers, Students, and Parents. Each dashboard provides a centralized hub for users to access relevant information, manage their activities, and interact with the platform's features.

The core principles guiding the dashboard implementation include:
- Unique URL prefixes for each role (e.g., `/admin/dashboard`, `/teacher/dashboard`).
- A common base layout (`resources/views/layouts/x-dashboard-layout.blade.php`) ensuring a consistent look and feel.
- Role-specific sidebars (`resources/views/layouts/partials/[role]/sidebar.blade.php`) for targeted navigation.
- Views adapted from the Crossview College of Theology and Technology HTML template, maintaining visual consistency while integrating dynamic Laravel functionalities.

## 2. Implemented Dashboards and Features

The following outlines the features implemented for each role as of the current development phase.

### 2.1. Admin Dashboard
**Status:** Core features implemented (Phase 1).
- **Overview:** Site statistics and quick actions (`dshb-administration.html`).
- **User Management:** List and manage platform users (`dshb-users.html`).
- **Course Management:** List and manage all platform courses (`dshb-courses.html`).
- **Settings:** Admin-specific platform settings (`dshb-settings.html`).
- **Reports:** Site analytics and reports (adapted from `dshb-dashboard.html` or similar).

### 2.2. Teacher Dashboard
**Status:** Core features and extended functionalities implemented (Phases 2 & 5.2).
- **Basic Features:**
    - **Overview:** Summary cards, course overview, activity feed (`dshb-dashboard.html`).
    - **My Courses:** List and manage owned courses (`dshb-courses.html`).
    - **Create Course:** Form for creating new courses (`dshb-listing.html`).
    - **Reviews:** Manage course reviews (`dshb-reviews.html`).
    - **Settings:** Profile, password, payment, notifications (`dshb-settings.html`).
    - **Messages:** Two-column messaging interface (`dshb-messages.html`).
- **Extended Features (Phase 5.2):**
    - **Forum Management:** Manage course forums, create/edit/delete threads and posts (`dshb-forums.html`).
    - **Gradebook:** View and manage grades for students in their courses (`dshb-grades.html` for grade table, `dshb-courses.html` for course selection).
    - **Quiz Management:** Create, edit, and manage quizzes; view results (`dshb-quiz.html`).
    - **Calendar Management:** Manage personal and course-related events using FullCalendar (`dshb-calendar.html`).

### 2.3. Student Dashboard
**Status:** Core features implemented (Phase 3). Extended features (Phase 5.1) are "In Progress".
- **Basic Features:**
    - **Overview:** General dashboard view (`dshb-administration.html`).
    - **My Learning:** Access enrolled courses (`dshb-courses.html`).
    - **My Certificates:** View earned certificates (`dshb-administration.html`).
    - **Bookmarked Courses:** Manage bookmarked courses (`dshb-bookmarks.html`).
    - **Settings:** Student-specific profile settings (`dshb-settings.html`).
    - **Messages:** Access messaging interface (`dshb-messages.html`).
- **Extended Features (Phase 5.1 - In Progress):**
    - My Forums (`dshb-forums.html`)
    - My Grades (`dshb-grades.html`)
    - My Quizzes/Assignments (`dshb-quiz.html`)
    - My Calendar (`dshb-calendar.html`)

### 2.4. Parent Dashboard
**Status:** Core features and initial extended functionalities implemented (Phases 4 & 5.3).
- **Basic Features:**
    - **Overview:** Parent-specific dashboard view (`dshb-parent-dashboard.html` or generic).
    - **Child Progress:** Monitor child's learning activities.
    - **Subscriptions:** Manage subscriptions and view payment history (adapted from `invoice.html` or settings).
    - **Settings:** Parent-specific profile settings (`dshb-settings.html`).
    - **Messages:** Access messaging interface (`dshb-messages.html`).
- **Extended Features (Phase 5.3 - Initial Implementation):**
    - **Child's Grades View:** View a summary of a selected child's grades per course. Adapted from `dshb-grades.html`. (Data logic for assignments implemented; quiz data pending).
    - **Child's Calendar View:** View a calendar of a selected child's events. Adapted from `dshb-calendar.html` using FullCalendar. (Event fetching logic is currently placeholder).

## 3. Future Development (Phase 6 and Beyond)

Phase 6, focusing on "Advanced User Features & Platform Management" (e.g., student subscription management, teacher earnings, course Q&A, etc.), is planned for future development. Further enhancements and new features beyond Phase 6, such as gamification and live session integrations, are also under consideration.

Additionally, the "Admin Extended Features" (Phase 5.4), including forum oversight, advanced grade management, quiz settings, and site-wide calendar management, are marked as "To Do" and will be addressed in subsequent development cycles.

## 4. Recommendations for Refinement & Next Steps

To enhance the existing dashboard functionalities and ensure robustness, the following areas are recommended for attention:

- **Parent Dashboard - Child Calendar Events:**
    - Refine the event fetching logic in `App\Http\Controllers\Parent\ChildCalendarController@events`. Currently, it uses placeholder data. This should be updated to dynamically fetch and display actual due dates for assignments, quizzes, and other relevant events from the child's enrolled courses. This will require defining how due dates are stored on `Assignment` and `Quiz` models (or related models) and querying them effectively.
- **Parent Dashboard - Child Grades Controller:**
    - The `App\Http\Controllers\Parent\ChildGradesController@show` method currently fetches and processes grade data. Consider extracting this logic into a dedicated service class (e.g., `App\Services\Parent\ChildGradeService`) to improve controller conciseness, testability, and maintainability.
    - Implement Data Transfer Objects (DTOs) for structuring grade data passed to the view, enhancing type safety and code clarity.
    - Integrate quiz grade fetching and display once `Quiz` and `QuizAttempt` models and their relationships are fully defined and populated.
- **Student Extended Features (Phase 5.1):**
    - Prioritize the completion of all tasks under "Student Extended Features" (Forums, Grades, Quizzes/Assignments, Calendar), which are currently marked as "In Progress." This includes implementing controllers, views, routes, and sidebar links.
- **HTML Template Adaptation Review:**
    - Conduct a thorough review of all implemented views to ensure strict and accurate adaptation from the designated Crossview College of Theology and Technology HTML templates (e.g., `dshb-grades.html` for Task 5.3.1 - Parent Child's Grades View still notes a "To Do" for final review of adaptation). Ensure no placeholder content remains and that all interactive elements are correctly wired.
- **Data Logic Completion:**
    - Review all controllers and views for any remaining placeholder data logic (beyond the explicitly mentioned `ChildCalendarController`) and replace it with actual data retrieval and processing from the database.
- **Authorization and Policies:**
    - Continue to implement and rigorously test Laravel Policies for all relevant models and actions to ensure robust authorization across all dashboards and features. Verify that `AuthServiceProvider` correctly maps all necessary policies.
- **Error Handling and Validation:**
    - Ensure comprehensive error handling and robust input validation (using Form Requests where appropriate) are implemented for all user interactions, particularly for forms and data submission endpoints.
- **Asset Management:**
    - Verify that all necessary CSS and JavaScript assets (e.g., for FullCalendar, charts) are correctly managed, published to the `public` directory, and linked in the views using `asset()`.

By addressing these recommendations, the Crossview College of Theology and Technology dashboards will become more functional, maintainable, and scalable, providing a solid foundation for future enhancements. 
