# AIRADS DataTable row-selectability promotion — 2026-09-26

## Scope and lineage

- Source repository: AIRADS Virtual Campus
- Source mixed commit: `1a7af7336d24a179a15ece8a286c75b58b559bb0`
- Canonical LMS base: `67250433cd1a7c81a0907c3203e9d946d9925322`
- Canonical LMS commit: `e40dc93b7b883cbdfeb2fcf89062c5ca7a5bc819`
- Canonical branch: `feature/ai-connector-shared-20260926`

The reusable `DataTable` now accepts an `isRowSelectable` predicate. Select
all, direct row clicks, checkbox state, disabled state, and row cursor behavior
all respect that predicate while retaining the previous all-rows-selectable
default.

## Boundary decision

Only the generic component behavior was extracted from the mixed AIRADS
commit. AIRADS admissions models, views, reports, pages, campus rules,
configuration, templates, and generated `static/dist` assets were excluded.
Added source and test lines contain no AIRADS, DigikaTech, admissions, campus,
domain, or branded-asset literals.

## Verification evidence

| Gate | Result |
| --- | --- |
| Regression test before implementation | Failed as expected: 3 tests failed |
| Focused DataTable Vitest after implementation | Passed: 1 file, 3 tests |
| New test-file ESLint | Passed |
| `npm run build` | Passed: 19,785 modules transformed; built in 3m 51s |
| `git diff --check` | Passed |
| Generated asset audit | Passed: no `static/dist` changes retained |

The existing component-level ESLint warning for the unused `loading` prop
predates this promotion and was not widened into an API change. No full
repository suite was run because the user requested focused verification for
small features. No remote update, pull request, merge, deployment, or
production change was performed.
