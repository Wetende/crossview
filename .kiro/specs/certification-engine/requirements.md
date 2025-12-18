# Requirements Document

## Introduction

The Certification Engine automatically generates PDF certificates when students complete programs at 100%. It uses configurable certificate templates, generates unique serial numbers for verification, and integrates with the Progression Engine to detect completion events.

## Glossary

- **Certificate Template**: A configurable PDF template with placeholders for student name, program title, date, and serial number.
- **Serial Number**: A unique identifier for each issued certificate, used for verification.
- **Certificate**: A generated PDF document awarded to a student upon program completion.
- **Verification**: The process of confirming a certificate's authenticity using its serial number.

## Requirements

### Requirement 1: Certificate Template Configuration

**User Story:** As a registrar, I want to configure certificate templates per blueprint, so that different programs have appropriate certificate designs.

#### Acceptance Criteria

1. WHEN a blueprint has certificate_enabled set to true THEN the Certification Engine SHALL allow attaching a certificate template.
2. WHEN configuring a template THEN the Certification Engine SHALL support placeholders: {{student_name}}, {{program_title}}, {{completion_date}}, {{serial_number}}.
3. WHEN a template is saved THEN the Certification Engine SHALL validate that all required placeholders are present.
4. WHEN no template is attached THEN the Certification Engine SHALL use a default template.

### Requirement 2: Automatic Certificate Generation

**User Story:** As a student, I want to receive a certificate automatically when I complete a program, so that I have proof of my achievement.

#### Acceptance Criteria

1. WHEN a student's progress reaches 100% THEN the Certification Engine SHALL automatically generate a certificate.
2. WHEN generating a certificate THEN the Certification Engine SHALL populate all placeholders with actual values.
3. WHEN a certificate is generated THEN the Certification Engine SHALL assign a unique serial number.
4. WHEN generation completes THEN the Certification Engine SHALL store the certificate record and PDF file.

### Requirement 3: Serial Number Generation

**User Story:** As a system administrator, I want certificates to have unique, verifiable serial numbers, so that employers can confirm authenticity.

#### Acceptance Criteria

1. WHEN generating a serial number THEN the Certification Engine SHALL create a unique alphanumeric code.
2. WHEN a serial number is generated THEN the Certification Engine SHALL ensure no duplicates exist.
3. WHEN formatting the serial number THEN the Certification Engine SHALL include a prefix identifying the institution (e.g., CCT-2025-XXXXX).

### Requirement 4: Certificate Verification

**User Story:** As an employer, I want to verify a certificate's authenticity online, so that I can trust the credential.

#### Acceptance Criteria

1. WHEN a serial number is submitted for verification THEN the Certification Engine SHALL return the certificate details if valid.
2. WHEN verification succeeds THEN the Certification Engine SHALL display student name, program, completion date, and issue date.
3. WHEN a serial number is invalid THEN the Certification Engine SHALL return a "not found" response.
4. WHEN verification is performed THEN the Certification Engine SHALL log the verification attempt.

### Requirement 5: Certificate Download and Sharing

**User Story:** As a student, I want to download and share my certificate, so that I can use it for job applications.

#### Acceptance Criteria

1. WHEN a student requests their certificate THEN the Certification Engine SHALL return the PDF file.
2. WHEN a certificate is downloaded THEN the Certification Engine SHALL use a signed URL with expiration.
3. WHEN a student shares a certificate link THEN the Certification Engine SHALL provide a public verification URL.

### Requirement 6: Certificate Revocation

**User Story:** As a registrar, I want to revoke certificates if needed, so that invalid credentials can be invalidated.

#### Acceptance Criteria

1. WHEN a registrar revokes a certificate THEN the Certification Engine SHALL mark it as revoked with a reason.
2. WHEN a revoked certificate is verified THEN the Certification Engine SHALL indicate the revocation status.
3. WHEN a certificate is revoked THEN the Certification Engine SHALL retain the record for audit purposes.
