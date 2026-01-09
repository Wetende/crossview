# Content Management & Assessments
*Brainstorming Summary*

---

## 1. Content Management (Lessons & Sessions)

The platform organizes content via a hierarchical **Curriculum Tree** (Year → Unit → Session). We're evolving this from simple PDF parsing to a rich, instructor-authored experience.

### Rich Content Creation
*   **Rich Text Editor**: Modular "block-based" editor for Sessions/Lessons.
    *   Mix text, images, and embeds.
*   **Multi-Media Support**:
    *   **Video**: Embed links (YouTube/Vimeo) or direct uploads optimized for mobile.
    *   **Audio**: Support for lecture recordings or audio-only lessons.
*   **Downloadable Assets**: Attach PDFs, slide decks, or resource files to any lesson node.
*   **Versioning**: Keep history of content changes using the existing `ContentVersion` system.

---

## 2. Assessment System

### Structure: 2 Assignments + Lesson Quizzes

Each course/program will have:

| Assessment Type | Count | Purpose |
|-----------------|-------|---------|
| **Assignments** | 2 per course | Major graded work (e.g., essays, projects, file submissions) |
| **Quizzes** | 1+ per lesson | Short knowledge checks tied to specific lesson content |
| **Practicum** | 1 per course | Hands-on practical assessment (skills demonstration, portfolio) |

### Assignments (2 Per Course)
*   **Submission Types**: File upload (PDF, DOCX, images) or text entry.
*   **Grading**: Instructor manually grades and provides feedback.
*   **Weighting**: Configurable contribution to final grade (e.g., Assignment 1 = 20%, Assignment 2 = 30%).

### Quizzes (Lesson-Based)
*   **Creation Flow**: Instructor creates a Quiz *directly within a Lesson*. The quiz tests content from that specific lesson.
*   **Question Types**:
    *   Multiple Choice (MCQ) – *Auto-graded*
    *   True/False – *Auto-graded*
    *   Short Answer – *Optionally auto-graded or manual*
*   **Quiz Settings**:
    *   Time limit (optional)
    *   Number of attempts allowed
    *   Pass threshold (e.g., 70% to proceed)
*   **Question Bank**: Instructors can save questions to reuse across lessons/courses.

### Practicum (1 Per Course)
*   **Purpose**: Hands-on practical assessment to demonstrate applied skills.
*   **Submission Types**: File uploads (PDF, images, video) or external links (portfolio, prototype).
*   **Review Flow**:
    *   `Pending` → `Revision Required` → `Approved` / `Rejected`
*   **Skills Checklist**: For TVET/CDACC, ability to verify specific competency criteria.

---

## 3. Grading & Gradebook

### Grading Type: Percentage-Based
*   All assessments are scored as a **percentage** (0-100%).
*   Final course grade = weighted average of all assessment percentages.

### Weighted Categories (Example)
| Component | Weight |
|-----------|--------|
| Quizzes (average) | 20% |
| Assignment 1 | 20% |
| Assignment 2 | 20% |
| Practicum | 40% |
| **Total** | **100%** |

*Weights are configurable by the instructor or admin per course.*

### Pass Threshold
*   Default: **50%** to pass (configurable).
*   Students below threshold = "Fail" status.

### Gradebook View
*   **Instructor Interface**: See all students' scores across all components.
*   **Student Interface**: See their own scores and overall percentage.

---

## 4. Key Questions to Discuss

1.  **AI Quiz Generator**: Should we provide a tool to auto-generate quiz questions from the lesson's rich text content?
2.  **Drip Logic**: Should Lesson 2 be locked until the student passes the Quiz in Lesson 1?
3.  **Late Submissions**: Allow late assignment submissions with a penalty, or hard cutoff?

---

*Updated: Added "2 Assignments per course" structure and lesson-based quiz creation.*
