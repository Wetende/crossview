# Sequential Shared-Engine Sync Runbook

Use this runbook when shared work originates in `airads` or another fork.
Promotion is sequential: source fork, then canonical `lms`, then each downstream
fork. Do not implement the same shared change independently in parallel.

## 1. Freeze and Inventory

1. Fetch every relevant remote and record the source and destination refs.
2. Record dirty files, worktrees, and stashes without modifying them.
3. Create isolated integration worktrees from the exact refs being audited.
4. Classify every source change with `shared-surface-manifest.md`.

## 2. Promote into LMS

1. Apply shared commits or individual mixed-file hunks without
   `static/dist/`.
2. Resolve shared files to the source behavior unless that would import a
   fork-only extension or violate the canonical LMS dependency stack.
3. Search added lines for tenant names, domains, admissions/campus copy, and
   hardcoded assets.
4. Commit small, reviewable units on the integration branch.

## 3. LMS Gates

Run with the repository's own virtual environment and a non-production test
secret. `DEBUG=True` is required by this test configuration so HTTP assertions
do not become HTTPS redirects.

```bash
env DEBUG=True DJANGO_SECRET_KEY=sync-audit-only \
  venv/bin/python manage.py check
env DEBUG=True DJANGO_SECRET_KEY=sync-audit-only \
  venv/bin/python manage.py makemigrations --check --dry-run
env DEBUG=True DJANGO_SECRET_KEY=sync-audit-only \
  venv/bin/pytest -q
npm test
npm run build
```

`npm test` already invokes Vitest with `--run`; do not append another `--run`.
Restore generated build output before the source commit unless a separate
artifact commit is explicitly planned.

## 4. Update the Canonical Branch

1. Re-fetch the remote and confirm its target ref has not moved.
2. Write `docs/sync-reports/YYYY-MM-DD-source-to-lms.md` with the refs,
   decisions, and exact gate results.
3. Update the reviewed canonical `lms/main` branch.

## 5. Propagate Downstream

For each fork, in order:

1. Start from the fork's current reviewed main ref in an isolated worktree.
2. Merge or cherry-pick the accepted LMS range.
3. Resolve fork-only boundaries in favor of the fork while preserving the
   canonical shared behavior.
4. Run that fork's complete backend, frontend, build, and tenant-boundary gates.
5. Record a fork sync report and update its remote main.

After propagation, shared behavior is changed in `lms` first. Fork-only
extensions remain in their owning repository.
