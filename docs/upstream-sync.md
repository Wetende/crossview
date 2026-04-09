# Upstream Sync Guide (Digika Fork)

This repository (`Wetende/digikatech`) is a forked product line.

- `origin` points to `Wetende/digikatech` (where we push Digika work)
- `upstream` points to `Wetende/crossview` (where we pull shared LMS updates)

## One-Time Remote Check

```bash
git remote -v
```

Expected:

```text
origin   git@github.com:Wetende/digikatech
upstream git@github.com:Wetende/crossview.git
```

## Recommended Branch Flow

1. Keep `main` clean and deployable.
2. Build each change in a short-lived feature branch from `main`.
3. Merge feature branch to `main` after review/tests.
4. Pull from `upstream/main` on a regular schedule (weekly is ideal).

## Sync Upstream Into Digika

```bash
git checkout main
git fetch upstream
git merge upstream/main
```

Then run checks before pushing:

```bash
source .venv/bin/activate
python manage.py check
python manage.py migrate
pytest -q
npm run test -- --run
```

If all good:

```bash
git push origin main
```

## Conflict Strategy

When merges conflict, keep this boundary:

- Digika-specific surface:
  - Public pages (`frontend/src/pages/public`)
  - Public branding/copy/assets
- Shared core surface:
  - Dashboard, player, builder, assessments, enrollment, certifications
  - Django domain logic/models/services

If a change can help every LMS deployment, keep it generic and upstream-friendly.

## Commit Hygiene (Important)

Do not mix these in one commit:

- generic LMS/core improvements
- Digika-only branding/public-page customization

Split them into separate commits. This keeps future upstream merges and cherry-picks manageable.

## If Upstream Changes Become Large

Use this safer flow:

```bash
git checkout -b sync/upstream-YYYY-MM-DD
git fetch upstream
git merge upstream/main
```

Resolve conflicts, run tests, then merge that sync branch into `main`.

