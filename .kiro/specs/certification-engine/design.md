# Design Document: Certification Engine

## Overview

The Certification Engine generates PDF certificates when students complete programs. It listens for 100% completion events from the Progression Engine, populates certificate templates with student data, generates unique serial numbers, and provides verification endpoints.

## Architecture

```mermaid
graph TB
    subgraph "Certification Engine"
        CE[CertificationEngine]
        TG[TemplateGenerator]
        SN[SerialNumberGenerator]
        VS[VerificationService]
        CE --> TG
        CE --> SN
        CE --> VS
    end
    
    subgraph "Data Layer"
        CT[CertificateTemplate]
        C[Certificate]
        VL[VerificationLog]
    end
    
    subgraph "External"
        PE[Progression Engine]
        PDF[PDF Library - DOMPDF]
        PE -.->|100% Event| CE
        TG --> PDF
    end
```

## Components and Interfaces

### 1. CertificateTemplate Model

```php
namespace App\Models;

class CertificateTemplate extends Model
{
    protected $fillable = [
        'name',
        'blueprint_id',
        'template_html',
        'is_default',
        'metadata',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'metadata' => 'array',
    ];

    public function blueprint(): BelongsTo;
    public function certificates(): HasMany;
    public function hasRequiredPlaceholders(): bool;
}
```

### 2. Certificate Model

```php
namespace App\Models;

class Certificate extends Model
{
    protected $fillable = [
        'enrollment_id',
        'template_id',
        'serial_number',
        'student_name',
        'program_title',
        'completion_date',
        'issue_date',
        'pdf_path',
        'is_revoked',
        'revoked_at',
        'revocation_reason',
        'metadata',
    ];

    protected $casts = [
        'completion_date' => 'date',
        'issue_date' => 'date',
        'is_revoked' => 'boolean',
        'revoked_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function enrollment(): BelongsTo;
    public function template(): BelongsTo;
    public function verificationLogs(): HasMany;
    public function getSignedDownloadUrl(): string;
    public function getVerificationUrl(): string;
}
```

### 3. VerificationLog Model

```php
namespace App\Models;

class VerificationLog extends Model
{
    protected $fillable = [
        'certificate_id',
        'serial_number_queried',
        'ip_address',
        'user_agent',
        'result',
        'verified_at',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
    ];

    public function certificate(): BelongsTo;
}
```

### 4. CertificationEngine Service

```php
namespace App\Services;

class CertificationEngine
{
    public function __construct(
        private TemplateGenerator $templateGenerator,
        private SerialNumberGenerator $serialGenerator,
        private VerificationService $verificationService
    ) {}

    /**
     * Generate certificate for completed enrollment
     */
    public function generateCertificate(Enrollment $enrollment): Certificate;
    
    /**
     * Handle program completion event
     */
    public function onProgramCompleted(Enrollment $enrollment): void;
    
    /**
     * Revoke a certificate
     */
    public function revoke(Certificate $certificate, string $reason): void;
    
    /**
     * Get certificate for download
     */
    public function getCertificateForDownload(Certificate $certificate): string;
}
```

### 5. TemplateGenerator

```php
namespace App\Services\Certification;

class TemplateGenerator
{
    /**
     * Generate PDF from template with data
     */
    public function generate(
        CertificateTemplate $template,
        array $data
    ): string;
    
    /**
     * Validate template has required placeholders
     */
    public function validateTemplate(string $templateHtml): ValidationResult;
    
    /**
     * Get default template
     */
    public function getDefaultTemplate(): CertificateTemplate;
}
```

### 6. SerialNumberGenerator

```php
namespace App\Services\Certification;

class SerialNumberGenerator
{
    /**
     * Generate unique serial number
     */
    public function generate(string $prefix = 'CCT'): string;
    
    /**
     * Verify serial number is unique
     */
    public function isUnique(string $serialNumber): bool;
    
    /**
     * Parse serial number components
     */
    public function parse(string $serialNumber): array;
}
```

### 7. VerificationService

```php
namespace App\Services\Certification;

class VerificationService
{
    /**
     * Verify certificate by serial number
     */
    public function verify(string $serialNumber, ?string $ipAddress = null): VerificationResult;
    
    /**
     * Log verification attempt
     */
    public function logAttempt(
        ?Certificate $certificate,
        string $serialNumber,
        string $result,
        ?string $ipAddress
    ): void;
}
```

## Data Models

### Database Schema

```sql
CREATE TABLE certificate_templates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    blueprint_id BIGINT UNSIGNED NULL,
    template_html LONGTEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (blueprint_id) REFERENCES academic_blueprints(id) ON DELETE SET NULL,
    INDEX idx_blueprint (blueprint_id),
    INDEX idx_default (is_default)
);

CREATE TABLE certificates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    enrollment_id BIGINT UNSIGNED NOT NULL,
    template_id BIGINT UNSIGNED NOT NULL,
    serial_number VARCHAR(50) NOT NULL UNIQUE,
    student_name VARCHAR(255) NOT NULL,
    program_title VARCHAR(255) NOT NULL,
    completion_date DATE NOT NULL,
    issue_date DATE NOT NULL,
    pdf_path VARCHAR(500) NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP NULL,
    revocation_reason TEXT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES certificate_templates(id),
    
    INDEX idx_serial (serial_number),
    INDEX idx_enrollment (enrollment_id)
);

CREATE TABLE verification_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    certificate_id BIGINT UNSIGNED NULL,
    serial_number_queried VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    result ENUM('valid', 'revoked', 'not_found') NOT NULL,
    verified_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (certificate_id) REFERENCES certificates(id) ON DELETE SET NULL,
    INDEX idx_serial_queried (serial_number_queried),
    INDEX idx_verified_at (verified_at)
);
```

### Template Placeholders

```html
<div class="certificate">
    <h1>Certificate of Completion</h1>
    <p>This certifies that</p>
    <h2>{{student_name}}</h2>
    <p>has successfully completed</p>
    <h3>{{program_title}}</h3>
    <p>on {{completion_date}}</p>
    <p>Serial Number: {{serial_number}}</p>
</div>
```

### Serial Number Format

```
CCT-2025-A1B2C3
│   │    │
│   │    └── Random alphanumeric (6 chars)
│   └── Year
└── Institution prefix
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Template Attachment Requires Certificate Enabled
*For any* blueprint with certificate_enabled false, attaching a template SHALL be rejected.
**Validates: Requirements 1.1**

### Property 2: Template Placeholder Validation
*For any* template missing required placeholders (student_name, program_title, completion_date, serial_number), saving SHALL be rejected with validation error.
**Validates: Requirements 1.2, 1.3**

### Property 3: Default Template Fallback
*For any* certificate generation without an attached template, the default template SHALL be used.
**Validates: Requirements 1.4**

### Property 4: Auto-Generation on 100% Completion
*For any* enrollment reaching 100% progress with certificate_enabled true, a Certificate record SHALL be created with serial_number and pdf_path.
**Validates: Requirements 2.1, 2.3, 2.4**

### Property 5: Placeholder Population
*For any* generated certificate PDF, all placeholders SHALL be replaced with actual values (no {{...}} remaining).
**Validates: Requirements 2.2**

### Property 6: Serial Number Uniqueness and Format
*For any* generated serial number, it SHALL be unique across all certificates and match the format PREFIX-YEAR-XXXXXX.
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 7: Verification Returns Correct Response
*For any* verification request, valid serials SHALL return certificate details, invalid serials SHALL return "not_found", revoked serials SHALL return "revoked".
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 8: Verification Logging
*For any* verification attempt, a VerificationLog record SHALL be created with serial_number_queried, result, and verified_at.
**Validates: Requirements 4.4**

### Property 9: Certificate Download Returns PDF
*For any* certificate download request by the owner, the PDF file SHALL be returned.
**Validates: Requirements 5.1**

### Property 10: Signed URL with Expiration
*For any* certificate download URL, it SHALL be signed and have an expiration time.
**Validates: Requirements 5.2**

### Property 11: Public Verification URL
*For any* certificate share request, the returned URL SHALL be a public verification endpoint containing the serial number.
**Validates: Requirements 5.3**

### Property 12: Revocation Workflow
*For any* revoked certificate, is_revoked SHALL be true, revocation_reason SHALL be non-empty, and the record SHALL be retained.
**Validates: Requirements 6.1, 6.2, 6.3**

## Error Handling

- **CertificateNotEnabledException**: Thrown when generating for blueprint without certificate_enabled
- **TemplateMissingPlaceholdersException**: Thrown when template lacks required placeholders
- **DuplicateSerialNumberException**: Should not occur due to uniqueness check, but logged if constraint violation
- **CertificateNotFoundException**: Thrown when serial number not found during verification
- **CertificateAlreadyRevokedException**: Thrown when attempting to revoke already-revoked certificate

## Testing Strategy

### Property-Based Testing Library
PHPUnit with eris/eris for property-based tests.

### Test Data Generators
```php
// Serial number generator
$serialGen = Generator::tuple(
    Generator::elements(['CCT', 'XYZ', 'ABC']),
    Generator::int(2020, 2030),
    Generator::string(6)->filter(fn($s) => ctype_alnum($s))
)->map(fn($parts) => implode('-', $parts));

// Template HTML generator
$templateGen = Generator::elements([
    '<h1>{{student_name}}</h1><p>{{program_title}}</p><p>{{completion_date}}</p><p>{{serial_number}}</p>',
    '<div>Missing placeholders</div>',
]);

// Verification result generator
$resultGen = Generator::elements(['valid', 'revoked', 'not_found']);
```

### External Dependencies
- **barryvdh/laravel-dompdf**: PDF generation from HTML
