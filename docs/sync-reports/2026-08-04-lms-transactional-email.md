# LMS Transactional Email Framework

Date: 2026-08-04

## Frozen refs

- Classification: mixed rollout, split into shared-engine and product-owned work
- Canonical LMS base: `201b5d34`
- Accepted shared commit: `fa200f98`
- LMS integration branch: `feature/branded-email-framework`
- DigikaTech destination base: `3b32d2c7`
- Airads: explicitly excluded from this rollout

## Canonical implementation

- Configured Django Anymail with the Brevo transactional API and a
  development-only console fallback.
- Made production startup fail closed when `BREVO_API_KEY`,
  `DEFAULT_FROM_EMAIL`, or `PLATFORM_PUBLIC_BASE_URL` is missing.
- Added one multipart renderer and delivery interface for notifications,
  grouped digests, password resets, course invitations, and inquiry alerts.
- Derived the default identity, logo, palette, and reply-to address from
  `PlatformSettings`, with safe absolute URLs, escaped content, readable color
  contrast, and an institution-name fallback when no logo is available.
- Preserved notification preferences, outbox idempotency, digest grouping, and
  retry scheduling.
- Kept the announcement creation signal as the only delivery trigger and
  removed duplicate delivery loops from instructor and administrator views.
- Documented deployment variables and the five-minute outbox and daily
  engagement cron entries. No database migration was introduced.

## Ownership boundaries

- The shared renderer, delivery behavior, event wording, default dynamic
  layout, and tests are canonical LMS behavior.
- Product layouts, product names, fixed palettes, fixed sender defaults, and
  stable product logos remain fork-owned.
- The added-line shared-source scan found no Airads or DigikaTech product
  literals. Product-name assertions occur only in tenant-neutral regression
  tests.
- Airads' repository, configuration, templates, notification implementation,
  and in-progress certificate work were not modified.
- The production build emitted to a temporary directory; no generated
  `static/dist` changes were retained.

## LMS verification

Environment used `DEBUG=True` and a non-production test secret where Django
startup required them.

| Gate | Result |
| --- | --- |
| `manage.py check` | Passed, zero issues |
| `manage.py makemigrations --check --dry-run` | Passed, no changes detected |
| Full backend pytest | Passed: 872 tests in 1542.79 seconds |
| Final email/auth/inquiry/invitation pytest subset | Passed: 78 tests in 102.77 seconds |
| Full Vitest suite | Passed: 67 files and 176 tests |
| Temporary-output production Vite build | Passed: 19,775 modules transformed |
| `git diff --check` | Passed |

Warnings were limited to existing Django constraint deprecations,
factory_boy post-generation notices, and the isolated worktree's absent
`staticfiles` collection directory.

## Promotion decision

Treat `fa200f98` as the authoritative shared implementation. Promote it to
DigikaTech, resolve only its settings/public-view boundary differences, then
add the DigikaTech layout, sender defaults, and stable logo in a separate
product-owned commit. Do not propagate this rollout to Airads.
