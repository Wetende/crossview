# Generic Inquiry Intake

`apps/inquiries` is the shared, tenant-neutral intake workflow for contact,
program-interest, partnership, support, and other public questions.

## Ownership boundary

Shared engine:

- the `Inquiry` record and staff-facing Django admin workflow;
- validation, optional published-program linkage, and submitter attribution;
- the CSRF-protected JSON/form endpoint;
- internal email delivery and delivery-state recording.

Fork only:

- public form layout, copy, category choices, and success presentation;
- hardcoded or deployment-specific recipient addresses;
- tenant-specific admissions or campus workflows.

## Endpoint

Submit `POST /api/inquiries/` with a same-origin CSRF token. JSON and regular
form bodies are supported.

```json
{
  "name": "Example Learner",
  "email": "learner@example.com",
  "phone": "+1 555 0100",
  "subject": "Program question",
  "message": "Please tell me about the next intake.",
  "kind": "program",
  "programId": 42,
  "source": "program_detail",
  "website": ""
}
```

Supported `kind` values are `general`, `program`, `partnership`, `support`, and
`other`. `programId` must identify a published program and is required when the
kind is `program`. A non-program inquiry must include a message. `fullName` is
accepted as an alias for `name`, and `program_id` is accepted as an alias for
`programId`.

Successful submissions return HTTP 201:

```json
{
  "message": "Thank you. Your inquiry has been received.",
  "inquiryId": 123
}
```

Validation errors return HTTP 422 with an `errors` map. Invalid JSON returns
HTTP 400. The hidden `website` field is a honeypot: when populated, the endpoint
returns the generic success response without creating a record or sending mail.

## Notification routing

The internal recipient is selected in this order:

1. `INQUIRY_NOTIFICATION_EMAIL`, when the deployment explicitly configures it.
2. `PlatformSettings.contact_email`.

Delivery failure never discards the inquiry. Staff can see
`notification_sent_at` or `notification_error` in Django admin and follow up or
retry operationally.

## Frontend integration

Public pages should import
`frontend/src/features/inquiries/hooks/useInquirySubmission.js` directly. The
hook uses the shared API client, sends the same-origin CSRF headers, prevents
duplicate submissions through `isSubmitting`, and exposes field errors plus a
user-facing status message. Page markup and form copy remain fork-owned.
