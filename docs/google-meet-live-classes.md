# Google Meet live classes

The LMS is the authoritative course, enrollment, progress, grading, and attendance system. Google Calendar creates the event and unique Google Meet link. Google Classroom is not used.

## Configuration

Set these values in the deployment environment, then restart the application:

```dotenv
GOOGLE_WORKSPACE_ENABLED=True
GOOGLE_WORKSPACE_CLIENT_ID=...
GOOGLE_WORKSPACE_CLIENT_SECRET=...
GOOGLE_WORKSPACE_REDIRECT_URI=https://lms.example.com/api/google-workspace/oauth/callback/
GOOGLE_WORKSPACE_TOKEN_ENCRYPTION_KEY=...
PLATFORM_PUBLIC_BASE_URL=https://lms.example.com
```

The Google Cloud OAuth web-client callback must be the exact `GOOGLE_WORKSPACE_REDIRECT_URI`. Enable the Google Calendar API. Calendar authorization is enough to create, reschedule, cancel, and invite learners to Google Meet lessons. The Google Meet REST API and `meetings.space.readonly` scope are optional; they add post-meeting attendance and recording synchronization. Calendar-created conferences are not covered by `meetings.space.created`.

## Production migration

Back up the production database before migration. The `google_workspace.0001_initial` migration copies each legacy Classroom credential, preserving its primary key, encrypted refresh token, granted scopes, status, and timestamps. Only after that copy does `google_classroom.0002_remove_classroom_models` drop the Classroom tables.

Run:

```bash
python manage.py migrate
python manage.py check
python manage.py sync_live_sessions --limit 100
```

Schedule the last command every minute. It retries pending Meet-link generation and later optional attendance/recording synchronization. Do not delete or modify the migration history even though the Classroom runtime is retired.

## Acceptance walkthrough

1. An instructor opens a Google Meet lesson, connects Google Calendar, and chooses **Save & create Google Meet**.
2. Confirm the unique Meet link and Calendar event appear; test invite-off and invite-on separately.
3. Publish only after the Meet status is ready. A learner verifies the countdown and joins through the LMS during the join window.
4. If optional Meet REST access is enabled, finish the meeting and synchronize attendance. Review unmatched/anonymous rows, map a signed-in Google participant to an enrolled learner, then synchronize again.
5. Reschedule and cancel the lesson; confirm the Calendar event follows the change.

Meet evidence never marks a lesson complete or assigns a grade automatically. Instructor attendance overrides are audited, and the LMS remains authoritative.
