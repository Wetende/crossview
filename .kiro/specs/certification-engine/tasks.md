# Implementation Plan

> **🔄 Migration Notice:** This implementation plan is for migrating from PHP/Laravel to Python/Django. All tasks reference Django-specific implementations (Django models, migrations, pytest/Hypothesis for testing, management commands).

- [ ] 1. Set up database schema and models
  - [ ] 1.1 Create Django migration for certificate_templates table
    - Create table with name, blueprint_id, template_html, is_default, metadata
    - Add foreign key and indexes
    - _Requirements: 1.1, 1.4_

  - [ ] 1.2 Create Django migration for certificates table
    - Create table with enrollment_id, template_id, serial_number (unique), student_name, program_title, completion_date, issue_date, pdf_path, is_revoked, revoked_at, revocation_reason, metadata
    - Add foreign keys and indexes
    - _Requirements: 2.4, 3.2_

  - [ ] 1.3 Create Django migration for verification_logs table
    - Create table with certificate_id, serial_number_queried, ip_address, user_agent, result, verified_at
    - Add foreign key and indexes
    - _Requirements: 4.4_

  - [ ] 1.4 Create CertificateTemplate Django model
    - Define fields and relationships
    - Implement has_required_placeholders() method
    - _Requirements: 1.2, 1.3_

  - [ ] 1.5 Create Certificate Django model
    - Define fields and relationships
    - Implement get_signed_download_url() and get_verification_url()
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 1.6 Create VerificationLog Django model
    - Define fields and relationships
    - _Requirements: 4.4_

- [ ] 2. Implement template management
  - [ ] 2.1 Create TemplateGenerator service
    - Implement validate_template() for placeholder validation
    - Implement get_default_template()
    - _Requirements: 1.2, 1.3, 1.4_

  - [ ] 2.2 Write property test for template placeholder validation
    - **Property 2: Template Placeholder Validation**
    - **Validates: Requirements 1.2, 1.3**

  - [ ] 2.3 Write property test for default template fallback
    - **Property 3: Default Template Fallback**
    - **Validates: Requirements 1.4**

  - [ ] 2.4 Write property test for template attachment requires certificate enabled
    - **Property 1: Template Attachment Requires Certificate Enabled**
    - **Validates: Requirements 1.1**

- [ ] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 4. Implement serial number generation
  - [ ] 4.1 Create SerialNumberGenerator service
    - Implement generate() with PREFIX-YEAR-XXXXXX format
    - Implement is_unique() to check for duplicates
    - Implement parse() to extract components
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 4.2 Write property test for serial number uniqueness and format
    - **Property 6: Serial Number Uniqueness and Format**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ] 5. Implement certificate generation
  - [ ] 5.1 Install WeasyPrint dependency
    - Add to requirements.txt
    - _Requirements: 2.2_

  - [ ] 5.2 Implement generate() in TemplateGenerator
    - Replace placeholders with actual values
    - Generate PDF using WeasyPrint
    - _Requirements: 2.2_

  - [ ] 5.3 Create CertificationEngine service
    - Implement generate_certificate() orchestrating template, serial, PDF
    - Store certificate record and PDF file
    - _Requirements: 2.1, 2.3, 2.4_

  - [ ] 5.4 Write property test for placeholder population
    - **Property 5: Placeholder Population**
    - **Validates: Requirements 2.2**

  - [ ] 5.5 Integrate with Progression Engine
    - Listen for 100% completion using Django signals
    - Implement on_program_completed() handler
    - _Requirements: 2.1_

  - [ ] 5.6 Write property test for auto-generation on completion
    - **Property 4: Auto-Generation on 100% Completion**
    - **Validates: Requirements 2.1, 2.3, 2.4**

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement verification
  - [ ] 7.1 Create VerificationService
    - Implement verify() returning certificate details or not_found/revoked
    - Implement log_attempt() for logging
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 7.2 Write property test for verification returns correct response
    - **Property 7: Verification Returns Correct Response**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [ ] 7.3 Write property test for verification logging
    - **Property 8: Verification Logging**
    - **Validates: Requirements 4.4**

- [ ] 8. Implement download and sharing
  - [ ] 8.1 Implement get_certificate_for_download() in CertificationEngine
    - Return PDF file for owner
    - _Requirements: 5.1_

  - [ ] 8.2 Implement signed URL generation using Django signing
    - Generate signed URL with expiration
    - _Requirements: 5.2_

  - [ ] 8.3 Implement public verification URL
    - Generate shareable verification link
    - _Requirements: 5.3_

  - [ ] 8.4 Write property test for certificate download
    - **Property 9: Certificate Download Returns PDF**
    - **Validates: Requirements 5.1**

  - [ ] 8.5 Write property test for signed URL
    - **Property 10: Signed URL with Expiration**
    - **Validates: Requirements 5.2**

  - [ ] 8.6 Write property test for public verification URL
    - **Property 11: Public Verification URL**
    - **Validates: Requirements 5.3**

- [ ] 9. Implement revocation
  - [ ] 9.1 Implement revoke() in CertificationEngine
    - Set is_revoked, revoked_at, revocation_reason
    - Retain record for audit
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 9.2 Write property test for revocation workflow
    - **Property 12: Revocation Workflow**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [ ] 10. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
