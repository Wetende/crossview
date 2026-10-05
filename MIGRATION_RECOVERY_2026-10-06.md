# LMS machine migration recovery — 6 October 2026

Recovery package: Desktop/Migration-Handover-2026-10-06/lms.
Original checkout: `/home/wetende/Projects/lms`.
Original branch: `main` at `88e0da1a89a594ba3e913be21043bd48b6a34790`.
This handover branch preserves local work and restore guidance. No publishing,
feature acceptance, shared-engine propagation, PRs, merges or deployment are
performed as part of this migration backup.

## Recover Git history and worktrees

Clone the package repository.bundle for all local branches and history. If using
a GitHub clone, fetch refs from that bundle; local migration branches are unpushed.
Original refs, stashes and reflog objects are retained. The source repository
remains intact. Recreate worktrees from the recorded branches/commits rather than
copying stale .git pointer files. Restore private files selectively from worktree-files.zip.
The package inventory records all registered worktrees, including missing ones.
Missing worktree folders have no filesystem snapshot; their available Git tips
are retained in the bundle. Existing external Codex worktrees are included.

Stash recovery branches combine the stash working-tree snapshot with its
untracked file tree. The original stash and index commit remain unchanged.
Review each branch against its original base before merging; intentional
deletions are preserved. Do not apply old stashes blindly to current main.

- `migration/2026-10-06/lms-stash-1`: a1965d542e9017fbe53444e68f17f5eab8300e40; base fb099b2f34c36ced1d076bc2327cc8723d4958de.
- `migration/2026-10-06/lms-stash-2`: e8136db2c5c1b3861d0466ab39bee247b1eec64e; base a51ac336b8a2f88fb69e401b6a3d893222e421d7.

## Private configuration, data and dependencies

environment-and-databases.zip uses AES-256 ZIP encryption. Passwords are
stored separately in Desktop/Migration-Handover-2026-10-06/ENV_ARCHIVE_PASSWORDS.txt.
The ordinary Git bundle/worktree ZIP also may contain private data and are
not encrypted. Do not publish recovery packages or password files.
Read database-exports.json for exported databases and failures. PostgreSQL
custom dumps preserve schema/data; users, permissions, extensions and server
configuration may need recreation. SQLite supplemental copies are consistent
backups; raw worktree copies are filesystem snapshots. External cloud buckets,
object storage, third-party services, Redis and remote databases are not copied.

Recreate virtual environments, node_modules, vendor packages and framework
caches from the preserved manifests/lockfiles. Adapt environment paths and
service hosts on Windows. Keep the original machine until restoration and
the required application checks succeed.

The package includes personal skills/reference files separately, outside the
repository. Adapt their Linux absolute paths to the new checkout paths.

LMS remains the canonical shared engine. Recover these branches independently;
do not merge DigikaTech branding/public content into LMS. Follow canonical
LMS-first acceptance and sequential downstream propagation for future engine work.

## Verification scope

Verification covers full snapshot hashes/ZIP integrity, database export decoding
or SQLite quick_check, stash/untracked tree equality, unchanged original refs,
and restoration of the Git bundle into a fresh checkout. Python syntax findings
for preserved stashes are recorded separately. Full feature tests, production
builds, integration behavior and actual Windows restoration remain unverified.
