# Paystack Payment Reconciliation to LMS

## Scope

- Classification: shared-engine generic commerce.
- Incident source: DigikaTech live M-Pesa order `ord-5cf87013db854ff3818a`
  remained `pending_payment` after Paystack recorded a successful KES 5 charge.
- Canonical base: `09ee8de1`.
- Canonical accepted head: `0c8352b2`.
- Accepted commits:
  - `64c9955b` — reconcile pending Paystack orders and replace duplicate-reference retry behavior.
  - `0c8352b2` — refine the learner checkout and use plain-language payment actions.

## Decisions

- Keep Paystack webhooks as the primary asynchronous completion path.
- Add throttled server-side verification when a learner polls a pending Paystack
  order, so a delayed or missed webhook can recover safely.
- Verify the existing provider reference instead of attempting to initialize it
  again.
- Poll for the full mobile-money confirmation window and automatically reconcile
  pending orders whenever their detail page is opened.
- Replace gateway terminology such as `STK Push` with learner-facing actions such
  as `Pay with M-Pesa`.
- Present payment methods as accessible selection cards and remove the obsolete
  phone-action prompt after payment succeeds.

## Exclusions

- No tenant names, domains, branding assets, or public-page content were added.
- No Paystack keys, cPanel environment values, or other deployment secrets were
  committed.
- Generated `static/dist/` output was excluded from the canonical source commits.
- The production Paystack Live webhook and callback URL configuration remains a
  deployment responsibility.

## Promotion Evidence

- Added-line tenant-literal scan: clean.
- `git diff --check`: passed.
- `env DEBUG=True DJANGO_SECRET_KEY=sync-audit-only venv/bin/python manage.py check`:
  passed with no issues.
- `env DEBUG=True DJANGO_SECRET_KEY=sync-audit-only venv/bin/python manage.py makemigrations --check --dry-run`:
  passed with no changes detected.
- `env DEBUG=True DJANGO_SECRET_KEY=sync-audit-only venv/bin/pytest -q`:
  871 passed.
- `npm test`: 70 files passed, 183 tests passed.
- Changed-file ESLint: passed.
- Repository-wide `npm run lint`: baseline failure on 120 unrelated pre-existing
  errors; none were in the changed files.
- `npm run build`: passed; 19,777 modules transformed.
- Generated build output was restored after the build gate.

## Production Incident Notes

- Paystack recorded the transaction as successful with matching KES 5 amount and
  order reference.
- The production Live webhook was registered as
  `https://digikatech.com/webhooks/paystack/` and payment completion began working.
- The Live callback was registered as
  `https://digikatech.com/payments/paystack/callback/`.
