# LMS

The canonical shared Learning Management System used by the Airads and
DigikaTech products. It is a Django and React monolith: Django owns routing,
authentication, domain logic, and Inertia responses, while React provides the
public pages, dashboards, course builder, and course player.

## Repository role

This repository is the authoritative home of the shared LMS engine.

- Generic course creation, delivery, assessment, progression, reporting, and
  commerce behavior is accepted here first.
- A generic improvement may be prototyped in Airads, but it becomes official
  only after it is audited, promoted here, and verified.
- Airads and DigikaTech receive accepted engine changes from this repository.
- Product branding, public marketing pages, admissions content, and branded
  assets remain in their owning product repositories.

See [`docs/shared-engine-playbook.md`](docs/shared-engine-playbook.md) and
[`docs/upstream-sync.md`](docs/upstream-sync.md) before moving changes between
repositories.

## Core capabilities

- Course and program creation, publishing, and management
- Course builder with sections, lessons, quizzes, assignments, and resources
- Course player with progress tracking, prerequisites, and drip access
- Assessments, rubrics, grading, reviews, and certificates
- Student, instructor, and administrator dashboards
- Enrollment, payments, orders, and Paystack integration
- Reports, inquiries, notifications, and public program discovery
- Configurable platform policies and product extension points

The LMS is inspired by mature course platforms such as MasterStudy: the shared
engine centers on authoring courses, delivering them reliably, and giving each
role a focused dashboard.

## Technology

| Layer           | Technology                                               |
| --------------- | -------------------------------------------------------- |
| Backend         | Django 5, Django REST Framework where an API is required |
| Web application | React 19, Inertia.js, MUI, Tailwind CSS                  |
| Database        | PostgreSQL in production, SQLite for local development   |
| Build           | Vite 7                                                   |
| Testing         | pytest, pytest-django, Vitest, Testing Library           |
| Documents       | WeasyPrint and PyMuPDF                                   |

Inertia.js is the primary web data path. Django views render React components
with props directly; a separate REST service is not required for normal web
navigation.

## Ownership boundary

Shared engine work normally includes:

- `apps/curriculum/`, `apps/progression/`, `apps/assessments/`,
  `apps/certifications/`, `apps/reviews/`, and `apps/commerce/`
- `frontend/src/features/course-builder/`
- `frontend/src/features/course-player/`
- Generic dashboard, program-management, reporting, and platform behavior

Product-only work normally includes:

- `frontend/src/pages/public/`
- Product navigation, footers, logos, copy, and visual assets
- Admissions, campus, school, event, and marketing content
- Host-specific deployment settings and product seed data

Split mixed work into separate commits before promotion.

## Local setup

### Prerequisites

- Python 3.10+
- Node.js 20+
- PostgreSQL for production, or SQLite for local development

```bash
git clone git@github.com:Wetende/crossview.git lms
cd lms

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
npm install

cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
```

## Development

Run Django and Vite in separate terminals:

```bash
source .venv/bin/activate
python manage.py runserver
```

```bash
npm run dev
```

Open `http://localhost:8000`.

## Verification

Use normal automated checks first. Browser automation is reserved for behavior
that cannot be established through focused Django or React tests.

```bash
source .venv/bin/activate
python manage.py check
python manage.py makemigrations --check --dry-run
python -m pytest -q
npm test
npm run build
```

For cross-repository promotions, run the complete gates and record the accepted
refs and exclusions under `docs/sync-reports/`.

## Shared-engine workflow

1. Classify the request as `shared-engine`, `product-only`, or `mixed`.
2. Isolate generic behavior from branded or public-site work.
3. Promote the reviewed generic commit into this repository.
4. Verify this repository as the canonical implementation.
5. Synchronize the accepted change into Airads and DigikaTech sequentially.

Do not maintain three independent implementations of the same LMS behavior.

## Documentation

| Document                                                               | Purpose                                       |
| ---------------------------------------------------------------------- | --------------------------------------------- |
| [`docs/shared-engine-playbook.md`](docs/shared-engine-playbook.md)     | Change classification and ownership rules     |
| [`docs/shared-surface-manifest.md`](docs/shared-surface-manifest.md)   | File-level sharing boundary                   |
| [`docs/upstream-sync.md`](docs/upstream-sync.md)                       | Sequential promotion and verification runbook |
| [`docs/course-builder-taxonomy.md`](docs/course-builder-taxonomy.md)   | Builder structure and terminology             |
| [`docs/inertia-architecture.md`](docs/inertia-architecture.md)         | Django and React integration                  |
| [`docs/dashboard-architecture.md`](docs/dashboard-architecture.md)     | Shared dashboard structure                    |
| [`docs/paystack-webhook-runbook.md`](docs/paystack-webhook-runbook.md) | Payment webhook operations                    |
