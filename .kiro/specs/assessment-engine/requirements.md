# Requirements Document

## Introduction

The Assessment Engine provides configurable grading logic that adapts to different academic models. It supports weighted summative grading (Theology: CAT 30% + Exam 70%), competency-based assessment (TVET: Competent/Not Yet Competent), and pass/fail systems. The engine reads grading configuration from the Academic Blueprint and calculates results accordingly.

## Glossary

- **Grading Strategy**: The algorithm used to calculate final results (weighted, competency, pass_fail).
- **Assessment Component**: A gradable element like CAT, Exam, Practical Observation, or Portfolio.
- **Result Status**: The outcome of an assessment (Pass, Fail, Competent, Not Yet Competent, Referral, Deferred).
- **Weighted Sum**: A grading strategy where components have percentage weights that sum to 100%.
- **Competency-Based**: A grading strategy where all required evidences must be present to achieve "Competent" status.
- **Pass Mark**: The minimum score required to pass (e.g., 40 for Theology).
- **Assessment Result**: The stored outcome of a student's assessment for a specific curriculum node.

## Requirements

### Requirement 1: Grading Strategy Configuration

**User Story:** As a registrar, I want to configure different grading strategies per blueprint, so that Theology programs use weighted grades while TVET programs use competency checks.

#### Acceptance Criteria

1. WHEN a blueprint specifies grading_logic type "weighted" THEN the Assessment Engine SHALL calculate results using component weights that sum to 1.0.
2. WHEN a blueprint specifies grading_logic type "competency" THEN the Assessment Engine SHALL evaluate all required evidences and return Competent only if all are present.
3. WHEN a blueprint specifies grading_logic type "pass_fail" THEN the Assessment Engine SHALL return Pass if score meets threshold, Fail otherwise.
4. WHEN grading_logic is missing required fields for its type THEN the Assessment Engine SHALL reject the configuration with a validation error.

### Requirement 2: Assessment Result Storage

**User Story:** As a lecturer, I want to record student assessment results, so that grades are persisted and can be retrieved for transcripts.

#### Acceptance Criteria

1. WHEN a lecturer submits an assessment result THEN the Assessment Engine SHALL store the result_data JSON with all component scores.
2. WHEN an assessment result is saved THEN the Assessment Engine SHALL calculate and store the final status based on the blueprint's grading strategy.
3. WHEN an assessment result exists for a student-node combination THEN the Assessment Engine SHALL update the existing record rather than create a duplicate.
4. WHEN an assessment result is queried THEN the Assessment Engine SHALL return the result with calculated totals and status.

### Requirement 3: Weighted Grading Calculation

**User Story:** As a student, I want my CAT and Exam scores combined correctly, so that my final grade reflects the 30/70 weighting.

#### Acceptance Criteria

1. WHEN calculating weighted results THEN the Assessment Engine SHALL multiply each component score by its weight and sum the products.
2. WHEN the weighted total is below the pass_mark THEN the Assessment Engine SHALL set status to "Referral".
3. WHEN the weighted total meets or exceeds the pass_mark THEN the Assessment Engine SHALL set status to "Pass" and calculate the letter grade.
4. WHEN a component score is missing THEN the Assessment Engine SHALL treat it as zero for calculation purposes.

### Requirement 4: Competency-Based Assessment

**User Story:** As a TVET instructor, I want to mark students as Competent or Not Yet Competent based on evidence submission, so that assessment follows CDACC guidelines.

#### Acceptance Criteria

1. WHEN evaluating competency THEN the Assessment Engine SHALL check each required evidence type defined in the blueprint.
2. WHEN all required evidences are marked as "pass" or "present" THEN the Assessment Engine SHALL set status to "Competent".
3. WHEN any required evidence is missing or marked "fail" THEN the Assessment Engine SHALL set status to "Not Yet Competent".
4. WHEN competency labels are customized in the blueprint THEN the Assessment Engine SHALL use those labels in the result.

### Requirement 5: Grade Letter Mapping

**User Story:** As a registrar, I want to configure grade boundaries (A, B, C, D, F), so that different programs can have different grading scales.

#### Acceptance Criteria

1. WHEN a blueprint defines grade_boundaries THEN the Assessment Engine SHALL map numeric scores to letter grades accordingly.
2. WHEN no grade_boundaries are defined THEN the Assessment Engine SHALL use default boundaries (A: 70+, B: 60-69, C: 50-59, D: 40-49, F: below 40).
3. WHEN calculating letter grade THEN the Assessment Engine SHALL find the highest boundary the score meets or exceeds.

### Requirement 6: Assessment Result Publishing

**User Story:** As a lecturer, I want to control when students see their results, so that I can review grades before releasing them.

#### Acceptance Criteria

1. WHEN an assessment result is created THEN the Assessment Engine SHALL set is_published to false by default.
2. WHEN a lecturer publishes a result THEN the Assessment Engine SHALL set is_published to true and record the publish timestamp.
3. WHEN a student queries their results THEN the Assessment Engine SHALL only return results where is_published is true.
4. WHEN a lecturer bulk-publishes results for a node THEN the Assessment Engine SHALL update all unpublished results for that node.

### Requirement 7: Assessment Result Serialization

**User Story:** As a developer, I want assessment results to be serializable, so that they can be exported for transcripts and reports.

#### Acceptance Criteria

1. WHEN an assessment result is serialized THEN the Assessment Engine SHALL produce JSON containing all scores, status, and metadata.
2. WHEN serializing for transcript THEN the Assessment Engine SHALL include student name, node title, component scores, total, and letter grade.
