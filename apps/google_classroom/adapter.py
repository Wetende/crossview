from __future__ import annotations

import json

from django.conf import settings

from .configuration import decrypt_refresh_token


class ClassroomAPIError(RuntimeError):
    def __init__(self, message, *, category="remote_error", status_code=None):
        super().__init__(message)
        self.category = category
        self.status_code = status_code


def categorize_google_error(exc):
    status = getattr(getattr(exc, "resp", None), "status", None)
    content = getattr(exc, "content", b"")
    if isinstance(content, bytes):
        content = content.decode(errors="replace")
    lowered = str(content or exc).lower()
    if status == 401 or "invalid_grant" in lowered:
        return "authorization_invalid"
    if "accessnotconfigured" in lowered or "api has not been used" in lowered:
        return "api_disabled"
    if status == 403 and ("insufficient" in lowered or "scope" in lowered):
        return "insufficient_scope"
    if status == 403:
        return "teacher_role_required"
    if status == 404:
        return "remote_deleted"
    if status == 409:
        return "remote_conflict"
    if status == 429 or status == 503:
        return "quota_or_transient"
    return "remote_error"


class GoogleClassroomAdapter:
    """Thin Google API boundary; domain workflows remain outside this class."""

    def __init__(self, credential, service=None):
        self.credential = credential
        self._service = service

    @property
    def service(self):
        if self._service is None:
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build

            credentials = Credentials(
                token=None,
                refresh_token=decrypt_refresh_token(
                    self.credential.refresh_token_ciphertext
                ),
                token_uri="https://oauth2.googleapis.com/token",
                client_id=settings.GOOGLE_CLASSROOM_CLIENT_ID,
                client_secret=settings.GOOGLE_CLASSROOM_CLIENT_SECRET,
                scopes=self.credential.granted_scopes,
            )
            self._service = build(
                "classroom", "v1", credentials=credentials, cache_discovery=False
            )
        return self._service

    def _execute(self, request):
        try:
            return request.execute()
        except Exception as exc:
            category = categorize_google_error(exc)
            if category == "authorization_invalid":
                self.credential.status = self.credential.Status.INVALID
                self.credential.last_error = "Google Classroom authorization is no longer valid."
                self.credential.save(update_fields=["status", "last_error", "updated_at"])
                self.credential.course_links.update(sync_paused=True)
            raise ClassroomAPIError(
                "Google Classroom rejected the request.",
                category=category,
                status_code=getattr(getattr(exc, "resp", None), "status", None),
            ) from exc

    def _list_all(self, method, collection_key, **kwargs):
        rows = []
        page_token = None
        while True:
            response = self._execute(method(pageToken=page_token, **kwargs))
            rows.extend(response.get(collection_key, []))
            page_token = response.get("nextPageToken")
            if not page_token:
                return rows

    def get_profile(self):
        return self._execute(self.service.userProfiles().get(userId="me"))

    def list_courses(self):
        return self._list_all(
            self.service.courses().list,
            "courses",
            teacherId="me",
            courseStates=["ACTIVE", "PROVISIONED"],
        )

    def get_course(self, course_id):
        return self._execute(self.service.courses().get(id=course_id))

    def create_course(self, *, name, section="", description=""):
        body = {
            "name": name,
            "section": section,
            "description": description,
            "ownerId": "me",
            "courseState": "PROVISIONED",
        }
        return self._execute(self.service.courses().create(body=body))

    def ensure_teacher(self, course_id):
        return self._execute(
            self.service.courses().teachers().get(courseId=course_id, userId="me")
        )

    def list_students(self, course_id):
        return self._list_all(
            self.service.courses().students().list,
            "students",
            courseId=course_id,
        )

    def create_student_invitation(self, course_id, email):
        return self._execute(
            self.service.invitations().create(
                body={"courseId": course_id, "userId": email, "role": "STUDENT"}
            )
        )

    def create_resource(self, course_id, resource_type, body):
        endpoints = {
            "coursework": self.service.courses().courseWork(),
            "material": self.service.courses().courseWorkMaterials(),
            "announcement": self.service.courses().announcements(),
            "topic": self.service.courses().topics(),
        }
        return self._execute(endpoints[resource_type].create(courseId=course_id, body=body))

    def get_resource(self, course_id, resource_type, resource_id):
        endpoints = {
            "coursework": self.service.courses().courseWork(),
            "material": self.service.courses().courseWorkMaterials(),
            "announcement": self.service.courses().announcements(),
            "topic": self.service.courses().topics(),
        }
        return self._execute(
            endpoints[resource_type].get(courseId=course_id, id=resource_id)
        )

    def update_resource(self, course_id, resource_type, resource_id, body, update_mask):
        endpoints = {
            "coursework": self.service.courses().courseWork(),
            "material": self.service.courses().courseWorkMaterials(),
            "announcement": self.service.courses().announcements(),
            "topic": self.service.courses().topics(),
        }
        return self._execute(
            endpoints[resource_type].patch(
                courseId=course_id,
                id=resource_id,
                updateMask=update_mask,
                body=body,
            )
        )

    def list_student_submissions(self, course_id, coursework_id, user_id):
        return self._list_all(
            self.service.courses().courseWork().studentSubmissions().list,
            "studentSubmissions",
            courseId=course_id,
            courseWorkId=coursework_id,
            userId=user_id,
        )

    def set_submission_grade(self, course_id, coursework_id, submission_id, grade):
        endpoint = self.service.courses().courseWork().studentSubmissions()
        return self._execute(
            endpoint.patch(
                courseId=course_id,
                courseWorkId=coursework_id,
                id=submission_id,
                updateMask="draftGrade,assignedGrade",
                body={"draftGrade": float(grade), "assignedGrade": float(grade)},
            )
        )

    def return_submission(self, course_id, coursework_id, submission_id):
        endpoint = self.service.courses().courseWork().studentSubmissions()
        return self._execute(
            endpoint.return_(
                courseId=course_id,
                courseWorkId=coursework_id,
                id=submission_id,
                body={},
            )
        )
