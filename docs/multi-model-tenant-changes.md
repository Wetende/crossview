# Multi-Model Tenant Changes (TVET + Online Short Courses + Theology) — Design & Implementation Plan

## Purpose
Enable a **single institution (single tenant deployment)** to run **multiple education models concurrently**, e.g.:

- **TVET / CDACC (CBET)** competency-based qualifications with portfolio/practicum evidence and regulated reporting.
- **Online short courses** (self-paced) with completion-based progression, optional payments, gamification.
- **Theology / Bible college** semester-based programs with credit hours and weighted grading (CAT + exam).

This document describes **what must change**, **what should remain universal**, and a practical **implementation roadmap** you can execute later.

---

## Background (Current State Summary)
Crossview currently supports:
- `PlatformSettings` (singleton) with:
  - `deployment_mode` (single choice),
  - branding fields,
  - `features` JSON,
  - `active_blueprint` FK,
  - `course_levels`.
- `AcademicBlueprint` with:
  - `hierarchy_structure` list of labels,
  - `grading_logic` JSON,
  - `progression_rules` JSON,
  - `certificate_enabled`, `gamification_enabled`,
  - `feature_flags` JSON.
- Programs reference a blueprint (used by the assessment engine via enrollment → program → blueprint).

**Problem:** A single `deployment_mode` and platform-level feature flags are not sufficient for one tenant to run *TVET + online* simultaneously without conflicts. TVET and online require different structure constraints, grading semantics, enrollment policy, and evidence requirements.

---

## Goals
1. Support multiple “models” within one tenant **without code forks**.
2. Make configuration predictable and safe:
   - No silent overwrites.
   - Clear precedence.
   - Prevent invalid combinations.
3. Keep regulatory/compliance behaviors consistent per program model.
4. Make UI and backend behavior program-aware (not tenant-mode-aware).

---

## Non-Goals
- Building a full plugin system for arbitrary node types without constraints.
- Automatically migrating an existing program’s learning records when switching blueprint/models (we will *prevent* this by default).
- Implementing payments end-to-end (only configuration scaffolding; execution can follow).

---

## Key Design Principles
### 1) Separate configuration into tiers
- **Platform (tenant-wide)**: identity, infrastructure, and module availability.
- **Program Model**: academic model defaults + compliance bundle (TVET vs online vs theology).
- **Program**: program-specific settings/overrides within allowed limits.

### 2) Use an “effective config resolver” everywhere
All runtime decisions (UI rendering, workflow, validation) should be based on a **single resolved configuration**, not raw scattered flags.

### 3) Program-scoped model, not tenant-scoped mode
The institution may have multiple models. `deployment_mode` becomes a **default** or legacy field, not the driver.

---

## Proposed Data Model Changes

### A) New model: `ProgramModelProfile`
A profile bundles academic blueprint + behavioral defaults + compliance settings for a given model.

**Fields (recommended):**
- `id`
- `code` (unique): e.g. `tvet_cdacc`, `online_short_courses`, `theology_semester`
- `name`
- `description`
- `blueprint` (FK to `AcademicBlueprint`) — required
- `terminology` (JSON) — optional, for UI vocabulary (Course vs Qualification etc.)
- `defaults` (JSON) — program-model default behaviors (see below)
- `compliance` (JSON) — regulator settings/templates/reporting requirements
- `is_active` (bool)

**Rationale:** A profile is the “unit of multi-model configuration” administrators understand.

---

### B) Program-level association
Add to `Program`:
- `program_model_profile` (FK to `ProgramModelProfile`, nullable for migration)
- `program_overrides` (JSON) — optional overrides for behavior for this program
- Optional: `certificate_template` selection (if you add a templates table)

**Rationale:** Program chooses its model; overrides allow minor variation without new model profile.

---

### C) PlatformSettings: redefine responsibilities
Keep as tenant singleton but **change semantics**:

1) `deployment_mode`
- becomes: `default_deployment_mode` (legacy-compatible), used only for default suggestions and initial setup.
- do NOT use it to determine behavior globally.

2) `features` should split into:
- `modules` (tenant-wide module availability, hard caps)
- `policies` (tenant-wide defaults, NOT program-specific)

If you can’t change schema now, treat `features` as `modules` and move policies to model profile defaults.

---

## Configuration Schema (Recommended)

### 1) Platform modules (tenant-wide hard caps)
These represent “is the module installed/available at all?”

Example:
- `modules.certificates: bool`
- `modules.practicum: bool`
- `modules.gamification: bool`
- `modules.discussions: bool`
- `modules.events: bool`
- `modules.payments: bool` (scaffold)

Rule:
- If platform module is OFF, model/profile/program cannot enable it.

---

### 2) Program Model defaults (profile defaults)
These represent “how this model behaves”.

Example:
- `defaults.enrollment.mode: "open" | "admin_approval" | "instructor_approval"`
- `defaults.registration.self_registration: bool`
- `defaults.learning.self_paced: bool`
- `defaults.payments.enabled: bool` (only if platform payments module ON)
- `defaults.assessment.require_portfolio: bool`
- `defaults.assessment.require_practicum: bool`
- `defaults.assessment.enforce_standard_rubrics: bool`
- `defaults.ui.enable_gamification: bool`
- `defaults.reporting.profile: "cdacc" | "theology" | "online"`

---

### 3) Program overrides
Allowed overrides should be constrained by profile/blueprint.

Example:
- override enrollment cap, pricing, certificate template, allow/disallow discussions, etc.

---

## Effective Configuration Resolver (Must-Have)
Create a single resolver that returns:

- effective modules (tenant-wide)
- effective behavior flags (per program)
- effective terminology (per program)
- effective compliance rules (per program)

### Precedence (recommended)
Highest wins:

1. Program overrides (if allowed)
2. Program model profile defaults
3. Platform default policies (optional)
4. Platform modules cap (final “AND” gate)

Pseudo-logic:
- `effective_behavior = deep_merge(profile.defaults, program.overrides)`
- `effective_behavior = apply_platform_caps(effective_behavior, platform.modules)`
- `effective_terminology = merge(platform_terminology, profile.terminology)`
- `effective_compliance = merge(profile.compliance, program.compliance_overrides?)`

**Important:** Do not silently discard values; validate and return readable errors.

---

## Blueprint Enhancements (TVET / Theology / Online)

### 1) TVET/CDACC (CBET) blueprint requirements
TVET/CDACC is not only labels; it requires constraints + evidence:
- Hierarchy (example baseline): `Level → Unit → Learning Outcome → Session`
- Grading: `competency` with levels like `Not Yet Competent`, `Competent`
- Progression: must achieve competence in required outcomes
- Evidence: portfolio/practicum/checklist artifacts; may require assessor/verifier workflow

Blueprint should support:
- allowed child types per level
- required node properties per level (e.g., contact hours, evidence type)
- required assessment types at outcome level

### 2) Theology blueprint
Common structure:
- `Year → Semester → Course → Session`
- Weighted grading (CAT + exam)
- Credit hours per course
- Optional ministry practicum

Blueprint should support:
- credit hours fields required at course level
- weighted grading components validation

### 3) Online short courses blueprint
Structure:
- `Course → Module → Lesson`
- Completion-based progression
- Quizzes/assignments optional
- Gamification often enabled

Blueprint should support:
- completion rules: lesson completion, quiz pass threshold, etc.

---

## UI / Frontend Changes (Program Context Everywhere)

### 1) Introduce “Program Context” for pages that act on a program
Any page that is program-specific should receive:
- `program` object
- `programModelProfile` (or its `code/name`)
- `effectiveConfig` (behavior flags and caps)
- `blueprint` summary

**Do not** render based solely on `platform.deploymentMode` for mixed-mode tenants.

### 2) Dashboard changes
Dashboard should allow:
- filtering by program model/profile (TVET vs Online vs Theology)
- showing different KPIs depending on model:
  - TVET: competence completion, evidence completeness
  - Online: completion rate, time-on-task, revenue (if enabled)
  - Theology: grade distributions, credit progress

### 3) Navigation
Show a visible badge/selector indicating current program model, to reduce user confusion.

---

## Backend Changes (Where to Apply Effective Config)
### Must change checks from platform-wide to per-program effective config:
- enrollment workflow decisioning (open vs approval)
- whether practicum features are required/available
- whether certificates are issued for a program
- whether gamification logic runs for a program
- reporting endpoints and export templates

### Consistency requirement
Backend enforcement must match frontend toggles:
- UI hiding is not security.
- Always enforce in backend using effective config.

---

## Guardrails / Data Integrity Rules

### 1) Blueprint/Profile switching lock
Once a program has enrollments or assessments, switching its:
- blueprint,
- model profile,
- grading type,
should be blocked by default.

If you need change later:
- implement “Program versioning” (new intake uses new program version).

### 2) Configuration validation
Validate:
- platform modules schema
- model profile defaults schema
- program overrides schema
- blueprint grading logic schema (already exists in part)

Return actionable errors in admin UI.

### 3) No silent overwrites
When changing “default deployment mode” or model profiles:
- do not overwrite existing program overrides
- do not erase platform modules/policies

---

## Recommended Starter Model Profiles (Ship as presets)

### Profile: `tvet_cdacc`
- Blueprint: CBET (competency)
- Defaults:
  - enrollment.mode: instructor/admin approval
  - self_registration: false (often controlled)
  - require_portfolio: true
  - require_practicum: true
  - enforce_standard_rubrics: true
  - gamification: typically false (optional)

### Profile: `online_short_courses`
- Blueprint: self-paced
- Defaults:
  - enrollment.mode: open
  - self_registration: true
  - payments.enabled: true (if module available)
  - gamification: true
  - practicum: false by default

### Profile: `theology_semester`
- Blueprint: weighted grading (CAT/exam)
- Defaults:
  - enrollment.mode: instructor approval (varies)
  - self_registration: often true/false depending on institution
  - practicum: optional
  - gamification: typically false

---

## Migration Plan (From Current Single-Mode)

### Phase 0: Preparation
- Add new models/fields with migrations:
  - `ProgramModelProfile`
  - `Program.program_model_profile` (nullable)
  - `Program.program_overrides` (default `{}`)

### Phase 1: Seed default profiles
- Create 2–3 profiles in migration or admin command:
  - tvet_cdacc, online_short_courses, theology_semester
- Link each to an existing `AcademicBlueprint` or create one.

### Phase 2: Assign existing programs
- For each existing program:
  - if `program.blueprint.grading_logic.type == competency` → tvet_cdacc
  - if `percentage/points` and self-paced patterns → online_short_courses
  - else → theology_semester or custom

### Phase 3: Introduce Effective Config resolver
- Build resolver and replace checks gradually:
  - backend first for enforcement
  - frontend second for display consistency

### Phase 4: Reframe PlatformSettings
- Rename or repurpose `deployment_mode` to “default mode”
- Treat `PlatformSettings.features` as “modules”
- Update setup wizard to:
  - configure platform modules + branding + default mode
  - optionally create initial model profiles

---

## Implementation Checklist (Concrete Tasks)

### Data / Migrations
- [ ] Add `ProgramModelProfile` model
- [ ] Add `Program.program_model_profile` FK
- [ ] Add `Program.program_overrides` JSON
- [ ] Seed model profiles (migration/script)

### Backend Services
- [ ] Implement `EffectiveConfigService.get_for_program(program, user)`:
  - returns `modules`, `behavior`, `terminology`, `compliance`
- [ ] Replace enrollment workflow checks to use effective config
- [ ] Replace certificate issuing logic to use effective config
- [ ] Replace practicum requirement checks to use effective config

### Validation
- [ ] Add schemas/validators for:
  - platform modules
  - model profile defaults
  - program overrides
- [ ] Ensure invalid config produces readable errors in admin UI

### Frontend
- [ ] Ensure program-specific pages receive `effectiveConfig`
- [ ] Update conditional rendering to use effective config
- [ ] Add dashboard filtering by program model

### Guardrails
- [ ] Block changing program model/blueprint after enrollments exist
- [ ] Add audit logging for configuration changes (recommended)

---

## Acceptance Criteria
A single institution tenant can:
1. Create a TVET program under `tvet_cdacc` profile and an online course under `online_short_courses`.
2. TVET program enforces competency outcomes and evidence requirements; online course does not.
3. Enrollment workflows can differ per program (approval vs open).
4. UI shows correct features per program without affecting other programs.
5. Backend enforces these rules even if frontend is bypassed.

---

## Notes on Kenya Context (Why This Structure Fits Reality)
- TVET/CDACC CBET emphasizes **competence demonstration** and structured outcomes/evidence; a blueprint must encode constraints, not just labels.
- Theology programs commonly align with higher-ed patterns (years/semesters/credit hours, CAT/exam weighting).
- Many Kenyan institutions run mixed offerings (regulated qualifications + market-facing short courses), so the tenant must support multiple models simultaneously.

---