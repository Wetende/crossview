# Certificate Builder v2 — MasterStudy-Inspired Plan

## Outcome

Build a platform-native certificate editor with the clarity of MasterStudy's
workflow while retaining the LMS's stronger guarantees:

- administrators edit certificates visually, without changing code;
- a published version is immutable;
- course, category and default assignment use one predictable precedence rule;
- the browser preview and issued PDF consume the same structured document;
- long, multilingual learner data cannot silently disappear.

This is an interaction reference, not a copy of MasterStudy's code, branding or
assets.

## What already works

The current branch already provides the foundation that should not be rewritten:

- a focused template gallery with ten protected, editable starters;
- blank portrait and landscape certificates;
- drag positioning, numeric sizing, rotation, locking, hiding, ordering,
  duplication and undo/redo;
- safe image uploads and structured JSON layouts;
- preview and issuance through the same WeasyPrint renderer;
- immutable published versions and issued-layout snapshots;
- default, category and course assignment precedence;
- a visual course-builder selector with template thumbnails and preview;
- automatic, idempotent issuance after progress and grade requirements pass;
- learner download, revocation and public verification.

## Architecture decision

Continue with the structured DOM canvas and deterministic PDF renderer for v2.
Do not introduce Konva yet.

Konva would improve transform handles and multi-selection, but adopting it now
would create a second rendering model. Every Konva-only behaviour would need an
equivalent implementation in the PDF renderer or the issued certificate could
differ from the editor. The present schema already supports bounded positioning,
rotation, layers and styling, so it is safer to add the missing behaviours to
that schema first.

Reconsider Konva only if usability testing shows that multi-select and freeform
transform handles materially block certificate production. If adopted later,
Konva must remain an editor for the same JSON schema rather than becoming the
source of PDF output.

## Experience map

| Area | v2 behaviour | Status |
| --- | --- | --- |
| Builder navigation | Certificates and Link certificates, matching the assignment workflow | Implemented |
| Left rail | Editable certificate thumbnails, current selection and create button | Implemented |
| Top toolbar | Name, status, undo, redo, selected-item duplicate, preview, test PDF, save and publish | Implemented |
| Preview controls | Zoom, standard/long-name data, printable safe area and snapping | Implemented |
| Right sidebar | Elements and Backgrounds tabs, with contextual properties after selection | Implemented |
| Element panel | Grouped Certificate, Course, Student, Instructor, Design and Organisation fields | Implemented |
| Layer operations | Lock, hide, order, duplicate and delete from the selected element; no raw Layers list in the primary interface | Implemented |
| Canvas | Drag, keyboard move, rotate, page bounds, safe margins, page/element snapping and page alignment | Implemented; resize handles and visible live snap guides remain |
| Text properties | Font, size, weight, italic, underline, colour, case, spacing, line height, alignment, opacity and shadow | Implemented |
| Dynamic text safety | Auto-shrink, min/max sizes, wrapping, one-line mode, ellipsis and overflow warning | Implemented |
| Images | Upload/replace, fit/crop mode, opacity, border, radius, size and rotation | Implemented |
| QR code | Size, error correction, border, padding and foreground/background colours | Implemented |
| Page | A4 orientation display, background colour/image, background lock and safe margin | Implemented |
| Page format | Change orientation or page size after creation | Planned; requires a version-dimension migration |
| Advanced canvas | Multi-select, group movement and distribute tools | Planned after usability testing |

## Dynamic data contract

### Available from current LMS records

- student name and generated student number;
- course name, level, category/department and duration;
- grade/status, score and completion progress;
- enrolment/start, completion and issue dates;
- instructor and co-instructor;
- organisation and configured campus/principal values;
- certificate serial/verification code, verification URL and QR code.

### Optional institutional values

Admission number, national examination number, campus and principal/director
must never be invented. Their placeholders are available, but issued output is
blank until the deployment supplies those values. A later platform-settings
slice should add explicit mappings for deployments that require them.

## Delivery phases

### Phase 1 — Data-safe design controls

Acceptance:

- every supported placeholder renders in standard and stress previews;
- long names shrink only to the configured minimum;
- unresolved overflow is visibly warned about;
- apostrophes, accents and non-Latin text survive preview and PDF output;
- editor and PDF use the same fitting rules;
- new styling fields survive save/reopen validation.

### Phase 2 — Page and canvas precision

Add live snap guide lines, direct resize handles, optional rotation handles,
layer drag ordering, aspect-ratio lock and distribution controls.

Acceptance:

- no drag or resize can leave an element outside the page;
- keyboard and pointer operations produce equivalent persisted coordinates;
- snap targets are visible while moving;
- browser/PDF geometry remains within the agreed visual tolerance.

### Phase 3 — Page formats and reusable designs

Add A4, Letter and institution-defined sizes. Allow orientation changes only by
creating a new draft version and scaling or repositioning elements with an
explicit confirmation preview.

Acceptance:

- published and issued versions never change dimensions;
- conversion reports any elements that no longer fit;
- background assets and safe margins scale predictably.

### Phase 4 — Institutional identity data

Add configurable student-number/admission/examination mappings, campus,
principal/director, official seal, default signatures and optional
institutional font packs.

Acceptance:

- missing official values render blank rather than plausible fake data;
- field visibility can be restricted by deployment mode;
- verification pages do not reveal fields that are not explicitly public.

### Phase 5 — Usability and rollout

Run keyboard/focus/contrast review, payload and PDF performance tests, browser
flows at laptop widths, and user acceptance. Only after acceptance should the
shared-engine commits be ported sequentially to Airads and DigikaTech.

## Required regression matrix

- landscape and portrait;
- each protected starter plus a blank design;
- standard and stress data profiles;
- long hyphenated names, apostrophes, accents and non-Latin characters;
- missing optional institutional data;
- save/reopen, publish, edit-after-publish and immutable issued snapshots;
- default, category and course assignment precedence;
- automatic issuance retries and duplicate prevention;
- learner download and public valid/revoked/unknown verification.
