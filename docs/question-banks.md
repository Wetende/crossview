# Question banks

A question bank holds reusable quiz questions. Instructors copy bank questions into a quiz, or add a pool that draws a number of questions at random for every attempt. Each attempt freezes its own copy of the questions it received, so later bank edits never change a submitted grade.

## Scopes

Every bank has one scope:

| Scope       | Label in the UI | Belongs to        | Who can use it                                  | Who can edit it                         | Who can delete it   |
| ----------- | --------------- | ----------------- | ----------------------------------------------- | --------------------------------------- | ------------------- |
| Course      | Course          | One course        | Instructors assigned to that course             | Instructors assigned to that course     | Its owner, admins   |
| Instructor  | My library      | One instructor    | Its owner, in every course they teach           | Its owner, admins                       | Its owner, admins   |
| Institution | Shared          | The whole site    | Every instructor                                | Admins                                  | Admins              |

Existing banks migrate to the course scope, so nothing changes for them until someone creates a library or shared bank.

- A course bank always has a course. Library and shared banks have none.
- An admin can promote any course or library bank to a shared bank from **Admin → Question Banks**. Quizzes that already use the bank keep working.
- Archiving a bank hides it from pickers and search. Pools that already draw from it keep drawing.
- A bank that any quiz pool still uses cannot be deleted (HTTP 409 `bank_in_use`). Archive it instead.
- Deleting a user keeps their banks and questions, with no owner. An ownerless library bank becomes visible to admins only, who can promote or delete it.

## Edits and versions

Editing a bank question creates a new version and keeps the revision history. Quizzes that copied an older version keep their copy. The quiz editor shows **Newer version in bank** on such a question, and **Update from bank** replaces the copy with the current version. Pools always draw the current version.

When one quiz has several pools on the same bank, the publish check counts the questions all of them need together. The draw fills the most constrained pool first, so a narrow pool is not starved by a wide one.

## Pages

- **Instructor → Question Library** (`/instructor/question-library/`): browse every bank the instructor can see, create course or library banks, write, edit, move, and delete questions.
- **Admin → Question Banks** (`/admin/question-banks/`): manage shared banks and promote existing banks.
- The course builder's **Question Bank** pool dialog, **Questions Library** drawer, and **Save to bank** dialog list every visible bank with its scope.

## API

All routes are under `/assessments/question-library/`. Pass `?program=<id>` to limit course banks to one course.

| Route                              | Methods             | Purpose                                                          |
| ---------------------------------- | ------------------- | ---------------------------------------------------------------- |
| `banks/`                           | GET, POST           | List visible banks (`scope`, `q`, `include_archived`) or create one |
| `banks/<id>/`                      | GET, PATCH, DELETE  | Read, rename, archive, or delete a bank                          |
| `banks/<id>/promote/`              | POST                | Admins only: make the bank shared                                |
| `entries/`                         | GET, POST           | Paginated search (`page`, `page_size` up to 100), or save a question |
| `entries/<id>/`                    | GET, PATCH, DELETE  | Read, edit (new version), or delete a question                   |
| `entries/<id>/add-to-quiz/`        | POST                | Copy a question into a quiz                                      |
| `categories/`, `stats/`            | GET                 | Category names and usage counts                                  |

The course-nested routes under `/assessments/programs/<id>/question-library/` keep their previous responses.

## Upgrade notes

- Migration `assessments.0022_question_bank_scopes` adds the scope, archive flag, and version tracking, and records the current version on every question that was already copied from a bank. Reversing it fails while library or shared banks exist; convert them to course banks first.
- `QuestionBank.program` can now be `NULL`. Code that reads a bank's course must handle library and shared banks.
- The course builder no longer receives the `questionLibrary` page prop. It fetches bank questions from the API and receives `questionLibraryVersions` for the update badge. Take the backend and builder changes together.
- `config/urls.py` includes `apps.assessments.page_urls`, and the dashboard navigation gains the two pages above.

## Acceptance walkthrough

1. As an instructor on course A, save a question to a new **My library** bank.
2. Open the course B builder: the bank appears with the **My library** chip in the pool dialog and the Questions Library drawer. A colleague on course B does not see it.
3. As an admin, promote the bank. The colleague now sees it as **Shared** and cannot edit it.
4. Add a pool that asks for more questions than the bank holds: the pool card shows **Only N of M available** and publishing is blocked.
5. Edit the bank question. The quiz that copied it shows **Newer version in bank**; **Update from bank** applies the new version.
