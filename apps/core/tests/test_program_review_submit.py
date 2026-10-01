from django.test import TestCase
from django.utils import timezone

from apps.core.models import Program
from apps.core.tests.factories import UserFactory
from apps.progression.models import Enrollment
from apps.reviews.models import ProgramReview


class ProgramReviewSubmitRedirectTests(TestCase):
    def setUp(self):
        self.student = UserFactory()
        self.program = Program.objects.create(
            name="Reviewed course",
            code="REVIEW-NEXT",
            level="beginner",
            is_published=True,
        )
        self.enrollment = Enrollment.objects.create(
            user=self.student,
            program=self.program,
            status="completed",
            completed_at=timezone.now(),
        )
        self.client.force_login(self.student)
        self.url = f"/programs/{self.program.id}/review/"

    def test_review_returns_to_a_safe_next_url(self):
        summary_url = f"/student/programs/{self.enrollment.id}/complete/"

        response = self.client.post(
            self.url,
            {"rating": 4, "review": "Clear and practical.", "next": summary_url},
        )

        self.assertRedirects(response, summary_url, fetch_redirect_response=False)
        review = ProgramReview.objects.get(program=self.program, user=self.student)
        self.assertEqual(review.rating, 4)
        self.assertEqual(review.review_html, "<p>Clear and practical.</p>")

    def test_invalid_rating_also_returns_to_the_next_url(self):
        summary_url = f"/student/programs/{self.enrollment.id}/complete/"

        response = self.client.post(
            self.url,
            {"rating": 0, "next": summary_url},
        )

        self.assertRedirects(response, summary_url, fetch_redirect_response=False)
        self.assertFalse(ProgramReview.objects.exists())

    def test_external_next_url_falls_back_to_the_public_course_page(self):
        response = self.client.post(
            self.url,
            {"rating": 5, "next": "https://example.org/elsewhere/"},
        )

        self.assertRedirects(
            response,
            f"/programs/{self.program.slug}/",
            fetch_redirect_response=False,
        )

    def test_protocol_relative_next_url_is_rejected(self):
        response = self.client.post(
            self.url,
            {"rating": 5, "next": "//evil.example/steal/"},
        )

        self.assertRedirects(
            response,
            f"/programs/{self.program.slug}/",
            fetch_redirect_response=False,
        )

    def test_plain_review_text_is_escaped_into_paragraphs(self):
        self.client.post(
            self.url,
            {"rating": 3, "review": "<b>Bold</b> claim\n\nSecond point"},
        )

        review = ProgramReview.objects.get(program=self.program, user=self.student)
        self.assertEqual(
            review.review_html,
            "<p>&lt;b&gt;Bold&lt;/b&gt; claim</p>\n\n<p>Second point</p>",
        )

    def test_rich_review_html_is_kept_as_submitted(self):
        self.client.post(
            self.url,
            {"rating": 4, "review_html": "<p><strong>Great</strong></p>"},
        )

        review = ProgramReview.objects.get(program=self.program, user=self.student)
        self.assertEqual(review.review_html, "<p><strong>Great</strong></p>")
