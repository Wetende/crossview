# Comparison Report: Studiesafari vs. Crossview

This report provides a technical comparison between **Studiesafari** (Laravel) and **Crossview** (Django), focusing on architecture, user flows, and feature sets.

*Last Updated: 2026-01-13*

## 1. High-Level Architecture

| Feature | Studiesafari (Laravel) | Crossview (Django) |
| :--- | :--- | :--- |
| **Core Hierarchy** | Rigid: `Course` → `Section` → `Lesson`. | Flexible: `Program` → `CurriculumNode` (Tree). Structure defined by `AcademicBlueprint`. |
| **Content Strategy** | **Lesson-centric**: Each Lesson has a specific type (Video, Stream, Text, Quiz). | **Block-centric**: `CurriculumNode` contains ordered `ContentBlock`s (Video, RichText, Quiz, PDF). |
| **Data Model** | Relational, explicit foreign keys for every relationship level. | Hierarchical (Self-referencing), using JSON fields (`properties`, `data`) for flexibility. |
| **Workflow** | **Wizard-based**: Distinct steps for Curriculum, Settings, Pricing, Drip, FAQ. | **Vetting-based**: Draft → Submit → `CourseChangeRequest` (Review Loop) → Approve. |

## 2. Deep Dive: Flows & Features

### A. Teacher Flow (Course Creation)
*   **Studiesafari:**
    *   **Experience:** "Course Builder" wizard.
    *   **Features:** Explicit "Drip Content" settings, Pricing tiers (Free/Subscription/Purchase), Sale prices, and Meta tags for SEO.
    *   **Strengths:** Very "Product-ready" for selling courses immediately.
*   **Crossview:**
    *   **Experience:** "Program Editor" with content block management.
    *   **Unique Feature:** **PDF Parsing** (`ContentVersion`, `ParsedImage`) to auto-generate content from uploaded syllabus documents.
    *   **Strengths:** Extremely flexible for academic/university-style curriculums.
    *   **Gap:** Lacks the "Commerce" layer (Pricing, Sales Pages, Subscriptions) found in Studiesafari.

### B. Quizzes & Assessments (Significant Updates)
*   **Studiesafari:**
    *   **Variety:** Supports **Gap Fill, Matching Pairs, Keyword Answers**, and MCQ.
    *   **Reusability:** Has a `QuestionLibrary`.
*   **Crossview (Updated):**
    *   **Placement:** `Quiz` model linked to a `CurriculumNode`.
    *   **Variety:** **Now Parity Achieved.** Recently added support for **Matching Pairs** and **Ordering/Sequence** question types (see `apps/assessments/models.py`).
    *   **Reusability:** **Gap Closed.** Now includes a `QuestionBank` service (`QuestionBankEntry` model) allowing teachers to save and copy questions across quizzes.
    *   **Strengths:** The `QuestionBankService` supports tagging and subject area filtering, making it robust for large institutions.

### C. Student Flow (Learning & Gamification)
*   **Studiesafari:**
    *   **Engagement:** **Gamification is core** (Badges, Leaderboards, Points, Ranks).
    *   **Social:** Parent/Student linking.
*   **Crossview:**
    *   **Consumption:** Tree traversal of `CurriculumNodes`.
    *   **Status:** **Major Gap.** While UI placeholders for "Gamification & Badges" exist in the Admin Settings, **no backend models** (`Badge`, `UserPoints`) exist in `apps/core` or `apps/assessments`.
    *   **Impact:** Learning is functional but lacks the retention loops of Studiesafari.

### D. User Management & Vetting
*   **Studiesafari:**
    *   **Roles:** Teacher, Student, Parent, Admin.
*   **Crossview:**
    *   **Roles:** User, Instructor.
    *   **Vetting:** **Strong Instructor Vetting**. `InstructorProfile` has a dedicated lifecycle (`draft` → `pending_review` → `approved`).
    *   **Strengths:** Better suited for platforms requiring high-quality, verified instructors.

## 3. Recommendations for Crossview

To match the best features of Studiesafari while maintaining Crossview's architectural strengths:

### 1. Implement Gamification Backend (Priority: High)
*   **Why:** Studiesafari relies heavily on this. Crossview has the UI "hooks" but no database implementation.
*   **Action:**
    *   Create a new app `apps/gamification`.
    *   Models: `Badge` (icon, rules), `UserBadge` (earned_at), `UserPoints` (balance), `Leaderboard` (calculated views).
    *   Services: `GamificationService.award_points(user, 'quiz_completion', 50)`.

### 2. Add Commerce/Product Layer (Priority: Medium)
*   **Why:** Crossview has `Programs` but no way to "package" them for sale.
*   **Action:**
    *   Create a `Product` model that wraps a `Program`.
    *   Add fields: `price`, `currency`, `subscription_tier_required`.
    *   **Note:** `SubscriptionTier` exists for Tenants, but not yet for individual Course sales.

### 3. Frontend Builder Experience
*   **Why:** The backend `ContentBlock` structure is powerful but complex.
*   **Action:** Ensure the frontend "Block Editor" seamlessly creates `ContentBlock` records, hiding the complexity of the underlying `CurriculumNode` tree.

### 4. Enhance Content "Drip" (Priority: Low)
*   **Why:** Studiesafari allows releasing content over time (e.g., "Day 7").
*   **Action:** Add `unlock_condition` to `CurriculumNode` (e.g., `{'type': 'days_after_enrollment', 'value': 7}`).
