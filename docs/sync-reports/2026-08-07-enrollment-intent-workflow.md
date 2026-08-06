# Enrollment Intent Workflow

Date: 2026-08-07

## Scope

- Classification: mixed
- Canonical shared-engine commit: `7d2ba7aa`
- LMS public wiring commit: `a1c52335`
- Responsive course-manager header commit: `932220d8`

The shared engine now captures a learner's name, email, and phone before
authentication or checkout; resumes the same intent after sign-in; auto-enrols
eligible free learners; links paid intents to orders; and exposes captured
records to staff at `/admin/enrollment-leads/`. Internal browser transitions
use Inertia, following `docs/inertia-architecture.md`; payment callbacks and
webhooks retain their external-provider boundary.

The course-manager header now truncates long titles with an accessible full
title, reserves independent space for tabs and actions, and stacks navigation
on narrow screens instead of shrinking text below a readable size.

## Ownership and exclusions

- The enrollment lifecycle, payment-policy extension points, admin view, and
  modal are shared engine.
- LMS public course-page wiring remains LMS-owned and was not promoted as
  Airads product behavior.
- No downstream branding, admissions pages, deployment settings, or generated
  `static/dist` assets were included.

## Verification

| Gate | Result |
| --- | --- |
| `manage.py check` | Passed |
| Migration drift check | Passed |
| Full pytest suite | 867 passed |
| Focused enrollment frontend tests | 3 passed |
| Responsive header test | 1 passed |
| Full Vitest suite | 178 passed; one unrelated timeout passed alone |
| Targeted ESLint | Passed |
| Temporary-directory production build | Passed |
| `git diff --check` and product-literal scan | Passed |

Repository-wide ESLint retains its existing unrelated baseline failures; the
files changed by this work pass targeted linting.
