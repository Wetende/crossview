# Airads LMS Maturity Promotion — 2026-07-21

## Frozen refs

- Airads source base: `c4974a71d00794738bd7fe3489123803282d45a8`
- Airads source head: `744550ff1408997a3747fdae3d3064ca5061d164`
- LMS destination base: `db2f3286f6fbbaee8cf3fc2cf12dc474a5766bdc`
- LMS reviewed head before this report: `a029c2ac`
- LMS `origin/main` at freeze: `ed0184818bb29b802cb0bed5598c44ce776b5bdf`
- Airads `origin/main` at freeze: `4937c6f55603057cb4d2a6b2df6a072055dd0085`
- DigikaTech `origin/main` at freeze: `f503ecf29e982b2366ac51ed7e97f3c658c7ba58`

The canonical local repository was renamed from
`/home/wetende/Projects/crossview` to `/home/wetende/Projects/lms`. The GitHub
remote retains its historical `Wetende/crossview` slug.

## Included shared work

The promotion includes course delivery and learning operations, learner
management, question banks and dynamic pools, scheduled pricing, engagement
automation, gamification, Google Classroom, scheduled sessions, native Google
Meet lessons, the delivery-aware course player, gradebook/manual grading
improvements, obsolete learning-route consolidation, and the authenticated
wishlist workspace.

The Airads commits were replayed sequentially into LMS. Conflicts were resolved
in favor of LMS public surfaces while retaining shared pricing, notification,
activity-progress and learner-operation behavior. Canonical follow-up fixes:

- `cb75feb6` exposes the learner detail Drawer as an accessible modal dialog.
- `a029c2ac` removes a duplicate public course price formatter introduced while
  combining the LMS and Airads pricing implementations.
- `15209aad` removes a stray Airads admissions dependency from the generic
  checkout and adds a render regression test. Airads retains its legitimate
  product-owned admissions checkout behavior.

## Exclusions

- `cfd8903e` remains Airads-only because it changes the Airads DevOps demo/test
  course seed weights.
- `744550ff` was not promoted wholesale. Its Airads admissions, program-interest
  flow, event views, event public pages and enrollment-route replacement remain
  Airads-only.
- Only the product-neutral authenticated wishlist workspace was extracted from
  `744550ff` as canonical commit `9ba52da5`.
- Generated `static/dist` bundles and unrelated local artifacts were excluded.

An added-line scan of the promoted source range found no Airads, DigikaTech,
campus, admissions, product-domain or branded-asset literals in canonical
shared code.

## LMS verification

Environment: `DEBUG=True`, `DJANGO_SECRET_KEY=sync-audit-only`.

- `manage.py check`: passed, zero issues.
- `manage.py makemigrations --check --dry-run`: passed, no changes detected.
- Full backend suite: **829 passed**, 945 warnings, 28m40s.
- Full frontend suite after the accessibility correction: **49 files passed,
  129 tests passed**, 58.33s.
- Production frontend build after the pricing correction: passed; 19,747
  modules transformed in 38.41s.
- Generic checkout render regression test after the downstream portability
  scan: passed, 1 test.
- Google Classroom, Calendar/Meet and live-session tests used mocked adapters.
  A real Google sandbox journey remains a separate credential-dependent gate.

The production build regenerated `static/dist` only for verification; generated
assets were removed from the source diff afterward.

## Promotion status

This report records the reviewed local integration. No remote branch was
pushed as part of this run. After the report commit, the reviewed LMS range is
the authoritative source for downstream Airads and DigikaTech synchronization.
