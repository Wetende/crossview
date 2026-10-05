# Migration handoff — Neutral dark theme prototype

Saved on 6 October 2026 for moving to another machine. **This branch preserves unfinished work; it is not a production acceptance or merge approval.**

## Starting point

- Original checkout: `lms-dark-theme`
- Original branch: `fix/dark-theme-neutrals`
- Original HEAD / snapshot base: `b94a468c4fede86ad5eda75d695a2032bcf615ee`
- Migration branch: `migration/2026-10-06/lms-dark-theme`
- Scope: existing dirty state only; existing stashes and other local branches were not applied or rewritten.

## Preserved work

Shared engine: study panel, dashboard sidebar, palette/color utilities and new tests. Review current-main overlap, then promote downstream sequentially.

The original source bytes/deletions are preserved. Source and existing compiled output use separate commits where both exist. No application refactor or feature completion was performed as part of this snapshot.

## Checks actually run

- npm test -- frontend/src/theme/palette.test.js frontend/src/theme/utils/colorUtils.test.js frontend/src/layouts/DashboardLayout/DashboardSidebar.test.jsx: 8 passed, exit 0.
- JavaScript/JSX/TypeScript parser: 7 files parsed; 0 errors.
- Original git diff HEAD --check: exit 0 (passed).
- Hashes of the original working files were checked against a private local snapshot before any Git mutation.
- Full application tests, production builds, browser flows, migration execution and production-release review were not completed. Do not infer that passing syntax/focused checks covers those gates.

## After cloning

This local branch must be pushed to an approved remote before a GitHub clone can retrieve it. After publication:

```bash
git fetch origin
git switch --track origin/migration/2026-10-06/lms-dark-theme
```

Read this note, compare the preserved change against the latest integration branch, and select/review source commits. Do not blindly merge the entire historical branch. Refresh builds using the destination revision/dependencies. For shared LMS code, accept canonical LMS first and propagate to AIRADS Virtual/DigikaTech sequentially. Main/integration branches were not advanced by the snapshot operation.

## Files requiring separate transfer

The private original-state snapshot is in the old machine folder `migration-cleanup-2026-10-06/original-state/lms-dark-theme`. It is not uploaded or included by cloning. Preserve relevant .env files, databases, media, stashes, ignored source/docs and other local branches separately.

## Exact original source paths

- `frontend/src/features/course-player/components/Tools/StudyPanel.jsx`
- `frontend/src/layouts/DashboardLayout/DashboardSidebar.jsx`
- `frontend/src/theme/palette.js`
- `frontend/src/theme/utils/colorUtils.js`
- `frontend/src/theme/utils/colorUtils.test.js`
- `frontend/src/layouts/DashboardLayout/DashboardSidebar.test.jsx`
- `frontend/src/theme/palette.test.js`

## Exact original compiled-output paths
