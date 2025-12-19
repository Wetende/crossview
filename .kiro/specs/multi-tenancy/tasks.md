# Implementation Plan

> **🔄 Migration Notice:** This implementation plan is for migrating from PHP/Laravel to Python/Django. All tasks reference Django-specific implementations (Django models, migrations, pytest/Hypothesis for testing, management commands).

- [x] 1. Set up database schema and models
  - [x] 1.1 Create Django migration for tenants table
    - Create table with name, subdomain (unique), admin_email, subscription_tier_id, is_active, settings, activated_at
    - Add indexes on subdomain and is_active
    - _Requirements: 1.1_

  - [x] 1.2 Create Django migration for tenant_brandings table
    - Create table with tenant_id, logo_path, primary_color, secondary_color, institution_name, tagline, favicon_path
    - Add foreign key to tenants
    - _Requirements: 4.1_

  - [x] 1.3 Create Django migration for tenant_limits table
    - Create table with tenant_id, max_students, max_storage_mb, max_programs, current_students, current_storage_mb, current_programs
    - Add foreign key to tenants
    - _Requirements: 6.1_

  - [x] 1.4 Create Django migration for preset_blueprints table
    - Create table with name, code (unique), description, regulatory_body, hierarchy_labels, grading_config, structure_rules, is_active
    - Add indexes
    - _Requirements: 5.1_

  - [x] 1.5 Create Django migration to add tenant_id to existing tables
    - Add tenant_id column to users, academic_blueprints, curriculum_nodes, enrollments, etc.
    - Add foreign keys
    - _Requirements: 2.1_

  - [x] 1.6 Create Tenant Django model
    - Define fields, JSONField for settings, and relationships
    - _Requirements: 1.1_

  - [x] 1.7 Create TenantBranding, TenantLimits, PresetBlueprint models
    - Define fields and relationships
    - _Requirements: 4.1, 6.1, 5.1_

- [x] 2. Implement tenant context and identification
  - [x] 2.1 Create TenantContext thread-local singleton
    - Implement set(), get(), id(), check(), clear() methods
    - _Requirements: 3.3_

  - [x] 2.2 Create TenantMiddleware
    - Extract subdomain from request
    - Resolve tenant and set context
    - Return 404 for unknown subdomains
    - _Requirements: 3.1, 3.2_

  - [x] 2.3 Write property test for subdomain identification
    - **Property 7: Subdomain Identification**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 3. Implement query scoping
  - [x] 3.1 Create TenantManager custom QuerySet
    - Override get_queryset() to add tenant_id filter
    - _Requirements: 2.1_

  - [x] 3.2 Create TenantAwareModel abstract base class
    - Apply TenantManager as default manager
    - Auto-set tenant_id on save
    - _Requirements: 2.1_

  - [x] 3.3 Apply TenantAwareModel to all tenant-scoped models
    - Inherit from TenantAwareModel in User, AcademicBlueprint, CurriculumNode, Enrollment, etc.
    - _Requirements: 2.1_

  - [x] 3.4 Write property test for query scoping
    - **Property 3: Query Scoping**
    - **Validates: Requirements 2.1**

  - [x] 3.5 Write property test for cross-tenant access denial
    - **Property 4: Cross-Tenant Access Denial**
    - **Validates: Requirements 2.2**

- [x] 4. Checkpoint - Ensure all tests pass
  - All 62 tenant tests pass.

- [x] 5. Implement tenant registration and provisioning
  - [x] 5.1 Create TenantService
    - Implement create() to create tenant record
    - Implement provision() to create admin user, branding, limits
    - _Requirements: 1.1, 1.2_

  - [x] 5.2 Write property test for tenant creation with admin
    - **Property 1: Tenant Creation with Admin**
    - **Validates: Requirements 1.1, 1.2**

  - [x] 5.3 Implement welcome email sending using Django email
    - Send email with login credentials after provisioning
    - _Requirements: 1.4_

  - [x] 5.4 Implement tenant deletion with cascade
    - Delete all associated data and files
    - _Requirements: 2.4_

  - [x] 5.5 Write property test for tenant deletion cascade
    - **Property 6: Tenant Deletion Cascade**
    - **Validates: Requirements 2.4**

- [x] 6. Implement preset blueprints
  - [x] 6.1 Create PresetService
    - Implement get_all(), get_by_code()
    - Implement copy_to_tenant() to create tenant blueprint from preset
    - _Requirements: 5.1, 5.2_

  - [x] 6.2 Create Django data migration for 5 regulatory presets
    - Seed TVET CDACC, NITA Trade, NTSA Driving, CBC K-12, CCT Theology
    - _Requirements: 5.1_

  - [x] 6.3 Write property test for preset blueprint copying
    - **Property 2: Preset Blueprint Copying**
    - **Validates: Requirements 1.3, 5.2**

  - [x] 6.4 Write property test for preset copy isolation
    - **Property 9: Preset Copy Isolation**
    - **Validates: Requirements 5.3, 5.4**

- [x] 7. Checkpoint - Ensure all tests pass
  - All 62 tenant tests pass.

- [x] 8. Implement file storage isolation
  - [x] 8.1 Create TenantAwareStorage service
    - Prefix all paths with tenant identifier
    - _Requirements: 2.3_

  - [x] 8.2 Write property test for file storage isolation
    - **Property 5: File Storage Isolation**
    - **Validates: Requirements 2.3**

- [x] 9. Implement branding
  - [x] 9.1 Implement branding configuration in TenantService
    - Allow setting logo, colors, institution name
    - _Requirements: 4.1_

  - [x] 9.2 Create BrandingMiddleware to inject branding into context
    - Apply tenant branding or defaults using context processors
    - _Requirements: 4.1, 4.3_

  - [x] 9.3 Write property test for branding configuration
    - **Property 8: Branding Configuration**
    - **Validates: Requirements 4.1, 4.3**

- [x] 10. Implement billing and limits
  - [x] 10.1 Create BillingService
    - Implement check_limits() for students, storage, programs
    - Implement get_usage_stats()
    - _Requirements: 6.1, 6.4_

  - [x] 10.2 Implement limit enforcement
    - Prevent enrollments when student limit exceeded
    - Prevent uploads when storage limit exceeded
    - Send notifications to admin
    - _Requirements: 6.2, 6.3_

  - [x] 10.3 Write property test for limit assignment
    - **Property 10: Limit Assignment**
    - **Validates: Requirements 6.1**

  - [x] 10.4 Write property test for limit enforcement
    - **Property 11: Limit Enforcement**
    - **Validates: Requirements 6.2, 6.3**

  - [x] 10.5 Write property test for usage statistics
    - **Property 12: Usage Statistics**
    - **Validates: Requirements 6.4**

- [x] 11. Final Checkpoint - Ensure all tests pass
  - All 62 tenant tests pass.
