# Backend Structure Tasks

## Task 1: Create Settings Directory Structure

**Requirements:** 1

Create the split settings directory structure.

**Files to create:**

-   `config/settings/__init__.py`
-   `config/settings/base.py`
-   `config/settings/development.py`
-   `config/settings/production.py`

---

## Task 2: Migrate Base Settings

**Requirements:** 1

Move shared settings from `config/settings.py` to `config/settings/base.py`.

**Include:**

-   INSTALLED_APPS
-   MIDDLEWARE
-   TEMPLATES
-   AUTH_USER_MODEL
-   REST_FRAMEWORK
-   Static/Media settings
-   Internationalization settings

---

## Task 3: Create Development Settings

**Requirements:** 1

Create `config/settings/development.py` with dev-specific settings.

**Include:**

-   DEBUG = True
-   SQLite database
-   Local ALLOWED_HOSTS
-   Local CORS origins
-   Development logging

---

## Task 4: Create Production Settings

**Requirements:** 1

Create `config/settings/production.py` with production-specific settings.

**Include:**

-   DEBUG = False
-   PostgreSQL database from env vars
-   Security settings (CSRF, XSS, etc.)
-   Production ALLOWED_HOSTS from env

---

## Task 5: Update Entry Points

**Requirements:** 1

Update Django entry points to use new settings path.

**Files to update:**

-   `manage.py` - Set default to `config.settings.development`
-   `config/wsgi.py` - Set default to `config.settings.production`
-   `config/asgi.py` - Set default to `config.settings.production`

---

## Task 6: Delete Old Settings File

**Requirements:** 1

Remove the old monolithic settings file.

**Files to delete:**

-   `config/settings.py`

---

## Task 7: Add Core App Configuration

**Requirements:** 2, 3

Ensure core app has proper structure.

**Files to create/update:**

-   `apps/core/apps.py` - CoreConfig class
-   `apps/core/admin.py` - User and Program admin registrations

---

## Task 8: Add Tenants App Configuration

**Requirements:** 2, 4

Ensure tenants app has proper structure.

**Files to create/update:**

-   `apps/tenants/apps.py` - TenantsConfig class
-   `apps/tenants/admin.py` - All tenant model admin registrations

---

## Task 9: Add Blueprints App Configuration

**Requirements:** 2, 5

Ensure blueprints app has proper structure.

**Files to create/update:**

-   `apps/blueprints/apps.py` - BlueprintsConfig class
-   `apps/blueprints/admin.py` - AcademicBlueprint admin registration

---

## Task 10: Add Curriculum App Configuration

**Requirements:** 2, 5

Ensure curriculum app has proper structure.

**Files to create/update:**

-   `apps/curriculum/apps.py` - CurriculumConfig class
-   `apps/curriculum/admin.py` - CurriculumNode admin registration

---

## Task 11: Add Assessments App Configuration

**Requirements:** 2, 5

Ensure assessments app has proper structure.

**Files to create/update:**

-   `apps/assessments/apps.py` - AssessmentsConfig class
-   `apps/assessments/admin.py` - AssessmentResult admin registration

---

## Task 12: Add Progression App Configuration

**Requirements:** 2, 5

Ensure progression app has proper structure.

**Files to create/update:**

-   `apps/progression/apps.py` - ProgressionConfig class
-   `apps/progression/admin.py` - Enrollment, NodeCompletion admin registrations

---

## Task 13: Add Practicum App Configuration

**Requirements:** 2, 5

Ensure practicum app has proper structure.

**Files to create/update:**

-   `apps/practicum/apps.py` - PracticumConfig class
-   `apps/practicum/admin.py` - Rubric, PracticumSubmission, SubmissionReview admin registrations

---

## Task 14: Add Certifications App Configuration

**Requirements:** 2, 5

Ensure certifications app has proper structure (apps.py already exists).

**Files to create/update:**

-   `apps/certifications/admin.py` - CertificateTemplate, Certificate, VerificationLog admin registrations

---

## Task 15: Add Content App Configuration

**Requirements:** 2, 5

Ensure content app has proper structure.

**Files to create/update:**

-   `apps/content/apps.py` - ContentConfig class
-   `apps/content/admin.py` - ContentVersion, ParsedImage admin registrations

---

## Task 16: Update .env.example

**Requirements:** 1

Update environment example file with new settings module variable.

**Add:**

-   `DJANGO_SETTINGS_MODULE=config.settings.development`

---

## Task 17: Verify and Test

**Requirements:** 1, 2, 3, 4, 5, 6

Verify the restructure works correctly.

**Commands to run:**

```bash
python manage.py check
python manage.py makemigrations --dry-run
python manage.py showmigrations
```

**Verify:**

-   No import errors
-   All apps discovered
-   Settings load correctly for each environment
-   Admin interface loads with all models registered
