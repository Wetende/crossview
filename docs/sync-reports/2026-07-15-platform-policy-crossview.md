# Generic Platform Policy Locks in Crossview — 2026-07-15

## Recorded refs and commit

- Canonical base: `5cfc71c2b6a5bbc8d26e2ed2f91f3d8ffb1652e4`
- Shared policy commit: `9591ed08`
  (`feat(platform): add optional deployment policy locks`)

The shared commit contains no fork identity or public-page implementation. A
fork enables the mechanism with its own `LMS_PLATFORM_POLICY` setting.

## Canonical feature

- Added an opt-in deployment policy for immutable institution identity,
  branding URLs/colors, deployment mode, active blueprint mode, setup state,
  and selected feature flags.
- Kept the canonical engine fully configurable by default: when no policy is
  configured, all capabilities remain enabled and existing behavior is
  unchanged.
- Enforced configured locks in the settings model and service mutation paths,
  including partial model saves.
- Added capability-aware Django admin modules and fields, direct blueprint
  route protection, legacy preset/setup route protection, and active-blueprint
  assignment for program creation.
- Shared effective capabilities and features through the platform payload so
  Inertia navigation and settings UI can remove unavailable controls.
- Retained operational configuration for contact details, currency, course
  levels, program categories, public content, and social links.
- Clarified the non-TVET program form heading as `Course details` while
  retaining `Examining body details` in TVET mode.

## Boundary decisions

- The policy implementation is `shared-engine`; policy values are `fork-only`.
- No institution names, domains, tenant assets, admissions content, or public
  marketing pages were added to the canonical commit.
- No files under `frontend/src/pages/public/` changed.
- Generated `static/dist` output was used only to verify the build and was
  removed from the source diff.

## Verification evidence

| Gate | Result |
| --- | --- |
| `python manage.py check` | Passed: zero issues |
| `python manage.py makemigrations --check --dry-run` | Passed: no changes detected |
| Focused policy/admin/backend regression suite | Passed: `38 passed, 29 warnings in 51.80s` |
| Full `pytest --reuse-db -q` | Passed: `711 passed, 435 warnings in 1707.15s` |
| Full `npm test` | Passed: `25` files, `75` tests in `40.62s` |
| `npm run build` | Passed: `19718` modules transformed; built in `43.44s` |
| Tenant-literal addition scan | Passed with no fork-name matches |
| Public-page boundary audit | Passed: no public-page source changes |
| Generated asset audit | Passed: no `static/dist` diff retained |

Warnings were existing Django 6 constraint deprecations, factory_boy
post-generation deprecations, MUI Grid migration notices, and stale
Browserslist data.

## Propagation decision

Promote `9591ed08` unchanged to Airads and DigikaTech. Airads keeps the default
fully configurable behavior. DigikaTech enables its identity and online-only
product decisions in a separate fork-owned configuration commit.
