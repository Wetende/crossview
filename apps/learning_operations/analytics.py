"""Course-level analytics for the instructor Analytics page.

The query count is fixed however many learners a course has: counts,
averages and per-lesson figures are grouped in SQL. Learner states reuse
``classify_enrollment`` over one narrow enrollment query (a Python pass over
those rows), and the lesson set matches the "published leaf" definition used
for progress.
"""

from collections import Counter, defaultdict
from datetime import datetime, time, timedelta

from django.db import connections
from django.db.models import (
    Avg,
    Case,
    Count,
    Exists,
    F,
    FloatField,
    IntegerField,
    Min,
    OuterRef,
    Q,
    Value,
    When,
)
from django.db.models.fields.json import KeyTextTransform
from django.db.models.functions import TruncDay, TruncMonth, TruncWeek
from django.utils import timezone

from apps.assessments.models import AssignmentSubmission, QuizAttempt
from apps.assessments.official_results import FINALIZED_ASSIGNMENT_STATUSES
from apps.certifications.models import Certificate
from apps.curriculum.models import CurriculumNode
from apps.progression.gradebook_columns import resolve_gradebook_columns
from apps.progression.models import Enrollment, NodeCompletion

from .models import LearnerNodeProgress
from .services import classify_enrollment

ANALYTICS_RANGES = ("7d", "30d", "90d", "all")
DEFAULT_ANALYTICS_RANGE = "30d"
RANGE_DAYS = {"7d": 7, "30d": 30, "90d": 90}
LESSON_ROW_LIMIT = 250
WEEKLY_ALL_TIME_MAX_DAYS = 180
SUBMITTED_ASSIGNMENT_STATUSES = ("submitted", "graded", "returned")

# Display order: engaged, at risk, finished, ended.
LEARNER_STATE_ORDER = (
    "active",
    "new",
    "not_started",
    "stalled",
    "inactive",
    "completed",
    "expired",
    "suspended",
    "withdrawn",
)
NEEDS_ATTENTION_STATES = {"not_started", "stalled", "inactive"}

_TRUNC = {"day": TruncDay, "week": TruncWeek, "month": TruncMonth}


def parse_analytics_range(value):
    value = str(value or "").strip().lower()
    return value if value in ANALYTICS_RANGES else DEFAULT_ANALYTICS_RANGE


def get_range_start(range_key, now=None):
    """Start of the local day the range begins on, or None for all time."""
    days = RANGE_DAYS.get(range_key)
    if days is None:
        return None
    today = timezone.localdate(now or timezone.now())
    return timezone.make_aware(
        datetime.combine(today - timedelta(days=days - 1), time.min)
    )


def _percent(part, whole):
    return round(part / whole * 100, 1) if whole else 0.0


def _json_text(value):
    """JSON key text; MySQL returns the string "null" for JSON null."""
    if value is None:
        return None
    text = str(value).strip()
    return None if text in {"", "null"} else text


def _json_int(value):
    try:
        return int(_json_text(value))
    except (TypeError, ValueError):
        return None


def _published_leaf_nodes(program):
    """Published leaves of the curriculum tree in reading (depth-first) order.

    ``position`` only orders siblings, so ordering by it globally would
    interleave modules. One query loads the light node columns.
    """
    nodes = list(
        CurriculumNode.objects.filter(program=program)
        .annotate(
            lesson_type=KeyTextTransform("lesson_type", "properties"),
            assignment_ref=KeyTextTransform("assignment_id", "properties"),
        )
        .values(
            "id",
            "parent_id",
            "position",
            "is_published",
            "title",
            "node_type",
            "lesson_type",
            "assignment_ref",
        )
    )
    known_ids = {node["id"] for node in nodes}
    children = defaultdict(list)
    for node in nodes:
        node["lesson_type"] = _json_text(node["lesson_type"])
        parent_id = node["parent_id"] if node["parent_id"] in known_ids else None
        children[parent_id].append(node)
    for siblings in children.values():
        siblings.sort(key=lambda item: (item["position"], item["id"]))

    leaves = []
    stack = list(reversed(children[None]))
    while stack:
        node = stack.pop()
        node_children = children.get(node["id"])
        if node_children:
            stack.extend(reversed(node_children))
        elif node["is_published"]:
            leaves.append(node)
    return leaves


def _classify_learners(program, now):
    """Every enrollment's learner state from the fields ``classify_enrollment`` reads."""
    enrollments = list(
        Enrollment.objects.filter(program=program)
        .select_related("learning_activity")
        .only(
            "id",
            "status",
            "enrolled_at",
            "expires_at",
            "learning_activity__id",
            "learning_activity__started_at",
            "learning_activity__last_activity_at",
        )
    )
    states = Counter(classify_enrollment(item, now=now) for item in enrollments)
    return enrollments, states


def get_course_analytics_summary(
    program, *, since=None, leaf_count=None, now=None, learners=None
):
    now = now or timezone.now()
    enrollments, states = learners or _classify_learners(program, now)
    total = len(enrollments)
    new_learners = sum(
        1 for item in enrollments if since is None or item.enrolled_at >= since
    )

    published_leaves = CurriculumNode.objects.filter(
        program=program, is_published=True, children__isnull=True
    )
    if leaf_count is None:
        leaf_count = published_leaves.count()
    completed_leaves = (
        NodeCompletion.objects.filter(
            enrollment__program=program, node__in=published_leaves
        ).count()
        if total and leaf_count
        else 0
    )
    return {
        "totalLearners": total,
        "newLearners": new_learners,
        "activeLearners": states.get("active", 0),
        "completedLearners": states.get("completed", 0),
        "needsAttention": sum(states.get(state, 0) for state in NEEDS_ATTENTION_STATES),
        "averageProgress": min(
            100.0, _percent(completed_leaves, leaf_count * total)
        ),
        "certificatesIssued": Certificate.objects.filter(
            enrollment__program=program, is_revoked=False
        ).count(),
    }


def get_status_breakdown(by_state):
    ordered = [state for state in LEARNER_STATE_ORDER if by_state.get(state)]
    ordered += sorted(
        state for state in by_state if state not in LEARNER_STATE_ORDER and by_state[state]
    )
    return [{"status": state, "count": by_state[state]} for state in ordered]


def _bucket_start(day, granularity):
    if granularity == "week":
        return day - timedelta(days=day.weekday())
    if granularity == "month":
        return day.replace(day=1)
    return day


def _next_bucket(day, granularity):
    if granularity == "week":
        return day + timedelta(days=7)
    if granularity == "month":
        return (day.replace(day=28) + timedelta(days=4)).replace(day=1)
    return day + timedelta(days=1)


def _as_local_date(value):
    if isinstance(value, datetime):
        if timezone.is_aware(value):
            value = timezone.localtime(value)
        return value.date()
    return value


def _count_by_bucket(enrollments, granularity):
    counts = defaultdict(int)
    if connections[enrollments.db].features.has_zoneinfo_database:
        rows = (
            enrollments.annotate(bucket=_TRUNC[granularity]("enrolled_at"))
            .values("bucket")
            .annotate(count=Count("id"))
            .order_by("bucket")
        )
        for row in rows:
            bucket = _bucket_start(_as_local_date(row["bucket"]), granularity)
            counts[bucket] += row["count"]
    else:
        # Without time zone tables (MySQL) Trunc cannot convert to local time
        # and Django raises on the NULL buckets, so bucket timestamps here.
        for value in enrollments.values_list("enrolled_at", flat=True):
            counts[_bucket_start(_as_local_date(value), granularity)] += 1
    return counts


def get_enrollment_trend(program, range_key, now=None):
    """New enrollments per local day, week or month, zero-filled.

    A first week that starts before the range is clipped to the range start
    and marked ``partial`` so it is not read as a full week.
    """
    now = now or timezone.now()
    today = timezone.localdate(now)
    since = get_range_start(range_key, now)
    enrollments = Enrollment.objects.filter(program=program)

    if since is None:
        first = enrollments.aggregate(first=Min("enrolled_at"))["first"]
        if first is None:
            return {"granularity": "week", "since": None, "points": [], "total": 0}
        start_day = _as_local_date(first)
        granularity = (
            "week" if (today - start_day).days <= WEEKLY_ALL_TIME_MAX_DAYS else "month"
        )
    else:
        enrollments = enrollments.filter(enrolled_at__gte=since)
        start_day = _as_local_date(since)
        granularity = "week" if range_key == "90d" else "day"

    counts = _count_by_bucket(enrollments, granularity)

    points = []
    bucket = _bucket_start(start_day, granularity)
    last_bucket = _bucket_start(today, granularity)
    while bucket <= last_bucket:
        point = {"date": bucket.isoformat(), "count": counts.get(bucket, 0)}
        if since is not None and bucket < start_day:
            point.update(date=start_day.isoformat(), partial=True)
        points.append(point)
        bucket = _next_bucket(bucket, granularity)
    return {
        "granularity": granularity,
        "since": start_day.isoformat(),
        "points": points,
        "total": sum(counts.values()),
    }


def _assignment_node_map(leaves):
    """Assignment id -> node id for assignment lessons (first node wins)."""
    mapping = {}
    for node in leaves:
        kinds = {
            str(node["node_type"] or "").lower(),
            str(node["lesson_type"] or "").lower(),
        }
        assignment_id = _json_int(node.get("assignment_ref"))
        if "assignment" in kinds and assignment_id:
            mapping.setdefault(assignment_id, node["id"])
    return mapping


def _has_evidence(model, node_ref, node_field="node_id"):
    """Correlated check for the outer row's learner having evidence on a node."""
    return Exists(
        model.objects.filter(
            enrollment_id=OuterRef("enrollment_id"),
            **{node_field: OuterRef(node_ref)},
        )
    )


def get_lesson_engagement(program, *, leaves=None, learner_count=None):
    """Per-lesson reach, completion and drop-off in curriculum order.

    A learner has *started* a lesson when there is activity evidence, a
    completion, a quiz attempt or an assignment submission for it; each
    learner counts once per lesson. Text lessons record no evidence before
    completion, so for them started equals completed.
    """
    if leaves is None:
        leaves = _published_leaf_nodes(program)
    if learner_count is None:
        learner_count = Enrollment.objects.filter(program=program).count()
    rows = leaves[:LESSON_ROW_LIMIT]
    leaf_ids = [node["id"] for node in rows]

    progress_stats = {}
    completion_stats = {}
    attempt_only = {}
    submission_only = {}
    if leaf_ids and learner_count:
        progress_stats = {
            row["node_id"]: row
            for row in LearnerNodeProgress.objects.filter(
                node_id__in=leaf_ids, enrollment__program=program
            )
            .values("node_id")
            .annotate(
                started=Count("enrollment_id", distinct=True),
                avg_seconds=Avg("active_seconds", filter=Q(active_seconds__gt=0)),
            )
        }
        completion_stats = {
            row["node_id"]: row
            for row in NodeCompletion.objects.filter(
                node_id__in=leaf_ids, enrollment__program=program
            )
            .values("node_id")
            .annotate(
                completed=Count("enrollment_id", distinct=True),
                without_progress=Count(
                    "enrollment_id",
                    distinct=True,
                    filter=~_has_evidence(LearnerNodeProgress, "node_id"),
                ),
            )
        }
        attempt_only = dict(
            QuizAttempt.objects.filter(
                quiz__node_id__in=leaf_ids, enrollment__program=program
            )
            .filter(
                ~_has_evidence(LearnerNodeProgress, "quiz__node_id"),
                ~_has_evidence(NodeCompletion, "quiz__node_id"),
            )
            .values("quiz__node_id")
            .annotate(started=Count("enrollment_id", distinct=True))
            .values_list("quiz__node_id", "started")
        )
        assignment_nodes = _assignment_node_map(rows)
        if assignment_nodes:
            lesson_for_assignment = Case(
                *(
                    When(assignment_id=assignment_id, then=Value(node_id))
                    for assignment_id, node_id in assignment_nodes.items()
                ),
                output_field=IntegerField(),
            )
            submission_only = dict(
                AssignmentSubmission.objects.filter(
                    assignment_id__in=list(assignment_nodes),
                    enrollment__program=program,
                )
                .annotate(lesson_id=lesson_for_assignment)
                .filter(
                    ~_has_evidence(LearnerNodeProgress, "lesson_id"),
                    ~_has_evidence(NodeCompletion, "lesson_id"),
                    ~_has_evidence(QuizAttempt, "lesson_id", "quiz__node_id"),
                )
                .values("lesson_id")
                .annotate(started=Count("enrollment_id", distinct=True))
                .values_list("lesson_id", "started")
            )

    results = []
    previous_started = None
    for index, node in enumerate(rows, start=1):
        progress = progress_stats.get(node["id"], {})
        completion = completion_stats.get(node["id"], {})
        started = (
            progress.get("started", 0)
            + completion.get("without_progress", 0)
            + attempt_only.get(node["id"], 0)
            + submission_only.get(node["id"], 0)
        )
        completed = completion.get("completed", 0)
        drop_off = None
        if previous_started:
            drop_off = max(0.0, _percent(previous_started - started, previous_started))
        avg_seconds = progress.get("avg_seconds")
        results.append(
            {
                "id": node["id"],
                "position": index,
                "title": node["title"],
                "type": node["lesson_type"] or node["node_type"],
                "started": started,
                "completed": completed,
                "completionRate": _percent(completed, learner_count),
                "dropOff": drop_off,
                "avgActiveSeconds": (
                    round(float(avg_seconds), 1) if avg_seconds is not None else None
                ),
            }
        )
        previous_started = started
    return {
        "learnerCount": learner_count,
        "results": results,
        "total": len(leaves),
        "truncated": len(leaves) > LESSON_ROW_LIMIT,
    }


def _round_score(value):
    return round(float(value), 1) if value is not None else None


def get_assessment_performance(program):
    """Attempts, pass rate, scores and grading queue per gradebook assessment.

    Pass rate is learners who passed over learners with a graded result, so
    work still awaiting grading is reported as ``pending`` instead of
    lowering the rate. Quiz scores average each learner's best attempt;
    assignment scores average official results after any late penalty.
    """
    quizzes, assignments = resolve_gradebook_columns(program)
    quiz_stats = {}
    if quizzes:
        scored = Q(submitted_at__isnull=False, score__isnull=False)
        better_attempt = QuizAttempt.objects.filter(
            scored,
            enrollment_id=OuterRef("enrollment_id"),
            quiz_id=OuterRef("quiz_id"),
        ).filter(
            Q(score__gt=OuterRef("score"))
            | Q(score=OuterRef("score"), id__gt=OuterRef("id"))
        )
        quiz_stats = {
            row["quiz_id"]: row
            for row in QuizAttempt.objects.filter(
                quiz_id__in=[quiz["id"] for quiz in quizzes],
                enrollment__program=program,
                submitted_at__isnull=False,
            )
            .values("quiz_id")
            .annotate(
                attempts=Count("id"),
                learners=Count("enrollment_id", distinct=True),
                graded_learners=Count(
                    "enrollment_id", distinct=True, filter=Q(passed__isnull=False)
                ),
                passed_learners=Count(
                    "enrollment_id", distinct=True, filter=Q(passed=True)
                ),
                average=Avg("score", filter=scored & ~Exists(better_attempt)),
                pending=Count("id", filter=Q(passed__isnull=True)),
            )
        }
    assignment_stats = {}
    if assignments:
        finalized = Q(status__in=FINALIZED_ASSIGNMENT_STATUSES)
        final_score = Case(
            When(
                Q(is_late=True, assignment__late_penalty_percent__gt=0),
                then=F("score")
                * (Value(100.0) - F("assignment__late_penalty_percent"))
                / Value(100.0),
            ),
            default=F("score"),
            output_field=FloatField(),
        )
        assignment_stats = {
            row["assignment_id"]: row
            for row in AssignmentSubmission.objects.filter(
                assignment_id__in=[item["id"] for item in assignments],
                enrollment__program=program,
                status__in=SUBMITTED_ASSIGNMENT_STATUSES,
            )
            .values("assignment_id")
            .annotate(
                attempts=Count("id"),
                learners=Count("enrollment_id", distinct=True),
                graded_learners=Count("enrollment_id", distinct=True, filter=finalized),
                passed_learners=Count(
                    "enrollment_id", distinct=True, filter=finalized & Q(passed=True)
                ),
                average=Avg(
                    final_score, filter=Q(is_official=True, score__isnull=False)
                ),
                pending=Count("id", filter=Q(status="submitted")),
            )
        }

    def row(kind, item, stats, url):
        graded = stats.get("graded_learners", 0)
        passed = stats.get("passed_learners", 0)
        return {
            "id": item["id"],
            "kind": kind,
            "title": item["title"],
            "attempts": stats.get("attempts", 0),
            "learners": stats.get("learners", 0),
            "graded": graded,
            "passed": passed,
            "passRate": _percent(passed, graded) if graded else None,
            "averageScore": _round_score(stats.get("average")),
            "pending": stats.get("pending", 0),
            "passThreshold": item.get("passThreshold"),
            "url": url,
        }

    return [
        row("quiz", quiz, quiz_stats.get(quiz["id"], {}), None) for quiz in quizzes
    ] + [
        row(
            "assignment",
            assignment,
            assignment_stats.get(assignment["id"], {}),
            f"/instructor/assignments/{assignment['id']}/submissions/",
        )
        for assignment in assignments
    ]


def get_course_analytics(program, range_key, now=None):
    now = now or timezone.now()
    leaves = _published_leaf_nodes(program)
    learners = _classify_learners(program, now)
    summary = get_course_analytics_summary(
        program,
        since=get_range_start(range_key, now),
        leaf_count=len(leaves),
        now=now,
        learners=learners,
    )
    assessments = get_assessment_performance(program)
    summary["pendingGrading"] = sum(item["pending"] for item in assessments)
    return {
        "summary": summary,
        "statusBreakdown": get_status_breakdown(learners[1]),
        "enrollmentTrend": get_enrollment_trend(program, range_key, now=now),
        "lessonEngagement": get_lesson_engagement(
            program, leaves=leaves, learner_count=summary["totalLearners"]
        ),
        "assessments": assessments,
    }
