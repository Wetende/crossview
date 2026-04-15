from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from apps.progression.tests.factories import (
    CurriculumNodeFactory,
    EnrollmentFactory,
    PracticumSubmissionFactory,
    ProgramFactory,
)


class PracticumApiAuthorizationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.program = ProgramFactory()
        self.other_program = ProgramFactory()
        self.node = CurriculumNodeFactory(program=self.program)
        self.other_node = CurriculumNodeFactory(program=self.other_program)

        self.student_enrollment = EnrollmentFactory(program=self.program)
        self.other_student_enrollment = EnrollmentFactory(program=self.program)

        self.upload_url = "/api/v1/student/practicum/upload/"

    def test_upload_rejects_foreign_enrollment_id(self):
        self.client.force_login(self.student_enrollment.user)

        response = self.client.post(
            self.upload_url,
            {
                "file": SimpleUploadedFile("evidence.mp3", b"abc123", content_type="audio/mp3"),
                "enrollment_id": self.other_student_enrollment.id,
                "node_id": self.node.id,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 404)

    def test_upload_rejects_node_outside_enrollment_program(self):
        self.client.force_login(self.student_enrollment.user)

        response = self.client.post(
            self.upload_url,
            {
                "file": SimpleUploadedFile("evidence.mp3", b"abc123", content_type="audio/mp3"),
                "enrollment_id": self.student_enrollment.id,
                "node_id": self.other_node.id,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 404)

    def test_download_rejects_other_users_submission(self):
        submission = PracticumSubmissionFactory(
            enrollment=self.other_student_enrollment,
            node=self.node,
        )
        self.client.force_login(self.student_enrollment.user)

        response = self.client.get(
            f"/api/v1/student/practicum/{submission.id}/download/",
        )

        self.assertEqual(response.status_code, 404)
