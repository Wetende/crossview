"""
Unified Django settings - controlled by environment variables.
LMS - Django + Inertia.js + React

Set DEBUG=True for development, DEBUG=False for production.
All configuration is done via environment variables (12-factor app pattern).
"""

import os
import importlib.util
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# =============================================================================
# Core Settings (Environment-controlled)
# =============================================================================

# DEBUG mode - controls development vs production behavior
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

# Security
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    if DEBUG:
        # Per-process dev fallback only; never use a static, guessable key.
        SECRET_KEY = os.urandom(32).hex()
    else:
        raise RuntimeError(
            "DJANGO_SECRET_KEY environment variable is required when DEBUG=False."
        )
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

# =============================================================================
# Application Definition
# =============================================================================

INSTALLED_APPS = [
    "unfold",  # Modern admin theme - must be before django.contrib.admin
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party apps
    "rest_framework",
    "corsheaders",
    "inertia",
    # Local apps
    "apps.core",
    "apps.platform",
    "apps.blueprints",
    "apps.curriculum",
    "apps.assessments",
    "apps.discussions",
    "apps.progression",
    "apps.practicum",
    "apps.certifications",
    "apps.content",
    "apps.notifications",
    "apps.messaging",
    "apps.events",
    "apps.reviews",
    "apps.commerce",
]

if DEBUG and importlib.util.find_spec("debug_toolbar"):
    INSTALLED_APPS.append("debug_toolbar")

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # Serve static files in production
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "inertia.middleware.InertiaMiddleware",
    "apps.core.middleware.InertiaShareMiddleware",
    "apps.core.performance.SlowRequestLoggingMiddleware",
]

if DEBUG and "debug_toolbar" in INSTALLED_APPS:
    MIDDLEWARE.insert(1, "debug_toolbar.middleware.DebugToolbarMiddleware")

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "django.template.context_processors.csrf",
                "apps.platform.context_processors.platform_branding",
            ],
        },
    },
]

INTERNAL_IPS = ["127.0.0.1"]
WSGI_APPLICATION = "config.wsgi.application"

# =============================================================================
# Database (Environment-controlled)
# =============================================================================

# Use SQLite by default (development), MySQL/PostgreSQL for production
DB_ENGINE = os.getenv("DB_ENGINE", "sqlite3")
DB_CONN_MAX_AGE = int(os.getenv("DB_CONN_MAX_AGE", "60"))
SQLITE_TIMEOUT_SECONDS = int(os.getenv("SQLITE_TIMEOUT_SECONDS", "20"))

if DB_ENGINE == "sqlite3":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
            "CONN_MAX_AGE": 0,
            "OPTIONS": {
                "timeout": SQLITE_TIMEOUT_SECONDS,
            },
        }
    }
elif DB_ENGINE == "mysql":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": os.getenv("DB_NAME", "lms"),
            "USER": os.getenv("DB_USER", "root"),
            "PASSWORD": os.getenv("DB_PASSWORD", ""),
            "HOST": os.getenv("DB_HOST", "localhost"),
            "PORT": os.getenv("DB_PORT", "3306"),
            "CONN_MAX_AGE": DB_CONN_MAX_AGE,
        }
    }
elif DB_ENGINE == "postgresql":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("DB_NAME", "lms"),
            "USER": os.getenv("DB_USER", "postgres"),
            "PASSWORD": os.getenv("DB_PASSWORD", ""),
            "HOST": os.getenv("DB_HOST", "localhost"),
            "PORT": os.getenv("DB_PORT", "5432"),
            "CONN_MAX_AGE": DB_CONN_MAX_AGE,
        }
    }

# =============================================================================
# CORS & CSRF Settings (Required for Inertia/SPA)
# =============================================================================

CORS_ALLOWED_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

CSRF_TRUSTED_ORIGINS = os.getenv(
    "CSRF_TRUSTED_ORIGINS",
    "http://localhost:8001,http://127.0.0.1:8001,http://localhost:8000,http://127.0.0.1:8000"
).split(",")

# Required for Inertia/SPA authentication (JS needs to read CSRF cookie)
# Use Axios/Inertia default names so no frontend config is needed
CSRF_COOKIE_NAME = 'XSRF-TOKEN'  # Axios default cookie name
CSRF_HEADER_NAME = 'HTTP_X_XSRF_TOKEN'  # Axios default header name
CSRF_COOKIE_HTTPONLY = False  # Allow JavaScript to read the cookie
CSRF_COOKIE_SAMESITE = 'Lax'  # Required for SPA cookie handling
CSRF_USE_SESSIONS = False  # Use cookies, not sessions for CSRF

# =============================================================================
# Security Settings (Production-only when DEBUG=False)
# =============================================================================

if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"

    # HTTPS-related settings (can be disabled via env vars for local testing)
    CSRF_COOKIE_SECURE = os.getenv("CSRF_COOKIE_SECURE", "True") == "True"
    SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "True") == "True"
    SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "True") == "True"
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# =============================================================================
# Authentication
# =============================================================================

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

AUTH_USER_MODEL = "core.User"

AUTHENTICATION_BACKENDS = [
    "apps.core.backends.EmailBackend",
    "django.contrib.auth.backends.ModelBackend",
]

LOGIN_URL = "/login/"
LOGIN_REDIRECT_URL = "/dashboard/"
LOGOUT_REDIRECT_URL = "/"

# =============================================================================
# Internationalization
# =============================================================================

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Nairobi"
USE_I18N = True
USE_TZ = True

# =============================================================================
# Static & Media Files
# =============================================================================

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]

STATICFILES_STORAGE_BACKEND = (
    "django.contrib.staticfiles.storage.StaticFilesStorage"
    if DEBUG
    else "whitenoise.storage.CompressedManifestStaticFilesStorage"
)
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": STATICFILES_STORAGE_BACKEND,
    },
}

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

CACHE_LOCATION = os.getenv("CACHE_LOCATION", str(BASE_DIR / ".cache" / "django"))
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.filebased.FileBasedCache",
        "LOCATION": CACHE_LOCATION,
        "TIMEOUT": int(os.getenv("CACHE_TIMEOUT", "900")),
        "OPTIONS": {
            "MAX_ENTRIES": 5000,
        },
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# =============================================================================
# Third-party Settings
# =============================================================================

INERTIA_LAYOUT = "base.html"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

# =============================================================================
# Application-specific Settings
# =============================================================================

CURRICULUM_NODE_REQUIRED_PROPERTIES = {
    "Lesson": ["title"],
    "Session": [],
    "Unit": [],
    "Year": [],
    "Course": [],
    "Section": [],
}

# =============================================================================
# Logging (Environment-controlled verbosity)
# =============================================================================

LOG_LEVEL = os.getenv("LOG_LEVEL", "DEBUG" if DEBUG else "WARNING")
ENABLE_PERF_LOGGING = os.getenv("ENABLE_PERF_LOGGING", "False").lower() == "true"
SLOW_REQUEST_MS = int(os.getenv("SLOW_REQUEST_MS", "400"))

# Payments
PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY", "")
PAYSTACK_PUBLIC_KEY = os.getenv("PAYSTACK_PUBLIC_KEY", "")
PAYSTACK_WEBHOOK_SECRET = os.getenv("PAYSTACK_WEBHOOK_SECRET", "")
PAYSTACK_CALLBACK_URL = os.getenv("PAYSTACK_CALLBACK_URL", "")

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": LOG_LEVEL,
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO" if DEBUG else "ERROR",
            "propagate": False,
        },
        "apps.core.performance": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}
