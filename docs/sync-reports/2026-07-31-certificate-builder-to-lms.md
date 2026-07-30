# Certificate Builder Promotion to LMS

Date: 2026-07-31

## Scope

- Classification: shared engine
- Canonical repository: LMS
- Reviewed base: `013fe90b538a0c8db66131f955269e453738d572`
- Reviewed source/build head: `e4ed897f`
- Included range: `013fe90b..e4ed897f` (24 commits)
- Destination before promotion: `main` and `origin/main` at
  `013fe90b538a0c8db66131f955269e453738d572`

The range adds the generic visual certificate builder, template assignment,
automatic issuance, PDF rendering, verification data, course-builder template
selection, and final Inertia navigation corrections. Production assets are
isolated in dedicated `build(lms)` commits.

## Ownership and exclusions

- No Airads or DigikaTech public pages, branding, deployment settings, or
  product assets are included.
- The added-line product-literal scan found only intentional Airads and
  DigikaTech synchronization checklist references in certificate planning
  documentation.
- Local `.playwright-cli/` and `output/` browser artifacts remain untracked and
  are excluded.
- The final Vite build reproduced the committed `static/dist` tree without
  tracked changes.

## Verification

Run from `/home/wetende/Projects/lms-certificate-builder` with
`DEBUG=True` and `DJANGO_SECRET_KEY=sync-audit-only` where applicable.

| Gate                                         | Result                         |
| -------------------------------------------- | ------------------------------ |
| `manage.py check`                            | Passed, 0 issues               |
| `manage.py makemigrations --check --dry-run` | Passed, no changes detected    |
| Full pytest suite                            | Passed, 862 tests              |
| Full Vitest suite                            | Passed, 67 files and 176 tests |
| `npm run build`                              | Passed in 27.50 seconds        |
| Generated manifest JSON parse                | Passed                         |
| Source `git diff --check`                    | Passed                         |

The pytest run reported 951 existing warnings, including the isolated
worktree's missing `staticfiles/` collection directory; there were no test
failures.

### Downstream compatibility follow-up

Airads verification found that MUI Icons 9 no longer exports
`PersonOutline`. The shared element library now uses the cross-version
`Person` icon instead:

- Source correction: `a3998e9c`
- Rebuilt LMS assets: `9abbf096`
- Focused certificate frontend tests: 5 passed
- Full Vitest suite with a 10-second per-test timeout: 67 files and 176 tests
  passed
- Production build: passed in 33.79 seconds

Two default-timeout full-suite attempts each reported a different unrelated
five-second jsdom timeout with 175 tests passing. Both timed-out tests passed
individually, and the unfiltered 10-second-timeout run passed completely.

Airads' production build then identified one additional MUI 9 compatibility
gap: `DeleteOutline` is unavailable there. The builder now uses the
cross-version `Delete` icon:

- Source correction: `a285eee7`
- Rebuilt LMS assets: `e4ed897f`
- Focused builder tests: 4 passed
- Production build: passed in 43.43 seconds

## Promotion order

1. Fast-forward LMS `main` to the reviewed certificate-builder branch.
2. Treat the resulting LMS commit as authoritative.
3. Synchronize LMS into Airads and verify Airads.
4. Synchronize LMS into DigikaTech and verify DigikaTech while preserving its
   online self-paced product lock and public surface.
