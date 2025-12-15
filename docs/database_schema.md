# Crossview College of Theology and Technology Database Schema Documentation

This document provides a comprehensive overview of the Crossview College of Theology and Technology database schema, including tables, relationships, and design considerations.

## Overview

The Crossview College database is designed to support a feature-rich Learning Management System (LMS) focused on educational content delivery, user management, and subscription-based access. The schema was implemented through a phased approach:

1. Core Foundation - Users & Authentication
2. Subscriptions & Course Foundation
3. Core Content - Lessons, Quizzes, Past Papers
4. Relationships & Features
5. Profile Completion & Teacher Payouts
6. Enhancements - Progress tracking, Notifications, Gamification

## Database Tables and Relationships

### Core Users & Authentication

#### `users`
- **Purpose**: Central user table storing common user data.
- **Key Fields**: `id`, `first_name`, `last_name`, `email`, `email_verified_at`, `password`, `profile_picture_path`, `phone_number`, `phone_verified_at`, `remember_token`.
- **Relationships**: 
  - One-to-many with various tables (enrollments, courses, etc.)
  - Many-to-many with roles
  - One-to-one with profile tables (student_profiles, teacher_profiles, parent_profiles)
- **Notes**: 
  - Contains soft deletes for data recovery
  - Role-specific information is stored in separate profile tables

#### `roles`
- **Purpose**: Defines user roles in the system.
- **Key Fields**: `id`, `name`, `display_name`.
- **Relationships**: Many-to-many with users through role_user table.
- **Notes**: Pre-seeded with 'student', 'teacher', 'parent', 'admin' roles.

#### `role_user` (Pivot)
- **Purpose**: Associates users with roles (many-to-many).
- **Key Fields**: `user_id`, `role_id`.

### Subscription & Payment System

#### `subscription_tiers`
- **Purpose**: Defines available subscription plans.
- **Key Fields**: `id`, `name`, `description`, `price`, `level`, `duration_days`, `features` (JSON), `is_active`.
- **Relationships**: 
  - One-to-many with user_subscriptions
  - One-to-many with courses (as required tier)
- **Notes**: Pre-seeded with Free, Bronze, Silver, Gold tiers.

#### `payments`
- **Purpose**: Central payment tracking for all monetary transactions.
- **Key Fields**: `id`, `user_id`, `amount`, `currency`, `status`, `payment_gateway`, `gateway_reference_id`, `payable_type`, `payable_id`, `paid_at`.
- **Relationships**: 
  - Polymorphic with user_subscriptions and course_purchases
  - Belongs to users
- **Notes**: 
  - Uses Laravel polymorphic relationships (`payable_type`/`payable_id`)
  - Supports various payment gateways

#### `user_subscriptions`
- **Purpose**: Tracks user subscription status and history.
- **Key Fields**: `id`, `user_id`, `subscription_tier_id`, `started_at`, `expires_at`, `status`, `latest_payment_id`.
- **Relationships**: 
  - Belongs to users
  - Belongs to subscription_tiers
  - One payment (latest)
- **Notes**: Includes soft deletes for subscription history.

#### `course_purchases`
- **Purpose**: Records one-time course purchases.
- **Key Fields**: `id`, `user_id`, `course_id`, `payment_id`, `platform_fee`, `teacher_payout`.
- **Relationships**: 
  - Belongs to users
  - Belongs to courses
  - One-to-one with payments
- **Notes**: Includes financial breakdown for platform/teacher revenue split.

### Course System & Content Management

#### `courses`
- **Purpose**: Core course entity with metadata and access requirements.
- **Key Fields**: `id`, `user_id` (teacher), `title`, `description`, `thumbnail_url`, `status`, `required_subscription_tier_id`, `price`, `published_at`, `featured`, `category_id`, `subject_id`.
- **Relationships**: 
  - Belongs to users (teacher)
  - Belongs to subscription_tiers (optional)
  - Belongs to categories (optional)
  - Belongs to subjects (optional)
  - One-to-many with lessons, quizzes, past_papers, enrollments
- **Notes**: Supports both subscription and one-time payment access models.

#### `lessons`
- **Purpose**: Individual learning content units within courses.
- **Key Fields**: `id`, `course_id`, `title`, `content_type`, `content`, `order`, `is_free`.
- **Relationships**: 
  - Belongs to courses
  - One-to-many with lesson_progress
- **Notes**: 
  - Supports various content types (text, image, pdf, video_embed, live_session_link)
  - Ordered within courses

#### `lesson_attachments`
- **Purpose**: Supporting files for lessons.
- **Key Fields**: `id`, `lesson_id`, `title`, `file_path`, `file_type`.
- **Relationships**: Belongs to lessons.

#### `quizzes`
- **Purpose**: Assessment components within courses.
- **Key Fields**: `id`, `course_id`, `title`, `description`, `time_limit`, `randomize_questions`, `show_correct_answer`, `passing_grade`, `retake_penalty_percent`, `style`, `order`, `subject_id`.
- **Relationships**: 
  - Belongs to courses
  - Belongs to subjects (optional)
  - One-to-many with questions
  - One-to-many with quiz_attempts
- **Notes**: Supports various assessment configurations and behaviors.

#### `questions`
- **Purpose**: Individual quiz questions with various formats.
- **Key Fields**: `id`, `quiz_id`, `text`, `type`, `options` (JSON), `correct_answer` (JSON), `points`, `order`.
- **Relationships**: 
  - Belongs to quizzes
  - One-to-many with answers
- **Notes**: 
  - Supports multiple question types (single_choice, multiple_response, true_false, matching, etc.)
  - Uses JSON fields for flexible options and answer structures
  - Refer to `json_schemas.md` for detailed JSON structure documentation

#### `quiz_attempts`
- **Purpose**: Records of student quiz attempts.
- **Key Fields**: `id`, `student_user_id`, `quiz_id`, `started_at`, `completed_at`, `score`, `passed`.
- **Relationships**: 
  - Belongs to users (student)
  - Belongs to quizzes
  - One-to-many with answers
- **Notes**: Tracks completion and performance metrics.

#### `answers`
- **Purpose**: Student responses to individual questions.
- **Key Fields**: `id`, `quiz_attempt_id`, `question_id`, `answer_text` (JSON), `is_correct`, `score`.
- **Relationships**: 
  - Belongs to quiz_attempts
  - Belongs to questions
- **Notes**: Uses JSON for flexible answer format based on question type.

#### `past_papers`
- **Purpose**: Exam preparation materials.
- **Key Fields**: `id`, `course_id`, `title`, `description`, `file_path`, `exam_year`, `exam_level`, `subject_id`, `uploaded_by_user_id`.
- **Relationships**: 
  - Belongs to courses
  - Belongs to subjects (optional)
  - Belongs to users (uploader)
- **Notes**: Centralized repository for practice exam materials.

### Student Enrollment & Classroom Management

#### `enrollments`
- **Purpose**: Tracks student course participation.
- **Key Fields**: `id`, `user_id` (student), `course_id`, `enrolled_at`, `completed_at`, `progress`, `access_type`, `course_purchase_id`.
- **Relationships**: 
  - Belongs to users (student)
  - Belongs to courses
  - Belongs to course_purchases (optional)
  - One-to-many with lesson_progress
- **Notes**: Supports both subscription and purchase-based enrollment types.

#### `classrooms`
- **Purpose**: Virtual classrooms for grouped student management.
- **Key Fields**: `id`, `teacher_user_id`, `name`, `join_code`, `description`.
- **Relationships**: 
  - Belongs to users (teacher)
  - Many-to-many with users (students) through classroom_student
- **Notes**: Join code allows easy student addition.

#### `classroom_student` (Pivot)
- **Purpose**: Links students to classrooms.
- **Key Fields**: `classroom_id`, `student_user_id`, `joined_at`.

#### `parent_student` (Pivot)
- **Purpose**: Links parent accounts to student accounts.
- **Key Fields**: `parent_user_id`, `student_user_id`, `status`, `requested_at`, `approved_at`.
- **Notes**: Supports a request/approval workflow for parent-student linking.

### Categorization System

#### `categories`
- **Purpose**: Hierarchical course categorization.
- **Key Fields**: `id`, `name`, `slug`, `description`, `parent_category_id`.
- **Relationships**: 
  - Self-referential (parent-child categories)
  - One-to-many with courses
- **Notes**: Supports nested category structure.

#### `subjects`
- **Purpose**: Academic subject areas.
- **Key Fields**: `id`, `name`, `slug`, `description`, `icon_path`, `color_code`, `is_active`.
- **Relationships**: 
  - Many-to-many with users (teachers) through teacher_subjects
  - One-to-many with quizzes, past_papers
- **Notes**: Pre-seeded with common academic subjects.

#### `grade_levels`
- **Purpose**: Educational grade levels.
- **Key Fields**: `id`, `name`, `level_order`.
- **Relationships**: One-to-many with student_profiles.
- **Notes**: Pre-seeded with S1-S6 levels.

#### `teacher_subjects` (Pivot)
- **Purpose**: Links teachers to subjects they teach.
- **Key Fields**: `teacher_user_id`, `subject_id`.

### User Profile & Payment Information

#### `student_profiles`
- **Purpose**: Student-specific profile information.
- **Key Fields**: `user_id` (PK), `date_of_birth`, `grade_level_id`, `school_name`, `learning_interests` (JSON).
- **Relationships**: 
  - One-to-one with users
  - Belongs to grade_levels

#### `teacher_profiles`
- **Purpose**: Teacher-specific profile information.
- **Key Fields**: `user_id` (PK), `bio`, `qualifications`, `school_affiliation`.
- **Relationships**: One-to-one with users.

#### `parent_profiles`
- **Purpose**: Parent-specific profile information.
- **Key Fields**: `user_id` (PK), `notification_prefs` (JSON).
- **Relationships**: One-to-one with users.

#### `teacher_payment_details`
- **Purpose**: Securely store teacher payment information.
- **Key Fields**: `id`, `teacher_user_id`, `method`, encrypted payment fields.
- **Relationships**: One-to-one with users (teachers).
- **Notes**: Contains sensitive financial information requiring encryption.

#### `teacher_payouts`
- **Purpose**: Records of payments made to teachers.
- **Key Fields**: `id`, `teacher_user_id`, `amount`, `status`, `period_start`, `period_end`, `payment_method`, `transaction_reference`.
- **Relationships**: Belongs to users (teachers).

### Progress Tracking & Engagement Features

#### `lesson_progress`
- **Purpose**: Detailed tracking of student lesson completion.
- **Key Fields**: `id`, `enrollment_id`, `lesson_id`, `progress_percentage`, `last_accessed_at`, `completed_at`.
- **Relationships**: 
  - Belongs to enrollments
  - Belongs to lessons
- **Notes**: More granular than enrollment.progress with per-lesson tracking.

#### `lesson_completions`
- **Purpose**: Records successful lesson completions.
- **Key Fields**: `id`, `enrollment_id`, `lesson_id`, `completed_at`.
- **Relationships**: 
  - Belongs to enrollments
  - Belongs to lessons

#### `notifications`
- **Purpose**: System notifications for users.
- **Key Fields**: `id`, `user_id`, `type`, `data` (JSON), `read_at`.
- **Relationships**: Belongs to users.
- **Notes**: Supports various notification types through JSON data field.

### Gamification & Rewards

#### `badges`
- **Purpose**: Defines achievement badges.
- **Key Fields**: `id`, `name`, `slug`, `description`, `icon_path`, `points`, `criteria` (JSON).
- **Relationships**: Many-to-many with users through user_badges.
- **Notes**: Criteria JSON defines how badges are earned.

#### `user_badges` (Pivot)
- **Purpose**: Records badges earned by users.
- **Key Fields**: `id`, `user_id`, `badge_id`, `awarded_at`, `metadata` (JSON).
- **Relationships**: 
  - Belongs to users
  - Belongs to badges

#### `leaderboards`
- **Purpose**: Performance ranking configuration.
- **Key Fields**: `id`, `name`, `type`, `course_id` (optional), `subject_id` (optional).
- **Relationships**: 
  - Belongs to courses (optional)
  - Belongs to subjects (optional)
  - One-to-many with leaderboard_entries
- **Notes**: Supports course-specific, subject-specific, or global leaderboards.

#### `leaderboard_entries`
- **Purpose**: Individual user rankings on leaderboards.
- **Key Fields**: `id`, `leaderboard_id`, `user_id`, `score`, `rank`, `achievements` (JSON).
- **Relationships**: 
  - Belongs to leaderboards
  - Belongs to users
- **Notes**: Tracks user performance metrics for rankings.

## Design Considerations

### Security

- **Sensitive Data**: Teacher payment details are designed to be encrypted at rest.
- **Authentication**: Leverages Laravel's secure authentication system.
- **Authorization**: Role-based access control through the roles system.

### Performance

- **Indexing**: Foreign keys and commonly queried fields are indexed.
- **Denormalization**: Strategic denormalization (e.g., enrollment.progress) for performance.
- **Soft Deletes**: Implemented on critical tables to maintain referential integrity while allowing "deletion".

### Flexibility

- **JSON Fields**: Used for flexible data structures (quiz options, lesson content, etc.).
- **Polymorphic Relationships**: Employed for the payments system to handle different payment contexts.
- **Multiple Access Models**: Supports both subscription-based and one-time purchase access to content.

### Scalability

- **Modular Design**: Tables are logically grouped and related, allowing for feature-based scaling.
- **Background Processing**: Designed with queuing capabilities for handling intensive operations.

## Related Documentation

- [JSON Schemas](json_schemas.md) - Detailed documentation of JSON structure for flexible fields.

## Migrations

The database schema is implemented through Laravel migrations located in `database/migrations/`. These are organized chronologically and grouped by functionality phases. 