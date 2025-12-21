# Crossview LMS - Frontend Architecture & Design System

> **Context File**: This document provides complete context for any AI or developer working on the Crossview LMS frontend. Read `understand` for backend/business context.

---

## 1. Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.0 | UI Framework |
| Vite | 7.2.2 | Build tool & dev server |
| MUI (Material UI) | 7.2.0 | Component library |
| Framer Motion | 12.23.12 | Animations |
| Inertia.js | 1.0.0 | **Primary data layer** - Django-React bridge (SPA feel without API) |
| TanStack Query | 5.90.11 | Real-time polling only (rare) - NOT for primary data fetching |
| React Hook Form | 7.60.0 | Form handling (use Inertia's `useForm` for most forms) |
| Axios | 1.10.0 | HTTP client (file uploads only) |
| Tailwind CSS | 3.4.17 | Utility CSS (supplementary) |
| Recharts | 2.12.0 | Dashboard charts |
| date-fns | 4.1.0 | Date utilities |

> **Inertia-First Architecture**: Data comes from Django views as props. Use `<Link>` for navigation, `useForm` for forms, and Partial Reloads for pagination. Only use TanStack Query/Axios for file uploads and real-time polling.

---

## 2. Project Structure


```
frontend/
├── src/
│   ├── app/                    # App-level providers
│   │   └── ProviderWrapper.jsx
│   ├── components/             # Shared components
│   │   ├── cards/              # Card variants
│   │   ├── common/             # Buttons, inputs, etc.
│   │   ├── navigation/         # Navbar, sidebar
│   │   └── ...
│   ├── contexts/               # React contexts (Auth, Config)
│   ├── hooks/                  # Custom hooks
│   ├── layouts/                # Page layouts (Dashboard, Public)
│   ├── Pages/                  # Inertia page components
│   │   ├── Auth/               # Login, Register, etc.
│   │   └── Dashboard.jsx
│   ├── styles/                 # Global CSS
│   ├── theme/                  # MUI theme configuration
│   │   ├── index.jsx           # ThemeProvider
│   │   ├── palette.js          # Colors
│   │   ├── typography.js       # Fonts
│   │   └── overrides/          # Component overrides
│   └── utils/                  # Utility functions
```

---

## 3. Page Structure (From Backend Models)

### PUBLIC PAGES (No authentication required)

| Page | Purpose |
|------|---------|
| Landing Page | Marketing page for the SaaS platform |
| Login | Authentication for all users |
| Register | Student self-registration (if enabled) |
| Forgot Password | Password reset flow |
| Certificate Verification | Public page to verify certificate by serial number |
| Tenant Subdomain Landing | Custom branded landing per tenant |

### STUDENT PORTAL (Role: Student)

| Page | Backend Models Used |
|------|---------------------|
| Dashboard | Enrollment, NodeCompletion, Program |
| My Programs | Enrollment (list enrolled programs) |
| Program View | CurriculumNode tree, NodeCompletion (progress) |
| Session/Lesson View | CurriculumNode (content_html), ContentVersion |
| Assessment Results | AssessmentResult (view grades, status) |
| Practicum Upload | PracticumSubmission (upload audio/video/files) |
| Practicum History | PracticumSubmission, SubmissionReview (feedback) |
| My Certificates | Certificate (download, share) |
| Profile Settings | User |

### INSTRUCTOR DASHBOARD (Role: Instructor/Lecturer)

| Page | Backend Models Used |
|------|---------------------|
| Dashboard | Program, Enrollment (stats) |
| My Programs | Program (assigned programs) |
| Student List | Enrollment (students in program) |
| Student Progress | NodeCompletion (per student) |
| Gradebook | AssessmentResult (adapts to blueprint grading mode) |
| Practicum Review | PracticumSubmission, SubmissionReview, Rubric |
| Publish Results | AssessmentResult (bulk publish) |

### ADMIN DASHBOARD (Role: Admin - Tenant Admin)

| Page | Backend Models Used |
|------|---------------------|
| Dashboard | TenantLimits (usage stats), Enrollment (counts) |
| Blueprint Management | AcademicBlueprint, PresetBlueprint |
| Program Management | Program (CRUD) |
| Curriculum Builder | CurriculumNode (tree editor, drag-drop) |
| Content Upload | ContentVersion, ParsedImage (PDF parsing) |
| User Management | User (CRUD, role assignment) |
| Enrollment Management | Enrollment (enroll/withdraw students) |
| Certificate Templates | CertificateTemplate (design templates) |
| Issued Certificates | Certificate (view, revoke) |
| Rubric Management | Rubric (create grading rubrics) |
| Branding Settings | TenantBranding (logo, colors) |
| Tenant Settings | Tenant, TenantLimits |

### SUPER ADMIN (Platform Owner)

| Page | Backend Models Used |
|------|---------------------|
| Platform Dashboard | Tenant (all tenants stats) |
| Tenant Management | Tenant, TenantLimits, SubscriptionTier |
| Preset Blueprints | PresetBlueprint (manage TVET, NITA, etc.) |
| Subscription Tiers | SubscriptionTier (pricing plans) |

---

## 4. Design System & Visual Texture

### Reference Design
The visual texture is inspired by **SaasAble** (premium SaaS UI kit). Key characteristics:
- Clean, modern, professional look
- Generous whitespace and breathing room
- Subtle animations and micro-interactions
- Large border radius for friendly feel
- Minimal shadows, flat design with depth on interaction

### 4.1 Color Palette (Crossview Branding)

```javascript
// frontend/src/theme/palette.js
const palette = {
  primary: {
    lighter: "#DBEAFE",
    light: "#3B82F6",
    main: "#2563EB",      // Deep Blue - Trust & professionalism
    dark: "#1E40AF",
    darker: "#1E3A8A",
  },
  secondary: {
    lighter: "#CCFBF1",
    light: "#2DD4BF",
    main: "#14B8A6",      // Vibrant Teal - Innovation
    dark: "#0D9488",
    darker: "#115E59",
  },
  success: {
    main: "#10B981",      // Fresh Green - Progress
  },
  warning: {
    main: "#F97316",      // Warm Coral - CTAs
  },
  grey: {
    50: "#F8FAFC",        // Background
    100: "#F1F5F9",       // Card backgrounds
    200: "#E2E8F0",
    300: "#CBD5E1",       // Borders
    700: "#475569",
    800: "#42474E",       // Text secondary
    900: "#1A1C1E",       // Text primary
  },
  background: {
    default: "#F8FAFC",
    paper: "#FFFFFF",
  },
};
```

### 4.2 Typography

```javascript
// frontend/src/theme/typography.js
// Dual font system: Archivo (headings) + Figtree (body)

const typography = {
  // Headings - Archivo Bold
  h1: { fontFamily: "Archivo", fontWeight: 700, fontSize: 48 },
  h2: { fontFamily: "Archivo", fontWeight: 700, fontSize: 36 },
  h3: { fontFamily: "Archivo", fontWeight: 600, fontSize: 28 },
  h4: { fontFamily: "Archivo", fontWeight: 600, fontSize: 24 },
  
  // Body - Figtree Regular
  body1: { fontFamily: "Figtree", fontWeight: 400, fontSize: 16, lineHeight: 1.6 },
  body2: { fontFamily: "Figtree", fontWeight: 400, fontSize: 14, lineHeight: 1.5 },
  
  // Buttons - Figtree Medium, no uppercase
  button: { fontFamily: "Figtree", fontWeight: 600, textTransform: "none" },
};
```

### 4.3 Border Radius System

| Component | Radius | Notes |
|-----------|--------|-------|
| Buttons | 8px or 100 (pill) | Use pill for primary CTAs |
| Cards | 12-16px | Friendly, modern feel |
| GraphicsCard (Hero) | 48-80px | xs: 6, sm: 8, md: 10 in MUI spacing |
| Inputs | 8px | Consistent with buttons |
| Chips | 6px or pill | Depends on context |
| Dialogs | 16px | Prominent, focused |
| Tooltips | 6px | Subtle |

### 4.4 Shadow System

```javascript
// Minimal shadows - flat design with depth on interaction
const shadows = {
  card: "0 2px 8px rgba(0, 0, 0, 0.08)",        // Subtle, barely visible
  cardHover: "0 4px 12px rgba(0, 0, 0, 0.15)",  // Lifts on hover
  button: "none",                                // Flat by default
  buttonHover: "0 4px 12px rgba(0, 0, 0, 0.15)", // Appears on hover
};
```


---

## 5. Animation Patterns (Framer Motion)

### 5.1 Entrance Animations

```jsx
// Fade up on scroll into view
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.5, delay: 0.2, ease: [0.215, 0.61, 0.355, 1] }}
>
  {children}
</motion.div>
```

### 5.2 Scale on Scroll (Hero Images)

```jsx
const { scrollYProgress } = useScroll({ target: containerRef });
const scale = useTransform(scrollYProgress, [0, 0.5], [0.9, 1]);

<motion.div style={{ scale }}>
  <HeroImage />
</motion.div>
```

### 5.3 Button Animation Wrapper

```jsx
// components/ButtonAnimationWrapper.jsx
export default function ButtonAnimationWrapper({ children }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}
```

### 5.4 Staggered List Items

```jsx
{items.map((item, index) => (
  <motion.div
    key={index}
    initial={{ opacity: 0, scale: 0.6 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: index * 0.08 }}
  >
    {item}
  </motion.div>
))}
```

### 5.5 Chip Pulse Animation (Taglines)

```jsx
<motion.div
  animate={{
    boxShadow: [
      "0 0 0px rgba(37, 99, 235, 0)",
      "0 0 20px rgba(37, 99, 235, 0.8)",
      "0 0 0px rgba(37, 99, 235, 0)",
    ],
  }}
  transition={{ duration: 2, repeat: Infinity }}
>
  <Chip label="AI-Powered Learning" />
</motion.div>
```

---

## 6. Utility Functions

### 6.1 Background Dots Pattern

```javascript
// utils/getBackgroundDots.js
export function getBackgroundDots(fill = "#CBD5E1", dotSize = 30, spacing = 20) {
  const encodedFill = fill.replace("#", "%23");
  return `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 60"><text x="0" y="25" fill="${encodedFill}" font-size="${dotSize}px">.</text></svg>') 0 0/${spacing}px ${spacing}px`;
}

// Usage in Hero section
<Box
  sx={{
    background: getBackgroundDots(theme.palette.grey[300], 60, 35),
    bgcolor: "grey.100",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  }}
/>
```

### 6.2 Focus Visible Styles

```javascript
// utils/focusStyles.js
export function generateFocusVisibleStyles(color) {
  return {
    outline: `2px solid ${color}`,
    outlineOffset: "2px",
  };
}
```

---

## 7. Component Patterns

### 7.1 GraphicsCard (Hero/Feature Images)

```jsx
// Large radius card for hero sections and feature showcases
<Card
  sx={{
    bgcolor: "grey.100",
    borderRadius: { xs: 6, sm: 8, md: 10 }, // 48-80px
    border: "5px solid",
    borderColor: "grey.300",
    overflow: "hidden",
  }}
>
  {children}
</Card>
```

### 7.2 Section Container

```jsx
// Consistent section padding
const SECTION_COMMON_PY = { xs: 6, sm: 8, md: 10 }; // 48-80px

<Container maxWidth="lg" sx={{ py: SECTION_COMMON_PY }}>
  {children}
</Container>
```

### 7.3 Typeset (Heading + Caption)

```jsx
// Reusable heading block
function Typeset({ heading, caption, align = "left" }) {
  return (
    <Stack sx={{ gap: 1.5, textAlign: align }}>
      <Typography variant="h2">{heading}</Typography>
      {caption && (
        <Typography variant="h6" color="text.secondary">
          {caption}
        </Typography>
      )}
    </Stack>
  );
}
```

### 7.4 Navbar (Transparent with Elevation on Scroll)

```jsx
// Navbar starts transparent, gains elevation on scroll
<AppBar
  position="fixed"
  color="inherit"
  sx={{
    background: scrolled ? "rgba(255,255,255,0.9)" : "transparent",
    backdropFilter: scrolled ? "blur(10px)" : "none",
    boxShadow: scrolled ? 1 : "none",
    transition: "all 0.3s ease",
  }}
>
```


---

## 8. Component Overrides (MUI Theme)

```javascript
// frontend/src/theme/overrides/index.js
export default function componentsOverride(theme) {
  return {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 100,           // Pill shape
          padding: "14px 24px",
          fontWeight: 600,
          boxShadow: "none",
          "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
root: {
          borderR
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          bgcolor: "grey.100",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.primary.main,
          },
        },
      },
    },
    MuiSwitch: {
      // iOS-style toggle with smooth animation
      styleOverrides: {
        root: { padding: 0, width: 38, height: 22 },
        thumb: { width: 18, height: 18 },
        track: { borderRadius: 16, opacity: 1 },
      },
    },
  };
}
```

---

## 9. Responsive Breakpoints

```javascript
// Custom breakpoints matching design system
const breakpoints = {
  values: {
    xs: 0,
    sm: 768,
    md: 1024,
    lg: 1266,
    xl: 1440,
  },
};
```

---

## 10. Spec Breakdown (Development Order)

1. **public-pages** - Landing, login, certificate verification
2. **student-portal** - Student dashboard, program view, session viewer, practicum upload
3. **instructor-dashboard** - Gradebook, practicum review, student progress
4. **admin-dashboard** - Blueprint management, curriculum builder, user management
5. **super-admin** - Platform-level tenant management

---

## 11. Key Files Reference

| File | Purpose |
|------|---------|
| frontend/src/theme/index.jsx | MUI ThemeProvider setup |
| frontend/src/theme/palette.js | Color definitions |
| frontend/src/theme/typography.js | Font configuration |
| frontend/src/theme/overrides/ | Component style overrides |
| frontend/src/config.js | App constants, font exports |
| frontend/src/styles/app.css | Global CSS, scrollbar, focus styles |
| understand | Backend/business context |

---

## 12. Design Checklist (For Every New Component)

- [ ] Uses theme colors (not hardcoded hex)
- [ ] Uses theme typography variants
- [ ] Has Framer Motion entrance animation
- [ ] Responsive (works on mobile)
- [ ] Accessible (focus states, ARIA labels)
- [ ] Consistent border radius
- [ ] Hover states with subtle shadow/scale
- [ ] Loading states (Skeleton or Loader)

