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
- [ ] Keep product-specific branding out of the shared LMS repository.
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
- [x] Allow a user to clone a starter with **Use template**.
- [x] Show draft/published state, orientation and last-updated information.
- [x] Add object-level authorization for view, clone and edit operations.

### Test checkpoint

- [ ] An administrator can open the template gallery.
- [ ] Starter templates are visible and cannot be overwritten.
- [ ] **Use template** creates an independent editable draft.
- [ ] A blank portrait or landscape draft can be created.

## Milestone 2 — Visual builder

- [x] Build the MasterStudy-style workspace:
  - [x] top toolbar with name, status, undo/redo, zoom, save and preview;
  - [x] left panel for elements and layers;
  - [x] fixed-ratio page canvas;
  - [x] right properties panel for the selected element.
- [ ] Support drag-to-position, keyboard movement, resize and rotation.
- [ ] Add snap guides, alignment tools and canvas boundaries.
- [ ] Support duplicate, lock, hide, layer ordering and delete.
- [ ] Add unsaved-change protection.
- [x] Add undo/redo history.
- [ ] Make the builder usable at common laptop resolutions.

### Test checkpoint

- [ ] A user can add an element, drag it, resize it and edit its properties.
- [ ] Saving and reopening restores the same layout.
- [ ] Undo/redo works for element and styling changes.
- [ ] Elements cannot be accidentally dragged outside the printable page.

## Milestone 3 — Certificate elements and styling

- [ ] Add dynamic content elements:
  - [x] student name;
  - [x] course title;
  - [ ] completion date;
  - [x] issue date;
  - [ ] certificate code;
  - [ ] verification URL and QR code;
  - [ ] instructor name;
  - [ ] site or organization name;
  - [ ] custom text.
- [ ] Add visual elements:
  - [ ] image/logo;
  - [ ] signature;
  - [x] decorative line;
  - [x] shape;
  - [ ] background image or color.
- [ ] Add typography controls including family, size, weight, alignment,
      colour, line height and letter spacing.
- [ ] Add safe asset upload and asset reuse.
- [x] Provide meaningful sample data while editing.
- [ ] Define graceful fallback values for missing dynamic data.

### Test checkpoint

- [ ] Every supported dynamic field renders sample content in the builder.
- [ ] Preview replaces sample content with a selected learner/course context.
- [ ] A logo, signature and background can be uploaded and positioned.

## Milestone 4 — Preview, publishing and versions

- [ ] Generate a faithful PDF preview from the structured layout.
- [ ] Use the same rendering pipeline for preview and final issuance.
- [ ] Publish an immutable template version.
- [ ] Keep later edits in a new draft without changing issued certificates.
- [ ] Allow a published version to be duplicated for further editing.
- [ ] Add a concise version and publish history.
- [ ] Record who created, edited and published each version.

### Test checkpoint

- [ ] Browser canvas and generated PDF have matching positions and typography.
- [ ] Publishing freezes the version used for issuance.
- [ ] Editing after publication does not alter an existing certificate.

## Milestone 5 — Assignment and course-builder integration

- [ ] Add assignment precedence:
  1. course-specific template;
  2. category-specific template;
  3. organization default template.
- [ ] Add certificate selection to the course builder.
- [ ] Allow eligible instructors to create or choose a certificate.
- [ ] Preserve existing blueprint/eligibility rules.
- [ ] Show which assignment rule selected the effective certificate.
- [ ] Warn before unpublishing a version currently used by courses.

### Test checkpoint

- [ ] A course can select a published certificate from its builder.
- [ ] Course overrides category, and category overrides the default.
- [ ] Learners receive the expected template after satisfying eligibility.

## Milestone 6 — Issuance, download and verification

- [ ] Issue certificates from a published version snapshot.
- [ ] Store a non-guessable verification identifier.
- [ ] Add authenticated certificate download with object-level authorization.
- [ ] Add configurable public verification without exposing private learner data.
- [ ] Render code and QR verification elements.
- [ ] Preserve revocation and re-issue behavior.
- [ ] Add rate limiting and abuse controls to public verification.
- [ ] Restrict PDF/image fetching to approved local assets and hosts.

### Test checkpoint

- [ ] A qualifying learner can download the issued PDF.
- [ ] Another learner cannot access that PDF by changing an identifier.
- [ ] Public verification reports valid, revoked and unknown certificates.
- [ ] Revoked certificates cannot be represented as valid.

## Milestone 7 — Quality and rollout

- [ ] Add model, permission, API, rendering and browser-flow tests.
- [ ] Check portrait/landscape output and long-name overflow.
- [ ] Check accessibility for keyboard operation, focus order and contrast.
- [ ] Check template payload size and PDF-render performance.
- [ ] Document template administration and instructor workflows.
- [ ] Run canonical LMS checks and record evidence.
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
