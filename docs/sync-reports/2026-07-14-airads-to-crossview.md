# Airads to Crossview Shared-Engine Sync — 2026-07-14

## Recorded refs

- Source repository: `Wetende/airads`
- Source ref: `main` at `1621fc12f9e55906a81a9fce463808c6a555a866`
- Canonical repository: `Wetende/crossview`
- Destination base: `origin/main` at `3be97d57695920ffd99501e98b8a636d7b697b45`
- Reviewed integration head before this report: `9935e4eb50ff744ec564d6a0bff5f9d68f4598e6`
- Accepted commit range before this report: `8f55f70e^..9935e4eb`

The source and destination were fetched before the audit. The destination ref
was fetched again after verification and remained at the recorded base.

## Included shared-engine work

- Relative and absolute drip scheduling, including builder editing and tests.
- Course-player overview, sidebar, renderer, results-history, answer-review,
  media, code-lab, whiteboard, and accessibility refinements.
- Assessment answer normalization, any-correct-option MCQ handling,
  multi-select scoring, mastery retakes, penalties, result payloads, and
  official-result reconciliation.
- Generic program categories, program-management controls, classification,
  pricing/currency presentation, and related platform configuration.
- Generic role-scoped reporting with registry, exports, print layouts, routes,
  permissions, and tests.
- Generic platform/logo fallbacks, registration notifications, Vite dev-host
  handling, shared UI fixes, and canonical public landing resolution.
- The enforced two-label builder taxonomy, including a repaired legacy
  migration that maps the source Course level to `Program`, migrates sections
  as root containers, keeps lessons as direct children, and preserves legacy
  course identity as metadata.
- Current test contracts for section-scoped settings, scoring, curriculum,
  certification serial defaults, and unique Program codes.
- Shared-surface governance documentation and the sequential sync runbook.
- Removal of the obsolete root-level database probe from pytest collection.

## Excluded or retained by boundary decision

- Airads branding, logos, public copy, and public-page redesign work.
- Admissions, campus, inquiry/public workflow, and tenant-specific report
  behavior, including the Airads admissions report implementation.
- Tenant-specific email templates, seed/demo data, domains, and contact data.
- Airads' MUI 9/global Bookman design-system drift; Crossview retains its
  documented MUI 7.2 dependency surface.
- Generated `static/dist` output. The production build was verified, then all
  generated output was restored/removed from the source-only branch.
- Crossview-only regression coverage that provides stricter generic behavior,
  including its immediate quiz-answer submission test, was retained.
- Downstream-only LMS behavior absent from Airads was not treated as a reason
  to change the accepted Airads behavior during this promotion.

## Boundary audit

- Changed files were reviewed against `docs/shared-surface-manifest.md`.
- The generic reports app imports only its shared report registry; no
  admissions report module is registered.
- Added non-documentation lines were scanned for `airads`, `digika`,
  `digikatech`, `wetende`, admissions/campus terms, virtual-campus copy, and
  tenant-logo literals. The scan returned no matches.
- `git diff --name-only origin/main..HEAD -- static/dist` returned no files
  after build cleanup.
- The existing dirty worktrees, stashes, and unrelated user changes in all
  three repositories were left untouched; integration used isolated
  worktrees.

## Verification evidence

All commands ran in the isolated Crossview integration worktree with
`DEBUG=True` and `DJANGO_SECRET_KEY=sync-audit-only` where Django required it.

| Gate | Result |
| --- | --- |
| `python manage.py check` | Passed: `System check identified no issues (0 silenced).` |
| `python manage.py makemigrations --check --dry-run` | Passed: `No changes detected` |
| `pytest -q -x` | Passed: `693 passed, 691 warnings in 1978.89s (0:32:58)` |
| `npm test` | Passed: `23` files, `69` tests in `40.47s` |
| `npm run build` | Passed: `19716` modules transformed; built in `53.06s` |

Focused suites used while resolving integration failures also passed:

- Reports: 9 tests.
- Blueprints: 39 tests.
- Curriculum: 23 tests.
- Legacy assessment suite: 54 tests.
- Certifications: 62 tests.
- Content, practicum, and progression standalone suites: 145 tests.

The remaining output was warning-only: Django 6 constraint deprecations,
factory_boy post-generation deprecations, the absent test `staticfiles`
directory, legacy MUI Grid prop warnings in one frontend test, and stale
Browserslist data during the production build.

## Promotion decision

The reviewed range is accepted for promotion to `crossview/main`. After that
push, this exact canonical range will be propagated sequentially to Airads and
then DigikaTech with each fork's public/branding surface preserved and its full
verification gates rerun.
