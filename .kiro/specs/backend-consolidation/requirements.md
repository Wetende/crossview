# Backend Structure Requirements

## Overview

Restructure the Django project following best practices from GeeksforGeeks and real-world patterns. Keep the multi-app architecture with domain-separated apps, split settings by environment, and standardize app structure across all apps.

## Goals

-   Maintain multi-app structure for single responsibility and loose coupling
-   Split settings into environment-specific files (base, development, production)
-   Standardize each app's internal structure
-   Improve maintainability, scalability, and collaboration

## Requirements

### Requirement 1: Split Settings by Environment

**User Story:** As a developer, I want settings split into base, development, and production files so I can manage environment-specific configurations easily.

**Acceptance Criteria:**

-   Create `config/settings/` directory with `__init__.py`
-   Create `config/settings/base.py` with shared settings
-   Create `config/settings/development.py` inheriting from base
-   Create `config/settings/production.py` inheriting from base
-   Remove old `config/settings.py` file
-   Update `manage.py` and `wsgi.py` to use new settings path

### Requirement 2: Standardize App Structure

**User Story:** As a developer, I want all apps to follow a consistent structure for easier navigation and maintenance.

**Acceptance Criteria:**

Each app in `apps/` should have:

-   `__init__.py` - Package init
-   `apps.py` - Django app configuration
-   `admin.py` - Admin registrations
-   `models.py` - Data models
-   `views.py` - View logic (if needed)
-   `urls.py` - URL patterns
-   `services.py` - Business logic (if needed)
-   `migrations/` - Database migrations
-   `tests/` - App-specific tests (directory or tests.py)

### Requirement 3: Core App Structure

**User Story:** As a developer, I want the core app to contain foundational models (User, Program) and shared utilities.

**Acceptance Criteria:**

-   `apps/core/` contains User and Program models
-   Add `admin.py` with User and Program admin registrations
-   Add `apps.py` with proper app configuration
-   Contains shared base classes and utilities

### Requirement 4: Tenants App Structure

**User Story:** As a developer, I want the tenants app to handle all multi-tenancy concerns.

**Acceptance Criteria:**

-   `apps/tenants/` contains Tenant, TenantBranding, TenantLimits, SubscriptionTier, PresetBlueprint models
-   Contains `managers.py` with TenantManager, AllTenantsManager
-   Contains `middleware.py` for tenant context
-   Contains `mixins.py` for tenant-aware models
-   Add `admin.py` with all tenant model registrations
-   Add `apps.py` with proper app configuration

### Requirement 5: Domain Apps Structure

**User Story:** As a developer, I want each domain app to be self-contained with its own models, services, and tests.

**Acceptance Criteria:**

Apps to standardize:

-   `apps/blueprints/` - AcademicBlueprint model
-   `apps/curriculum/` - CurriculumNode model
-   `apps/assessments/` - AssessmentResult model
-   `apps/progression/` - Enrollment, NodeCompletion models
-   `apps/practicum/` - Rubric, PracticumSubmission, SubmissionReview models
-   `apps/certifications/` - CertificateTemplate, Certificate, VerificationLog models
-   `apps/content/` - ContentVersion, ParsedImage models

Each app must have: `apps.py`, `admin.py`, `models.py`, `urls.py`, `migrations/`

### Requirement 6: Project Root Organization

**User Story:** As a developer, I want the project root to be clean and well-organized.

**Acceptance Criteria:**

```
crossview-lms/
├── manage.py
├── README.md
├── requirements.txt
├── .gitignore
├── .env
├── pytest.ini
├── config/                  # Project configuration
├── apps/                    # All Django apps
├── templates/               # Global templates
├── static/                  # Global static files
├── media/                   # User uploads
├── frontend/                # Vue.js frontend
├── tests/                   # Project-wide tests
└── docs/                    # Documentation
```

## Current Apps (9 total)

| App            | Models                                                                  | Status      |
| -------------- | ----------------------------------------------------------------------- | ----------- |
| core           | User, Program                                                           | Needs admin |
| tenants        | Tenant, TenantBranding, TenantLimits, SubscriptionTier, PresetBlueprint | Complete    |
| blueprints     | AcademicBlueprint                                                       | Needs admin |
| curriculum     | CurriculumNode                                                          | Needs admin |
| assessments    | AssessmentResult                                                        | Needs admin |
| progression    | Enrollment, NodeCompletion                                              | Needs admin |
| practicum      | Rubric, PracticumSubmission, SubmissionReview                           | Needs admin |
| certifications | CertificateTemplate, Certificate, VerificationLog                       | Needs admin |
| content        | ContentVersion, ParsedImage                                             | Needs admin |

## Notes

-   This approach follows Django best practices for maintainability and scalability
-   Each app remains independent and potentially reusable
-   Split settings allow easy environment management without code changes
-   Standardized structure makes onboarding new developers easier
