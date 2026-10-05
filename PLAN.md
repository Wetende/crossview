# Master Shared-Engine Synchronization & DigikaTech Public Redesign Plan

## Executive Summary & Roadmap Priority

We operate across three codebases (`Wetende/airads`, `Wetende/crossview`, `Wetende/digikatech`) governed by `docs/shared-engine-playbook.md` and `docs/upstream-sync.md`.

Currently, `airads` has served as the active working lab for significant shared LMS engine improvements (`shared-engine`: course builder, course player, progression tracking, prerequisites, drip access scheduling, reviews, and commerce/Paystack). As a result, **`airads` holds the latest, most up-to-date version of the canonical LMS shared engine.**

To preserve architectural integrity and avoid divergence across repositories, our execution roadmap is strictly ordered into two sequential phases:

### Phase 1 (First Priority): Shared LMS Engine Synchronization (`airads` -> `crossview` -> `digikatech`)
Before touching any public-facing frontend work or branding across forks, our immediate priority is to synchronize the canonical parent engine (`crossview`) with the latest core LMS capabilities from `airads`, and then propagate `crossview` down into `digikatech`. 
All three codebases must achieve 100% parity and test suite stability on the shared LMS engine (`frontend/src/features/*`, `apps/core/models.py`, `apps/progression`, `apps/reviews`, `apps/commerce`).

### Phase 2 (Second Priority): DigikaTech Public-Facing Frontend Redesign (`digika/` -> `digikatech/frontend/`)
Only after Phase 1 is verified across all repositories will we initiate the public-facing redesign for DigikaTech Africa. We will take the new public faces/pages from `/home/wetende/Projects/digikatech/digika/` and integrate them into `/home/wetende/Projects/digikatech/frontend/src/pages/public/`. This phase is **100% `fork-only` work** and will be kept strictly isolated in `digikatech` without leaking into `shared-engine` folders or pushing upstream.

---

## Locked Governance Decisions

1. **Canonical Engine Owner**: `crossview` is the permanent source of truth for `shared-engine` behavior once synced.
2. **Promotion Direction**: `airads` (lab) -> cherry-pick/merge into `crossview` (parent engine) -> sync/merge down into `digikatech` (product fork).
3. **Commit Separation (`fork-only` vs `shared-engine`)**: Never bundle `airads` branding or public pages into the `crossview` promotion commits. Never bundle `digikatech` public pages into `shared-engine` commits.
4. **Digika Public Redesign Delivery Strategy (`Option A - Integrated Monolith`)**: We will integrate the `/home/wetende/Projects/digikatech/digika/` pages (`HomePage`, `AboutPage`, `DeliveryPage`, `PartnershipsPage`, `ImpactPage`, `FAQPage`, `ContactPage`, `ProgramsPage`) directly into `digikatech/frontend/src/pages/public/` as Inertia.js pages rather than running `digika/` as a separate SPA on a second port/host. This ensures native Django authentication cookies, unified CSRF handling, single Vite build pipeline, and instant SPA navigation between public pages (`/programs`) and the LMS (`/dashboard`).

---

## Phase 1 Execution Plan: Shared Engine Synchronization

### 1. Triage & Audit `airads` Commits
- Audit recent commits and modified files in `/home/wetende/Projects/airads`.
- Verify boundary cleanly:
  - **Shared Engine to promote**: `apps/core/models.py` (Program settings, prerequisites, drip, ratings), `apps/progression/models.py` (Enrollment expiry, access source), `apps/reviews/`, `apps/commerce/`, `frontend/src/features/course-builder/`, `frontend/src/features/course-player/`, `frontend/src/features/programs/`, `frontend/src/features/dashboard/`.
  - **Fork-Only to leave behind**: `frontend/src/pages/public/*`, `frontend/src/components/common/AiradsLogoLockup.jsx`, `templates/emails/*` with Airads branding, campus/admissions content.

### 2. Promote from `airads` into Canonical Engine (`crossview`)
- In `/home/wetende/Projects/crossview`:
  ```bash
  cd /home/wetende/Projects/crossview
  git remote add airads /home/wetende/Projects/airads || true
  git fetch airads
  ```
- Cherry-pick or merge clean `shared-engine` commits from `airads/main`.
- Run automated verification:
  ```bash
  source .venv/bin/activate
  python manage.py check
  python manage.py migrate
  pytest -q
  npm test -- --run
  ```
- Push verified shared engine: `git push origin main`.

### 3. Propagate from Canonical Engine (`crossview`) into `digikatech`
- In `/home/wetende/Projects/digikatech`:
  ```bash
  cd /home/wetende/Projects/digikatech
  git remote add upstream /home/wetende/Projects/crossview || true
  git fetch upstream
  git checkout main
  git merge upstream/main
  ```
- Resolve any merge conflicts by respecting the boundary:
  - Keep `digikatech` public pages and `DIGIKATECHAFRICA.md` intact.
  - Accept all incoming shared core backend apps (`reviews`, `commerce`, `progression`) and LMS frontend features (`course-builder`, `course-player`).
- Run automated verification:
  ```bash
  source .venv/bin/activate
  python manage.py check
  python manage.py migrate
  pytest -q
  npm test -- --run
  ```

---

## Phase 2 Execution Plan: DigikaTech Public Frontend Redesign (`fork-only`)

Once Phase 1 is verified across all three repos, all changes below will occur in `/home/wetende/Projects/digikatech` as isolated `fork-only` commits.

### 1. Backend Routing & Views (`apps/core`)
Register Django endpoints and views for the four new public pages introduced in `digika/` (`DeliveryPage`, `PartnershipsPage`, `ImpactPage`, `FAQPage`).

#### [MODIFY] `apps/core/views.py`
```python
def delivery_page(request):
    """How We Deliver page."""
    return render(request, "Public/Delivery")

def partnerships_page(request):
    """Partnerships page."""
    return render(request, "Public/Partnerships")

def impact_page(request):
    """Impact page."""
    return render(request, "Public/Impact")

def faq_page(request):
    """FAQ page."""
    return render(request, "Public/FAQ")
```

#### [MODIFY] `apps/core/urls.py`
```python
path("how-we-deliver/", views.delivery_page, name="delivery"),
path("partnerships/", views.partnerships_page, name="partnerships"),
path("impact/", views.impact_page, name="impact"),
path("faq/", views.faq_page, name="faq"),
```

### 2. Frontend Assets & Components (`frontend/src`)

#### [NEW] `frontend/src/assets/digika/`
Copy all imagery from `/home/wetende/Projects/digikatech/digika/src/assets/` into `frontend/src/assets/digika/`:
- `Arduino Robot Car.jpg`, `LEGO Robotics EV3.webp`, `MindstormEV3.jpg`, `DefenderWiseKit.jpg`
- `Robotics & IoT.jpg`, `Coding & Algorithms.jpg`, `Artificial Intelligence.webp`, `Web Design & Dev.jpg`, `Mobile App Dev.jpg`, `Graphics & 3D Design.jpg`
- `DIGIKATECH Main Logo.png`, `Digikatech africa Logo withname.png`

#### [NEW] `frontend/src/pages/public/components/`
- `Navbar.jsx`: Ported from `digika/src/components/Navbar.jsx`. Converted from `react-router-dom` `<Link to>` to `@inertiajs/react` `<Link href>`. Dynamically inspects `usePage().props.auth.user`: if logged in, shows `Dashboard` CTA button (`/dashboard/`); otherwise shows `WhatsApp` & `Enroll Now / Login` CTA.
- `Footer.jsx`: Ported from `digika/src/components/Footer.jsx`, converted to Inertia links.
- `AnimatedRobot.jsx` & `TechDecor.jsx`: Ported verbatim from `digika/src/components/`.
- `RoboticsKits.jsx`: Ported verbatim with asset import paths pointing to `frontend/src/assets/digika/`.

### 3. Frontend Public Pages (`frontend/src/pages/public`)

Every page will be wrapped in the new `Navbar` and `Footer` layout and converted from React Router to Inertia (`<Head title="..." />`, `<Link href="..." />`).

- **`Landing.jsx` (`Public/Landing`)**: Port `HomePage.jsx` from `digika/`. Features Hero section (`AnimatedRobot`), Robotics Kits showcase, Course Categories grid, and Impact banner.
- **`About.jsx` (`Public/About`)**: Port `AboutPage.jsx` from `digika/`. Features company philosophy, African robotics market gap, and leadership values.
- **`Contact.jsx` (`Public/Contact`)**: Port `ContactPage.jsx` from `digika/`. Features contact channels and Axios-CSRF compatible inquiry form.
- **`Programs.jsx` (`Public/Programs`)**: Merge `ProgramsPage.jsx` visual structure from `digika/` with `digikatech` dynamic course grid props (`programs` array from Django backend).
- **`Delivery.jsx` (`Public/Delivery`)** [NEW]: Port `DeliveryPage.jsx` (`/how-we-deliver`).
- **`Partnerships.jsx` (`Public/Partnerships`)** [NEW]: Port `PartnershipsPage.jsx` (`/partnerships`).
- **`Impact.jsx` (`Public/Impact`)** [NEW]: Port `ImpactPage.jsx` (`/impact`).
- **`FAQ.jsx` (`Public/FAQ`)** [NEW]: Port `FAQPage.jsx` (`/faq`).

### 4. Router Resolution (`frontend/src/main.jsx`)

#### [MODIFY] `frontend/src/main.jsx`
Update `publicMap` in `resolvePageLoader`:
```javascript
const publicMap = {
    "Public/Landing": "./pages/public/Landing.jsx",
    "Public/About": "./pages/public/About.jsx",
    "Public/Contact": "./pages/public/Contact.jsx",
    "Public/Programs": "./pages/public/Programs.jsx",
    "Public/ProgramDetail": "./pages/public/ProgramDetail.jsx",
    "Public/Wishlist": "./pages/public/Wishlist.jsx",
    "Public/CertificateVerify": "./pages/public/CertificateVerify.jsx",
    "Public/VerifyCertificate": "./pages/public/VerifyCertificate.jsx",
    "Public/Events": "./pages/public/Events.jsx",
    "Public/EventDetail": "./pages/public/EventDetail.jsx",
    "Public/Delivery": "./pages/public/Delivery.jsx",
    "Public/Partnerships": "./pages/public/Partnerships.jsx",
    "Public/Impact": "./pages/public/Impact.jsx",
    "Public/FAQ": "./pages/public/FAQ.jsx",
    Home: "./pages/public/Home.jsx",
};
```

---

## Verification & Acceptance Checklist

### Phase 1 Checkpoint (Shared Engine Parity)
- [ ] `airads` shared-engine commits cleanly identified without `fork-only` contamination.
- [ ] `crossview` successfully cherry-picks/merges `airads` shared engine. `python manage.py check && pytest -q && npm test` pass 100%.
- [ ] `digikatech` successfully merges `upstream/main` (`crossview`). `python manage.py check && pytest -q && npm test` pass 100%.
- [ ] User review checkpoint: confirm 3-way repo parity before proceeding to Phase 2.

### Phase 2 Checkpoint (Digika Frontend Redesign)
- [ ] Backend routes `/how-we-deliver/`, `/partnerships/`, `/impact/`, `/faq/` return HTTP 200 and render correct Inertia component.
- [ ] Frontend builds cleanly via `npm run build` with no missing asset references or React Router syntax errors.
- [ ] All 8 public pages render cleanly with the `AnimatedRobot`, `Navbar`, and `Footer`.
- [ ] SPA navigation transitions smoothly without browser reloads.
- [ ] Logged-in user sees `Dashboard` button in navbar; guest sees `Enroll Now / Login`.
- [ ] `git status` in `digikatech` confirms 100% of modified files are inside `fork-only` boundaries (`apps/core/views.py`, `apps/core/urls.py`, `frontend/src/pages/public/*`, `frontend/src/assets/*`, and `main.jsx`).
