# Implementation Plan

> **🔄 Migration Notice:** This implementation plan is for migrating from PHP/Laravel to Python/Django. All tasks reference Django-specific implementations (Django models, migrations, pytest/Hypothesis for testing, management commands).

- [-] 1. Set up database schema and models


  - [x] 1.1 Create Django migration for content_versions table

    - Create table with node_id, version, source_file_path, source_file_name, page_count, is_published, is_manually_edited, parsed_at, published_at, metadata
    - Add foreign keys and indexes
    - _Requirements: 5.1_


  - [ ] 1.2 Create Django migration for parsed_images table
    - Create table with content_version_id, original_path, optimized_path, page_number, width, height, file_size
    - Add foreign key
    - _Requirements: 1.3_


  - [x] 1.3 Create ContentVersion Django model

    - Define fields and relationships
    - Add sessions relationship
    - _Requirements: 5.1, 5.2_

- [-] 2. Implement PDF extraction


  - [x] 2.1 Install PyMuPDF (fitz) dependency

    - Add to requirements.txt
    - _Requirements: 1.1_

  - [x] 2.2 Create PdfExtractor service


    - Implement extract() for full PDF extraction
    - Implement extract_pages() for page range extraction
    - Implement detect_sections() for chapter detection
    - _Requirements: 1.1, 1.2, 2.2_



  - [ ] 2.3 Create ExtractedContent dataclass
    - Define pages, images, headings, page_count, metadata
    - _Requirements: 1.1_


  - [x] 2.4 Write property test for PDF extraction completeness

    - **Property 1: PDF Extraction Completeness**
    - **Validates: Requirements 1.1, 1.2, 1.3**


  - [ ] 2.5 Write property test for processing report accuracy
    - **Property 2: Processing Report Accuracy**
    - **Validates: Requirements 1.4**

- [x] 3. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [-] 4. Implement session generation


  - [ ] 4.1 Create SessionGenerator service
    - Implement generate() to create session nodes from content
    - Implement auto_generate_ranges() for auto-detection
    - Implement generate_title() for title extraction
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 4.2 Write property test for session generation from ranges

    - **Property 3: Session Generation from Ranges**
    - **Validates: Requirements 2.1, 2.4**


  - [ ] 4.3 Write property test for auto-detection
    - **Property 4: Auto-Detection Creates Sessions**
    - **Validates: Requirements 2.2**


  - [ ] 4.4 Write property test for session title generation
    - **Property 5: Session Title Generation**
    - **Validates: Requirements 2.3**


- [-] 5. Implement content optimization


  - [ ] 5.1 Install Pillow dependency
    - Add to requirements.txt
    - _Requirements: 3.2_


  - [ ] 5.2 Create ContentOptimizer service
    - Implement optimize() for mobile optimization
    - Implement optimize_images() for compression/resize
    - Implement to_html() for HTML conversion
    - Implement paginate() for large content
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 5.3 Write property test for content storage as HTML

    - **Property 6: Content Storage as HTML**
    - **Validates: Requirements 3.1, 3.4**


  - [ ] 5.4 Write property test for image optimization
    - **Property 7: Image Optimization**
    - **Validates: Requirements 3.2**


  - [ ] 5.5 Write property test for large content pagination
    - **Property 8: Large Content Pagination**
    - **Validates: Requirements 3.3**

- [x] 6. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [-] 7. Implement ContentParserService


  - [ ] 7.1 Create ContentParserService
    - Implement parse_pdf() orchestrating extraction, generation, optimization
    - Create ContentVersion record
    - Store parsed content in node properties
    - _Requirements: 1.1, 2.1, 3.1_


  - [ ] 7.2 Implement content editing
    - Allow editing session content_html
    - Set is_manually_edited flag on edit
    - _Requirements: 4.1, 4.2_

  - [x] 7.3 Write property test for edit persistence

    - **Property 9: Edit Persistence with Modified Flag**

    - **Validates: Requirements 4.1, 4.2**

  - [ ] 7.4 Implement re-parse with warning
    - Check is_manually_edited before re-parsing
    - Return warning if edited content would be overwritten
    - _Requirements: 4.3_


  - [ ] 7.5 Write property test for re-parse warning
    - **Property 10: Re-parse Warning for Edited Content**
    - **Validates: Requirements 4.3**

- [-] 8. Implement versioning

  - [x] 8.1 Implement version creation on new upload

    - Increment version number
    - Create new ContentVersion record
    - _Requirements: 5.1_


  - [ ] 8.2 Implement version retrieval
    - Return all versions for a node
    - _Requirements: 5.2_


  - [ ] 8.3 Write property test for version creation and retrieval
    - **Property 11: Version Creation and Retrieval**
    - **Validates: Requirements 5.1, 5.2**


  - [ ] 8.4 Implement version publishing
    - Set is_published flag
    - Make published version active for students
    - _Requirements: 5.3_


  - [ ] 8.5 Write property test for version publishing
    - **Property 12: Version Publishing**
    - **Validates: Requirements 5.3**


- [x] 9. Final Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.
