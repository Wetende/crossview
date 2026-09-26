# Airads Google Meet attendance promotion to LMS — 2026-08-24

## Scope and lineage

- Source repository: `/home/wetende/Projects/airads`
- Source base: `1d5b01a9`
- Source integration branch: `feature/google-meet-attendance-cleanup-20260824`
- Canonical repository: `/home/wetende/Projects/lms`
- Canonical base: `b94a468c`
- Canonical integration branch: `promote/airads-google-meet-attendance-20260824`

The complete dependency chain was promoted because canonical LMS and
DigikaTech did not yet contain Airads' first-class Google Meet lesson work.
Product documentation and generated Airads assets were not promoted.

| Airads source | Canonical LMS | Purpose |
| --- | --- | --- |
| `cc2fcee7` | `802980ef` | First-class Google Meet lesson type |
| `e66b8411` | `3605f00a` | Simplified Meet lesson editor |
| `2b0f5849` | `7fd48665` | Calendar capability reconciliation |
| `3041bc48` | `5dd3e0e0` | Incremental OAuth grants |
| `9fdd21e6` | `930cbf0c` | Connection-state infrastructure |
| `194274b3` | `f1effcba` | OAuth callback failure state |
| `5ee9cba8` | `6d3b4965` | Validated expanded grants |
| `2e7e61df` | `505105cb` | Create Meet when a lesson is saved |
| `19f32e21` | `b8b0d692` | Learner Meet renderer on resume |
| `1d5b01a9` | `cc56cd42` | Organizer email notification |
| `c1123ad5` | `a3706b36` | Gradebook attendance and frontend cleanup |

Canonical follow-up commits:

- `7097b441` makes shared OAuth and Meet UI wording product-neutral.
- `a24bbab7` restores server logging for optional attendance identity failures
  exposed by the promoted auth regression tests.

Excluded source commits:

- `9a5b49be`: Airads-only production documentation.
- `524bb745`: generated Airads frontend assets.
- Airads' unrelated `.docx_work/` and `.tmp_bryson_ch4_render/` directories.

## Boundary decisions

- Google Meet lessons remain the only teacher-facing creation workflow.
- The duplicate Live Classes builder frontend is removed, while the
  `live_sessions` backend remains the scheduling, synchronization, attendance,
  recording, and audit engine.
- Verified attendance is reviewed in the course Gradebook.
- Calendar invitations remain distinct from provider-verified attendance.
- Existing instructor overrides remain authoritative and audited.
- Shared code contains no Airads domain, campus, admissions, or product-name
  literals. Airads production troubleshooting remains in its fork-owned docs.
- DigikaTech must receive the canonical engine separately while preserving its
  self-paced delivery policy and hiding synchronous lesson authoring UI.

## Verification evidence

All Django commands used `DEBUG=True` and
`DJANGO_SECRET_KEY=sync-audit-only`.

| Gate | Result |
| --- | --- |
| `python manage.py check` | Passed: zero issues |
| `python manage.py makemigrations --check --dry-run` | Passed: no changes detected |
| Focused auth regression suite | Passed: `31 passed` |
| Full `pytest -q` | Passed: `868 passed, 619 warnings in 1718.57s` |
| Isolated frontend regression rerun | Passed: `2` files, `6` tests |
| Full `npm test -- --testTimeout=10000` | Passed: `71` files, `193` tests in `141.84s` |
| `npm run build` | Passed: `19,778` modules transformed; built in `37.66s` |
| Tenant-literal addition scan | Passed: no tenant-specific additions |
| Generated asset audit | Passed: no `static/dist` changes retained |

The first frontend run used Vitest's five-second default and two unrelated
resource-heavy tests timed out. Both passed alone, and the complete suite
passed with a ten-second per-test timeout. Remaining backend output was
warning-only.

## Propagation

After canonical acceptance, propagate the functional canonical range
`802980ef..a24bbab7` sequentially into Airads and DigikaTech. Record each
destination hash, keep product-only UI and generated assets in separate
commits, and do not update remotes until the user explicitly requests a push.
