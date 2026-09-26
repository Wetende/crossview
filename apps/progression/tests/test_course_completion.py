import json

from django.contrib.messages import get_messages
from django.core import mail
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from apps.assessments.models import Quiz, QuizAttempt
from apps.core.models import Program
from apps.core.tests.factories import UserFactory
from apps.curriculum.models import CurriculumNode
from apps.learning_operations.models import LearnerNodeProgress
from apps.notifications.models import Notification
from apps.progression.models import Enrollment, NodeCompletion
from apps.progression.services import ProgressionEngine
from apps.progression.views import _reconcile_enrollment_status
from apps.reviews.models import ProgramReview


def _program(code, **overrides):
    values = {
        "name": f"Course {code}",
        "code": code,
        "level": "Beginner",
        "category": "Data",
        "is_published": True,
    }
    values.update(overrides)
    return Program.objects.create(**values)


def _lesson(program, title, position):
    return CurriculumNode.objects.create(
        program=program,
        title=title,
        node_type="Lesson",
        position=position,
        is_published=True,
        properties={"lesson_type": "text", "content": "<p>Body</p>"},
    )


def _complete(enrollment, node):
    return NodeCompletion.objects.create(
        enrollment=enrollment,
        node=node,
        completed_at=timezone.now(),
        completion_type="view",
    )


class CourseCompletionPageTests(TestCase):
    def setUp(self):
        self.student = UserFactory()
        self.program = _program("COMPLETE-001", duration_hours=6)
        self.lesson = _lesson(self.program, "Intro", 1)
        self.quiz_node = _lesson(self.program, "Check", 2)
        self.enrollment = Enrollment.objects.create(
            user=self.student,
            program=self.program,
            status="completed",
            completed_at=timezone.now(),
        )
        _complete(self.enrollment, self.lesson)
        _complete(self.enrollment, self.quiz_node)
        self.client.force_login(self.student)

    def _url(self, enrollment=None):
        return reverse(
            "progression:student.course.complete",
            args=[(enrollment or self.enrollment).id],
        )

    def test_renders_summary_for_own_completed_enrollment(self):
        quiz = Quiz.objects.create(
            node=self.quiz_node, title="Check", is_published=True
        )
        now = timezone.now()
        for number, passed in ((1, False), (2, True), (3, True)):
            QuizAttempt.objects.create(
                enrollment=self.enrollment,
                quiz=quiz,
                attempt_number=number,
                started_at=now,
                submitted_at=now,
                score=90 if passed else 40,
                passed=passed,
            )
        LearnerNodeProgress.objects.create(
            enrollment=self.enrollment,
            node=self.lesson,
            activity_type="video",
            active_seconds=630,
        )

        response = self.client.get(self._url(), HTTP_X_INERTIA="true")

        self.assertEqual(response.status_code, 200)
        page = response.json()
        self.assertEqual(page["component"], "Student/CoursePlayer")
        props = page["props"]
        self.assertEqual(props["activeView"], "course_complete")
        self.assertIsNone(props["node"])
        completion = props["courseCompletion"]
        self.assertEqual(
            set(completion),
            {
                "completedAt",
                "stats",
                "certificate",
                "review",
                "nextCourses",
                "dashboardUrl",
            },
        )
        self.assertEqual(
            completion["completedAt"], self.enrollment.completed_at.isoformat()
        )
        self.assertEqual(
            completion["stats"],
            {
                "lessonsCompleted": 2,
                "totalLessons": 2,
                "quizzesPassed": 1,
                "timeSpentMinutes": 10,
            },
        )
        self.assertEqual(completion["certificate"]["status"], "not_offered")
        self.assertIsNone(completion["certificate"]["downloadUrl"])
        self.assertIsNone(completion["certificate"]["verifyUrl"])
        self.assertTrue(completion["certificate"]["message"])
        self.assertEqual(
            completion["review"],
            {
                "canReview": True,
                "hasReviewed": False,
                "submitUrl": f"/programs/{self.program.id}/review/",
            },
        )
        self.assertEqual(completion["dashboardUrl"], "/dashboard/")
        self.assertEqual(
            props["enrollment"]["completionSummaryUrl"], self._url()
        )

    def test_time_spent_is_omitted_without_tracked_activity(self):
        response = self.client.get(self._url(), HTTP_X_INERTIA="true")

        stats = response.json()["props"]["courseCompletion"]["stats"]
        self.assertNotIn("timeSpentMinutes", stats)

    def test_next_courses_exclude_enrolled_and_unpublished_programs(self):
        same_category = _program(
            "NEXT-SAME", name="Same category", duration_hours=4
        )
        _program("NEXT-DRAFT", name="Draft", is_published=False)
        enrolled = _program("NEXT-ENROLLED", name="Already enrolled")
        Enrollment.objects.create(user=self.student, program=enrolled)
        fallback = _program(
            "NEXT-OTHER", name="Other category", category="Design"
        )

        response = self.client.get(self._url(), HTTP_X_INERTIA="true")

        next_courses = response.json()["props"]["courseCompletion"]["nextCourses"]
        self.assertEqual(
            [course["id"] for course in next_courses],
            [same_category.id, fallback.id],
        )
        self.assertEqual(
            next_courses[0],
            {
                "id": same_category.id,
                "title": "Same category",
                "slug": same_category.slug,
                "url": f"/programs/{same_category.slug}/",
                "thumbnailUrl": None,
                "level": "Beginner",
                "durationHours": 4,
            },
        )

    def test_next_courses_are_capped_at_three(self):
        for index in range(5):
            _program(f"NEXT-CAP-{index}")

        response = self.client.get(self._url(), HTTP_X_INERTIA="true")

        self.assertEqual(
            len(response.json()["props"]["courseCompletion"]["nextCourses"]), 3
        )

    def test_existing_review_is_reported(self):
        ProgramReview.objects.create(
            program=self.program,
            user=self.student,
            enrollment=self.enrollment,
            rating=5,
        )

        response = self.client.get(self._url(), HTTP_X_INERTIA="true")

        review = response.json()["props"]["courseCompletion"]["review"]
        self.assertTrue(review["hasReviewed"])

    def test_another_learners_enrollment_is_not_found(self):
        other = Enrollment.objects.create(
            user=UserFactory(),
            program=self.program,
            status="completed",
            completed_at=timezone.now(),
        )

        response = self.client.get(self._url(other), HTTP_X_INERTIA="true")

        self.assertEqual(response.status_code, 404)

    def test_incomplete_enrollment_redirects_to_overview_with_message(self):
        self.enrollment.status = "active"
        self.enrollment.completed_at = None
        self.enrollment.save(update_fields=["status", "completed_at"])

        response = self.client.get(self._url())

        self.assertRedirects(
            response,
            reverse("progression:student.program", args=[self.program.id]),
            fetch_redirect_response=False,
        )
        stored = [str(message) for message in get_messages(response.wsgi_request)]
        self.assertEqual(len(stored), 1)

    def test_overview_links_to_summary_only_when_completed(self):
        overview_url = reverse(
            "progression:student.program", args=[self.program.id]
        )

        completed = self.client.get(overview_url, HTTP_X_INERTIA="true")
        self.assertEqual(
            completed.json()["props"]["courseCompleteUrl"], self._url()
        )

        self.enrollment.status = "active"
        self.enrollment.save(update_fields=["status"])
        active = self.client.get(overview_url, HTTP_X_INERTIA="true")
        self.assertIsNone(active.json()["props"]["courseCompleteUrl"])
        self.assertIsNone(active.json()["props"]["enrollment"]["completionSummaryUrl"])


class MarkCompleteTransitionTests(TestCase):
    def setUp(self):
        self.student = UserFactory()
        self.program = _program("COMPLETE-TRANSITION")
        self.first = _lesson(self.program, "First", 1)
        self.last = _lesson(self.program, "Last", 2)
        self.enrollment = Enrollment.objects.create(
            user=self.student, program=self.program, status="active"
        )
        self.summary_url = reverse(
            "progression:student.course.complete", args=[self.enrollment.id]
        )
        self.client.force_login(self.student)

    def _session_url(self, node):
        return reverse(
            "progression:student.session", args=[self.enrollment.id, node.id]
        )

    def _mark_complete(self, node):
        return self.client.post(
            self._session_url(node),
            data=json.dumps({"mark_complete": True}),
            content_type="application/json",
            HTTP_X_INERTIA="true",
            HTTP_X_INERTIA_PARTIAL_COMPONENT="Student/CoursePlayer",
            HTTP_X_INERTIA_PARTIAL_DATA="isCompleted,curriculum,courseCompleteUrl",
        )

    def _get(self, node, query=""):
        return self.client.get(
            f"{self._session_url(node)}{query}", HTTP_X_INERTIA="true"
        )

    def test_course_complete_url_follows_the_node_that_finished_the_course(self):
        first = self._mark_complete(self.first)
        self.assertEqual(first.status_code, 200)
        self.assertIsNone(first.json()["props"]["courseCompleteUrl"])

        last = self._mark_complete(self.last)
        self.assertEqual(last.json()["props"]["courseCompleteUrl"], self.summary_url)
        self.enrollment.refresh_from_db()
        self.assertEqual(self.enrollment.status, "completed")

        repeat = self._mark_complete(self.last)
        self.assertEqual(repeat.json()["props"]["courseCompleteUrl"], self.summary_url)

        earlier = self._mark_complete(self.first)
        self.assertIsNone(earlier.json()["props"]["courseCompleteUrl"])

    def test_plain_get_never_offers_the_summary(self):
        self._mark_complete(self.first)
        self._mark_complete(self.last)

        self.assertIsNone(self._get(self.last).json()["props"]["courseCompleteUrl"])
        self.assertEqual(
            self._get(self.last, "?course_complete=1").json()["props"][
                "courseCompleteUrl"
            ],
            self.summary_url,
        )
        self.assertIsNone(
            self._get(self.first, "?course_complete=1").json()["props"][
                "courseCompleteUrl"
            ]
        )

    def test_final_lesson_completed_by_playback_evidence(self):
        from apps.learning_operations.activity_progress import _maybe_complete

        video = CurriculumNode.objects.create(
            program=self.program,
            title="Closing video",
            node_type="Lesson",
            position=3,
            is_published=True,
            properties={
                "lesson_type": "video",
                "video_url": "https://video.example/closing",
                "required_progress": 50,
            },
        )
        _complete(self.enrollment, self.first)
        _complete(self.enrollment, self.last)
        progress = LearnerNodeProgress.objects.create(
            enrollment=self.enrollment,
            node=video,
            activity_type="video",
            duration_seconds=20,
            active_seconds=20,
        )
        # The heartbeat, not this request, moves the enrollment to completed.
        self.assertTrue(_maybe_complete(self.enrollment, video, progress))
        self.enrollment.refresh_from_db()
        self.assertEqual(self.enrollment.status, "completed")

        response = self._mark_complete(video)

        self.assertEqual(
            response.json()["props"]["courseCompleteUrl"], self.summary_url
        )

    def test_final_code_lab_completed_on_submit(self):
        from apps.learning_operations.activity_progress import save_code_work

        lab = CurriculumNode.objects.create(
            program=self.program,
            title="Closing lab",
            node_type="Lesson",
            position=3,
            is_published=True,
            properties={
                "lesson_type": "code",
                "language": "html_css_js",
                "starter_code": "<p>Start</p>",
            },
        )
        _complete(self.enrollment, self.first)
        _complete(self.enrollment, self.last)
        save_code_work(
            enrollment=self.enrollment, node=lab, code="<p>Done</p>", submit=True
        )
        self.enrollment.refresh_from_db()
        self.assertEqual(self.enrollment.status, "completed")

        response = self._mark_complete(lab)

        self.assertEqual(
            response.json()["props"]["courseCompleteUrl"], self.summary_url
        )

    def test_final_inline_quiz_offers_the_summary(self):
        quiz_node = CurriculumNode.objects.create(
            program=self.program,
            title="Closing quiz",
            node_type="Lesson",
            position=3,
            is_published=True,
            properties={"lesson_type": "quiz"},
        )
        quiz = Quiz.objects.create(
            node=quiz_node, title="Closing quiz", is_published=True, max_attempts=1
        )
        quiz_node.properties = {"lesson_type": "quiz", "quiz_id": quiz.id}
        quiz_node.save(update_fields=["properties"])
        now = timezone.now()
        QuizAttempt.objects.create(
            enrollment=self.enrollment,
            quiz=quiz,
            attempt_number=1,
            started_at=now,
            submitted_at=now,
            score=100,
            passed=True,
        )
        _complete(self.enrollment, self.first)
        _complete(self.enrollment, self.last)

        response = self.client.post(
            self._session_url(quiz_node),
            data=json.dumps({"mark_complete": True, "quiz_answers": {}}),
            content_type="application/json",
            HTTP_X_INERTIA="true",
            HTTP_X_INERTIA_PARTIAL_COMPONENT="Student/CoursePlayer",
            HTTP_X_INERTIA_PARTIAL_DATA="isCompleted,curriculum,courseCompleteUrl",
        )

        self.assertEqual(
            response.json()["props"]["courseCompleteUrl"], self.summary_url
        )


class AssessmentCompletionRedirectTests(TestCase):
    def setUp(self):
        self.student = UserFactory()
        self.program = _program("COMPLETE-ASSESSMENT")
        self.enrollment = Enrollment.objects.create(
            user=self.student, program=self.program, status="active"
        )
        self.summary_url = reverse(
            "progression:student.course.complete", args=[self.enrollment.id]
        )
        self.client.force_login(self.student)

    def _runtime_quiz(self):
        from apps.assessments.models import Question, QuestionOption

        node = CurriculumNode.objects.create(
            program=self.program,
            title="Final quiz",
            node_type="Lesson",
            position=2,
            is_published=True,
            properties={"lesson_type": "quiz"},
        )
        quiz = Quiz.objects.create(
            node=node,
            title="Final quiz",
            is_published=True,
            max_attempts=3,
            pass_threshold=70,
        )
        node.properties = {"lesson_type": "quiz", "quiz_id": quiz.id}
        node.save(update_fields=["properties"])
        question = Question.objects.create(
            quiz=quiz,
            question_type="mcq",
            text="Pick one",
            points=1,
            position=0,
            answer_data={"correct": 0},
        )
        option = QuestionOption.objects.create(
            question=question, text="Correct", is_correct=True, position=0
        )
        QuizAttempt.objects.create(
            enrollment=self.enrollment,
            quiz=quiz,
            attempt_number=1,
            started_at=timezone.now(),
            runtime_state={"current_question_index": 0},
        )
        return node, quiz, question, option

    def _submit(self, node, quiz, question, option):
        return self.client.post(
            reverse("core:student.quiz_submit", kwargs={"quiz_id": quiz.id}),
            data=json.dumps(
                {
                    "response": "json",
                    "enrollment_id": self.enrollment.id,
                    "node_id": node.id,
                    "answers": {str(question.id): str(option.id)},
                    "runtime_state": {"current_question_index": 0},
                }
            ),
            content_type="application/json",
        )

    def test_runtime_quiz_that_finishes_the_course_keeps_results_then_offers_summary(self):
        lesson = _lesson(self.program, "Lesson", 1)
        _complete(self.enrollment, lesson)
        node, quiz, question, option = self._runtime_quiz()

        submit = self._submit(node, quiz, question, option)

        redirect_url = submit.json()["redirectUrl"]
        self.assertIn("/results/", redirect_url)
        self.assertTrue(redirect_url.endswith("&course_complete=1"))

        results = self.client.get(redirect_url)
        self.assertEqual(results.status_code, 302)
        self.assertIn("show_results=1", results.url)
        self.assertIn("course_complete=1", results.url)

        session = self.client.get(results.url, HTTP_X_INERTIA="true")
        props = session.json()["props"]
        self.assertEqual(props["courseCompleteUrl"], self.summary_url)
        self.assertIn("quizResults", props["node"]["properties"])

    def test_runtime_quiz_before_the_last_lesson_does_not_flag_completion(self):
        _lesson(self.program, "Unfinished lesson", 3)
        node, quiz, question, option = self._runtime_quiz()

        submit = self._submit(node, quiz, question, option)

        self.assertNotIn("course_complete", submit.json()["redirectUrl"])

    def test_assignment_that_finishes_the_course_redirects_to_summary(self):
        from unittest.mock import patch

        from apps.assessments.models import Assignment

        assignment = Assignment.objects.create(
            program=self.program,
            title="Final task",
            description="Describe the work.",
            instructions="Submit a short summary.",
            weight=100,
            is_published=True,
        )
        node = CurriculumNode.objects.create(
            program=self.program,
            title="Final task",
            node_type="Lesson",
            position=1,
            is_published=True,
            properties={"lesson_type": "assignment", "assignment_id": assignment.id},
        )

        with patch(
            "apps.core.views._assignment_node_completion_state",
            return_value={"is_complete": True},
        ):
            response = self.client.post(
                reverse(
                    "core:student.assignment_submit",
                    kwargs={"assignment_id": assignment.id},
                ),
                {
                    "text_content": "My final answer.",
                    "enrollment_id": self.enrollment.id,
                    "node_id": node.id,
                },
            )

        self.assertRedirects(
            response, self.summary_url, fetch_redirect_response=False
        )


class ReconcileCompletionTests(TestCase):
    def setUp(self):
        self.student = UserFactory()
        self.program = _program("COMPLETE-RECONCILE")
        self.published = _lesson(self.program, "Published", 1)
        self.second = _lesson(self.program, "Second", 2)
        self.draft = _lesson(self.program, "Draft", 3)
        self.enrollment = Enrollment.objects.create(
            user=self.student, program=self.program, status="active"
        )
        self.client.force_login(self.student)

    def _notifications(self):
        return Notification.objects.filter(
            recipient=self.student, notification_type="course_completed"
        )

    def _unpublish_draft_after_completing_it(self):
        _complete(self.enrollment, self.published)
        _complete(self.enrollment, self.draft)
        self.draft.is_published = False
        self.draft.save(update_fields=["is_published"])

    def test_completions_of_unpublished_lessons_do_not_complete_on_dashboard(self):
        self._unpublish_draft_after_completing_it()

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.get(reverse("core:dashboard"), HTTP_X_INERTIA="true")

        self.assertEqual(response.status_code, 200)
        self.enrollment.refresh_from_db()
        self.assertEqual(self.enrollment.status, "active")
        self.assertFalse(self._notifications().exists())

    def test_completions_of_unpublished_lessons_do_not_complete_in_course_list(self):
        self._unpublish_draft_after_completing_it()

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.get(
                reverse("progression:student.programs"), HTTP_X_INERTIA="true"
            )

        self.assertEqual(response.status_code, 200)
        self.enrollment.refresh_from_db()
        self.assertEqual(self.enrollment.status, "active")
        self.assertFalse(self._notifications().exists())

    def test_dashboard_reconcile_completes_and_notifies_once(self):
        self.draft.is_published = False
        self.draft.save(update_fields=["is_published"])
        _complete(self.enrollment, self.published)
        _complete(self.enrollment, self.second)

        for _ in range(2):
            with self.captureOnCommitCallbacks(execute=True):
                self.client.get(reverse("core:dashboard"), HTTP_X_INERTIA="true")

        self.enrollment.refresh_from_db()
        self.assertEqual(self.enrollment.status, "completed")
        self.assertEqual(self._notifications().count(), 1)


class CourseCompletionNotificationTests(TestCase):
    def setUp(self):
        self.student = UserFactory()
        self.program = _program("COMPLETE-NOTIFY")
        self.lesson = _lesson(self.program, "Only lesson", 1)
        self.enrollment = Enrollment.objects.create(
            user=self.student, program=self.program, status="active"
        )

    def _course_completed(self):
        return Notification.objects.filter(
            recipient=self.student,
            notification_type="course_completed",
            related_enrollment_id=self.enrollment.id,
        )

    def _completion_emails(self):
        return [
            message
            for message in mail.outbox
            if message.subject == f"Course completed: {self.program.name}"
        ]

    def test_mark_complete_notifies_once_after_commit(self):
        engine = ProgressionEngine()
        with self.captureOnCommitCallbacks(execute=True) as callbacks:
            engine.mark_complete(self.enrollment, self.lesson, "view")
        self.assertEqual(len(callbacks), 1)

        with self.captureOnCommitCallbacks(execute=True) as repeat_callbacks:
            engine.mark_complete(self.enrollment, self.lesson, "view")
        self.assertEqual(len(repeat_callbacks), 0)

        self.assertEqual(self._course_completed().count(), 1)
        notification = self._course_completed().get()
        self.assertEqual(
            notification.action_url,
            f"/student/programs/{self.enrollment.id}/complete/",
        )
        self.assertEqual(len(self._completion_emails()), 1)

    def test_reconcile_path_shares_the_single_send(self):
        _complete(self.enrollment, self.lesson)
        with self.captureOnCommitCallbacks(execute=True):
            self.assertEqual(
                _reconcile_enrollment_status(self.enrollment, 100), "completed"
            )
        self.enrollment.refresh_from_db()
        self.assertIsNotNone(self.enrollment.completed_at)

        with self.captureOnCommitCallbacks(execute=True):
            _reconcile_enrollment_status(self.enrollment, 50)
            _reconcile_enrollment_status(self.enrollment, 100)
            ProgressionEngine().mark_complete(self.enrollment, self.lesson, "view")

        self.assertEqual(self._course_completed().count(), 1)
        self.assertEqual(len(self._completion_emails()), 1)

    def test_course_completed_is_queued_before_the_certificate_notice(self):
        from unittest.mock import patch

        from django.db import transaction

        from apps.certifications.services import CertificationEngine
        from apps.notifications.services import NotificationService

        order = []

        def queue_certificate_notice(engine, enrollment):
            transaction.on_commit(lambda: order.append("certificate"))

        with patch.object(
            CertificationEngine, "on_program_completed", queue_certificate_notice
        ), patch.object(
            NotificationService,
            "notify_course_completed",
            side_effect=lambda enrollment: order.append("course"),
        ):
            with self.captureOnCommitCallbacks(execute=True):
                ProgressionEngine().mark_complete(self.enrollment, self.lesson, "view")

        self.assertEqual(order, ["course", "certificate"])

    def test_nothing_is_sent_before_the_transaction_commits(self):
        with self.captureOnCommitCallbacks(execute=False):
            ProgressionEngine().mark_complete(self.enrollment, self.lesson, "view")

        self.assertFalse(self._course_completed().exists())
