# Assessment, Gradebook, and Certificate Parity Plan

## Summary
Rebuild the assessment flow around immutable attempts, auto-calculated grades, and manual certificate release so Digika behaves consistently for quizzes, assignments, marking, retries, reporting, and certification.

Core rules:
- Quizzes and assignments both use attempt history as the source of truth.
- Official results use the learner’s best finalized attempt.
- Assignment submission no longer marks completion by upload alone.
- Final course grades are auto-calculated and regenerated from official results.
- Certificates are manually released by admins only after eligibility is met.

## Key Changes
### 1. Attempt-driven assessment model
- Convert assignment submissions from a single mutable row into immutable attempt records.
- Remove the single-record-per-student assignment constraint and add `attempt_number`, attempt lifecycle status, and official-result selection.
- Add child media assets for assignment attempts and instructor reviews so one attempt can carry multiple files, audio clips, and videos.
- Backfill existing assignment rows as `attempt_number = 1`.

### 2. Assignment workflow and teacher marking
- Enforce assignment attempt caps server-side using the configured `assignment_attempts`; empty means unlimited.
- Add explicit attempt states: `started`, `submitted`, `graded`, `returned`.
- Replace the current instructor review flow with attempt-aware review:
  - show full attempt history
  - show submitted text/files/audio/video
  - allow score, pass/fail result, written review, and media review attachments
- Derive pass/fail from the scored result instead of hardcoded thresholds.
- Make the official assignment result equal the highest graded attempt score for that learner and assignment.
- If a newer attempt is still pending review, the previously best graded attempt remains the official result until grading happens.

### 3. Quiz retry and result rules
- Keep raw quiz scoring based on correct answers only; no hidden retake penalty.
- Make best quiz attempt the official quiz result for downstream gradebook and certification.
- Enforce `retake_after_pass` from builder settings:
  - if `false`, stop retries once any passing attempt exists
  - if `true`, allow retries until `max_attempts` is exhausted
- Keep `max_attempts` as total allowed submissions.
- Show both attempt history and official/best result consistently in learner and instructor views.

### 4. Completion rules for assessment nodes
- Remove upload-only completion for graded assignment nodes.
- Evaluate assignment completion against official graded results only.
- Standardize node completion as:
  - `question_only`: complete when the official quiz result satisfies the node rule
  - `submission_only`: complete when the official assignment result satisfies the node rule
  - `mixed`: complete only when both the official quiz result and official assignment result satisfy the node rule
- Keep course completion dependent on actual assessment completion, not just submission presence.

### 5. Auto-calculated gradebook and regenerate flow
- Make auto-calculated grades the source of truth for final course results.
- Replace manual final-grade entry with derived results from official quiz and assignment results.
- Preserve Digika’s blueprint grading logic as the aggregation rule instead of forcing MasterStudy’s equal-weight formula.
- Add grade regeneration for instructor, admin, and student flows.
- Regeneration should recompute:
  - official per-assessment results
  - overall course grade
  - pass/fail status
  - letter grade where the blueprint supports it
  - certificate eligibility state
- Keep publish/visibility controls if needed, but remove manual score entry as the main workflow.

### 6. Reports and analytics for the assessment domain
- Rework the instructor gradebook payload to match the frontend’s richer expectations:
  - quiz columns
  - assignment columns
  - per-student quiz scores
  - per-student assignment scores
  - official overall score
- Add assessment reporting based on official results and attempt history:
  - pending assignment reviews
  - pass/fail counts
  - average progress
  - average course grade
  - quiz and assignment completion/pass counts
  - certificate queue counts
- Scope analytics to the assessment/certification module, not commerce or revenue reporting.

### 7. Certificate redesign with admin-only manual release
- Stop issuing certificates automatically on enrollment completion.
- Introduce a certificate eligibility queue separate from issued certificates.
- Eligibility is created or refreshed when:
  - the enrollment is complete
  - official course grade satisfies the blueprint pass rule
  - all required assessment completion rules are satisfied
- Allow admins only to approve issuance from the queue.
- Instructors can see certificate eligibility state, but cannot release certificates.
- On admin approval:
  - generate the certificate
  - assign serial number
  - render/store PDF
  - mark the queue item as released
- Prevent duplicate issuance per enrollment.
- Because no certificates have been released yet, redesign the certificate workflow cleanly and backfill currently eligible completed learners into the pending queue.
- Support template selection as `program override -> blueprint default`.

## Public APIs / Interface Changes
- Assignment runtime and submission APIs should return:
  - `attempts`
  - `attemptsRemaining`
  - `maxAttempts`
  - `officialAttempt`
  - `reviewStatus`
  - attached media metadata
- Quiz results payload should expose the official/best attempt alongside attempt history and retry state.
- Gradebook APIs should return derived structures the UI already expects:
  - `quizzes`
  - `assignments`
  - `students[].quizScores`
  - `students[].assignmentScores`
  - `students[].overallScore`
  - grade regeneration actions/status
- Certificate APIs should add:
  - eligibility queue listing
  - admin-only approve/release action
  - release status per enrollment
- Builder interfaces should support full assignment settings for:
  - max attempts
  - attachment permissions/counts
  - audio/video enablement
  - media size limits
  - late submission policy

## Test Plan
- Migration test: existing single assignment submission becomes attempt `#1` with no data loss.
- Assignment attempt enforcement: capped attempts block new submissions after limit; unlimited assignments do not.
- Assignment best-result logic: highest graded attempt becomes official result; pending attempts do not displace an already graded best result.
- Quiz retry policy: `retake_after_pass=false` blocks retries after pass; `true` allows retries until `max_attempts`.
- Completion rules:
  - upload alone does not complete graded submission assignments
  - `mixed` nodes require both quiz and assignment success
  - `question_only` and `submission_only` complete only from official results
- Grade regeneration:
  - regrading an assignment updates the official result
  - retaking a quiz updates the official result if the new best score is higher
  - overall course grade recalculates from blueprint rules
- Gradebook payload test: backend returns the same per-assessment data shape the frontend renders.
- Media tests: file/audio/video validation, storage metadata, and instructor review attachments.
- Certificate workflow:
  - eligible enrollments enter the queue
  - ineligible enrollments do not
  - admin approval creates one certificate only
  - instructor approval is rejected
  - repeated approval cannot duplicate issuance
  - verification/download still work after manual release

## Assumptions and Defaults
- `program` remains Digika’s course-equivalent object.
- Blueprint grading logic stays authoritative for final-grade aggregation.
- “Best attempt” means the highest finalized score; ungraded attempts are not official.
- Quiz and assignment attempt limits count total submissions, including the first attempt.
- Certificate release is manual and admin-only, but eligibility is still computed automatically.
- Since no certificates have been issued yet, the certificate module can be refactored without legacy issuance constraints.
