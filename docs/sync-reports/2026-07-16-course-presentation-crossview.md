# Shared Course Presentation in Crossview — 2026-07-16

## Recorded refs and commits

- Canonical base: `ed0184818bb29b802cb0bed5598c44ce776b5bdf`
- Shared presentation and builder layout: `ea9cc62038618ef3b7fb4853787ecd90982f47fb`
- Canonical public-page wiring: `f9e627d9`
- Shared MUI compatibility correction: `bc42beed3b8b3971d27a1c50460791d69c3b777a`

## Canonical implementation

- Added presentational course-detail and six-tab course-content components under
  the programs feature.
- Added grey metric rows, single-open curriculum sections, initially collapsed
  FAQ and Notice accordions, sanitized rich content, and responsive tab
  scrolling with keyboard and focus behavior.
- Preserved the Description, Resources, and Reviews content-specific layouts.
- Added one shared `COURSE_BUILDER_SIDEBAR_WIDTH = 360` constant and applied it
  to curriculum and settings sidebars without changing builder behavior.
- Wired the canonical public page while retaining the LMS public navigation,
  enrollment actions, footer, and 4/8 content grid.
- Added presentation and builder regression tests.

## Boundary decisions

- Shared components, styles, tests, and builder width are `shared-engine`.
- Public page wiring remains product-owned and was promoted selectively.
- No model, migration, URL, payload, player, quiz, or generated-asset changes
  were made.
- No fork identity literal was introduced into shared source.

## Verification evidence

| Gate | Result |
| --- | --- |
| Focused presentation and builder tests | Passed: 7 tests |
| Full Vitest | Passed: 26 files, 80 tests |
| Changed-file ESLint | Passed |
| Full ESLint | Existing backlog: 130 errors, 14 warnings in untouched files |
| Production build | Passed: 19,718 modules transformed |
| `python manage.py check` | Passed: zero issues |
| Migration drift | Passed: no changes detected |
| Full backend pytest | Passed: 711 tests |
| `git diff --check` | Passed |
| Generated asset audit | Passed: no `static/dist` changes retained |

## Propagation decision

Promote the two shared commits unchanged, then wire each fork's public course
page separately so navigation, enrollment, footer, branding, and product policy
remain fork-owned.
