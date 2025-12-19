# Implementation Plan

> **🔄 Migration Notice:** This implementation plan is for migrating from PHP/Laravel to Python/Django. All tasks reference Django-specific implementations (Django models, migrations, pytest/Hypothesis for testing, management commands).

- [x] 1. Set up database schema and models
  - [x] 1.1 Create CertificateTemplate Django model
    - Define fields: name, blueprint_id (FK), template_html, is_default, metadata
    - Implement has_required_placeholders() method
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 Create Certificate Django model
    - Define fields: enrollment_id (FK), template_id (FK), serial_number (unique), student_name, program_title, completion_date, issue_date, pdf_path, is_revoked, revoked_at, revocation_reason, metadata
    - Implement get_signed_download_url() and get_verification_url() methods
    - _Requirements: 2.4, 3.2, 5.1, 5.2, 5.3_

  - [x] 1.3 Create VerificationLog Django model
    - Define fields: certificate_id (FK nullable), serial_number_queried, ip_address, user_agent, result, verified_at
    - _Requirements: 4.4_

  - [x] 1.4 Create Django migration for all certification models
    - Generate migration with proper foreign keys and indexes
    - _Requirements: 1.1, 2.4, 3.2, 4.4_

- [x] 2. Implement template management
  - [x] 2.1 Create TemplateGenerator service
    - Implement validate_template() for placeholder validation
    - Implement get_default_template() for fallback
    - Implement get_template_for_enrollment() to select appropriate template
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 2.2 Write property test for template placeholder validation
    - **Property 2: Template Placeholder Validation**
    - **Validates: Requirements 1.2, 1.3**

  - [x] 2.3 Write property test for default template fallback
    - **Property 3: Default Template Fallback**
    - **Validates: Requirements 1.4**

  - [x] 2.4 Write property test for template attachment requires certificate enabled
    - **Property 1: Template Attachment Requires Certificate Enabled**
    - **Validates: Requirements 1.1**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement serial number generation
  - [x] 4.1 Create SerialNumberGenerator service
    - Implement generate() with PREFIX-YEAR-XXXXXX format
    - Implement is_unique() to check for duplicates
    - Implement parse() to extract components
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 4.2 Write property test for serial number uniqueness and format
    - **Property 6: Serial Number Uniqueness and Format**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 5. Implement certificate generation
  - [x] 5.1 Implement generate() in TemplateGenerator
    - Replace placeholders with actual values
    - Generate PDF using WeasyPrint (already in requirements.txt)
    - _Requirements: 2.2_

  - [x] 5.2 Create CertificationEngine service
    - Implement generate_certificate() orchestrating template, serial, PDF
    - Store certificate record and PDF file
    - _Requirements: 2.1, 2.3, 2.4_

  - [x] 5.3 Write property test for placeholder population
    - **Property 5: Placeholder Population**
    - **Validates: Requirements 2.2**

  - [x] 5.4 Integrate with Progression Engine
    - Listen for 100% completion using Django signals
    - Implement on_program_completed() handler
    - _Requirements: 2.1_

  - [x] 5.5 Write property test for auto-generation on completion
    - **Property 4: Auto-Generation on 100% Completion**
    - **Validates: Requirements 2.1, 2.3, 2.4**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement verification
  - [x] 7.1 Create VerificationService
    - Implement verify() returning certificate details or not_found/revoked
    - Implement log_attempt() for logging
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 7.2 Write property test for verification returns correct response
    - **Property 7: Verification Returns Correct Response**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [x] 7.3 Write property test for verification logging
    - **Property 8: Verification Logging**
    - **Validates: Requirements 4.4**

- [x] 8. Implement download and sharing
  - [x] 8.1 Implement get_certificate_for_download() in CertificationEngine
    - Return PDF file path for owner
    - _Requirements: 5.1_

  - [x] 8.2 Implement signed URL generation using Django signing
    - Generate signed URL with expiration
    - _Requirements: 5.2_

  - [x] 8.3 Implement public verification URL
    - Generate shareable verification link
    - _Requirements: 5.3_

  - [x] 8.4 Write property test for certificate download
    - **Property 9: Certificate Download Returns PDF**
    - **Validates: Requirements 5.1**

  - [x] 8.5 Write property test for signed URL
    - **Property 10: Signed URL with Expiration**
    - **Validates: Requirements 5.2**

  - [x] 8.6 Write property test for public verification URL
    - **Property 11: Public Verification URL**
    - **Validates: Requirements 5.3**

- [x] 9. Implement revocation
  - [x] 9.1 Implement revoke() in CertificationEngine
    - Set is_revoked, revoked_at, revocation_reason
    - Retain record for audit
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 9.2 Write property test for revocation workflow
    - **Property 12: Revocation Workflow**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 10. Final Checkpoint - Ensure all tests pass
  - All 62 tests pass.

## Notes

- WeasyPrint is already installed in requirements.txt
- The certifications app exists at `crossview/apps/certifications/` with empty models.py
- Tests should be created in `crossview/tests/certifications/` directory
- Integration with Progression Engine uses Django signals for completion events
- The Enrollment model exists in `crossview/apps/progression/models.py`
- The AcademicBlueprint model has `certificate_enabled` field already
