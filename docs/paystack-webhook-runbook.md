# Paystack Webhook Runbook

## Purpose

Operational guide for verifying, processing, and replaying Paystack webhook events safely.

## Scope

- Endpoint: `POST /webhooks/paystack/`
- Provider: Paystack
- Optional legacy callback: `GET /payments/paystack/callback/`

## Key principles

1. Webhook is the authoritative payment source of truth.
2. Callback is user-facing only and must not bypass webhook safety checks.
3. Event processing must be idempotent.

## Verification checklist

1. Confirm the request is received at the webhook endpoint.
2. Validate provider signature using configured webhook secret.
3. Reject and log any payload with invalid signature.
4. Extract stable dedupe key (event id/reference/provider tuple).
5. Check dedupe store before processing business transitions.

## Idempotent processing

For each webhook event:

1. Compute or read dedupe key.
2. If already processed:
   - Return success response (do not re-apply transitions).
   - Record duplicate delivery in logs/metrics.
3. If new:
   - Persist event row with raw payload and signature result.
   - Apply transition once (order/payment/enrollment).
   - Mark event as processed with timestamp.

## Replay handling

Use replay when delivery failed before business transition completion.

### Safe replay steps

1. Locate event by provider + event id/reference.
2. Verify signature status was valid.
3. Verify current order/enrollment state.
4. Re-run processing using same idempotency key path.
5. Confirm final state and processed timestamp updated.

### Replay guardrails

- Never bypass signature checks.
- Never issue enrollment/payment state transitions without idempotency checks.
- Replays must be traceable in logs.

## Incident triage

### Symptom: payment completed but access not granted

1. Check webhook event exists for reference.
2. Check signature validity.
3. Check dedupe row processed flag.
4. Check order status transition to paid.
5. Check enrollment creation/activation (`access_source='paid'`).
6. If event valid but unprocessed, execute replay.

### Symptom: duplicate enrollments/orders

1. Check repeated webhook deliveries for same reference.
2. Confirm dedupe key uniqueness and lookup path.
3. Confirm transition code is guarded against duplicate active enrollment creation.

## Logging expectations

Each webhook attempt should log:

- provider
- reference/event id
- signature_valid
- dedupe key
- processed status
- resulting order/enrollment state

## Configuration dependencies

- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_WEBHOOK_SECRET`
- `PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_CALLBACK_URL` (optional for legacy redirect flow only)

## Production readiness

1. Rotate the live secret key if it has been pasted into logs, chat, or screenshots.
2. Update both `PAYSTACK_SECRET_KEY` and `PAYSTACK_WEBHOOK_SECRET` after rotation.
3. Re-register the production webhook URL in the Paystack dashboard if needed.
4. Confirm the active live checkout is Popup-driven and the callback route is no longer required for primary checkout.

## Validation commands

- Frontend build: `npm run build`
- Frontend tests: `npm test`
- Backend checks: `/home/wetende/Projects/crossview/venv/bin/python manage.py check`

Note: if backend check fails with missing `django_filters`, install project dependencies before concluding webhook/runtime health.
