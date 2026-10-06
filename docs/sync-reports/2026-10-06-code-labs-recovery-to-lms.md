# Browser code-lab recovery into LMS — 2026-10-06

This slice restores the preserved React and Python code-lab implementation.
Instructors can author these languages; learners run them in a sandboxed browser
iframe and save and submit code through the existing authenticated progress API.
JavaScript and HTML behavior and submission authorization are preserved.

## Provenance and boundary

- Source: `1461b57b121bdef818da95494cc3ebd32a608962`.
- Initial integration base: `02ba63c3dc572999ff7c4314882dbe9e729ffa10`;
  refreshed to `1531ee21ed8baea36f3bfff7fda923bb8e93d646` after
  canonical email recovery PR #26 merged.
- Shared-engine source and regression tests only. Historical migration plan,
  databases, test fixtures, screenshots and generated assets remain outside Git.
- Python runs through pinned Pyodide, React through pinned Babel/React CDN
  modules. No learner code runs on the application server.
- Sandbox allows scripts and modals for Python input, without same-origin
  privileges. Imported React modules are limited by the lab runtime.

## Verification

- Django system check: no issues. Migration drift: none.
- Combined full backend: **1,360 passed** with SQLite and test-only MD5 hashing.
- Full frontend: **538 passed across 113 files** with two workers.
- Changed-file ESLint, editor-test formatting and diff checks passed.
- Production Vite build passed in an isolated directory. Accepted email recovery
  changes no frontend, package or Vite configuration, so the verified build
  still corresponds to this source.
- Chrome/Playwright: eight real runtime scenarios passed, including Python
  input/errors, React hooks/imports/explicit roots and denied parent-document
  access. Actual JavaScript, Python and React player run/submit flows passed.
- Builder tests verified saving React and Python language selections.
- Repository-wide pre-existing frontend lint debt remains outside this slice.

## Operational limits

React and Python first runs require access to the configured external CDNs.
Successful local browser checks do not prove every production network policy.
SQLite tests do not prove production database behavior. Java and C/C++ retain
submission-only behavior. Downstream propagation is a separate reviewed slice;
public branding and Website remain outside shared-engine recovery.
