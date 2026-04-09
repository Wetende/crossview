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

**Pro-Tip: Use AI for Triage**
If you make bulk changes across the Digikatech codebase, do not just `git add .`! 
 *"Look at my uncommitted changes, tell me which ones are generic Crossview features and which ones are Digika-specific, and split them into separate commits for me."* The AI will analyze the diff and generate the exact stage/commit commands needed to protect the sync boundary.

## If Upstream Changes Become Large

Use this safer flow:

```bash
git checkout -b sync/upstream-YYYY-MM-DD
git fetch upstream
git merge upstream/main
```

Resolve conflicts, run tests, then merge that sync branch into `main`.

## Backporting Digika Features to Crossview

If you build a generic feature in `digikatech` and want to easily port it back to `crossview` without waiting for a GitHub pull request, you can link the two local folders directly.

### 1. Set Up the Local Bridge
In your `crossview` terminal, add `digikatech` as a local remote:

```bash
cd /path/to/crossview
git remote add digika /path/to/digikatech
git fetch digika
```

*(Note: `fetch` doesn't alter your Crossview files. It simply downloads the awareness of Digika's commits into Crossview's hidden Git memory.)*

### 2. Cherry-Pick the Feature
Now that Crossview has the blueprint, find the 7-character hash of the commit you want from your Digikatech git history (`git log --oneline`).

Then, manually apply just that commit to Crossview:

```bash
git cherry-pick <commit-hash>
```

Because `cherry-pick` is a 100% manual process, you have complete surgical control over what comes over. You can confidently pick commits that contain generic platform improvements and ignore the commits that contain Digika-specific branding or templates!

