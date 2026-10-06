# Branded email recovery into LMS — 2026-10-06

The preserved migration contained branded transactional email behavior absent
from canonical main. This slice restores configurable HTML/text email delivery,
notification action links and digest rendering, and removes duplicate
announcement delivery from views whose model signal already sends notifications.

## Provenance and boundary

- Integration base: `02ba63c3dc572999ff7c4314882dbe9e729ffa10`.
- Framework source: `fa200f9850c36f272c1c5862b18e21baa587bcd1`.
- Portable branding test correction: `01915a476bfe9fe93e5eebdf94a72c1138f87284`.
- Shared-engine only: LMS platform settings determine identity and colors;
  products can configure their own template and logo without engine forks.
- Preserved current AI connector settings, explicit Vite configuration,
  enrollment notification behavior and existing Anymail dependency.
- Updated the in-person retry test to patch the new email delivery boundary.
- No databases, restored media, product content, historical notes, generated
  assets or real provider credentials are included.

## Verification

- Django system check: no issues. Migration drift: none.
- Full backend: **1,359 passed**; SQLite and the test-only MD5 password hasher.
- Full frontend: **529 passed across 112 files** with one worker.
- Vite production build passed; output stayed outside tracked `static/dist`.
- Production check and isolated collectstatic passed with three warnings from
  existing/custom security settings and a disposable short test secret.
- Chrome/Playwright: desktop/mobile HTML email previews, absolute action link,
  and actual password-reset request passed without application console errors.
- Diff checks passed. Frontend source and its existing lint debt are unchanged.

## Operational limits

Production now requires `BREVO_API_KEY`, `DEFAULT_FROM_EMAIL` and
`PLATFORM_PUBLIC_BASE_URL`. Development without a provider key uses console
email. Tests and browser previews used an in-memory email backend; no real
email was sent and provider delivery is not proven. Production check and
collectstatic used disposable configuration and output.

Downstream email integration remains a separate slice. DigikaTech already has
email-specific product behavior that must be compared before synchronization;
its excluded title/theme/sidebar recovery remains excluded. AIRADS public
branding and Website are outside this canonical change.
