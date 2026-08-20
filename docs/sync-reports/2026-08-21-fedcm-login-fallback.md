# FedCM login fallback sync

## Scope

- Classification: shared authentication support contract.
- Canonical LMS commit: `cd7b0717`.
- Airads destination commit: `5ecc9cac`.
- DigikaTech destination commit: `a67c3def`.
- Included: Google Identity button initialization, login/register prompt removal, and regression coverage.
- Excluded: branding, public pages, deployment configuration, and generated `static/dist` assets.
- Added-line tenant-literal scan: no product names, domains, or product assets added.

## Verification

- LMS auth Vitest: 2 files and 2 tests passed.
- LMS production Vite build: passed.
- LMS `manage.py check`: passed.
- LMS migration drift: no changes detected.
- Full LMS Vitest run: 65 files and 176 tests passed; one unrelated gradebook test hit its five-second timeout under parallel load and then passed in the isolated rerun (3 files and 5 tests passed).
- Airads auth Vitest: 2 files and 2 tests passed.
- Airads production Vite build: passed.
- Airads `manage.py check`: passed; migration drift: none.
- DigikaTech auth Vitest: 3 files and 8 tests passed.
- DigikaTech production Vite build: passed.
- DigikaTech `manage.py check`: passed; migration drift: none.

The change removes automatic One Tap prompting and the optional FedCM button opt-in. The standard Google Identity Services redirect button remains enabled and continues posting credentials to the existing server-side login endpoint.
