# Implementation Plan

## Completed Tasks (Previous Phase)

- [x] 1. Initial rebranding from "Study Safari" to "Cross View College of Theology and Technology"
  - All configuration files updated
  - All view files updated to use dynamic config
  - All property tests implemented and passing
  - _Requirements: 1.1-1.5, 2.1-2.4, 3.1-3.5, 4.1-4.4_

## Current Phase: Name Correction and Short Name Implementation

- [x] 2. Fix brand name spelling and add short name configuration



  - [x] 2.1 Update .env file with corrected name and add short name variables

    - Change APP_NAME from "Cross View College..." to "Crossview College of Theology and Technology"
    - Add APP_SHORT_NAME="Crossview College"
    - Add APP_ABBREVIATION="CCT&T"
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.2 Update config/app.php to support short_name and abbreviation

    - Add 'short_name' => env('APP_SHORT_NAME', 'Crossview College')
    - Add 'abbreviation' => env('APP_ABBREVIATION', 'CCT&T')
    - _Requirements: 2.3, 2.4_


- [x] 3. Update all "Cross View" references to "Crossview" (one word)

  - Search and replace "Cross View College" with "Crossview College" in all files
  - Update debug_response.html
  - Update any remaining view files
  - _Requirements: 4.1, 4.2_


- [x] 4. Update views to use short name where appropriate
  - [x] 4.1 Update navigation headers to use config('app.short_name')
    - Update resources/views/layouts/*.blade.php header sections
    - _Requirements: 1.1, 3.1_
  - [x] 4.2 Update page titles to use short name
    - Update <title> tags to use config('app.short_name')
    - _Requirements: 1.2, 3.2_
  - [x] 4.3 Update dashboard sidebars to use short name
    - Update sidebar headers in all dashboard layouts
    - _Requirements: 1.3, 3.3_
  - [x] 4.4 Keep full name in copyright notices and formal areas
    - Verify footers use config('app.name') for full name
    - _Requirements: 1.5, 3.1_

- [x] 5. Update tests to reflect new naming convention

  - Update RebrandingTest.php to test for "Crossview College" (one word)
  - Add tests for short_name and abbreviation configuration
  - Update legacy reference tests to check for "Cross View" (two words) as legacy
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6. Final validation checkpoint
  - Run all tests to ensure they pass (completed - 6 tests, 52 assertions passing)
  - Verify no "Cross View" (two words) references remain (completed - only template files remain)
  - Verify short name displays correctly in navigation/headers (completed)
  - Verify full name displays correctly in copyright/formal areas (completed)
  - _Requirements: 4.1, 4.2, 4.3, 4.4_
