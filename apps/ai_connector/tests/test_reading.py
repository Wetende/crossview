from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext

from apps.core.views import _sync_quiz_questions
from apps.curriculum.models import CurriculumNode
from apps.progression.models import InstructorAssignment

from .. import reading
from ..access import AccessDenied, accessible_programs
from ..content import node_version, node_versions
from .helpers import LINKS, make_course, make_user


class ReadingPermissionTests(TestCase):
    def setUp(self):
        self.instructor = make_user("teacher", instructor=True)
        self.other_instructor = make_user("other", instructor=True)
        self.admin = make_user("admin", staff=True)
        self.student = make_user("student")
        self.course = make_course("AI101", instructor=self.instructor)
        self.other_course = make_course("BIO201", instructor=self.other_instructor)

    def test_instructors_see_only_assigned_courses_and_admins_see_all(self):
        mine = reading.search_courses(self.instructor, LINKS)
        self.assertEqual([item["code"] for item in mine["items"]], ["AI101"])
        everything = reading.search_courses(self.admin, LINKS)
        self.assertEqual({item["code"] for item in everything["items"]}, {"AI101", "BIO201"})
        self.assertFalse(accessible_programs(self.student).exists())

    def test_search_filters_and_paginates(self):
        result = reading.search_courses(self.admin, LINKS, query="bio", page=1, page_size=1)
        self.assertEqual(result["total"], 1)
        self.assertEqual(result["items"][0]["code"], "BIO201")
        page_two = reading.search_courses(self.admin, LINKS, page=2, page_size=1)
        self.assertEqual(page_two["page"], 2)
        self.assertFalse(page_two["has_more"])

    def test_guessed_course_and_lesson_ids_are_refused(self):
        with self.assertRaises(AccessDenied):
            reading.get_course(self.instructor, LINKS, self.other_course["program"].id)
        with self.assertRaises(AccessDenied):
            reading.get_lesson(self.instructor, LINKS, self.other_course["lesson"].id)
        with self.assertRaises(AccessDenied):
            reading.get_course(self.student, LINKS, self.course["program"].id)

    def test_removed_assignment_takes_effect_immediately(self):
        reading.get_course(self.instructor, LINKS, self.course["program"].id)
        InstructorAssignment.objects.filter(instructor=self.instructor).delete()
        with self.assertRaises(AccessDenied):
            reading.get_course(self.instructor, LINKS, self.course["program"].id)


class ReadingContentTests(TestCase):
    def setUp(self):
        self.instructor = make_user("teacher", instructor=True)
        self.course = make_course("AI101", instructor=self.instructor)

    def test_course_outline_has_ids_versions_and_links(self):
        data = reading.get_course(self.instructor, LINKS, self.course["program"].id)
        self.assertEqual([module["title"] for module in data["modules"]], ["Module 1: Foundations", "Module 2: Models"])
        quiz_item = data["modules"][1]["items"][0]
        self.assertEqual(quiz_item["activity_type"], "quiz")
        self.assertEqual(quiz_item["question_count"], 2)
        self.assertTrue(quiz_item["version"])
        self.assertEqual(
            quiz_item["builder_url"],
            f"https://lms.test/instructor/programs/{self.course['program'].id}/manage/?tab=curriculum&node={self.course['quiz_node'].id}",
        )
        self.assertIn("public_page", data["links"])

    def test_lesson_details_include_quiz_answers_and_text_bodies(self):
        quiz = reading.get_lesson(self.instructor, LINKS, self.course["quiz_node"].id)
        questions = quiz["quiz"]["questions"]
        self.assertEqual(questions[0]["type"], "single_choice")
        self.assertEqual(questions[0]["options"], ["Tree", "Rock"])
        self.assertEqual(questions[0]["correct"], 0)
        self.assertIs(questions[1]["correct"], True)
        self.assertEqual(quiz["quiz"]["settings"]["pass_threshold_percent"], 60)

        lesson = reading.get_lesson(self.instructor, LINKS, self.course["lesson"].id)
        self.assertEqual(lesson["activity_type"], "text")
        self.assertEqual(lesson["body_html"], "<p>AI is...</p>")
        self.assertEqual(lesson["module"]["title"], "Module 1: Foundations")

    def test_readiness_returns_linked_factual_findings(self):
        data = reading.check_course_readiness(self.instructor, LINKS, self.course["program"].id)
        self.assertEqual(data["kind"], "factual_findings")
        codes = {finding["code"] for finding in data["findings"]}
        self.assertIn("missing_thumbnail", codes)
        self.assertIn("invalid_weight_sum", codes)
        weight_finding = next(f for f in data["findings"] if f["code"] == "invalid_weight_sum")
        self.assertEqual(weight_finding["severity"], "blocking")
        self.assertIsNone(weight_finding["item"])
        self.assertIn("tab=settings", weight_finding["course_link"])


class CourseOutlineScaleTests(TestCase):
    def setUp(self):
        self.instructor = make_user("teacher", instructor=True)
        self.course = make_course("AI101", instructor=self.instructor)

    def add_modules(self, count):
        program = self.course["program"]
        for index in range(count):
            module = CurriculumNode.objects.create(
                program=program, title=f"Extra module {index}", node_type="Module", position=10 + index
            )
            CurriculumNode.objects.create(
                program=program, parent=module, title=f"Reading {index}", node_type="Lesson",
                properties={"lesson_type": "text", "content": "<p>x</p>"},
            )
            quiz = CurriculumNode.objects.create(
                program=program, parent=module, title=f"Check {index}", node_type="Lesson", position=1,
                properties={"lesson_type": "quiz"},
            )
            _sync_quiz_questions(quiz, [{"type": "true_false", "text": f"Q{index}", "correct": True}])

    def outline_queries(self):
        with CaptureQueriesContext(connection) as queries:
            reading.get_course(self.instructor, LINKS, self.course["program"].id, page_size=50)
        return len(queries)

    def test_outline_query_count_does_not_grow_with_course_size(self):
        small = self.outline_queries()
        self.add_modules(12)
        self.assertEqual(self.outline_queries(), small)

    def test_bulk_versions_match_the_versions_used_when_saving(self):
        self.add_modules(2)
        nodes = list(CurriculumNode.objects.filter(program=self.course["program"]))
        bulk = node_versions(nodes)
        self.assertEqual(bulk, {node.id: node_version(node) for node in nodes})

    def test_modules_are_paginated(self):
        self.add_modules(3)
        first = reading.get_course(self.instructor, LINKS, self.course["program"].id, page=1, page_size=2)
        self.assertEqual(first["module_count"], 5)
        self.assertEqual(len(first["modules"]), 2)
        self.assertTrue(first["has_more_modules"])
        last = reading.get_course(self.instructor, LINKS, self.course["program"].id, page=3, page_size=2)
        self.assertEqual([module["title"] for module in last["modules"]], ["Extra module 2"])
        self.assertFalse(last["has_more_modules"])
