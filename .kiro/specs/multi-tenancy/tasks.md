# Implementation Plan

- [ ] 1. Set up database schema and models
  - [ ] 1.1 Create migration for tenants table
    - Create table with name, subdomain (unique), admin_email, subscription_tier_id, is_active, settings, activated_at
    - Add indexes on subdomain and is_active
    - _Requirements: 1.1_

  - [ ] 1.2 Create migration for tenant_brandings table
    - Create table with tenant_id, logo_path, primary_color, secondary_color, institution_name, tagline, favicon_path
    - Add foreign key to tenants
    - _Requirements: 4.1_

  - [ ] 1.3 Create migration for tenant_limits table
    - Create table with tenant_id, max_students, max_storage_mb, max_programs, current_students, current_storage_mb, current_programs
    - Add foreign key to tenants
    - _Requirements: 6.1_

  - [ ] 1.4 Create migration for preset_blueprints table
    - Create table with name, code (unique), description, regulatory_body, hierarchy_labels, grading_config, structure_rules, is_active
    - Add indexes
    - _Requirements: 5.1_

  - [ ] 1.5 Create migration to add tenant_id to existing tables
    - Add tenant_id column to users, academic_blueprints, curriculum_nodes, enrollments, etc.
    - Add foreign keys
    - _Requirements: 2.1_

  - [ ] 1.6 Create Tenant Eloquent model
    - Define fillable fields, casts, and relationships
    - _Requirements: 1.1_

  - [ ] 1.7 Create TenantBranding, TenantLimits, PresetBlueprint models
    - Define fillable fields, casts, and relationships
    - _Requirements: 4.1, 6.1, 5.1_

- [ ] 2. Implement tenant context and identification
  - [ ] 2.1 Create TenantContext singleton service
    - Implement set(), get(), id(), check(), clear() methods
    - Register as singleton in service provider
    - _Requirements: 3.3_

  - [ ] 2.2 Create TenantIdentifier middleware
    - Extract subdomain from request
    - Resolve tenant and set context
    - Return 404 for unknown subdomains
    - _Requirements: 3.1, 3.2_

  - [ ] 2.3 Write property test for subdomain identification
    - **Property 7: Subdomain Identification**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ] 3. Implement query scoping
  - [ ] 3.1 Create TenantScope global scope
    - Implement apply() to add tenant_id WHERE clause
    - _Requirements: 2.1_

  - [ ] 3.2 Create BelongsToTenant trait
    - Apply TenantScope in booted()
    - Auto-set tenant_id on creating event
    - _Requirements: 2.1_

  - [ ] 3.3 Apply trait to all tenant-scoped models
    - Add BelongsToTenant to User, AcademicBlueprint, CurriculumNode, Enrollment, etc.
    - _Requirements: 2.1_

  - [ ] 3.4 Write property test for query scoping
    - **Property 3: Query Scoping**
    - **Validates: Requirements 2.1**

  - [ ] 3.5 Write property test for cross-tenant access denial
    - **Property 4: Cross-Tenant Access Denial**
    - **Validates: Requirements 2.2**

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement tenant registration and provisioning
  - [ ] 5.1 Create TenantService
    - Implement create() to create tenant record
    - Implement provision() to create admin user, branding, limits
    - _Requirements: 1.1, 1.2_

  - [ ] 5.2 Write property test for tenant creation with admin
    - **Property 1: Tenant Creation with Admin**
    - **Validates: Requirements 1.1, 1.2**

  - [ ] 5.3 Implement welcome email sending
    - Send email with login credentials after provisioning
    - _Requirements: 1.4_

  - [ ] 5.4 Implement tenant deletion with cascade
    - Delete all associated data and files
    - _Requirements: 2.4_

  - [ ] 5.5 Write property test for tenant deletion cascade
    - **Property 6: Tenant Deletion Cascade**
    - **Validates: Requirements 2.4**

- [ ] 6. Implement preset blueprints
  - [ ] 6.1 Create PresetService
    - Implement getAll(), getByCode()
    - Implement copyToTenant() to create tenant blueprint from preset
    - _Requirements: 5.1, 5.2_

  - [ ] 6.2 Create database seeder for 5 regulatory presets
    - Seed TVET CDACC, NITA Trade, NTSA Driving, CBC K-12, CCT Theology
    - _Requirements: 5.1_

  - [ ] 6.3 Write property test for preset blueprint copying
    - **Property 2: Preset Blueprint Copying**
    - **Validates: Requirements 1.3, 5.2**

  - [ ] 6.4 Write property test for preset copy isolation
    - **Property 9: Preset Copy Isolation**
    - **Validates: Requirements 5.3, 5.4**

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement file storage isolation
  - [ ] 8.1 Create TenantAwareStorage service
    - Prefix all paths with tenant identifier
    - _Requirements: 2.3_

  - [ ] 8.2 Write property test for file storage isolation
    - **Property 5: File Storage Isolation**
    - **Validates: Requirements 2.3**

- [ ] 9. Implement branding
  - [ ] 9.1 Implement branding configuration in TenantService
    - Allow setting logo, colors, institution name
    - _Requirements: 4.1_

  - [ ] 9.2 Create BrandingMiddleware to inject branding into views
    - Apply tenant branding or defaults
    - _Requirements: 4.1, 4.3_

  - [ ] 9.3 Write property test for branding configuration
    - **Property 8: Branding Configuration**
    - **Validates: Requirements 4.1, 4.3**

- [ ] 10. Implement billing and limits
  - [ ] 10.1 Create BillingService
    - Implement checkLimits() for students, storage, programs
    - Implement getUsageStats()
    - _Requirements: 6.1, 6.4_

  - [ ] 10.2 Implement limit enforcement
    - Prevent enrollments when student limit exceeded
    - Prevent uploads when storage limit exceeded
    - Send notifications to admin
    - _Requirements: 6.2, 6.3_

  - [ ] 10.3 Write property test for limit assignment
    - **Property 10: Limit Assignment**
    - **Validates: Requirements 6.1**

  - [ ] 10.4 Write property test for limit enforcement
    - **Property 11: Limit Enforcement**
    - **Validates: Requirements 6.2, 6.3**

  - [ ] 10.5 Write property test for usage statistics
    - **Property 12: Usage Statistics**
    - **Validates: Requirements 6.4**

- [ ] 11. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
