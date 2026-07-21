# Shared LMS Surface Manifest

This manifest is the tracked ownership contract for `lms`, `airads`, and
`digikatech`. `lms` is authoritative after a change is accepted.

## Shared by Default

| Surface | Paths or examples |
| --- | --- |
| Assessments and grading | `apps/assessments/`, generic gradebook logic, quiz and rubric UI |
| Curriculum and delivery | `apps/curriculum/`, `apps/progression/`, prerequisite and drip logic |
| Course creation | `frontend/src/features/course-builder/`, generic program management views and serializers |
| Course consumption | `frontend/src/features/course-player/`, student progress and certificate behavior |
| Generic platform configuration | `apps/platform/`, cached platform payloads, uploaded branding fields, currency and category configuration |
| Generic commerce | Orders, checkout, refunds, pricing, and provider abstractions without an admissions workflow |
| Generic reporting | `apps/reports/` registry, role-scoped reports, export audit log, print and CSV UI |
| Generic inquiry intake | `apps/inquiries/` records, validation, admin workflow, and configurable internal notification routing |
| Shared support contracts | Generic notifications, authentication return URLs, Inertia props, and utilities required by the surfaces above |

Shared code must use platform settings, request context, or explicit extension
points. It must not infer a tenant from a repository name, hostname, logo path,
or institution string.

## Fork-Only by Default

- `frontend/src/pages/public/` and tenant navigation/footer variants.
- Admissions, campuses, schools, news, career guides, and marketing funnels.
- Tenant-specific email copy, recipients, domains, logos, images, and seed data.
- Host-specific deployment configuration such as a cPanel filesystem path.
- Prototype applications nested inside a fork.
- Generated `static/dist/` output. Build output is reviewed and committed
  separately only when the release workflow explicitly requires it.

## Mixed Files

Some files contain both shared and fork-only behavior. These are promoted by
hunk, never by whole-file replacement:

- `apps/core/views.py`, `apps/core/urls.py`, and `apps/core/models.py`.
- `apps/commerce/services.py` and `apps/commerce/views.py`.
- `apps/notifications/services.py`.
- `config/settings/settings.py` and `config/urls.py`.
- `frontend/src/main.jsx`, dashboard navigation, and shared auth pages.

A mixed change is acceptable only after the generic portion has its own commit
and the staged diff contains no tenant identity or tenant-only route.

## Dependency and Design-System Changes

Runtime dependency upgrades, React/MUI major-version changes, and global
typography changes are shared only when deliberately adopted in `lms`.
Their presence in a lab fork does not make them part of an LMS feature sync.

## Required Promotion Evidence

Before updating a shared branch, the sync report must include:

1. Source and destination commit IDs.
2. Included shared commits and excluded fork-only changes.
3. An added-line tenant-literal scan of the promoted range.
4. `manage.py check` and migration-drift results.
5. Full backend and frontend test results.
6. A production frontend build result.
7. Confirmation that generated assets and unrelated dirty work were excluded.
