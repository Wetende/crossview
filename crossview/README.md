# Crossview LMS - Django Edition

> 🔄 **Migration from PHP/Laravel to Python/Django**

This is the new Django-based Crossview LMS, migrated from the original Laravel implementation.

## Tech Stack

- **Backend:** Django 5.0 + Django REST Framework
- **Frontend:** Vue.js 3 (Composition API)
- **Glue:** Inertia.js (`inertia-django` + `@inertiajs/vue3`)
- **Build:** Vite
- **Database:** PostgreSQL
- **Testing:** pytest + Hypothesis (property-based testing)

## Project Structure

```
crossview/
├── config/              # Django project settings
├── apps/                # Django apps
│   ├── core/           # User model, auth
│   ├── blueprints/     # Academic blueprints
│   ├── curriculum/     # Curriculum nodes
│   ├── assessments/    # Grading strategies
│   ├── progression/    # Progress tracking
│   ├── certifications/ # Certificate generation
│   ├── practicum/      # Media submissions
│   ├── content/        # PDF parsing
│   └── tenants/        # Multi-tenancy
├── frontend/           # Vue.js frontend
│   └── src/
│       ├── Pages/      # Inertia pages
│       └── main.js     # Vue entry point
├── templates/          # Django templates
├── static/             # Static files
└── tests/              # Test files
```

## Setup

### 1. Create virtual environment
```bash
cd crossview
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
```

### 2. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 3. Install Node dependencies
```bash
npm install
```

### 4. Configure environment
```bash
copy .env.example .env
# Edit .env with your database credentials
```

### 5. Run migrations
```bash
python manage.py migrate
```

### 6. Start development servers

Terminal 1 (Django):
```bash
python manage.py runserver
```

Terminal 2 (Vite):
```bash
npm run dev
```

Visit http://localhost:8000

## Specs

All feature specs are in `.kiro/specs/` and have been updated for Django implementation.
