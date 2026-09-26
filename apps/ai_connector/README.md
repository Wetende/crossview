# AI course-authoring connector

Trainers connect an AI app (ChatGPT, Claude, Claude Code, Codex) to the courses
they manage. The AI app does the reasoning and writing; this application exposes
a small set of permission-checked course tools over a remote MCP endpoint and
saves only changes the trainer has previewed and confirmed in the chat.

No AI provider API key is held by this application.

## How it works

```text
AI app ──OAuth (PKCE)──> /o/authorize, /o/token   (Django OAuth Toolkit)
   │
   └──Bearer token──> POST /mcp  (django-mcp-server, stateless JSON, WSGI/Passenger)
                          │
                          ├─ read tools: search_courses, get_course (paged by module), get_lesson,
                          │              check_course_readiness, get_authoring_schema
                          └─ write tools: prepare_course_change → apply_course_change,
                                          get_change_status
```

- **Identity and access.** Each trainer signs in with their own account. Only
  instructors and administrators can connect. Administrators reach every
  course; instructors reach only courses assigned to them. Every tool call
  re-checks the account, instructor role and course assignment, so removing
  access takes effect on the next request.
- **Scopes.** `courses:read` and `courses:write`. The consent screen lets the
  trainer connect read-only by unticking "Also allow saving course changes".
- **Preview, confirm, apply.** `prepare_course_change` validates operations and
  stores an immutable `CourseChange` record (user, client, exact operations,
  preview, content fingerprints) without touching the course.
  `apply_course_change` accepts only that record's ID, re-checks permissions and
  fingerprints, and applies every operation in one transaction. A course edited
  since the preview is refused as stale; applying twice returns the original
  result.
- **Audit.** `CourseChange` records are read-only in Django admin under
  "AI course-authoring connector".
- **Tokens.** Tokens are stored hashed, expire after one hour and refresh
  tokens rotate. Every token is bound to this server's `/mcp` resource
  (RFC 8707): authorization adds the resource when a client omits it, requests
  for any other resource are refused, and `/mcp` rejects unbound tokens.
  "Connected AI apps" in the account menu lists and disconnects apps.
- **Access rechecks.** `get_change_status` and repeated `apply_course_change`
  calls hide a change's details once the person loses access to its course.
- **Course builder safety.** Lesson editors and the course settings form send
  the version they were loaded from. A builder save is refused, with a message
  asking for a reload, when an AI change touching the same item was applied
  after that version, so an open editor cannot silently undo an AI change (for
  example, delete questions the AI just added). A person's own autosaves and
  uploads never conflict with each other. AI saves lock the rows they change
  before checking versions, and builder saves take the same lock.

### What V1 can change

| Operation | Notes |
| --- | --- |
| `update_course` | Title, description (HTML), learning outcomes. A new title changes the public course address; the preview says so. |
| `update_module` | Title of an existing module. |
| `create_text_lesson` / `update_text_lesson` | Title, body HTML, duration, short description. Other lesson properties are kept. |
| `create_quiz` | New quiz with 1–50 questions and builder default settings (weight 0%). |
| `add_questions` / `update_question` | Single choice, multiple choice and true/false. Existing questions, option IDs, settings and attempts are never removed. |

Out of scope: deleting content, publishing/unpublishing, course creation,
moving or reordering items, media uploads, question banks, grading weights and
policy, learner records, payments and calendars.

New items in a published course become visible to learners when applied (the
same rule as the course builder); the preview states this. Unpublished courses
stay unpublished.

All AI-written HTML is cleaned server-side (`nh3`) before storage.
Text lesson reads cap body HTML at 100,000 characters and mark truncated
results. The connector refuses body replacement for longer existing lessons;
edit those bodies in the course builder. Other fields remain editable.

## Enabling

The connector is off unless `AI_CONNECTOR_ENABLED=True`. While off, every
connector URL returns 404 and the menu entry is hidden. Production enablement
requires approval after staging acceptance.

```bash
AI_CONNECTOR_ENABLED=True
AI_CONNECTOR_BASE_URL=https://lms-staging.example.edu   # public origin, no trailing slash
AI_CONNECTOR_ALLOWED_REDIRECT_HOSTS=claude.ai,claude.com,chatgpt.com,platform.openai.com
```

Then run `python manage.py migrate` and restart Passenger.

`AI_CONNECTOR_BASE_URL` must match the URL trainers paste into their AI app
(scheme included). Tokens are bound to `<base>/mcp`, so an HTTPS/HTTP mismatch
behind the web server shows up as repeated sign-in prompts.

Endpoints:

| URL | Purpose |
| --- | --- |
| `/mcp` | MCP endpoint (streamable HTTP, JSON responses, stateless) |
| `/.well-known/oauth-protected-resource/mcp` | RFC 9728 resource metadata |
| `/.well-known/oauth-authorization-server` | RFC 8414 server metadata |
| `/o/register/` | RFC 7591 client registration (approved redirect hosts only, rate-limited) |
| `/o/authorize/`, `/o/token/`, `/o/revoke_token/` | OAuth 2.1 with PKCE (S256 only) |
| `/account/connected-apps/` | Trainer's connected apps |

Optional limits: `AI_CONNECTOR_RATE` (MCP calls per user, default `120/min`),
`AI_CONNECTOR_REGISTRATION_RATE` (default `20/hour` per IP),
`AI_CONNECTOR_CHANGE_TTL_HOURS` (prepared-change lifetime, default 24).

## Connecting a client

Use the connector URL shown on the Connected AI apps page
(`https://<host>/mcp`). The client registers itself, opens the sign-in page, and
the trainer approves access.

- **Claude Code:** `claude mcp add --transport http course-authoring https://<host>/mcp`,
  then run `/mcp` in a session to sign in. Claude Code asks before each tool
  call unless the tool is on the permissions allow list. Keep
  `mcp__course-authoring__apply_course_change` off the allow list so every save
  needs approval.
- **Claude (web/desktop):** add a custom connector with the URL. In the
  connector's tool permissions, leave "Save confirmed course change" set to
  require approval. *(Verify the exact settings path during client acceptance;
  Team/Enterprise owners must add the connector first.)*
- **ChatGPT:** add the URL as a custom MCP connector (developer mode). Write
  tools (`apply_course_change`, which is not marked read-only) require
  confirmation. *(Verify plan availability and settings during client
  acceptance; full write support is limited to some plans.)*
- **Codex CLI:** `codex mcp add course-authoring --url https://<host>/mcp` and
  `codex mcp login course-authoring`. *(Verify commands and approval mode
  against the installed Codex version.)*

The client's approval prompt and the tool instructions are the human
confirmation step. The server never trusts an AI-supplied "approved" flag; it
only applies a change ID that was prepared by the same account.

## Staging acceptance

1. Copy only the AI course content (no learner records) to staging.
2. Enable the connector on staging and connect Claude Code or Codex.
3. Ask: "Review AI101 against its learning outcomes. Show me missing
   assessments, then add three draft questions to the Module 2 quiz." Confirm
   the preview, apply, and check the quiz in the course builder and player.
4. Check refusals: an unassigned instructor's course ID, a read-only
   connection trying to save, an edit made in the builder between preview and
   save (stale), and disconnecting from Connected AI apps.
5. Repeat the read, preview and save in Claude and ChatGPT on connector-enabled
   accounts.

## Local verification

```bash
python -m pytest apps/ai_connector -q      # service, OAuth and MCP endpoint tests
npx vitest --run frontend/src/features/ai-connector frontend/src/layouts/DashboardLayout
```
