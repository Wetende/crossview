# Crossview LMS - Blueprint-Driven Learning Management System

A flexible, multi-tenant Learning Management System built with Django and React. Designed as a "Chameleon Engine" that adapts to different educational models through configurable blueprints.

## Overview

Crossview LMS solves the fragmentation in the Kenyan education market by abstracting academic structure into a configuration layer called "The Blueprint." The same engine can power:

- **Theological Programs** - Session-based, reflective learning
- **TVET Programs** - CDACC-compliant competency-based training
- **Vocational Schools** - Practical skills with visual verification
- **Online Courses** - Self-paced with gamification

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Backend | Django 5.0+, Django REST Framework | DRF used for mobile apps & third-party integrations only |
| Frontend | React 19, MUI 7, Inertia.js | Inertia.js is the primary data layer (not REST API) |
| Database | PostgreSQL (production), SQLite (development) | |
| Build | Vite 7, Tailwind CSS | |
| PDF | WeasyPrint (generation), PyMuPDF (parsing) | |
| Testing | pytest, pytest-django, Hypothesis | |

> **Architecture Note**: Frontend uses **Inertia.js** for page rendering and data fetching. Django views return React components with props directly - no separate REST API needed for the web app. DRF is reserved for mobile apps and third-party integrations.

## Project Structure

```
crossview/
├── apps/                    # Django apps
│   ├── core/               # User, Program models
│   ├── blueprints/         # Academic blueprint configuration
│   ├── curriculum/         # Curriculum tree (recursive nodes)
│   ├── assessments/        # Grading and results
│   ├── progression/        # Enrollment, progress tracking
│   ├── practicum/          # Media submissions, rubrics
│   ├── certifications/     # Certificate generation
│   ├── content/            # PDF parsing, content versions
│   └── tenants/            # Multi-tenancy
├── config/                 # Django settings
│   ├── settings/
│   │   ├── base.py        # Shared settings
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   └── wsgi.py
├── frontend/               # React frontend
│   └── src/
│       ├── components/
│       ├── Pages/
│       ├── theme/
│       └── contexts/
├── templates/              # Django templates
├── static/                 # Static files
├── manage.py
├── requirements.txt
└── package.json
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 12+ (or SQLite for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Wetende/crossview.git
   cd crossview
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # or: venv\Scripts\activate  # Windows
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Install Node dependencies**
   ```bash
   npm install
   ```

5. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

6. **Run migrations**
   ```bash
   python manage.py migrate
   ```

7. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

### Development

Run both servers in separate terminals:

```bash
# Terminal 1: Django backend
python manage.py runserver

# Terminal 2: Vite frontend
npm run dev
```

Access the app at `http://localhost:8000`

## Key Features

### Blueprint System
Configure academic structure via JSON:
```json
{
  "hierarchy_structure": ["Year", "Unit", "Session"],
  "grading_logic": {
    "type": "weighted",
    "components": [
      {"name": "CAT", "weight": 0.3},
      {"name": "Exam", "weight": 0.7}
    ]
  }
}
```

### Curriculum Tree
Recursive node structure supporting unlimited depth:
- Programs → Years → Units → Sessions
- Or: Qualifications → Modules → Competencies → Elements

### Assessment Modes
- **Weighted** - CAT + Exam percentages
- **Competency** - Competent / Not Yet Competent
- **Rubric** - Multi-dimensional scoring
- **Visual Review** - Photo/video verification

### Practicum Workflow
1. Student uploads media (audio/video)
2. Lecturer reviews against rubric
3. Approve, request revision, or reject
4. Completion unlocks next content

### Certificate Generation
- Auto-generated on program completion
- Unique serial numbers
- Public verification URL
- PDF with customizable templates

### Multi-Tenancy
- Subdomain-based isolation
- Custom branding per tenant
- Subscription tiers with limits
- Usage tracking

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=apps

# Run specific app tests
pytest apps/blueprints/
```

## Documentation

| Document | Description |
|----------|-------------|
| `understand` | Business context and architecture vision |
| `frontend.md` | Frontend design system and patterns |
| `docs/dashboard-architecture.md` | Unified dashboard layout system |
| `docs/services-layer.md` | Services layer pattern and implementation |
| `docs/inertia-architecture.md` | Inertia.js integration details |
| `docs/course_management.md` | Course and curriculum management |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DJANGO_SECRET_KEY` | Django secret key |
| `DJANGO_DEBUG` | Debug mode (True/False) |
| `DATABASE_URL` | PostgreSQL connection string |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts |
| `CORS_ALLOWED_ORIGINS` | Frontend origins for CORS |

## License

MIT License - See LICENSE file for details.
