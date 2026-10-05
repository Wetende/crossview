# Migration handoff — Curriculum terminology test work

Saved on 6 October 2026 for moving to another machine. **This branch preserves unfinished work; it is not a production acceptance or merge approval.**

## Starting point

- Original checkout: `lms-slotprops-fix`
- Original branch: `fix/curriculum-tree-slotprops`
- Original HEAD / snapshot base: `aec82cb82108dc302ddf492eb05d3f3a65419c27`
- Migration branch: `migration/2026-10-06/lms-slotprops-fix`
- Scope: existing dirty state only; existing stashes and other local branches were not applied or rewritten.

## Preserved work

Shared engine: modified CurriculumTree tests. Preserve the tests; verify matching canonical runtime behavior before integrating.

The original source bytes/deletions are preserved. Source and existing compiled output use separate commits where both exist. No application refactor or feature completion was performed as part of this snapshot.

## Checks actually run

- npm test -- frontend/src/features/course-builder/components/CurriculumTree.test.jsx: 3 passed, exit 0.
- JavaScript/JSX/TypeScript parser: 1 files parsed; 0 errors.
- Original git diff HEAD --check: exit 0 (passed).
- Hashes of the original working files were checked against a private local snapshot before any Git mutation.
- Full application tests, production builds, browser flows, migration execution and production-release review were not completed. Do not infer that passing syntax/focused checks covers those gates.

## After cloning

This local branch must be pushed to an approved remote before a GitHub clone can retrieve it. After publication:

```bash
git fetch origin
git switch --track origin/migration/2026-10-06/lms-slotprops-fix
```

Read this note, compare the preserved change against the latest integration branch, and select/review source commits. Do not blindly merge the entire historical branch. Refresh builds using the destination revision/dependencies. For shared LMS code, accept canonical LMS first and propagate to AIRADS Virtual/DigikaTech sequentially. Main/integration branches were not advanced by the snapshot operation.

## Files requiring separate transfer

The private original-state snapshot is in the old machine folder `migration-cleanup-2026-10-06/original-state/lms-slotprops-fix`. It is not uploaded or included by cloning. Preserve relevant .env files, databases, media, stashes, ignored source/docs and other local branches separately.

## Exact original source paths

- `frontend/src/features/course-builder/components/CurriculumTree.test.jsx`

## Exact original compiled-output paths
