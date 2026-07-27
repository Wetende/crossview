# Airads to LMS rich-text editor promotion

## Refs

- Source repository: `/home/wetende/Projects/airads`
- Source branch: `feature/rich-text-editor-authoring-tools`
- Source base: `a4d3980dacfaefa11472251fa2908faf8fa2345f`
- Source commits:
  - `92a0b1e327f0b5c0a66057c288c6d7b1d1961f27` — `feat(editor): expand rich text authoring tools`
  - `82d11598656274054cde4de15c86bef03b37c622` — `refactor(editor): move image controls into toolbar`
- Destination repository: `/home/wetende/Projects/lms`
- Destination base: `104f5f411de03e089d19b2ae305ac1d0a4e35fa7`
- Destination branch: `promote/airads-rich-text-editor-20260727`
- Promoted commits:
  - `a42fa7b5c23861358b2557402cbe54074278acba` — `feat(editor): expand rich text authoring tools`
  - `8d1c0c055070f16deeee50140670ff2d50a2390a` — `refactor(editor): move image controls into toolbar`

## Classification and boundaries

- Classification: `shared-engine`.
- Included: the shared rich-text editor, toolbar and dialogs, learner-side rich-text rendering, image serialization/rendering utilities, focused tests, Albert Sans editor-content font assets, and required Tiptap extensions.
- Excluded: Airads public pages, branding, admissions/campus content, tenant-specific configuration, unrelated source commits, and generated `static/dist/` assets.
- The `frontend/src/main.jsx` conflict was resolved by retaining canonical LMS routing and its existing config import while adding only the Albert Sans font asset imports.
- The LMS MUI 7 dependency stack was retained; the promotion added only the editor dependencies from the source commits.

## Tenant-literal scan

Command:

```bash
git diff --unified=0 104f5f41..8d1c0c05 |
  sed -n 's/^+//p' |
  rg -ni 'airads|digika|crossview|wetende|masterstudy|stylemixthemes|campus|admissions?'
```

Result: no matches.

## Verification

- `env DEBUG=True DJANGO_SECRET_KEY=sync-audit-only venv/bin/python manage.py check`
  - Passed: `System check identified no issues (0 silenced).`
- `env DEBUG=True DJANGO_SECRET_KEY=sync-audit-only venv/bin/python manage.py makemigrations --check --dry-run`
  - Passed: `No changes detected`.
- `env DEBUG=True DJANGO_SECRET_KEY=sync-audit-only venv/bin/pytest -q`
  - Passed: 839 tests in 1261.00 seconds.
- `npm test`
  - Passed: 60 test files and 159 tests in 83.73 seconds.
- `npm run build`
  - Passed with Vite 7.3.1: 19,766 modules transformed and production bundles emitted in 30.05 seconds.

Dependency installation used `npm ci --legacy-peer-deps`. A plain `npm ci`
reproduced the existing LMS `main` mismatch between
`@mui/icons-material@7.3.7` and the pinned `@mui/material@7.2.0`; the promoted
range does not change any MUI dependency.

## Workspace confirmation

- Generated `static/dist/` output was restored to the destination commit and new build artifacts were removed after the successful build.
- No unrelated dirty work or stashes were modified.
- No remote branch was pushed.
