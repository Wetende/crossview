# DigikaTech dashboard reskin to LMS

## Scope

- Source repository: `/home/wetende/Projects/digikatech`
- Source commit: `9440899` (`feat(digikatech): reskin authenticated dashboards`)
- Destination repository: `/home/wetende/Projects/lms`
- Destination base: `2c3d922b`
- Integration branch: `sync/digika-dashboard-reskin-20260723`

The authenticated dashboard shell and the student, instructor, and administrator dashboard presentations were promoted into LMS. Existing routes, permissions, feature gates, Inertia props, and backend behavior were retained.

## Product adaptation

- Replaced DigikaTech logo and name literals with an LMS-owned school mark and LMS identity.
- Set the LMS shell and dashboard palette to fixed greens: primary `#166534`, dark `#14532D`, and bright accent `#22C55E`.
- Retained the complementary LMS dark theme and the existing platform palette override capability outside the fixed authenticated shell.
- Did not promote DigikaTech assets, generated bundles, product policy, or deployment configuration.

## Verification

- `git diff --check`: passed.
- Scoped ESLint for all promoted dashboard, layout, navigation, and theme files: passed.
- Focused Vitest dashboard/layout/color suite: 13 passed.
- Django system check: passed.
- Migration drift check: passed; no changes detected.
- Full Django suite: 837 passed, 943 existing warnings.
- Full Vitest suite: 139 passed, 1 failed. The failure is the pre-existing date-sensitive `ScheduledSessionRenderer` test whose fixed July 21, 2026 session is now in the past; the same failure was reproduced on untouched LMS `main`.
- Production Vite build: passed; 19,751 modules transformed.
- Tenant literal scan of promoted source for DigikaTech names and palette values: clean.

Generated `static/dist` output is committed separately from source changes.
