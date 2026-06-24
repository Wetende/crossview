from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from apps.assessments.models import AssessmentResult
from apps.core.models import Program, User
from apps.progression.models import Enrollment


@dataclass(frozen=True)
class PrerequisiteRequirement:
    program_id: int
    name: str
    code: str
    enrollment_status: str | None
    completed: bool
    score: float | None
    passed: bool
    reason: str

    def as_dict(self) -> dict:
        return {
            "programId": self.program_id,
            "name": self.name,
            "code": self.code,
            "enrollmentStatus": self.enrollment_status,
            "completed": self.completed,
            "score": self.score,
            "passed": self.passed,
            "reason": self.reason,
        }


@dataclass(frozen=True)
class PrerequisiteEvaluation:
    required: bool
    eligible: bool
    required_percent: int
    requirements: tuple[PrerequisiteRequirement, ...]

    @property
    def blocking_requirements(self) -> tuple[PrerequisiteRequirement, ...]:
        return tuple(item for item in self.requirements if not item.passed)

    @property
    def blocking_message(self) -> str:
        if not self.required or self.eligible:
            return ""

        names = ", ".join(item.name for item in self.blocking_requirements[:3])
        suffix = " and more" if len(self.blocking_requirements) > 3 else ""
        if self.required_percent <= 0:
            return f"Complete prerequisite course(s) first: {names}{suffix}."
        return (
            f"Complete prerequisite course(s) with at least "
            f"{self.required_percent}% first: {names}{suffix}."
        )

    def as_dict(self) -> dict:
        return {
            "required": self.required,
            "eligible": self.eligible,
            "requiredPercent": self.required_percent,
            "blockingMessage": self.blocking_message,
            "requirements": [item.as_dict() for item in self.requirements],
        }


class CoursePrerequisiteService:
    @classmethod
    def evaluate(
        cls,
        user: User | None,
        program: Program,
    ) -> PrerequisiteEvaluation:
        prerequisite_programs = tuple(
            program.prerequisite_programs.all().order_by("name", "id")
        )
        required_percent = cls._normalize_percent(
            program.prerequisite_passing_percent
        )

        if not prerequisite_programs:
            return PrerequisiteEvaluation(
                required=False,
                eligible=True,
                required_percent=required_percent,
                requirements=(),
            )

        if not user or not getattr(user, "is_authenticated", False):
            requirements = tuple(
                cls._build_requirement(
                    prerequisite,
                    enrollment=None,
                    required_percent=required_percent,
                )
                for prerequisite in prerequisite_programs
            )
            return PrerequisiteEvaluation(
                required=True,
                eligible=False,
                required_percent=required_percent,
                requirements=requirements,
            )

        enrollment_by_program_id = cls._get_enrollments_by_program_id(
            user,
            prerequisite_programs,
        )
        requirements = tuple(
            cls._build_requirement(
                prerequisite,
                enrollment=enrollment_by_program_id.get(prerequisite.id),
                required_percent=required_percent,
            )
            for prerequisite in prerequisite_programs
        )

        return PrerequisiteEvaluation(
            required=True,
            eligible=all(item.passed for item in requirements),
            required_percent=required_percent,
            requirements=requirements,
        )

    @staticmethod
    def _normalize_percent(value) -> int:
        try:
            numeric = int(value)
        except (TypeError, ValueError):
            numeric = 50
        return max(0, min(100, numeric))

    @staticmethod
    def _get_enrollments_by_program_id(
        user: User,
        prerequisite_programs: Iterable[Program],
    ) -> dict[int, Enrollment]:
        program_ids = [program.id for program in prerequisite_programs]
        enrollments = (
            Enrollment.objects.filter(user=user, program_id__in=program_ids)
            .select_related("program")
            .order_by("program_id", "-updated_at")
        )
        result = {}
        for enrollment in enrollments:
            result.setdefault(enrollment.program_id, enrollment)
        return result

    @classmethod
    def _build_requirement(
        cls,
        prerequisite: Program,
        *,
        enrollment: Enrollment | None,
        required_percent: int,
    ) -> PrerequisiteRequirement:
        if enrollment is None:
            return PrerequisiteRequirement(
                program_id=prerequisite.id,
                name=prerequisite.name,
                code=prerequisite.code or "",
                enrollment_status=None,
                completed=False,
                score=None,
                passed=False,
                reason="not_enrolled",
            )

        completed = enrollment.status == "completed"
        score = cls._get_published_course_score(enrollment)
        if not completed:
            passed = False
            reason = "not_completed"
        elif required_percent <= 0:
            passed = True
            reason = "passed"
        elif score is None:
            passed = False
            reason = "missing_score"
        else:
            passed = score >= required_percent
            reason = "passed" if passed else "score_too_low"

        return PrerequisiteRequirement(
            program_id=prerequisite.id,
            name=prerequisite.name,
            code=prerequisite.code or "",
            enrollment_status=enrollment.status,
            completed=completed,
            score=score,
            passed=passed,
            reason=reason,
        )

    @staticmethod
    def _get_published_course_score(enrollment: Enrollment) -> float | None:
        results = (
            AssessmentResult.objects.filter(
                enrollment=enrollment,
                node__program=enrollment.program,
                is_published=True,
            )
            .select_related("node")
            .order_by("-updated_at")
        )

        root_score = None
        fallback_score = None
        for result in results:
            result_data = result.result_data if isinstance(result.result_data, dict) else {}
            total = result_data.get("total")
            if total in (None, ""):
                continue
            try:
                score = float(total)
            except (TypeError, ValueError):
                continue
            if result.node.parent_id is None:
                root_score = score
                break
            if fallback_score is None:
                fallback_score = score

        if root_score is not None:
            return root_score
        if fallback_score is not None:
            return fallback_score

        grades = enrollment.grades if isinstance(enrollment.grades, dict) else {}
        for key in ("total", "overall", "overallScore", "overall_score"):
            value = grades.get(key)
            if value in (None, ""):
                continue
            try:
                return float(value)
            except (TypeError, ValueError):
                continue
        return None
