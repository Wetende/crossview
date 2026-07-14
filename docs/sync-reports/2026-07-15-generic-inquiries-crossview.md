# Generic Inquiry Intake in Crossview — 2026-07-15

## Recorded refs and commits

- Canonical base: `7f225cd354ae21a1e9c78821ee966d24a580e680`
- Boundary correction: `fe29a725` (`fix: restore canonical shared-engine boundary`)
- Shared inquiry feature: `3d043cd0` (`feat: add generic inquiry intake workflow`)
- Crossview-only public wiring: `9f49039e`
  (`feat(public): connect contact form to inquiry intake`)

The three commits are deliberately separate. Downstream forks receive the
shared inquiry commit, while their public pages and recipient configuration
remain fork-owned.

## Canonical feature

- Added a neutral `Inquiry` model with contact details, inquiry kind, optional
  published-program linkage, submitter attribution, staff status/notes,
  resolution audit fields, and notification delivery state.
- Added Django admin search, filters, and explicit in-progress, resolved, and
  spam actions.
- Added a CSRF-protected `POST /api/inquiries/` endpoint supporting JSON and
  form bodies, camelCase aliases, validation errors, and a honeypot field.
- Added internal email routing using `INQUIRY_NOTIFICATION_EMAIL` first and
  `PlatformSettings.contact_email` as the canonical fallback.
- Preserved the saved inquiry when email delivery fails and recorded the
  failure for staff rather than returning a false submission failure.
- Added a direct-import frontend API client and reusable React submission hook
  with loading, field-error, success, failure, and reset states.
- Documented the API and updated the shared-surface manifest.

## Boundary decisions

- The prior Airads enrollment-interest promotion branch was not used because
  it stored questions as admissions applications and modified a public page.
- The canonical cleanup removed the accidentally retained Airads campus,
  virtual-site, and admissions runtime/migration surface before the inquiry
  model was introduced. No production migration had run from that surface.
- Airads keeps its admissions domain and must not receive the cleanup deletion.
- DigikaTech already excluded the same contamination during its reviewed LMS
  merge, so it requires only the shared inquiry commit.
- Crossview's contact page wiring is a separate public-surface commit and is
  not a template for downstream markup.
- Tenant-specific recipients, copy, and page design are not part of the shared
  feature.

## Verification evidence

All Django commands used `DEBUG=True` and
`DJANGO_SECRET_KEY=sync-audit-only` in the isolated Crossview worktree.

| Gate | Result |
| --- | --- |
| `python manage.py check` | Passed: zero issues |
| `python manage.py makemigrations --check --dry-run` | Passed: no changes detected |
| Boundary-correction regression set | Passed: `32 passed, 54 warnings in 137.35s` |
| Focused inquiry backend suite | Passed: `12 passed, 16 warnings in 70.55s` |
| Full `pytest -q` | Passed: `705 passed, 697 warnings in 1189.60s (0:19:49)` |
| Focused inquiry Vitest suite | Passed: `2` files, `5` tests |
| Full `npm test` | Passed: `25` files, `74` tests in `21.06s` |
| Inquiry/frontend ESLint | Passed with no findings |
| Inquiry/frontend Prettier check | Passed |
| `npm run build` | Passed: `19718` modules transformed; built in `27.39s` |
| Tenant-literal addition scan | Passed with no shared-code matches |
| Generated asset audit | Passed: no `static/dist` diff retained |

The remaining output was warning-only: existing Django 6 constraint
deprecations, factory_boy post-generation deprecations, the absent test
`staticfiles` directory, existing MUI Grid migration warnings, and stale
Browserslist data.

## Propagation decision

After this canonical head is pushed, cherry-pick `3d043cd0` into Airads and
DigikaTech. Add each fork's public form wiring and recipient configuration in a
separate local commit, run that repository's full gates, and only then update
its remote main.
