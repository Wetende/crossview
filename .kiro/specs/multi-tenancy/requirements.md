# Requirements Document

## Introduction

The Multi-tenancy system enables the LMS to serve multiple institutions (tenants) from a single codebase. Each tenant has isolated data, customizable branding, and can use preset blueprints. This supports the SaaS expansion strategy for onboarding Beauty Schools, Mechanics Workshops, and other vocational institutions.

## Glossary

- **Tenant**: An institution using the LMS (e.g., Crossview College, Eldoret Beauty School).
- **Tenant Isolation**: The separation of data between tenants so one cannot access another's data.
- **Preset Blueprint**: A pre-configured academic blueprint template for common use cases (Theology, TVET, Beauty, Mechanics).
- **Subdomain**: The tenant-specific URL prefix (e.g., crossview.lms.co.ke, beauty.lms.co.ke).
- **Tenant Admin**: The administrator role within a specific tenant.

## Requirements

### Requirement 1: Tenant Registration and Setup

**User Story:** As a platform administrator, I want to onboard new institutions quickly, so that I can scale the SaaS business.

#### Acceptance Criteria

1. WHEN a new tenant is registered THEN the Multi-tenancy System SHALL create a tenant record with unique identifier and subdomain.
2. WHEN a tenant is created THEN the Multi-tenancy System SHALL provision a tenant admin user.
3. WHEN a tenant selects a preset blueprint THEN the Multi-tenancy System SHALL copy the blueprint configuration to the tenant.
4. WHEN tenant setup completes THEN the Multi-tenancy System SHALL send welcome email with login credentials.

### Requirement 2: Data Isolation

**User Story:** As a tenant admin, I want my institution's data completely isolated, so that other tenants cannot access our students, courses, or grades.

#### Acceptance Criteria

1. WHEN any database query is executed THEN the Multi-tenancy System SHALL automatically scope it to the current tenant.
2. WHEN a user attempts to access another tenant's data THEN the Multi-tenancy System SHALL deny access and log the attempt.
3. WHEN files are uploaded THEN the Multi-tenancy System SHALL store them in tenant-specific directories.
4. WHEN a tenant is deleted THEN the Multi-tenancy System SHALL remove all associated data.

### Requirement 3: Tenant Identification

**User Story:** As a student, I want to access my institution via a unique URL, so that I know I'm in the right place.

#### Acceptance Criteria

1. WHEN a request arrives THEN the Multi-tenancy System SHALL identify the tenant from the subdomain.
2. WHEN a subdomain is not recognized THEN the Multi-tenancy System SHALL display a "tenant not found" page.
3. WHEN tenant is identified THEN the Multi-tenancy System SHALL set the tenant context for the entire request lifecycle.

### Requirement 4: Tenant Branding

**User Story:** As a tenant admin, I want to customize the look and feel, so that the platform reflects my institution's brand.

#### Acceptance Criteria

1. WHEN a tenant configures branding THEN the Multi-tenancy System SHALL allow setting logo, primary color, and institution name.
2. WHEN a page is rendered THEN the Multi-tenancy System SHALL apply the tenant's branding configuration.
3. WHEN no branding is configured THEN the Multi-tenancy System SHALL use default platform branding.

### Requirement 5: Preset Blueprints

**User Story:** As a platform administrator, I want to offer preset blueprints for common use cases, so that new tenants can get started quickly.

#### Acceptance Criteria

1. WHEN creating preset blueprints THEN the Multi-tenancy System SHALL support the following regulatory presets:
   - **TVET CDACC Standard (TVETA)**: Hierarchy `Qualification → Module → Unit of Competency → Element`, Module types: Basic/Common/Core, Grading: CBET (Competent/Not Yet Competent, 50% pass), Requirements: Theory 30% + Practical 70% + Portfolio of Evidence
   - **NITA Trade Test (Artisan)**: Hierarchy `Trade Area → Grade Level → Practical Project`, Levels: Grade III/II/I, Grading: Visual Review with checklist (Safety Gear, Tools, Finished Product Quality)
   - **NTSA Driving Curriculum**: Hierarchy `License Class → Unit → Lesson Type`, Lesson types: Theory/Yard Training/Roadwork, Grading: Instructor checklist with hours logged, Components: Theory Test + Maneuver Test + Road Test
   - **CBC K-12 Standard (KICD)**: Hierarchy `Grade → Learning Area → Strand → Sub-strand`, Grading: 4-point rubric (Exceeding/Meeting/Approaching/Below Expectation), Competencies tracking: Communication, Critical Thinking, Digital Literacy
   - **CCT Theology Standard (Legacy)**: Hierarchy `Program → Year → Unit → Session`, Grading: Summative (CAT 30% + Exam 70%, 40% pass), Practicum uploads enabled
2. WHEN a tenant selects a preset THEN the Multi-tenancy System SHALL create a copy of the blueprint for that tenant.
3. WHEN a preset is updated THEN the Multi-tenancy System SHALL not affect existing tenant copies.
4. WHEN a tenant modifies their blueprint THEN the Multi-tenancy System SHALL allow customization without affecting the preset.

### Requirement 6: Tenant Billing and Limits

**User Story:** As a platform administrator, I want to set usage limits per tenant, so that I can offer different pricing tiers.

#### Acceptance Criteria

1. WHEN a tenant is created THEN the Multi-tenancy System SHALL assign a subscription tier with limits.
2. WHEN a tenant exceeds student limit THEN the Multi-tenancy System SHALL prevent new enrollments and notify the admin.
3. WHEN a tenant exceeds storage limit THEN the Multi-tenancy System SHALL prevent new uploads and notify the admin.
4. WHEN checking limits THEN the Multi-tenancy System SHALL provide current usage statistics.
