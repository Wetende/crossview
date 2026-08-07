# Enrollment Account Handoff Synchronization

Date: 2026-08-07

## Scope

- Canonical LMS commits:
  - `70d24d4e` — provision learner access from enrollment intents
  - `4e456b0a` — isolate the generic enrollment-intent resume route
- Airads synchronization commits:
  - `5da43ddb` — shared learner account handoff with Airads admissions preserved
  - `ee33d4e3` — isolated generic resume route
- DigikaTech synchronization commits:
  - `fae95b0d` — shared learner account handoff adapted to the Digika public page
  - `ce0b09b4` — isolated generic resume route
  - `6b1c3d3b` — Digika enrollment CTA coverage
  - `78f02f48` — lint-clean Digika product seam

A visitor can now select **Enroll now** on the public course page without first
logging in. The enrollment dialog captures name, email, and phone. The server
creates a learner account for a new email or links the existing account without
changing its password, continues the appropriate enrollment path, and sends the
learner the next-step message.

Free courses auto-enrol under open-enrollment policy. Paid courses retain the
checkout path, and approval-based deployments retain a pending request. The
course page consumes a one-time access payload to show the account handoff, an
email-inbox action where supported, and a sign-in/resume action. Enrolled
learners see **Continue studying**.

## Product boundaries

- Airads' custom admissions/application workflow, public site context, and
  product-owned success experience were preserved.
- DigikaTech retains its public navigation/footer, course-level presentation,
  branding, online-only deployment policy, and Paystack-only paid checkout.
- Generic enrollment resume moved to `/enrollment-intents/resume/` so it
  cannot collide with Airads' product-owned `/programs/enrollment/resume/`.
- Generated `static/dist` assets were excluded from source commits.

## DigikaTech local test data

The local DigikaTech database contains a separate published free course:

- Course: `Enrollment Flow Test Course`
- Code: `DIGIKA-ENROLL-TEST`
- URL: `/programs/enrollment-flow-test-course/`
- Curriculum: one published section and one published text lesson

The existing unpublished `robotics` draft was not modified. Local database
content is intentionally not committed to Git.

## Verification

| Repository | Gate | Result |
| --- | --- | --- |
| LMS | System check and migration drift | Passed |
| LMS | Full Django suite | 869 passed |
| LMS | Full frontend suite | 180 passed |
| LMS | Temporary production build | Passed, 19,777 modules transformed |
| Airads | System check and migration drift | Passed |
| Airads | Full Django suite | 924 passed; one local `.env` hostname assertion was rerun with the production virtual-campus base URL and passed |
| Airads | Enrollment + production-host focused rerun | 6 passed |
| Airads | Full frontend suite | 193 passed |
| Airads | Temporary production build | Passed, 19,782 modules transformed |
| DigikaTech | System check and migration drift | Passed |
| DigikaTech | Full Django suite | 891 passed |
| DigikaTech | Full frontend suite | 198 passed; one load-sensitive Question Bank test timed out and passed alone in 2.38 seconds |
| DigikaTech | Enrollment/page focused frontend suite | 6 passed |
| DigikaTech | Targeted ESLint | Passed |
| DigikaTech | Exact final temporary production build | Passed, 19,746 modules transformed |
| DigikaTech | Published test-course HTTP contract | 200, free/not-enrolled, one lesson |

