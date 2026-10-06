# Migration recovery prepared for canonical LMS acceptance

Date: 2026-10-06. Classification: shared engine.

## Refs and acceptance state

- Canonical base: `88e0da1a89a594ba3e913be21043bd48b6a34790`.
- Reviewed source head: `d5f498a3d4f0f2f22db29248c6a96a75e2d6e7f4` on `fix/recover-migration-20261006`.
- Included commits: `fa8c2e1dde52b6a11c8a04e8d691b5e1dfa28124`, `eedffa1f4332d96413050bcc2a55bb2a3306a2fe`, `d5f498a3d4f0f2f22db29248c6a96a75e2d6e7f4`.
- Canonical acceptance is pending the LMS PR. No main branch was updated.
- AIRADS Virtual carries a corresponding recovery slice in a draft PR and must wait for canonical acceptance. DigikaTech synchronization is pending a later slice.

## Preserved sources and decisions

- Explicit Vite configuration comes from AIRADS Virtual's preserved `d76eaa1d` source snapshot, adapted to LMS settings and development documentation.
- Title handling comes from LMS `3a1ef43f8`; compact player rows from `f3200fdfd`; neutral dark surfaces and regression tests from `06ff93f61`; the MUI mock guard from `49ba39eba`.
- Keep Django's built manifest as the default. Hot reload requires `DEBUG=True` and an explicit `VITE_DEV_SERVER_URL`; production ignores that URL.
- Preserve the institution title when an Inertia page has no explicit title.
- Use neutral charcoal dark surfaces and compact navigation while retaining the existing LMS light palette and brand accents.
- Retain the newer token-based StudyPanel instead of replacing it with an older snapshot.
- Exclude AIRADS public pages, admissions, branding, blog/editor, marketing content, private media and databases, historical notes, generated assets, and old document deletions.
- Branded email and Python/React code-lab snapshots remain separate preserved work; this slice does not implement them.

## Verification

Backend commands used the existing LMS `.venv`, `DEBUG=True`, `DB_ENGINE=sqlite3` and a throwaway test secret. Frontend suites ran after backend completion.

- `manage.py check`: passed.
- `manage.py makemigrations --check --dry-run`: no changes detected.
- `python -m pytest -q`: 1,349 passed.
- `npm test -- --maxWorkers=2`: 112 files and 529 tests passed.
- `npm run build -- --outDir /home/wetende/projects/airads/.recovery/build-lms --emptyOutDir false`: passed; output stays outside tracked assets.
- Changed frontend files: ESLint passed.
- Whole-repository lint: 114 inherited errors and 14 warnings. All 51 files containing errors and the lint configuration match the canonical base; no errors were introduced by this slice.
- `git diff --check`: passed.
- Added executable lines contain no AIRADS or DigikaTech identity or product routes.
- Wetende confirmed the recovered local preview works and authorized commits, feature-branch pushes and PR creation.

## Limits and remaining steps

SQLite checks do not prove production PostgreSQL behavior. No production deployment or external-provider delivery was tested. Merge canonical LMS before making the Virtual draft ready; then synchronize accepted behavior to DigikaTech through its own reviewed change. The Release assets workflow builds tracked assets after merge.
