# Certificate Builder Implementation Checklist

## Product direction

- [x] Use a dedicated LMS worktree and feature branch.
- [x] Treat the builder as shared LMS-engine functionality.
- [x] Follow the MasterStudy interaction model while keeping an original,
      product-neutral interface and implementation.
- [x] Make certificates editable inside the platform. Administrators and
      instructors should not need to edit HTML or application code.
- [x] Provide generic starter templates that are copied before editing so the
      original starter remains reusable.
- [x] Keep product-specific branding out of the shared LMS repository.
- [ ] Synchronize the completed shared-engine changes to Airads and DigikaTech
      only after the canonical LMS implementation has been tested and accepted.

## Milestone 1 — Template foundation and gallery

- [x] Add editable, versioned certificate template storage.
- [x] Retain legacy certificate-template compatibility during migration.
- [x] Store page size, orientation, background and positioned elements as
      structured layout data rather than unrestricted HTML.
- [x] Add protected, product-neutral starter templates:
  - [x] Classic Formal
  - [x] Modern Blue
  - [x] Minimal Professional
  - [x] Academic Gold
  - [x] Participation
- [x] Add an admin certificate-template gallery.
- [x] Allow a user to create a blank portrait or landscape certificate.
- [x] Clone a starter and open the visual builder directly when its thumbnail is
      selected.
- [x] Keep the gallery focused on template thumbnails rather than exposing
      unnecessary status, orientation and metadata.
- [x] Add object-level authorization for view, clone and edit operations.

### Test checkpoint

- [x] An administrator can open the template gallery.
- [x] Starter templates are visible and cannot be overwritten.
- [x] Selecting a template creates an independent editable draft.
- [x] A blank portrait or landscape draft can be created.

## Milestone 2 — Visual builder

- [x] Build the MasterStudy-style workspace:
  - [x] top toolbar with name, status, undo/redo, zoom, save and preview;
  - [x] left panel for elements and layers;
  - [x] fixed-ratio page canvas;
  - [x] right properties panel for the selected element.
- [x] Support drag-to-position, keyboard movement, numeric resize and rotation.
- [ ] Add snap guides, alignment tools and canvas boundaries.
- [x] Support duplicate, lock, hide, layer ordering and delete.
- [x] Add unsaved-change protection.
- [x] Add undo/redo history.
- [x] Make the builder usable at common laptop resolutions.

### Test checkpoint

- [x] A user can add an element, drag it, resize it and edit its properties.
- [x] Saving and reopening restores the same layout.
- [x] Undo/redo works for element and styling changes.
- [ ] Elements cannot be accidentally dragged outside the printable page.

## Milestone 3 — Certificate elements and styling

- [x] Add dynamic content elements:
  - [x] student name;
  - [x] course title;
  - [x] completion date;
  - [x] issue date;
  - [x] certificate code;
  - [x] verification URL and QR code;
  - [x] instructor name;
  - [x] site or organization name;
  - [x] custom text.
- [x] Add visual elements:
  - [x] image/logo;
  - [x] signature;
  - [x] decorative line;
  - [x] shape;
  - [x] background image or color.
- [x] Add typography controls including family, size, weight, alignment,
      colour, line height and letter spacing.
- [x] Add safe image asset upload.
- [x] Provide meaningful sample data while editing.
- [x] Define graceful fallback values for missing dynamic data.

### Test checkpoint

- [x] Every supported dynamic field renders sample content in the builder.
- [x] Issuance replaces sample content with learner/course data.
- [x] A logo, signature and background can be uploaded and positioned.

## Milestone 4 — Preview, publishing and versions

- [x] Generate a faithful PDF preview from the structured layout.
- [x] Use the same rendering pipeline for preview and final issuance.
- [x] Publish an immutable template version.
- [x] Keep later edits in a new draft without changing issued certificates.
- [x] Allow a published version to be duplicated for further editing.
- [ ] Add a concise version and publish history.
- [ ] Record who created, edited and published each version.

### Test checkpoint

- [x] Browser canvas and generated PDF have matching positions and typography.
- [x] Publishing freezes the version used for issuance.
- [x] Editing after publication does not alter an existing certificate.

## Milestone 5 — Assignment and course-builder integration

- [x] Add assignment precedence:
  1. course-specific template;
  2. category-specific template;
  3. organization default template.
- [x] Add certificate selection to the course builder.
- [x] Show published certificates as visual course-builder thumbnails with a
      selected state and non-destructive preview dialog.
- [x] Preview the inherited category/system design on the default tile.
- [x] Allow eligible instructors to create or choose a certificate.
- [x] Preserve existing blueprint/eligibility rules.
- [x] Show which assignment rule selected the effective certificate.
- [ ] Warn before unpublishing a version currently used by courses.

### Test checkpoint

- [x] A course can select a published certificate from its builder.
- [x] Course overrides category, and category overrides the default.
- [x] Learners receive the expected template after satisfying eligibility.

## Milestone 6 — Issuance, download and verification

- [x] Automatically issue exactly one certificate when course completion,
      progress, grade and certificate-configuration requirements are satisfied.
- [x] Recheck issuance when a final grade is published after course completion.
- [x] Keep failed PDF renders pending for administrator retry without blocking
      learner completion.
- [x] Issue certificates from a published version snapshot.
- [x] Store a non-guessable verification identifier.
- [x] Add authenticated certificate download with object-level authorization.
- [x] Add configurable public verification without exposing private learner data.
- [x] Render code and QR verification elements.
- [x] Preserve revocation and re-issue behavior.
- [ ] Add rate limiting and abuse controls to public verification.
- [x] Restrict PDF/image fetching to approved local assets and hosts.

### Test checkpoint

- [x] A qualifying completion issues a certificate without an administrator
      release step.
- [x] Repeated completion/refresh events do not create duplicate certificates.
- [x] A rendering failure remains pending and succeeds on a later retry.
- [x] A qualifying learner can download the issued PDF.
- [x] Another learner cannot access that PDF by changing an identifier.
- [x] Public verification reports valid, revoked and unknown certificates.
- [x] Revoked certificates cannot be represented as valid.

## Milestone 7 — Quality and rollout

- [x] Add model, permission, API, rendering and browser-flow tests.
- [x] Check portrait/landscape output and long-name overflow.
- [ ] Check accessibility for keyboard operation, focus order and contrast.
- [ ] Check template payload size and PDF-render performance.
- [ ] Document template administration and instructor workflows.
- [x] Run canonical LMS checks and record evidence.
- [ ] Obtain user acceptance on the LMS branch.
- [ ] Review Airads and DigikaTech repository state again.
- [ ] Port shared-engine commits sequentially to Airads, then DigikaTech.
- [ ] Validate each product independently after synchronization.

## Out of scope for the first release

- Arbitrary HTML, CSS or JavaScript editing.
- Multi-page certificates.
- Real-time collaborative editing.
- A public marketplace for template packs.
- Product-branded starter templates in the shared LMS engine.
