# MasterStudy-parity roadmap — remaining work (LMS → AIRADS Virtual)

Written 2026-09-27 after the first batch landed (LMS crossview #11–#20, Virtual #10–#17).
Use this as the brief for the next sessions. Each slice is one PR in LMS, then one sync PR in
Virtual, then rows in the manual test plan (`virtual/docs/manual-tests/`).

## 0. State of both repositories (as of 2026-09-27)

| | LMS (`Wetende/crossview`) | AIRADS Virtual (`Airads-College/airads-virtual`) |
|---|---|---|
| Stack | Django 5.2, inertia-django 1.2, @inertiajs/react 2.3, React 19, MUI 9.4, Vite, TipTap 3.15, recharts, katex | same |
| `main` protection | none (GitHub free plan) — branch + PR only, merge with `--merge` | same; `airads-pr-review` skill for PR/merge |
| Release assets | `.github/workflows/release-assets.yml` builds `static/dist` after each merge — never commit dist | same |
| Latest migrations | core 0025, notifications 0008, assessments 0023, curriculum 0007, certifications (unchanged) | core **0027**, notifications **0009**, assessments 0023, curriculum 0007 |
| Inertia error contract | `apps/core/inertia_errors.py` (`flash_inertia_errors`) + `errors` shared prop | same |
| Shared props | auth, csrfToken, flash, platform, errors | + `aiConnector` |
| Email base URL | `PLATFORM_PUBLIC_BASE_URL` / `SITE_URL` | `PLATFORM_PUBLIC_BASE_URL` (other emails use `VIRTUAL_CAMPUS_BASE_URL`) |

Landed in batch 1: player look/behaviour, landing page pack, builder/enrollment bug fixes,
completion moment + completion/certificate notifications, free preview lessons, instructor
course analytics, quiz explanations/hints/LaTeX. Verified by unit/integration tests only — the
manual test plan is the browser pass.

## 1. Operating playbook (what worked)

1. **One slice = one LMS worktree** cut from `origin/main` (`git worktree add ../lms-<slug> -b feat/<slug> origin/main`), `npm ci` in each (lockfiles differ; never reuse another checkout's `node_modules`). Python: `DEBUG=True ../lms/venv/bin/python`.
2. **Agent brief template** (Opus for implementation, Fable for review): Step 0 confirm the gap in the code; write a 10-line plan under `docs/superpowers/specs/` (gitignored); Inertia rules (props from Django views, POST → validate → message → redirect, `flash_inertia_errors` for field errors, no browser JSON calls; keep existing REST views untouched unless the PR is about them); MUI 9 rules (`sx` not system props, `slotProps`, Grid `size`, `*Outlined` icons, `color="textSecondary"`); theme tokens/dark mode; test-first; verification set (`manage.py check`, `makemigrations --check --dry-run`, focused pytest, focused Vitest with `--testTimeout=30000`, eslint on changed files, `vite build` to a scratch `--outDir`); report with command tails + `git status --short` + `git diff --stat`. Agents never run `git stash/checkout/reset/commit`; the orchestrator commits.
3. **Review** with an independent reviewer (Opus deep review, then Fable pre-merge), fix findings as a second commit, rebase onto `origin/main` (it moves — release-assets bot + other merges), run the focused tests again, push with `--force-with-lease=<branch>:<sha>`.
4. **Merge order** small/independent first; anything touching `apps/core/views.py`, `apps/progression/views.py`, player files or `navigation.js` will conflict with its neighbours — rebase each after the previous merge.
5. **Virtual sync** per slice: worktree from Virtual `origin/main`, `git fetch upstream '+refs/remotes/origin/main:refs/remotes/upstream/origin-main'`, `git cherry-pick -x <lms commits>` (never the merge commit), adapt: migration numbers (see table), `frontend/src/pages/public/*` is Virtual-owned (re-wire by hand), `primaryCta.js` = "ENROLL NOW", shared props include `aiConnector`, AI-connector code paths (`quiz_properties.py`, `expected_version`) may need the same field additions. Sync report in `docs/sync-reports/` (needs `git add -f`: `docs/` is in `.git/info/exclude`). PR via `airads-pr-review` (ready, not draft, since the LMS PR is merged), merge with `--merge`.
6. **Pitfalls hit**: shared stash list across worktrees (never stash); `grep`-filtered test output masks exit codes (check counts, not `&&`); a worktree without `npm ci` after a dependency-adding merge shows spurious Vitest FAILs; Django's `TruncBase` raises on MySQL without tz tables (check `has_zoneinfo_database` first); `useAutosave` `enabled` flips move the saved baseline (use `canSave`/omit fields instead); `question banks` renamed builder props to `questionLibraryVersions`.
7. **Test plan**: extend `virtual/docs/manual-tests/` with a numbered section per slice, one row per behaviour with the expected result.

## 2. Backlog

Sizes: S ≤ ½ day, M ≈ 1 day, L ≈ 2–3 days (agent time is much shorter, review/sync dominate).
"Sync" = Virtual adaptations to expect.

### Tier 1 — small, mostly wiring what the backend already has (do first)

**T1.1 Instructor support actions (S–M)** — Reset lesson, Mark lesson complete (reason required), Grant extra quiz attempt (1–5 + reason), Return assignment for resubmission, Extend access (new expiry + reason). Backend: service functions exist in `apps/learning_operations/learner_management.py` (`reset_lesson_completion`, grant/return); add `mark_lesson_complete`, `extend_access`; every action writes `LearnerManagementAudit`. Expose as Inertia POST routes under `instructor/programs/<pk>/learners/<enrollment>/…` (instructor-scoped via `get_object_in_instructor_scope`), redirect back to the learner page; leave `LessonCompletionResetView`/`QuizAttemptGrantView`/`AssignmentReturnView` JSON views in place (no callers) or delete them in the same PR with a note. UI: `features/students/components/LearnerDetailPanel.jsx` per-row actions with confirm dialogs. Tests: per route auth/effect/audit; cross-program ids rejected. Sync: clean.

**T1.2 Lifecycle notifications (S)** — new types `assignment_submitted`, `quiz_awaiting_grading`, `learner_enrolled` (to program instructors), `offline_order_pending` (to staff). `NotificationService.notify_*` in the existing style (in-app + outbox, preferences, idempotency keys, `_public_url`), fired via `transaction.on_commit` at `student_assignment_submit`, manual-grading attempt creation, enrollment creation paths (`ensure_active_enrollment`, paid fulfilment, free self-enrol), offline order placement. Choices migration: LMS notifications **0009** → Virtual **0010**. Icons in `NotificationPanel.jsx` + `notifications/pages/Index.jsx`. Sync: renumber migration, union the choices (Virtual has `scheduled_session`).

**T1.3 Honest ratings and reviews (S–M)** — `Program.rating_average`/`rating_count` computed from approved `ProgramReview`s only (`recompute_program_rating` on approve/reject/create/delete); model defaults 4/60 → 0/0 + data migration recomputing all programs (LMS core **0026** → Virtual **0028**); remove the rating/count fields from `SettingsPanel.jsx` and ignore them in `instructor_program_update_settings`; public payload `rating{average,count,breakdown}`; "No reviews yet" on course page, catalogue cards, related courses (drop the hard-coded 4.5 in `apps/progression/views.py`); "Write a review" in the public Reviews tab for learners allowed by `program_review_submit`'s rule, posting to the existing route with `next`. Sync: Virtual's `ProgramDetail.jsx` Reviews tab wiring by hand.

**T1.4 Lesson materials in the player (S)** — builder saves `properties.files` (`instructor_lesson_file_upload`) but the player only renders files for assessments. Shared `Stage/LessonMaterials.jsx` used by `Whiteboard.jsx` and `AssessmentRenderer.jsx`; ensure `files` passes through `_build_player_node_payload` and the preview allowlist in `apps/curriculum/preview.py` for previewable lessons; sidebar `hasMaterials` paperclip. Tests on payloads. Sync: clean.

**T1.5 Notification preferences page (S)** — Inertia page `notifications/preferences/` over `NotificationPreference` (per-type channels + digest frequency), grouped rows, role-filtered types, POST → save → redirect; links from the bell panel, Index header and Account nav. Keep `api_preferences` or remove it (no frontend caller). Sync: clean.

**T1.6 Navigation + small fixes (S)** — link `/admin/reports/`, `/instructor/reports/`, `/admin/reviews/`, `/admin/blueprints/` in `navigation.js`; dedupe Profile/Settings entries; extract the builder `QATab` into `course-builder/components/QATab.jsx` and render it in `CodeLabEditor.jsx` (currently renders nothing) and `AssessmentEditor.jsx`; server-side `search` for `/instructor/students/` (`instructor_students` ignores GET); assignment submissions list vs grade page parity (serialize `passed`, `passThreshold`, keep score 0, use `attemptNumber`). Sync: Virtual `navigation.js` has extra product entries — merge by hand.

### Tier 2 — medium, presentation and instructor value

**T2.1 My Grades page for learners (M)** — `student/programs/<enrollment>/grades/` → `Student/CourseGrades`: columns from `apps/progression/gradebook_columns.py::resolve_gradebook_columns`, only **published** grades, overall via the gradebook's strategy helper (never re-implement the formula), status chips graded/pending/missing, unpublished notice; links from the course overview and sidebar; "Grades published" notification `action_url` → this page. Sync: clean.

**T2.2 Letter-grade scale editor + grade display setting (M)** — canonical `letter_scale` `[{letter,min_percent}]` helper (`apps/assessments/grade_scales.py`: normalise/validate/`letter_for_percent`), used by the gradebook and T2.1; editor section in `components/GradingSchemaBuilder.jsx` (rows, validation, preview, reset to default) saved through the existing schema/blueprint POST; `grade_display` percent|letter|both. Prefer storing in the existing schema JSON (no migration). Sync: clean.

**T2.3 Coupons (L)** — `Coupon` (code unique CI, percent|fixed, amount, currency, valid window, max uses, per-user limit, program scope M2M, active) + `CouponRedemption`; `apps/commerce/coupons.py` validate/apply (percent proportional, fixed spread, never < 0), redemption recorded idempotently on paid confirmation; `Order.coupon_code`/`discount_minor` (migration) and ledger/refund math on the discounted amount; checkout "Have a coupon?" apply/remove (Inertia POST → `flash_inertia_errors` → redirect; session-stored code; Paystack amount = discounted total); admin `Admin/Commerce/Coupons` list/create/edit/deactivate (staff only). Tests: validation matrix, rounding, scope, limits, idempotency, ledger. Sync: Virtual is Paystack + offline; DigikaTech keeps its Paystack-only lock (coupons allowed).

**T2.4 Bulk free-text message to selected learners (S–M)** — roster toolbar "Message selected" → dialog (subject ≤120, body ≤2000) → Inertia POST `instructor/programs/<pk>/learners/message/` (scoped; ids must belong to the program; ≤500 recipients; `operationId` idempotency) → in-app type `instructor_message` (choices migration, see T1.2 numbering) + outbox email + audit rows → redirect keeping filters. Sync: migration renumber.

**T2.5 Q&A edit/delete + instructor Questions inbox + roster N+1 (M)** — instructor-only edit/delete (add `is_hidden` to `DiscussionPost`/thread if no soft delete; learners never see hidden); `instructor/questions/` page (unanswered filter, per program, paginated, inline reply, link to builder Q&A tab), nav "Questions" with unanswered badge; roster: annotate `Count("completions")`, filter/paginate in the queryset, stream CSV export, constant-query test. Sync: clean.

### Tier 3 — larger, product decisions first

**T3.1 Cohorts/intakes inside a course (L)** — `Cohort` (program, name, start/end, capacity) on `Enrollment`; filters on roster, gradebook, analytics, announcements; drip "days after enrolment" may become "days after cohort start". Ask: does AIRADS want one course with many intakes, or one program per intake (today's practice)?
**T3.2 Upcoming intake status + "notify me" (M)** — `Program.status=upcoming`, `start_date`, countdown on the course page, `ProgramInterest` waitlist (Virtual already has an enrollment-interest flow — build on it), email when enrolment opens.
**T3.3 Learner calendar/agenda + ICS (M)** — month/list of assignment due dates, live/in-person sessions, drip unlocks, quiz windows; `calendar.ics` signed feed per learner.
**T3.4 Duplicate whole course (M)** — clone program settings, curriculum, quizzes/pools/questions, files, as a draft; reuse `_clone_node`/`_clone_quiz`; new title/slug; certificates/pricing copied but unpublished.
**T3.5 Video captions/chapters; in-video questions (M–L)** — `.vtt` upload per video lesson + `<track>`; chapters list with seek; optional pause-and-answer questions (reuse quiz questions) with completion gating.
**T3.6 Fee instalments via Paystack plans; bundles (L)** — product decision needed; instalments = Paystack subscription plans mapped to an order schedule; bundles = `ProgramBundle` price + multi-enrolment fulfilment.
**T3.7 Public instructor profiles; catalogue sort/filters; PDF receipts (S–M each)** — profile page from `InstructorProfile` (approved only); sort newest/popular/price + free/paid/delivery filters on `/programs/`; receipt PDF on the order detail page.

Skip for AIRADS (decided): SCORM, memberships, media file manager, points-as-currency, Zoom API provisioning, WP-style email template manager, course pre-moderation (was removed deliberately — needs an explicit decision to revive).

## 3. Suggested sequencing

1. T1.4, T1.5, T1.6 (no conflicts between them) → T1.1 → T2.1 → T2.2 → T2.5 → T1.2 → T1.3 → T2.4 → T2.3.
2. Sync to Virtual after each LMS merge (or in pairs) and append the test-plan section immediately — the manual browser pass is still the only end-to-end verification.
3. DigikaTech receives the same syncs after Virtual, preserving its online-only/Paystack locks.
4. Tier 3 only after the batch-1 test plan has been run and its findings fixed.
