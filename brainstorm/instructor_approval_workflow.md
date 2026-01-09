# Instructor Approval Workflow & Vetting Process
*Brainstorming Summary*

## 1. Core Concept: The "Instructor Profile"
To separate generic user data from instructor-specific vetting data, we will introduce an **InstructorProfile** concept (likely a separate model/table linked to the User).

This profile holds the "state" of the application and all provided credentials.

### Data Requirements (The Application Form)
When a user applies to become an instructor, they must provide:
*   **Professional Identity**: Bio/About Me, Job Title (e.g., "Senior Calculus Teacher").
*   **Proof of Expertise**:
    *   **Resume/CV** (File Upload - *Sensitive*)
    *   **Certifications** (File Uploads - *Sensitive*)
    *   **LinkedIn URL** (Link)
    *   **Vetting Questions** (e.g., "Why do you want to teach here?", "Past teaching experience?")

## 2. Application Lifecycle (Statuses)
The application will move through the following states:

1.  **DRAFT**: User is filling out the form but hasn't submitted.
2.  **PENDING_REVIEW**: Application submitted. User sees "Application Under Review" on dashboard. Admin receives notification.
3.  **APPROVED**: Admin has vetted and accepted the instructor.
4.  **REJECTED**: Admin has denied the application.

## 3. The Approval Workflow (The "Happy Path")
1.  **Submission**: User completes profile and clicks "Submit Application".
    *   *System*: Changes status to `PENDING_REVIEW`.
2.  **Admin Review**: Admin views the "Pending Applications" queue.
    *   Admin reviews Bio, LinkedIn, and downloads CV/Certifications.
3.  **Decision - Approve**:
    *   Admin clicks **Approve**.
    *   *System*:
        *   Sets status to `APPROVED`.
        *   Updates User Role/Permissions (adds to `Instructors` group).
        *   Sends "Welcome to the Instructor Team" email.
        *   Enables "Course Creator" tools in the user's dashboard.

## 4. The Rejection Workflow & Data Privacy
1.  **Decision - Reject**:
    *   Admin clicks **Reject**.
    *   *Requirement*: Admin **MUST** provide a "Reason for Rejection" (text field).
2.  **System Actions**:
    *   Sets status to `REJECTED`.
    *   Sends email to user: "Application Update" (including the Admin's reason).
    *   **CRITICAL PRIVACY ACTION**: The system **automatically deletes** the uploaded Resume/CV and Certification files from the storage server.
        *   *Rationale*: We do not want to hold sensitive personal documents for users who are not part of our organization.
    *   **Locking**: The application enters a "Locked" state. The user CANNOT immediately edit and resubmit.

## 5. Re-Application (The "Unlock" Process)
1.  **Admin Action**: If the admin decides to give the user another chance (perhaps after an offline conversation), they can click **"Unlock Application"**.
2.  **System Actions**:
    *   Changes status from `REJECTED` to `DRAFT`.
    *   User receives notification: "Your application has been unlocked. You may now update your details and resubmit."
    *   *Note*: Since the CV was deleted upon rejection, the user **MUST** upload a new CV to submit again.
