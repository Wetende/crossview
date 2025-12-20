# Implementation Plan: LMS Frontend Core

## Overview

This implementation plan establishes the foundational React infrastructure for the Crossview LMS. Tasks are organized to build incrementally: dependencies first, then theme system, contexts, layout components, and finally common UI components.

## Tasks

-   [ ] 1. Project Setup & Dependencies

    -   [ ] 1.1 Update package.json with required dependencies
        -   Add @mui/material, @mui/lab, @emotion/react, @emotion/styled
        -   Add @fontsource/archivo, @fontsource/figtree
        -   Add @tabler/icons-react
        -   Add framer-motion, react-hook-form
        -   Add vitest, @testing-library/react, @testing-library/jest-dom, fast-check for testing
        -   _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6_
    -   [ ] 1.2 Configure Vite with path aliases and test setup
        -   Update vite.config.js with @ alias pointing to frontend/src
        -   Create vitest.config.js with jsdom environment
        -   Create frontend/src/test/setup.js for test utilities
        -   _Requirements: 1.4, 1.8_

-   [ ] 2. Theme System Implementation

    -   [ ] 2.1 Create config module with font imports
        -   Create frontend/src/config.js
        -   Import Archivo and Figtree font weights
        -   Export font family constants and default config
        -   \_Requirements:
    -   [ ] 2.2 Implement theme palette
        -   Create frontend/src/theme/palette.js
        -   Define Crossview color palette (primary blue, secondary teal, success green, warning coral)
        -   Include grey scale, text colors, divider, and background colors
        -   _Requirements: 2.1_
    -   [ ] 2.3 Write property test for theme palette
        -   **Property 2: Theme Palette Color Integrity**
        -   **Validates: Requirements 2.1**
    -   [ ] 2.4 Implement theme typography
        -   Create frontend/src/theme/typography.js
        -   Configure Archivo for h1-h4, Figtree for body variants
        -   Add responsive font sizes for each breakpoint
        -   _Requirements: 2.2, 2.3_
    -   [ ] 2.5 Write property test for typography
        -   **Property 3: Typography Font Family Assignment**
        -   **Validates: Requirements 2.2, 2.3**
    -   [ ] 2.6 Create component overrides
        -   Create frontend/src/theme/overrides/index.js
        -   Add overrides for Button, Card, TextField, Paper components
        -   _Requirements: 2.5_
    -   [ ] 2.7 Create ThemeProvider component
        -   Create frontend/src/theme/index.jsx
        -   Compose palette, typography, and overrides into MUI theme
        -   Define breakpoints (xs: 0, sm: 768, md: 1024, lg: 1266, xl: 1440)
        -   _Requirements: 2.4_

-   [ ] 3. Checkpoint - Theme System

    -   Ensure all tests pass, user if questions arise.

-   [ ] 4. Context Providers Implementation

    -   [ ] 4.1 Create useLocalStorage hook
        -   Create frontend/src/hooks/useLocalStorage.js
        -   Implement get/set with JSON serialization
        -   Handle SSR and localStorage unavailability
        -   _Requirements: 3.3_
    -   [ ] 4.2 Implement ConfigContext
        -   Create frontend/src/contexts/ConfigContext.jsx
        -   Store themeMode, sidebarCollapsed, blueprintId
        -   Provide updateConfig, toggleSidebar, setBlueprint functions
        -   Persist to localStorage with useLocalStorage hook
        -   _Requirements: 3.3, 3.4, 3.5_
    -   [ ] 4.3 Write property test for config persistence
        -   **Property 4: Config Persistence Round-Trip**
        -   **Validates: Requirements 3.3, 4.3**
    -   [ ] 4.4 Implement AuthContext
        -   Create frontend/src/contexts/AuthContext.jsx
        -   Initialize user from Inertia page props
        -   Implement login, logout, refreshUser functions using Inertia router
        -   Provide isAuthenticated computed property
        -   _Requirements: 3.6, 3.7, 3.8, 3.9_
    -   [ ] 4.5 Write property test for authentication state
        -   **Property 5: Authentication State Consistency**
        -   **Validates: Requirements 3.9**
    -   [ ] 4.6 Create ProviderWrapper component
        -   Create frontend/src/app/ProviderWrapper.jsx
        -   Compose ConfigProvider → ThemeProvider → AuthProvider
        -   Add loading state with Loader component
        -   _Requirements: 3.1, 3.2_

-   [ ] 5. Checkpoint - Context Providers

    -   Ensure all tests pass, ask the user if questions arise.

-   [ ] 6. Layout Components Implementation

    -   [ ] 6.1 Implement DashboardLayout
        -   Create frontend/src/layouts/DashboardLayout/index.jsx
        -   Implement collapsible sidebar (260px/72px)
        -   Handle mobile responsive drawer
        -   Integrate with ConfigContext for sidebar state
        -   _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7_
    -   [ ] 6.2 Write property test for sidebar width
        -   **Property 6: Sidebar Width State**
        -   **Validates: Requirements 4.1**
    -   [ ] 6.3 Implement Sidebar component
        -   Create frontend/src/layouts/DashboardLayout/Sidebar.jsx
        -   Display Crossview logo (full/icon based on collapsed state)
        -   Render navigation items with role-based filtering
        -   Highlight active route with primary color
        -   Show tooltips when collapsed
        -   _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 5.8_
    -   [ ] 6.4 Write property test for role-based navigation
        -   **Property 7: Role-Based Navigation Filtering**
        -   **Validates: Requirements 5.2**
    -   [ ] 6.5 Implement Header component
        -   Create frontend/src/layouts/DashboardLayout/Header.jsx
        -   Add menu toggle button
        -   Add notification bell with badge
        -   Add user avatar with dropdown menu (Profile, Settings, Logout)
        -   Show user name/email on desktop, hide on mobile
        -   _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_
    -   [ ] 6.6 Write property test for avatar initials
        -   **Property 8: Avatar Initials Generation**
        -   **Validates: Requirements 6.3**

-   [ ] 7. Checkpoint - Layout Components

    -   Ensure all tests pass, ask the user if questions arise.

-   [ ] 8. Authentication Pages

    -   [ ] 8.1 Implement Login page
        -   Create frontend/src/Pages/Auth/Login.jsx
        -   Add email and password fields with validation
        -   Display Crossview logo and welcome message
        -   Add "Remember me" checkbox and "Forgot password" link
        -   Handle form submission with Inertia useForm
        -   Display error messages for invalid credentials
        -   _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6_
    -   [ ] 8.2 Write property test for login redirect
        -   **Property 9: Login Redirect by Role**
        -   **Validates: Requirements 7.4**

-   [ ] 9. Common UI Components

    -   [ ] 9.1 Implement Loader component
        -   Create frontend/src/components/Loader.jsx
        -   Display centered spinner with optional message
        -   _Requirements: 8.1_
    -   [ ] 9.2 Implement Breadcrumbs component
        -   Create frontend/src/components/Breadcrumbs.jsx
        -   Generate path segments from current route
        -   Make each segment navigable
        -   _Requirements: 8.2_
    -   [ ] 9.3 Write property test for breadcrumb generation
        -   **Property 10: Breadcrumb Path Generation**
        -   **Validates: Requirements 8.2**
    -   [ ] 9.4 Implement ErrorMessage component
        -   Create frontend/src/components/ErrorMessage.jsx
        -   Display error title, message, and optional retry button
        -   _Requirements: 8.3_
    -   [ ] 9.5 Implement SummaryCard component
        -   Create frontend/src/components/SummaryCard.jsx
        -   Display title, value, icon, and optional trend indicator
        -   Support different color variants
        -   _Requirements: 8.4_
    -   [ ] 9.6 Implement PageHeader component
        -   Create frontend/src/components/PageHeader.jsx
        -   Display page title, optional subtitle, and action buttons
        -   _Requirements: 8.5_
    -   [ ] 9.7 Implement EmptyState component
        -   Create frontend/src/components/EmptyState.jsx
        -   Display icon, message, and optional action button
        -   _Requirements: 8.6_
    -   [ ] 9.8 Implement ConfirmDialog component
        -   Create frontend/src/components/ConfirmDialog.jsx
        -   Display title, message, and confirm/cancel buttons
        -   _Requirements: 8.7_

-   [ ] 10. Accessibility & Integration

    -   [ ] 10.1 Add ARIA attributes to all interactive components
        -   Review and add aria-label, role, tabIndex where needed
        -   Ensure keyboard navigation works for all components
        -   _Requirements: 9.2, 9.4_
    -   [ ] 10.2 Write property test for accessibility compliance
        -   **Property 11: Accessibility Compliance**
        -   **Validates: Requirements 8.8, 9.2, 9.4**
    -   [ ] 10.3 Write property test for color contrast
        -   **Property 12: Color Contrast Compliance**
        -   **Validates: Requirements 9.3**
    -   [ ] 10.4 Configure Inertia progress bar
        -   Add NProgress or similar for page transitions
        -   _Requirements: 10.4_
    -   [ ] 10.5 Update main.jsx entry point
        -   Create frontend/src/main.jsx with Inertia setup
        -   Configure page resolver for Pages directory
        -   Wrap app with ProviderWrapper
        -   _Requirements: 1.7, 10.1_
    -   [ ] 10.6 Write property test for page resolution
        -   **Property 1: Page Resolution Consistency**
        -   **Validates: Requirements 1.7, 10.1**

-   [ ] 11. Final Checkpoint
    -   Ensure all tests pass, ask the user if questions arise.
    -   Verify all components render correctly
    -   Test responsive behavior on mobile and desktop

## Notes

-   All tasks are required for comprehensive implementation
-   Each task references specific requirements for traceability
-   Checkpoints ensure incremental validation
-   Property tests validate universal correctness properties
-   Unit tests validate specific examples and edge cases
