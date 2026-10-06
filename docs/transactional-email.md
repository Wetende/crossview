# Transactional Email

The LMS sends transactional email through Django Anymail and the Brevo API.
All outbound paths use the shared branded renderer, including password resets,
course invitations, inquiries, learning notifications, and email digests.

## Production configuration

Create a separate named Brevo API key for each deployment and configure:

```dotenv
BREVO_API_KEY=replace-with-a-deployment-specific-key
DEFAULT_FROM_EMAIL=notifications@example.edu
PLATFORM_PUBLIC_BASE_URL=https://lms.example.edu
EMAIL_FROM_NAME=
DEFAULT_REPLY_TO_EMAIL=
EMAIL_LAYOUT_TEMPLATE=emails/platform_message.html
EMAIL_LOGO_URL=
```

`DEFAULT_FROM_EMAIL` must be a sender verified by Brevo. When
`EMAIL_FROM_NAME` is blank, the renderer uses the institution name from
`PlatformSettings`. When `DEFAULT_REPLY_TO_EMAIL` is blank, it uses the
platform contact email.

Production startup fails when the API key, sender, or public base URL is
missing. Development without a Brevo key uses Django's console backend.

## Brand behavior

The default layout reads the institution name, tagline, logo, primary and
secondary colors, and contact email from `PlatformSettings`. Relative uploaded
logo and action paths are made absolute using `PLATFORM_PUBLIC_BASE_URL`.
Product deployments may select their own outer layout with
`EMAIL_LAYOUT_TEMPLATE` and a stable product-owned `EMAIL_LOGO_URL` while
retaining the shared message and delivery logic. A relative product logo path
is made absolute with the same public base URL.

## Scheduled delivery

Run the outbox processor every five minutes so due daily/weekly digests and
failed-email retries are delivered:

```cron
*/5 * * * * cd /path/to/lms && /path/to/venv/bin/python manage.py process_notification_outbox --limit 200
```

Run engagement automation once each morning in the deployment timezone:

```cron
0 7 * * * cd /path/to/lms && /path/to/venv/bin/python manage.py run_engagement_automation --limit 200
```

Redirect cron output to the deployment's normal logging destination. After a
release, send controlled welcome, password-reset, announcement, and digest
messages, then confirm both the database outbox states and Brevo transactional
logs.
