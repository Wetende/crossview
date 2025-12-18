# Requirements Document

## Introduction

The Content Parser transforms PDF documents into structured curriculum nodes (sessions) for mobile-friendly consumption. It enables the "Digital Library" feature where large PDF notes are broken into bite-sized text sessions that students can read on low-end Android phones without downloading massive files.

## Glossary

- **Content Parser**: The service that extracts and structures content from PDF documents.
- **Session Node**: A curriculum node containing a portion of parsed content (text, images).
- **Page Range**: A specification of which PDF pages belong to a session (e.g., pages 1-5).
- **Content Block**: A unit of parsed content (paragraph, heading, image, table).
- **Mobile-Optimized**: Content formatted for efficient loading on low-bandwidth mobile devices.

## Requirements

### Requirement 1: PDF Upload and Processing

**User Story:** As a lecturer, I want to upload a PDF and have it parsed into sessions, so that students can consume content in manageable chunks.

#### Acceptance Criteria

1. WHEN a lecturer uploads a PDF to a unit node THEN the Content Parser SHALL extract text content from all pages.
2. WHEN processing a PDF THEN the Content Parser SHALL preserve basic formatting (headings, paragraphs, lists).
3. WHEN a PDF contains images THEN the Content Parser SHALL extract and store images separately with references.
4. WHEN processing completes THEN the Content Parser SHALL report the number of pages processed and any errors.

### Requirement 2: Session Generation

**User Story:** As a lecturer, I want to define how the PDF is split into sessions, so that content is organized logically.

#### Acceptance Criteria

1. WHEN a lecturer specifies page ranges THEN the Content Parser SHALL create one session node per range.
2. WHEN no page ranges are specified THEN the Content Parser SHALL create one session per chapter/section detected.
3. WHEN a session is created THEN the Content Parser SHALL set the session title from the first heading or page number.
4. WHEN sessions are generated THEN the Content Parser SHALL maintain correct position ordering.

### Requirement 3: Content Storage

**User Story:** As a student, I want to load session content quickly on my phone, so that I can study even with slow internet.

#### Acceptance Criteria

1. WHEN content is stored THEN the Content Parser SHALL save it as HTML in the node's properties.content_html field.
2. WHEN storing content THEN the Content Parser SHALL optimize images for mobile (compress, resize).
3. WHEN content exceeds a size threshold THEN the Content Parser SHALL paginate within the session.
4. WHEN content is retrieved THEN the Content Parser SHALL return it ready for rendering without additional processing.

### Requirement 4: Manual Content Editing

**User Story:** As a lecturer, I want to edit parsed content, so that I can fix parsing errors or add clarifications.

#### Acceptance Criteria

1. WHEN a lecturer edits session content THEN the Content Parser SHALL save the edited version.
2. WHEN content is edited THEN the Content Parser SHALL mark it as manually modified.
3. WHEN re-parsing is triggered THEN the Content Parser SHALL warn before overwriting manually edited content.

### Requirement 5: Content Versioning

**User Story:** As a lecturer, I want to update course materials without losing previous versions, so that I can track changes.

#### Acceptance Criteria

1. WHEN a new PDF is uploaded for an existing unit THEN the Content Parser SHALL create a new content version.
2. WHEN multiple versions exist THEN the Content Parser SHALL allow viewing previous versions.
3. WHEN a version is published THEN the Content Parser SHALL make it the active version for students.
