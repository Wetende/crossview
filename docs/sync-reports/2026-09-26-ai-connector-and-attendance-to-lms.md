# AI connector and attendance promotion to LMS — 2026-09-26

## Scope and lineage

- Source repository: `/home/wetende/Projects/airads/virtual`
- Source connector range: `d92552c7`, `eecd56cb`, `4f3d5c5f`, `5ce516cf`
- Source attendance commits: `e38e71d0`, `3d980f03`
- Source editor fix: `a8537cae`
- Canonical repository: `/home/wetende/Projects/lms`
- Canonical base: `c9eb812ce4ee1b23f48f374d86191bb9b57a38f7`
- Canonical integration branch: `feature/ai-connector-shared-20260926`

The connector was promoted as a product-neutral shared engine. The canonical
implementation retains permission-scoped read and write tools, immutable
change proposals, explicit confirmation before apply, optimistic version
checks, atomic and idempotent application, audit records, diagnostics, and the
no-delete contract. A single `AI_CONNECTOR_ENABLED` setting gates the complete
surface.

| Source change | Canonical LMS | Purpose |
| --- | --- | --- |
| `d92552c7` | `508573b2` | Permission-scoped OAuth/MCP connector and read tools |
| `eecd56cb` | `051b9125` | Sandboxed/null-origin OAuth CSRF acceptance |
| `4f3d5c5f` | `0128e402` | Scoped authoring, diagnostics, immutable proposals, and confirmed apply |
| `5ce516cf` | `5672468a` | One connector enable switch |
| `e38e71d0`, `3d980f03` | `178be060` | In-person notifications, server-driven gradebook attendance, and callback compatibility |
| `a8537cae` | `f1e8604b` | Matching-pairs editor `IconButton` import |
| Canonical follow-up | `20b219f6` | Portable PostgreSQL and email runtime dependencies |

## Boundary decisions

- Shared runtime code and examples contain no Airads domain, brand, admissions,
  or deployment-path assumptions.
- The connector defaults to disabled and uses deployment-owned public base URL,
  redirect host, secret, and token configuration.
- No delete operation is exposed. Mutations remain limited to the documented
  course-authoring actions and preserve authorization, version, confirmation,
  transaction, idempotency, and audit boundaries.
- Attendance remains server-driven: instructors select sessions and submit
  bulk or individual decisions through permission-checked gradebook endpoints.
- In-person notifications are optional and apply only to in-person sessions;
  Google synchronization and verified identity mapping remain isolated.
- Product documentation, generated frontend assets, and Airads-only deployment
  material were not promoted.
- DigikaTech propagation must preserve its self-paced authoring lock and
  Paystack policy. Airads propagation must preserve its product-owned identity
  and deployment configuration.

## Verification evidence

Commands used `DEBUG=True` where Django settings required it.

| Gate | Result |
| --- | --- |
| `python manage.py check` | Passed: zero issues |
| `python manage.py makemigrations --check --dry-run` | Passed: no changes detected |
| Focused backend connector/attendance/Google suite | Passed: `112 passed, 102 warnings in 241.05s` |
| Focused frontend feature group | Passed: `25/26`; one concurrently loaded logout test timed out |
| Isolated dashboard rerun | Passed: `10 passed in 10.27s` |
| `npm run build` | Passed: `19,785` modules transformed; built in `50.72s` |
| Matching-pairs editor ESLint | Passed |
| Code-only tenant-literal addition scan | Passed: no Airads-specific additions |
| `git diff --check` | Passed |
| Generated asset audit | Passed: no `static/dist` changes retained |

A broad backend run was intentionally stopped after the testing scope was
narrowed to the affected features. It had reached `761 passed` with no failures
before interruption; it is partial evidence only and is not reported as a
passing full suite.

## Propagation

After this canonical checkpoint is committed, propagate the accepted behavior
sequentially into Airads Virtual and then DigikaTech on isolated local branches.
Record destination hashes and focused verification in each repository. Do not
push, open pull requests, merge, deploy, or change production state without a
separate user request.
