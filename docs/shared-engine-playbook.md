# Shared-Engine Hook and Cross-Repo Sharing Playbook

This document defines how shared LMS work moves across `lms`, `airads`, and `digikatech`.

`lms` is the canonical shared engine. Its local repository is
`/home/wetende/Projects/lms`.

The file-level ownership contract lives in
[`docs/shared-surface-manifest.md`](shared-surface-manifest.md). The executable
promotion sequence and required gates live in
[`docs/upstream-sync.md`](upstream-sync.md).

## Operating Model

- `lms` owns the shared LMS engine.
- `airads` can be the fast working lab for shared LMS improvements.
- `digikatech` and `airads` should receive accepted shared engine changes back from `lms`.
- Public pages, branding, admissions/marketing content, and tenant-specific seed/demo content stay fork-specific unless intentionally generalized.

## The Hook

Before starting any change, classify it into exactly one bucket:

- `shared-engine`
  - Improves how institutions create, build, publish, manage, or consume courses.
  - Includes supporting backend work for course builder, course player, course/program creation, curriculum flow, assessments, progression, and generic admin workflows.
- `fork-only`
  - Public pages
  - Branding and tenant-specific copy
  - Admissions, campus, news, and marketing content
  - Tenant-specific demo or seed content
- `mixed`
  - Contains both shared engine and fork-only work and must be split before promotion.

## Decision Rule

Use this rule:

- If the change would help any institution use the LMS engine better, it is `shared-engine`.
- If the change is visible only because of tenant identity, storytelling, or public-site presentation, it is `fork-only`.

## Fixed Checklist

Use this checklist before coding, before the first commit, and before promoting work into `lms`.

1. Does this touch course player, course builder, course/program creation, publishing, curriculum structure, assessments, progression, or generic admin course flow?
2. Would another institution benefit from the same behavior with different branding or content?
3. Does the change include hardcoded institution names, domains, public copy, assets, or tenant-specific seed data?
4. Can the logic be expressed using platform settings, shared props, or generic configuration instead of tenant literals?
5. If mixed, what files or edits must be split into a separate fork-only commit?

Interpretation:

- `yes` to 1 or 2 means `shared-engine`
- `yes` to 3 means split or rework before sharing
- `yes` to 4 means make it dynamic before promotion
- `yes` to 5 means do not commit as one bundle

## Ownership Boundary

Default `shared-engine` ownership:

- `frontend/src/features/course-builder`
- `frontend/src/features/course-player`
- `frontend/src/features/programs`
- curriculum tree building and serialization
- program publish and change-request flow
- generic assessment and progression behavior tied to learning flow
- shared branding/config mechanisms such as platform settings, payloads, and generic layout fallbacks

Default `fork-only` ownership:

- `frontend/src/pages/public`
- tenant-specific nav and footer variants
- admissions, campus, news, and marketing sections
- tenant-specific assets and copy
- tenant-specific seed and simulation content unless intentionally generalized

Important rule:

- If backend, model, service, or view changes are required to support builder, player, or course-creation behavior, they still count as `shared-engine` even if they live outside those frontend folders.

## Fork Product Locks

The shared engine supports an optional `LMS_PLATFORM_POLICY` Django setting for
forks whose product identity or learning mode must not be changed at runtime.
The policy mechanism is shared; the configured values remain fork-only.

When the setting is absent, every capability defaults to enabled and the
platform behaves exactly like a configurable LMS deployment. A fork may
lock any of these values:

- `institution_name` and `tagline`
- `logo_url` and `favicon_url`
- `primary_color` and `secondary_color`
- `deployment_mode` and `blueprint_mode`
- `setup_complete`
- individual `feature_overrides`

The `capabilities` mapping controls whether identity, branding, deployment,
presets, academic blueprints, feature flags, setup, registration, the frontend
general-settings page, and subscription UI can be managed or shown. Locked
values are enforced by the model and services as well as being removed from
admin and navigation surfaces.

Operational data remains tenant-managed: contact details, currency, course
levels, program categories, public content, and social links are not hardcoded
by the generic policy mechanism.

## Promotion Workflow

For all shared engine work, use this exact order:

1. Start in `airads` when speed matters.
2. Build only the generic behavior first, or split mixed work before committing.
3. Create a `shared-engine` commit in `airads` with no branding or public-page payload.
4. Promote that commit into `lms`.
5. Verify in `lms`.
6. Treat `lms` as the official parent version of the feature.
7. Pull `lms/main` back into `airads`.
8. Pull `lms/main` into `digikatech`.

Important convention:

- Never maintain separate equivalent shared commits in all three repos long-term.
- Once a shared change is accepted, `lms` becomes the only authoritative source of that behavior.

## Validation

Before promoting shared work:

- Review changed files against the ownership boundary.
- Search for tenant literals and public-site copy.
- Confirm shared work uses settings, config, or shared props instead of hardcoded institution values.
- Confirm the change would make sense for at least one non-originating tenant.
- Split mixed work into separate commits before promotion.
- Run every required backend and frontend gate from a clean integration
  worktree before updating a shared remote branch.
- Record the promoted refs, exclusions, commands, and results under
  `docs/sync-reports/`.

## Acceptance Criteria

This playbook is working when:

- A developer can classify a change as `shared-engine`, `fork-only`, or `mixed` in under 2 minutes.
- Shared engine commits can move from a fork into `lms` without carrying tenant branding or public-page content.
- `lms` remains the single canonical home for accepted shared behavior.
- `digikatech` receives shared work by syncing from `lms`, not by parallel reimplementation.
