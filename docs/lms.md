# Crossview LMS: Multi-Mode Tenant (TVET + Online Short Courses) Recommendations

## Goal
Support **one institution (single tenant)** running **multiple learning models** at the same time, e.g.:
- **TVET / CDACC-style** qualifications (competency, portfolios/practicum, approvals)
- **Online short courses** (self-paced, open enrollment, optional payments, gamification)

This must work **without forking code per client** and without “mode = whole tenant” limitations.

---

## Core Principle: Separate What Is Platform-Wide vs Academic-Model vs Program-Specific

### 1) Platform-wide (Superadmin, universal in tenant)
These are institutional operations and must be consistent everywhere:
- Branding/identity: institution name, logo, favicon, colors, email templates, PDF header/footer
- Contact/legal: address, contact email/phone, policy text
- Security/account policies: login identifier policy, MFA for admins (if supported), password policy
- Communication infrastructure: SMTP/SMS gateway config, notification defaults
- Global vocabularies: categories, campuses/centers, intake/cohort labels

### 2) Blueprint-level (Academic model defaults)
Blueprints represent the “academic contract”:
- Curriculum hierarchy labels + constraints (TVET vs theology vs online)
- Grading model + rules (competency vs weighted vs percentage etc.)
- Progression rules (prereqs, completion thresholds, evidence rules)
- Assessment requirements (portfolio required? enforce standard rubrics? etc.)
- Terminology pack selection (optional)

### 3) Program-level (Local variation inside the institution)
Programs can differ even within the same tenant:
- Which blueprint a program uses (TVET blueprint vs Online blueprint)
- Program duration, pricing, certificate template choice
- Instructor workflow and publishing policy
- Enrollment caps/eligibility rules
- Allowed overrides of grading components (only if blueprint permits)

### 4) Not configurable (universal invariants)
Avoid making these superadmin toggles:
- CSRF/session/security invariants
- Core role semantics and data integrity rules
- Audit logging should be always-on for admin actions
- API contract stability (verification endpoints, integrations)

---

## Required Architectural Change: “Mode is Not Tenant Identity”
In a multi-mode tenant:
- `PlatformSettings.deployment_mode` should be treated as a **default / primary mode**, not a hard constraint.
- Programs choose their blueprint, and that blueprint determines academic behavior.

If desired, store “enabled modes” as a list, but the key is:
> **The effective model is program-scoped, not tenant-scoped.**

---

## Configuration Resolution Model (Must Be Consistent Everywhere)
Introduce a single “effective configuration” resolver with clear precedence.

### Recommended precedence (highest wins):
1. **Program overrides** (optional; only keys allowed by blueprint)
2. **Blueprint defaults / blueprint feature flags**
3. **Platform defaults / platform policy defaults**
4. **Platform module availability** (hard cap: if module OFF here, no lower tier can enable it)

Represent this as:
`effective = platform_modules_cap( platform_defaults ⊕ blueprint_defaults ⊕ program_overrides )`

Where `⊕` is a merge with defined rules (no silent deletion).

---

## Split Feature Flags Into Two Tiers (Critical)
Right now, a common failure mode is mixing “module availability” with “policy behavior”.

### Tier A: Platform Modules (tenant-wide ON/OFF)
These are “is the module installed/available at all?”
- certificates module
- practicum module
- discussions/events module
- gamification module
- payments module

Rules:
- Superadmin controls Tier A.
- If OFF, no blueprint/program can turn it ON.

### Tier B: Blueprint/Program Behavior Flags
These determine academic behavior per program model:
- portfolio required / practicum required
- enforce standard rubrics
- show gamification UI for this program
- allow self-registration for this program
- enrollment policy for this program (open vs approvals)

Rules:
- Defaults come from blueprint.
- Program overrides can refine (if allowed).
- UI and backend must check **effective flags**, not raw platform deployment mode.

---

## Enrollment & Payments: Make Them Program-Level Policies
In Kenya, it’s common that:
- TVET: approvals required; payments may be offline or not used
- short courses: open enrollment; online payments often needed

Therefore:
- Keep payment provider configuration at platform level (keys, currency, settlement accounts).
- Make “payments enabled for this program” program-level (gated by platform module ON).
- Make enrollment workflow program-level (`open`, `instructor_approval`, `admin_approval`).

This prevents platform-wide settings from breaking one model when enabling the other.

---

## Certificates: Same Module, Different Templates
Mixed-mode tenants need different certificate styles:
- TVET/CDACC-style compliance certificate templates
- short course “completion certificate” templates

Recommendation:
- Platform: enable certificates module + verification system (global).
- Blueprint/program: choose certificate template and required completion criteria.

---

## Curriculum & Blueprint Integrity Guardrails
To prevent data corruption:
- Do not allow changing a program’s blueprint after enrollments exist (unless you build migration tooling).
- Keep “blueprints editable only if unused” (already a good practice).
- Validate that a program’s curriculum structure conforms to its blueprint constraints.

---

## UI/UX Recommendations for Mixed-Mode Tenants
### Program-aware dashboards and navigation
- `/dashboard/` should support filtering or switching context:
  - “TVET Programs” vs “Short Courses”
- Catalog `/programs/` can show both, but with filters/badges.
- Admin/course builder should conditionally render tabs based on **effective features for the selected program**.

### Data passed to frontend
For any program-scoped page, include:
- `program`
- `program.blueprint`
- `effectiveFeatures`
- `effectiveTerminology` (optional)

Do not rely only on globally shared `platform.features`.

---

## Minimal Implementation Plan (Pragmatic Steps)
1. Redefine `PlatformSettings.deployment_mode` as a default/primary mode (not exclusive).
2. Move policy flags out of platform `features` into:
   - blueprint `feature_flags` (defaults)
   - program overrides JSON (new field) for program-specific changes
3. Introduce a single resolver service:
   - `get_effective_features(program, platform_settings)`
4. Replace all frontend/backend checks to use effective features:
   - UI rendering
   - permission checks
   - workflow decisions
5. Stop overwriting feature toggles on mode change:
   - changing mode should not delete existing toggles silently
   - provide “reset to defaults” explicitly
6. Default new program’s blueprint to the platform’s active/default blueprint (optional), but allow choosing per program.
7. Add auditing/versioning of configuration changes (who changed what and when).

---

## Governance Model (How Admins Should Think)
- Superadmin configures: tenant identity, module availability, global vocabularies, operational policies.
- Blueprint defines: academic mechanics and constraints.
- Program configures: local program delivery settings and overrides (within guardrails).

This is the cleanest way to support **one institution offering TVET + online short courses** in one deployment without forking code.

---
