# AI connector integration and lesson images — 2026-10-02

## Source and acceptance boundary

- Base: LMS `origin/main` at `488608f0`.
- Existing source branch: `feature/ai-connector-shared-20260926`, checkpoint `4b2c72db`.
- AIRADS Virtual reference: `origin/main` at `3d62a20c` and connector reconciliation `ecb7c630`.
- Shared scope: OAuth/MCP course authoring, scoped learner activity and confirmed messaging, attendance gradebook actions, row selection, quiz metadata preservation, and inline lesson-image serving.
- Public pages, product branding, generated assets, and unrelated work were excluded.

## Integration decisions

Retain the AIRADS Connected AI Apps page exactly and retain one `AI_CONNECTOR_ENABLED` switch, disabled by default. Runtime connector code matches the downstream reconciliation; existing AIRADS migration history is preserved. Writes retain permission checks, immutable previews, atomic application, stale-version rejection and idempotent replay. No tool publishes or deletes a course.

The older connector branch was merged with current main. Preserve actor-aware quiz synchronization, timezone-aware unlock dates, course analytics navigation and current notification types. Add notifications migration 0009 instead of rewriting the already accepted 0008 migration.

AIRADS already preserves copied bank versions, hints and explanations when rebuilding quiz properties. Adopt that helper and its tests in LMS; an additional end-to-end regression reproduced lost hints/explanations before the correction.

With DEBUG=False and no media alias, existing stored lesson images returned 404. Add a fallback confined to `MEDIA_ROOT/lesson_images`, without exposing the full media tree. Test actual PNG/JPG/GIF/WebP files, missing images and path traversal. AIRADS's optional broad media fallback remains intact.

## Fresh verification

- Django system check: zero issues.
- Migration drift: no changes detected.
- Full backend: 1348 passed.
- Full frontend: 518 passed and 5 initially failed out of 523. The five affected files then passed all 12 tests after correcting integration expectations/analytics navigation and using a 20-second test timeout on the busy host. The final label-based session toggle check passed 2 tests separately.
- Connected AI Apps / gradebook / session checks: 9 passed.
- Production build of final source: passed.
- Lesson-image production tests: 6 passed (previously 4 failed / 2 passed).
- Chromium lesson-editor check: uploaded PNG inserted visibly at natural width 320, then saved and reloaded. Test uses a temporary real-editor harness with localStorage; production media serving is independently covered by Django request tests. No live course was changed.
- Lint: 114 errors / 14 warnings versus base 116 errors / 14 warnings; no introduced errors, two existing matching-pairs errors resolved.
- Added-code product-literal scan and git diff --check: passed.

Local backend tests use SQLite; production PostgreSQL locking and real OAuth client acceptance remain deployment checks. Connector remains disabled until configured and verified. Deployment must install requirements and apply migrations. Generated assets are supplied by the existing main-branch release workflow.

## Own-work review

Reviewed the complete branch against current main, including permissions, OAuth token/resource scope, preview/apply lifecycle, quiz persistence, builder conflicts, attendance routes, frontend consumers, migration ordering and production image serving. No unresolved critical or high finding; approve with the stated baseline lint and production acceptance limitations. This local review does not represent an external GitHub approval.
