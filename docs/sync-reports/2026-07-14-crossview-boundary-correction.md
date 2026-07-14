# Crossview Fork-Boundary Correction — 2026-07-14

## Recorded ref

- Canonical base: `Wetende/crossview` `main` at
  `7f225cd354ae21a1e9c78821ee966d24a580e680`
- Classification: canonical governance correction
- Production migrations executed before correction: none

## Finding

A post-promotion audit found that the Airads-to-Crossview merge had retained an
orphan Airads public/admissions block in `apps/core/views.py` together with the
fork-only campus and admissions models. Crossview exposed none of those views
through its URL configuration, but their presence violated the shared-surface
manifest and made the canonical model and migration state tenant-specific.

## Correction

- Removed the orphan public, campus, virtual-site, and admissions view helpers.
- Removed the fork-only campus and admissions models from Crossview runtime
  state.
- Removed the two newly promoted fork-only migrations before any production
  migration execution.
- Rebased the next canonical core migration on
  `core.0014_program_performance_indexes`, preserving a complete generic graph.
- Left Airads ownership unchanged; its admissions implementation remains a
  fork-only feature and must not receive this deletion as a downstream patch.
- DigikaTech already excluded this surface during its reviewed upstream merge,
  so no downstream repair was required there.

## Verification

| Gate | Result |
| --- | --- |
| Runtime tenant/admissions scan | No canonical code matches |
| `python manage.py check` | Passed: zero issues |
| `python manage.py makemigrations --check --dry-run` | Passed: no changes detected |
| `python manage.py showmigrations core --plan` | Passed: complete graph from `0014` to `0017` |
| Focused public/auth regression suite | Passed: `32 passed, 54 warnings in 137.35s` |
| `git diff --check` | Passed after EOF normalization |

This correction is intentionally committed before the generic inquiry app so
that inquiry behavior is built on neutral domain concepts and can be propagated
without importing or deleting any fork's admissions workflow.
