# Airads learning experience promotion to LMS

## Frozen refs

- Airads source base: `f110616ae3f0ffb30a47c92bcbd05495b075a2b9`
- Airads source head: `147e108c7fc123b66edad57185fb36e4b45b2fcb`
- LMS destination base: `efb57016dfef465c22cedd58aeff1837164e4028`
- LMS `origin/main` at freeze: `bf7e6002923af92d3f2c811c00cefb36beba5574`
- Airads `origin/main` at freeze: `f110616ae3f0ffb30a47c92bcbd05495b075a2b9`
- DigikaTech `origin/main` at freeze: `45de28f5f092e9395bcb36d5e0a989176a964e1f`
- Integration branch: `promote/learning-experience-ui-20260723`

## Included shared work

The four reviewed Airads learning-experience commits were replayed sequentially
as canonical LMS commits:

- `f9148dc9` prioritizes enrolled and in-progress learning on learner dashboards.
- `73813a42` adds a focused enrolled-course overview and navigation model.
- `a5fd1996` adds guided question navigation, answer review and attempt history.
- `5405a91e` adds derived unit-completion journeys without storing duplicate
  completion state.
- `9c8af82d` hardens the shared tests for the accessible question label and
  removes a fixed-date dependency from the scheduled-session fixture.

## Reconciliation and product boundaries

- Retained the current LMS role-based dashboard entry point and green visual
  identity.
- Integrated the shared current-learning experience inside the existing student
  dashboard component instead of replacing the complete dashboard.
- Kept the new learning components driven by MUI theme tokens so downstream
  products retain their own palettes.
- Preserved existing routes and public interfaces; the program launch resolver
  is additive.
- Excluded generated source-worktree bundles, Airads portal work, product
  configuration, branding, domains and public pages.
- An added-line source scan found no Airads, DigikaTech, campus, admissions or
  product-domain literals in the promoted range.

## LMS verification

Environment: `DEBUG=True`, `DJANGO_SECRET_KEY=sync-audit-only`.

- `git diff --check`: passed.
- Focused ESLint and learning-experience Vitest checks: passed.
- Django system check: passed with zero issues.
- Migration drift check: passed; no changes detected.
- Full frontend suite: **58 files passed, 152 tests passed**.
- Full backend suite: **839 passed, 939 warnings in 29m20s**.
- Production Vite build: passed.

The production `static/dist` output is committed separately from shared source
and documentation changes.
