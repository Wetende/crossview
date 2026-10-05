# Code Lab browser runtimes (React + Python) — handover plan

Status as of 2026-09-28. Branch `feat/code-lab-browser-runtimes` in the LMS
worktree `/home/wetende/Projects/lms-code-lab-runtimes` (cut from
`origin/main` at `76d55afa`). Nothing is committed yet. Do not commit or push
until the user confirms the slice works in a real browser.

## Goal

Let code labs in `react` and `python` run in the learner's browser, with no
server-side execution (shared cPanel hosting). `java` and `c_cpp` stay
submission-only. Same behaviour later synced to AIRADS Virtual through the
`manage-shared-lms-repos` skill.

## Design (already implemented)

Everything runs inside the existing sandboxed output iframe built from a
`srcdoc` string. Interpreters come from CDNs, the app server only serves HTML.

| Language | Runtime | Source |
|---|---|---|
| html_css_js, javascript | unchanged | inline shell |
| react | Babel standalone transpiles JSX in the iframe, React 19.1.0 as ES modules | jsDelivr + esm.sh |
| python | Pyodide 314.0.7 (CPython on WebAssembly) | jsDelivr |

Sandbox is `allow-scripts allow-modals` (modals so Python `input()` works).
`allow-same-origin` is deliberately absent.

React contract for learners: React and common hooks are in scope without
imports, `import ... from "react"` / `"react-dom/client"` also works, a
component named `App` (or a default export) is mounted automatically unless
the code calls `createRoot` itself. Other imports throw a clear error.

## Files changed (uncommitted)

- `frontend/src/features/course-player/components/Renderers/codeLabRuntimes.js` (new)
  srcdoc builders, `isBrowserRunnable`, `toScriptLiteral`, `IFRAME_SANDBOX`, CDN constants.
- `frontend/src/features/course-player/components/Renderers/codeLabRuntimes.test.js` (new)
  7 vitest cases. Passing.
- `frontend/src/features/course-player/components/Renderers/CodeLabRenderer.jsx`
  uses the module above, adds JSX CodeMirror mode for `react`, sandbox from constant.
- `frontend/src/features/course-builder/editors/CodeLabEditor.jsx`
  `react` language config + starter, `AUTHORABLE_LANGUAGES` now includes react and
  python, runtime hint alerts, updated legacy-language copy.
- `apps/learning_operations/activity_progress.py`
  `BROWSER_CODE_LANGUAGES` now includes `react` and `python` (drives `browserRunnable`).
- `apps/learning_operations/tests/test_activity_progress.py`
  new `test_code_lab_reports_which_languages_run_in_the_browser`. 5/5 passing.
- `static/dist/**` and `static/dist/.vite/manifest.json`
  rebuilt by `npm run build`. Restore before committing source (see below); the
  repo commits release assets in separate `build:` commits.

## Verification done

- `DEBUG=True ../lms/venv/bin/python -m pytest apps/learning_operations/tests/test_activity_progress.py` → 5 passed.
- `npx vitest --run frontend/.../codeLabRuntimes.test.js` → 7 passed.
- `npm run build` → exit 0.
- Manual, in the Claude desktop built-in browser against a debug-off local
  server on 127.0.0.1:8020 with a fresh SQLite DB:
  - JavaScript lab: Run printed `sum 6`, Submit & Complete marked the lesson done. OK.
  - React lab: page rendered, Run produced no output and no esm.sh / jsDelivr
    requests were recorded. Direct `curl` to esm.sh, Babel and Pyodide URLs
    all return 200 from this machine, so this is most likely the desktop
    browser pane refusing third-party origins from a sandboxed iframe, not a
    code bug. UNVERIFIED. Python lab not reached.

## Next steps (in order)

1. Verify React and Python in a real browser (Chrome).
   Start the server from the worktree with debug off so the built assets are used
   (memory says Vite dev is not used locally):
   ```bash
   cd /home/wetende/Projects/lms-code-lab-runtimes && DEBUG=False DJANGO_SECRET_KEY=local-codelab-test-only SECURE_SSL_REDIRECT=False CSRF_COOKIE_SECURE=False SESSION_COOKIE_SECURE=False ../lms/venv/bin/python manage.py runserver 127.0.0.1:8020 --noreload
   ```
   The local `db.sqlite3` already has: student `codelab_student@example.com`
   (password is the UserFactory default in `apps/core/tests/factories.py`),
   program 1 "Code Lab Runtimes Demo", lessons: JS lab (node 2, completed),
   React lab (node 3), Python lab (node 4). Player URLs:
   `/student/programs/1/session/3/` and `/student/programs/1/session/4/`.
   Expected: React shows "Hello, React!" with a working counter button;
   Python prints three `radius n: area ...` lines after a one-off ~10 MB
   Pyodide download. Check the Console pane mirrors output and errors.
   If React still fails in Chrome, open DevTools on the iframe: likely causes
   are a CSP header, esm.sh module resolution, or Babel `transform-modules-commonjs`
   output not matching the `require` shim.
2. Error-path checks in the browser: a Python `NameError` shows a trimmed
   traceback; a React syntax error shows Babel's message; an unsupported
   import (`import x from "lodash"`) shows the clear error; `input("name? ")`
   opens a prompt.
3. Builder check: create a code lab, switch language to React and Python,
   confirm the starter code, the runtime hint alert, and that Java/C++ remain
   legacy-only with the updated copy.
4. Restore the tracked build output before committing source, then commit:
   ```bash
   cd /home/wetende/Projects/lms-code-lab-runtimes && git checkout -- static/dist && git clean -fdq static/dist && git status --short
   ```
   Commit only after the user confirms the manual checks pass. Suggested
   split: one `feat(code-lab): run React and Python labs in the browser`
   commit for source + tests. Release assets follow the repo's existing
   `build: release assets for <sha>` convention.
5. Open the PR on LMS (`Wetende/lms`) targeting `main`, not stacked on any
   other branch. Then sync to AIRADS Virtual via `manage-shared-lms-repos`
   and hand the user a manual test plan (same steps as 1 to 3, with expected
   results).

## Open questions / risks

- Offline or CDN-blocked classrooms cannot run React or Python labs. The
  iframe shows "Could not load the ... runtime" messages, but consider a
  builder-side note. Self-hosting Pyodide (~10 MB+) on cPanel is possible
  later by changing `PYODIDE_BASE_URL`.
- No Content-Security-Policy is set in `config/settings/settings.py`, so the
  CDN loads are not blocked today. If a CSP is added later it must allow
  `cdn.jsdelivr.net` and `esm.sh` in `script-src` for the iframe.
- Pyodide `input()` uses `window.prompt`, which blocks the iframe thread;
  acceptable for lessons.
- `LANG_LABELS` in `codeLabRuntimes.js` must stay in sync with the builder's
  `LANGUAGE_CONFIG`.
