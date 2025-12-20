# Backend Structure Design

## Architecture Overview

```
crossview-lms/
├── manage.py
├── README.md
├── requirements.txt
├── .gitignore
├── .env
├── pytest.ini
│
├── config/                          # Project configuration
│   ├── __init__.py
│   ├── urls.py
│   ├── wsgi.py
│   ├── asgi.py
│   └── settings/                    # Split settings by environment
│       ├── __init__.py
│       ├── base.py                  # Common settings
│       ├── development.py           # Dev-specific settings
│       └── production.py            # Prod-specific settings
│
├── apps/                            # All Django apps
│   ├── __init__.py
│   │
│   ├── core/                        # Foundation app
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── admin.py
│   │   ├── models.py                # User, Program
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── migrations/
│   │
│   ├── tenants/                     # Multi-tenancy app
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── admin.py
│   │   ├── models.py                # Tenant, TenantBranding, TenantLimits, etc.
│   │   ├── managers.py              # TenantManager, AllTenantsManager
│   │   ├── middleware.py
│   │   ├── mixins.py
│   │   ├── context.py
│   │   ├── context_processors.py
│   │   ├── services.py
│   │   ├── storage.py
│   │   ├── urls.py
│   │   └── migrations/
│   │
│   ├── blueprints/                  # Academic blueprints
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── admin.py
│   │   ├── models.py                # AcademicBlueprint
│   │   ├── services.py
│   │   ├── exceptions.py
│   │   ├── urls.py
│   │   └── migrations/
│   │
│   ├── curriculum/                  # Curriculum management
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── admin.py
│   │   ├── models.py                # CurriculumNode
│   │   ├── services.py
│   │   ├── repositories.py
│   │   ├── exceptions.py
│   │   ├── urls.py
│   │   └── migrations/
│   │
│   ├── assessments/                 # Assessment engine
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── admin.py
│   │   ├── models.py                # AssessmentResult
│   │   ├── services.py
│   │   ├── strategies.py
│   │   ├── validators.py
│   │   ├── serializers.py
│   │   ├── exceptions.py
│   │   ├── urls.py
│   │   └── migrations/
│   │
│   ├── progression/                 # Student progression
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── admin.py
│   │   ├── models.py                # Enrollment, NodeCompletion
│   │   ├── services.py
│   │   ├── urls.py
│   │   └── migrations/
│   │
│   ├── practicum/                   # Practicum submissions
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── admin.py
│   │   ├── models.py                # Rubric, PracticumSubmission, SubmissionReview
│   │   ├── services.py
│   │   ├── validators.py
│   │   ├── storage.py
│   │   ├── exceptions.py
│   │   ├── urls.py
│   │   └── migrations/
│   │
│   ├── certifications/              # Certificates
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── admin.py
│   │   ├── models.py                # CertificateTemplate, Certificate, VerificationLog
│   │   ├── services.py
│   │   ├── signals.py
│   │   ├── urls.py
│   │   └── migrations/
│   │
│   └── content/                     # Content versioning
│       ├── __init__.py
│       ├── apps.py
│       ├── admin.py
│       ├── models.py                # ContentVersion, ParsedImage
│       ├── services.py
│       ├── exceptions.py
│       ├── urls.py
│       └── migrations/
│
├── templates/                       # Global templates
│   ├── base.html
│   └── ...
│
├── static/                          # Global static files
│   ├── css/
│   ├── js/
│   └── images/
│
├── media/                           # User uploads
│
├── frontend/                        # Vue.js frontend
│
├── tests/                           # Project-wide tests
│
└── docs/                            # Documentation
```

## Settings Structure

### config/settings/\_\_init\_\_.py

```python
# Default to development settings
from .development import *
```

### config/settings/base.py

```python
"""
Base settings shared across all environments.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'change-me-in-production')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',
    'corsheaders',
    'inertia',

    # Local apps
    'apps.core',
    'apps.tenants',
    'apps.blueprints',
    'apps.curriculum',
    'apps.assessments',
    'apps.progression',
    'apps.practicum',
    'apps.certifications',
    'apps.content',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'inertia.middleware.InertiaMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

AUTH_USER_MODEL = 'core.User'

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

INERTIA_LAYOUT = 'base.html'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

### config/settings/development.py

```python
"""
Development-specific settings.
"""
from .base import *

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

# Development-specific logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
}
```

### config/settings/production.py

```python
"""
Production-specific settings.
"""
import os
from .base import *

DEBUG = False

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'crossview'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

CORS_ALLOWED_ORIGINS = os.getenv('CORS_ORIGINS', '').split(',')

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
```

## Standard App Structure

Each app follows this pattern:

```
apps/example/
├── __init__.py
├── apps.py              # Django app configuration
├── admin.py             # Admin registrations
├── models.py            # Data models
├── views.py             # View logic (optional)
├── urls.py              # URL patterns
├── services.py          # Business logic (optional)
├── serializers.py       # DRF serializers (optional)
├── exceptions.py        # Custom exceptions (optional)
├── migrations/          # Database migrations
│   └── __init__.py
└── tests/               # App tests (optional)
    └── __init__.py
```

### Example apps.py

```python
from django.apps import AppConfig


class ExampleConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.example'
    verbose_name = 'Example'
```

### Example admin.py

```python
from django.contrib import admin
from .models import ExampleModel


@admin.register(ExampleModel)
class ExampleModelAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'created_at']
    search_fields = ['name']
    list_filter = ['created_at']
```

## Configuration Updates

### manage.py

```python
#!/usr/bin/env python
import os
import sys

def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
    # ... rest of manage.py
```

### config/wsgi.py

```python
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

application = get_wsgi_application()
```

### config/asgi.py

```python
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

application = get_asgi_application()
```

## Environment Variables

### .env.example

```
# Django
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_SETTINGS_MODULE=config.settings.development

# Database (production)
DB_ENGINE=postgresql
DB_NAME=crossview
DB_USER=postgres
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=5432

# Allowed hosts (production)
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# CORS
CORS_ORIGINS=https://yourdomain.com
```

## Migration Strategy

Since this is a restructure (not consolidation), the migration is straightforward:

1. Create `config/settings/` directory structure
2. Move settings from `config/settings.py` to split files
3. Update `manage.py`, `wsgi.py`, `asgi.py` references
4. Add missing `apps.py` and `admin.py` files to each app
5. Delete old `config/settings.py`
6. Test with `python manage.py check`
