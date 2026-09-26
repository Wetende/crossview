from datetime import timedelta
from decimal import Decimal

import pytest
from django.contrib.auth.models import Group
from django.db import connection
from django.db.models import DateTimeField, Value
from django.test.utils import CaptureQueriesContext
from django.utils import timezone

from apps.assessments.models import (
    Assignment,
    AssignmentSubmission,
    Quiz,
    QuizAttempt,
)
from apps.core.tests.factories import UserFactory
from apps.curriculum.models import CurriculumNode
from apps.learning_operations import analytics
from apps.learning_operations.analytics import (
    get_assessment_performance,
    get_lesson_engagement,
)
from apps.learning_operations.models import (
    EnrollmentLearningActivity,
    LearnerNodeProgress,
)
from apps.progression.models import Enrollment, InstructorAssignment, NodeCompletion
from apps.progression.tests.factories import ProgramFactory


def _url(program, query=""):
    return f"/instructor/programs/{program.id}/analytics/{query}"


def _inertia_get(client, url):
    return client.get(url, HTTP_X_INERTIA="true")


def _make_instructor():
    user = UserFactory()
    group, _ = Group.objects.get_or_create(name="Instructors")
    user.groups.add(group)
    return user


def _node(program, title, *, parent=None, position=0, published=True, **extra):
    return CurriculumNode.objects.create(
        program=program,
        parent=parent,
        node_type=extra.pop("node_type", "Session"),
        title=title,
        properties=extra.pop("properties", {}),
        position=position,
        is_published=published,
    )


def _complete(enrollment, node):
    return NodeCompletion.objects.create(
        enrollment=enrollment,
        node=node,
        completed_at=timezone.now(),
        completion_type="view",
    )


def _progress(enrollment, node, seconds=0):
    return LearnerNodeProgress.objects.create(
        enrollment=enrollment,
        node=node,
        activity_type="video",
        active_seconds=seconds,
        last_evidence_at=timezone.now(),
    )


def _quiz_node(program, parent, title, position):
    node = _node(
        program,
        title,
        parent=parent,
        position=position,
        properties={"lesson_type": "quiz"},
    )
    quiz = Quiz.objects.create(node=node, title=title, pass_threshold=60)
    node.properties = {"lesson_type": "quiz", "quiz_id": quiz.id}
    node.save(update_fields=["properties"])
    return node, quiz


def _assignment_node(program, parent, title, position):
    assignment = Assignment.objects.create(
        program=program,
        title=title,
        description="Describe",
        instructions="Do it",
        weight=20,
        is_published=True,
    )
    node = _node(
        program,
        title,
        parent=parent,
        position=position,
        properties={
            "lesson_type": "assignment",
            "assignment_id": assignment.id,
            "assignment_mode": "submission_only",
        },
    )
    return node, assignment


def _attempt(enrollment, quiz, *, passed, score, number=1):
    now = timezone.now()
    return QuizAttempt.objects.create(
        enrollment=enrollment,
        quiz=quiz,
        attempt_number=number,
        started_at=now - timedelta(minutes=5),
        submitted_at=now,
        score=score,
        passed=passed,
    )


@pytest.fixture
def instructor():
    return _make_instructor()


@pytest.fixture
def program(instructor):
    value = ProgramFactory(name="Data Literacy")
    InstructorAssignment.objects.create(instructor=instructor, program=value)
    return value


@pytest.mark.django_db
def test_assigned_instructor_gets_analytics_page_with_prop_shape(
    client, instructor, program
):
    module = _node(program, "Module", node_type="Unit")
    first = _node(program, "Intro", parent=module, position=0)
    second = _node(program, "Deep dive", parent=module, position=1)
    now = timezone.now()

    finished = Enrollment.objects.create(
        user=UserFactory(), program=program, status="completed", completed_at=now
    )
    active = Enrollment.objects.create(user=UserFactory(), program=program)
    idle = Enrollment.objects.create(user=UserFactory(), program=program)
    Enrollment.objects.filter(pk=idle.pk).update(enrolled_at=now - timedelta(days=4))
    _complete(finished, first)
    _complete(finished, second)
    _complete(active, first)

    client.force_login(instructor)
    response = _inertia_get(client, _url(program))

    assert response.status_code == 200
    payload = response.json()
    assert payload["component"] == "Instructor/Programs/Analytics"
    props = payload["props"]
    assert props["program"] == {
        "id": program.id,
        "title": "Data Literacy",
        "url": f"/instructor/programs/{program.id}/",
    }
    assert props["range"] == "30d"
    assert props["ranges"] == ["7d", "30d", "90d", "all"]

    summary = props["summary"]
    assert summary["totalLearners"] == 3
    assert summary["newLearners"] == 3
    assert summary["activeLearners"] == 1
    assert summary["completedLearners"] == 1
    assert summary["needsAttention"] == 1
    # (2 + 1 completed leaves) / (2 leaves x 3 learners)
    assert summary["averageProgress"] == 50.0
    assert summary["certificatesIssued"] == 0
    assert summary["awaitingGrading"] == 0

    assert props["statusBreakdown"] == [
        {"status": "active", "count": 1},
        {"status": "not_started", "count": 1},
        {"status": "completed", "count": 1},
    ]
    assert props["enrollmentTrend"]["granularity"] == "day"
    assert len(props["enrollmentTrend"]["points"]) == 30
    assert props["enrollmentTrend"]["total"] == 3

    lessons = props["lessonEngagement"]
    assert lessons["learnerCount"] == 3
    assert [row["title"] for row in lessons["results"]] == ["Intro", "Deep dive"]
    assert set(lessons["results"][0]) == {
        "id",
        "position",
        "title",
        "type",
        "started",
        "completed",
        "completionRate",
        "dropOff",
        "avgActiveSeconds",
    }
    assert props["assessments"] == []
    assert props["links"] == {
        "overview": f"/instructor/programs/{program.id}/",
        "roster": f"/instructor/programs/{program.id}/students/",
        "gradebook": f"/instructor/programs/{program.id}/gradebook/",
        "builder": f"/instructor/programs/{program.id}/manage/",
    }


@pytest.mark.django_db
def test_other_instructor_gets_404(client, program):
    other = _make_instructor()
    client.force_login(other)

    response = _inertia_get(client, _url(program))

    assert response.status_code == 404


@pytest.mark.django_db
def test_student_gets_404(client, program):
    student = UserFactory()
    Enrollment.objects.create(user=student, program=program)
    client.force_login(student)

    response = _inertia_get(client, _url(program))

    assert response.status_code == 404


@pytest.mark.django_db
def test_staff_can_open_any_course_analytics(client, program):
    staff = UserFactory(is_staff=True)
    client.force_login(staff)

    response = _inertia_get(client, _url(program))

    assert response.status_code == 200
    assert response.json()["props"]["program"]["id"] == program.id


@pytest.mark.django_db
def test_anonymous_user_is_redirected_to_login(client, program):
    response = client.get(_url(program))

    assert response.status_code == 302


@pytest.mark.django_db
def test_range_filter_changes_the_trend_window(client, instructor, program):
    now = timezone.now()
    for days_ago in (1, 20, 60, 400):
        enrollment = Enrollment.objects.create(user=UserFactory(), program=program)
        Enrollment.objects.filter(pk=enrollment.pk).update(
            enrolled_at=now - timedelta(days=days_ago)
        )
    client.force_login(instructor)

    def trend(query):
        props = _inertia_get(client, _url(program, query)).json()["props"]
        return props["range"], props["enrollmentTrend"], props["summary"]

    range_key, week, summary = trend("?range=7d")
    assert range_key == "7d"
    assert week["granularity"] == "day"
    assert len(week["points"]) == 7
    assert week["total"] == 1
    assert summary["newLearners"] == 1
    assert summary["totalLearners"] == 4

    _, month, _ = trend("?range=30d")
    assert len(month["points"]) == 30
    assert month["total"] == 2

    _, quarter, _ = trend("?range=90d")
    assert quarter["granularity"] == "week"
    assert quarter["total"] == 3
    assert 13 <= len(quarter["points"]) <= 14

    _, all_time, summary = trend("?range=all")
    assert all_time["granularity"] == "month"
    assert all_time["total"] == 4
    assert summary["newLearners"] == 4

    range_key, fallback, _ = trend("?range=bogus")
    assert range_key == "30d"
    assert fallback["total"] == 2


@pytest.mark.django_db
def test_trend_buckets_locally_when_the_database_cannot_convert_time_zones(
    monkeypatch, program
):
    now = timezone.now()
    for days_ago in (0, 2, 2):
        enrollment = Enrollment.objects.create(user=UserFactory(), program=program)
        Enrollment.objects.filter(pk=enrollment.pk).update(
            enrolled_at=now - timedelta(days=days_ago)
        )

    def null_bucket(field):
        return Value(None, output_field=DateTimeField())

    monkeypatch.setattr(
        analytics,
        "_TRUNC",
        {"day": null_bucket, "week": null_bucket, "month": null_bucket},
    )

    trend = analytics.get_enrollment_trend(program, "7d", now=now)

    assert trend["total"] == 3
    counts = {point["date"]: point["count"] for point in trend["points"]}
    assert counts[timezone.localdate(now).isoformat()] == 1
    assert counts[(timezone.localdate(now) - timedelta(days=2)).isoformat()] == 2


@pytest.mark.django_db
def test_lesson_engagement_counts_started_completed_and_drop_off(program):
    # Sibling positions repeat across modules; order must follow the tree.
    module_one = _node(program, "Module 1", position=0, node_type="Unit")
    module_two = _node(program, "Module 2", position=1, node_type="Unit")
    intro = _node(program, "Intro", parent=module_one, position=0)
    video = _node(
        program,
        "Video",
        parent=module_one,
        position=1,
        properties={"lesson_type": "video"},
    )
    reading = _node(program, "Reading", parent=module_two, position=0)
    quiz_node, quiz = _quiz_node(program, module_two, "Checkpoint", 1)
    _node(program, "Draft", parent=module_two, position=2, published=False)

    learners = [
        Enrollment.objects.create(user=UserFactory(), program=program)
        for _ in range(4)
    ]
    a, b, c, d = learners

    # Intro: 4 started (2 by completion, 2 by progress only); 2 completed.
    _complete(a, intro)
    _progress(a, intro, seconds=0)  # completion and progress count once
    _complete(b, intro)
    _progress(c, intro, seconds=60)
    _progress(d, intro, seconds=120)
    # Video: 2 started (drop-off 50%), 1 completed.
    _complete(a, video)
    _progress(b, video, seconds=30)
    # Reading: 2 started (no drop-off), 2 completed.
    _complete(a, reading)
    _complete(b, reading)
    # Checkpoint: 1 started via a failed attempt only (drop-off 50%).
    _attempt(c, quiz, passed=False, score=Decimal("40.00"))

    result = get_lesson_engagement(program)

    assert result["learnerCount"] == 4
    assert result["total"] == 4
    assert result["truncated"] is False
    rows = result["results"]
    assert [row["title"] for row in rows] == ["Intro", "Video", "Reading", "Checkpoint"]
    assert [row["position"] for row in rows] == [1, 2, 3, 4]
    assert [row["started"] for row in rows] == [4, 2, 2, 1]
    assert [row["completed"] for row in rows] == [2, 1, 2, 0]
    assert [row["completionRate"] for row in rows] == [50.0, 25.0, 50.0, 0.0]
    assert [row["dropOff"] for row in rows] == [None, 50.0, 0.0, 50.0]
    assert rows[0]["avgActiveSeconds"] == 90.0
    assert rows[1]["avgActiveSeconds"] == 30.0
    assert rows[2]["avgActiveSeconds"] is None
    assert rows[1]["type"] == "video"
    assert rows[3]["type"] == "quiz"
    assert rows[0]["type"] == "Session"
    assert quiz_node.id == rows[3]["id"]


@pytest.mark.django_db
def test_assessment_performance_reports_attempts_pass_rate_and_grading_queue(
    program,
):
    module = _node(program, "Module", node_type="Unit")
    _, quiz = _quiz_node(program, module, "Checkpoint", 0)
    _, assignment = _assignment_node(program, module, "Project", 1)
    a, b, c = [
        Enrollment.objects.create(user=UserFactory(), program=program)
        for _ in range(3)
    ]
    _attempt(a, quiz, passed=False, score=Decimal("40.00"), number=1)
    _attempt(a, quiz, passed=True, score=Decimal("80.00"), number=2)
    _attempt(b, quiz, passed=False, score=Decimal("30.00"))
    _attempt(c, quiz, passed=None, score=None)  # awaiting manual grading
    now = timezone.now()
    AssignmentSubmission.objects.create(
        enrollment=a,
        assignment=assignment,
        status="graded",
        submitted_at=now,
        score=Decimal("90.00"),
        passed=True,
    )
    AssignmentSubmission.objects.create(
        enrollment=b, assignment=assignment, status="submitted", submitted_at=now
    )
    AssignmentSubmission.objects.create(
        enrollment=c, assignment=assignment, status="started", submitted_at=now
    )

    rows = get_assessment_performance(program)

    assert rows == [
        {
            "id": quiz.id,
            "kind": "quiz",
            "title": "Checkpoint",
            "attempts": 4,
            "learners": 3,
            "passed": 1,
            "passRate": 33.3,
            "averageScore": 50.0,
            "awaitingGrading": 1,
            "passThreshold": 60,
            "url": None,
        },
        {
            "id": assignment.id,
            "kind": "assignment",
            "title": "Project",
            "attempts": 2,
            "learners": 2,
            "passed": 1,
            "passRate": 50.0,
            "averageScore": 90.0,
            "awaitingGrading": 1,
            "passThreshold": 50,
            "url": f"/instructor/assignments/{assignment.id}/submissions/",
        },
    ]


def _seed_learners(program, nodes, quiz, assignment, count):
    now = timezone.now()
    for index in range(count):
        enrollment = Enrollment.objects.create(user=UserFactory(), program=program)
        EnrollmentLearningActivity.objects.get_or_create(
            enrollment=enrollment,
            defaults={"started_at": now, "last_activity_at": now},
        )
        for node in nodes:
            _complete(enrollment, node)
            _progress(enrollment, node, seconds=30 + index)
        _attempt(enrollment, quiz, passed=index % 2 == 0, score=Decimal("70.00"))
        AssignmentSubmission.objects.create(
            enrollment=enrollment,
            assignment=assignment,
            status="submitted",
            submitted_at=now,
        )


@pytest.mark.django_db
def test_query_count_does_not_grow_with_learners(client, instructor, program):
    module = _node(program, "Module", node_type="Unit")
    nodes = [
        _node(program, f"Lesson {index}", parent=module, position=index)
        for index in range(3)
    ]
    _, quiz = _quiz_node(program, module, "Checkpoint", 3)
    _, assignment = _assignment_node(program, module, "Project", 4)
    _seed_learners(program, nodes, quiz, assignment, 2)
    client.force_login(instructor)
    _inertia_get(client, _url(program))  # warm per-process caches

    with CaptureQueriesContext(connection) as small:
        assert _inertia_get(client, _url(program)).status_code == 200

    _seed_learners(program, nodes, quiz, assignment, 6)
    with CaptureQueriesContext(connection) as large:
        response = _inertia_get(client, _url(program))

    assert response.status_code == 200
    assert response.json()["props"]["summary"]["totalLearners"] == 8
    assert len(large.captured_queries) == len(small.captured_queries)
    assert len(large.captured_queries) <= 30


@pytest.mark.django_db
def test_analytics_index_lists_only_the_instructors_programs(
    client, instructor, program
):
    ProgramFactory(name="Someone else's course")
    Enrollment.objects.create(user=UserFactory(), program=program)
    client.force_login(instructor)

    response = _inertia_get(client, "/instructor/analytics/")

    assert response.status_code == 200
    payload = response.json()
    assert payload["component"] == "Instructor/Analytics/Index"
    assert payload["props"]["programs"] == [
        {
            "id": program.id,
            "title": "Data Literacy",
            "code": program.code,
            "isPublished": True,
            "learnerCount": 1,
            "analyticsUrl": f"/instructor/programs/{program.id}/analytics/",
        }
    ]


@pytest.mark.django_db
def test_analytics_index_redirects_non_instructors(client):
    client.force_login(UserFactory())

    response = client.get("/instructor/analytics/")

    assert response.status_code == 302
    assert response["Location"] == "/dashboard/"
