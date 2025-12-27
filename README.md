# Crossview LMS - Blueprint-Driven Learning Management System

A flexible, **single-tenant deployable** Learning Management System built with Django and React. Designed as a "Chameleon Engine" that adapts to different educational models through configurable blueprints.

## Overview

Crossview LMS solves the fragmentation in the Kenyan education market by abstracting academic structure into a configuration layer called "The Blueprint." The same codebase can power:

- **Theological Programs** - Session-based, reflective learning
- **TVET Programs** - CDACC-compliant competency-based training
- **Vocational Schools** - Practical skills with visual verification
- **Online Courses** - Self-paced with gamification
- **Custom Programs** - Build your own blueprint

## Deployment Model

This is a **template-based single-tenant** system designed for agencies:

```
┌─────────────────────────────────────────────────────────────────┐
│                    ONE MASTER CODEBASE                          │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Angel Beauty    │  │ Netty Tech      │  │ Future Client   │
│ angelbeauty.com │  │ netty.com       │  │ theirdomain.com │
│ TVET Mode       │  │ Online Mode     │  │ Custom Mode     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### How It Works

1. **Fork** the master codebase for each client
2. **Deploy** to their server/domain
3. **Run Setup Wizard** to configure mode, branding, features
4. **Create courses** via Admin dashboard
5. **Handover** to client admin

No code changes required per client — only dashboard configuration!

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Backend | Django 5.0+, Django REST Framework | DRF used for mobile apps & third-party integrations only |
| Frontend | React 19, MUI 7, Inertia.js | Inertia.js is the primary data layer (not REST API) |
| Database | PostgreSQL (production), SQLite (development) | |
| Build | Vite 7, Tailwind CSS | |
| PDF | WeasyPrint (generation), PyMuPDF (parsing) | |
| Testing | pytest, pytest-django, Hypothesis | |

> **Architecture Note**: Frontend uses **Inertia.js** for page rendering and data fetching. Django views return React components with props directly - no separate REST API needed for the web app.

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
│   └── tenants/            # Platform settings & setup wizard
├── config/                 # Django settings
├── frontend/               # React frontend
│   └── src/
│       ├── components/
│       ├── Pages/
│       │   └── SuperAdmin/
│       │       └── Setup/  # Setup Wizard pages
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

1. **Clone/Fork the repository**
   ```bash
   git clone https://github.com/Wetende/crossview.git client-lms
   cd client-lms
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   npm install
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

### Development

```bash
# Terminal 1: Django backend
python manage.py runserver

# Terminal 2: Vite frontend
npm run dev
```

Access the app at `http://localhost:8000`

### First-Time Setup

1. Login as superuser
2. Navigate to `/setup/` 
3. Complete the 4-step wizard:
   - **Step 1**: Institution info (name, email, etc.)
   - **Step 2**: Deployment mode (TVET, Theology, Online, Custom)
   - **Step 3**: Branding (logo, colors)
   - **Step 4**: Feature toggles (certificates, gamification, etc.)

## Key Features

### Setup Wizard
Configure your entire platform without touching code:
- Select deployment mode (auto-configures terminology & grading)
- Upload institution logo and brand colors
- Enable/disable features per deployment

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

### Deployment Modes

| Mode | Terminology | Assessment | Features |
|------|-------------|------------|----------|
| **TVET** | Qualification → Module → Element | Competency-based | Portfolio, Certificates |
| **Theology** | Program → Year → Session | CAT + Exam | Practicum uploads |
| **Online** | Course → Module → Lesson | Progress-based | Gamification, Badges |
| **Driving** | License Class → Unit → Lesson | Instructor checklist | Hours tracking |
| **Custom** | You define | You define | You choose |

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

### Feature Flags
Per-deployment control over:
- ✅ Certificates & verification
- ✅ Practicum/media uploads
- ✅ Gamification & badges
- ✅ Self-registration
- ✅ Payment processing (coming soon)

## Agency Workflow

```
New Client Request
      │
      ▼
┌─────────────────┐
│ 1. Fork Repo    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. Deploy       │──→ Their server (e.g., angelbeauty.com)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. Setup Wizard │──→ Configure mode, branding, features
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. Create       │──→ Programs, courses, curriculum
│    Content      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. Create Admin │──→ Client admin account
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 6. Handover     │──→ Client manages their system
└─────────────────┘
```

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
