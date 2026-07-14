from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Iterable

from django.contrib.auth.models import AnonymousUser


MAX_SYNC_REPORT_ROWS = 1000


@dataclass(frozen=True)
class ReportColumn:
    key: str
    label: str
    align: str = "left"


@dataclass
class ReportResult:
    title: str
    columns: list[ReportColumn]
    rows: list[dict]
    filters: dict = field(default_factory=dict)
    summary: dict = field(default_factory=dict)
    orientation: str = "portrait"
    total_count: int = 0
    is_truncated: bool = False


ReportBuilder = Callable[[object, dict, list[str]], ReportResult]


@dataclass(frozen=True)
class ReportDefinition:
    id: str
    title: str
    scope: str
    roles: tuple[str, ...]
    columns: tuple[ReportColumn, ...]
    builder: ReportBuilder
    description: str = ""
    orientation: str = "portrait"
    shared_engine: bool = True
    formats: tuple[str, ...] = ("print", "csv")

    def can_access(self, user) -> bool:
        if isinstance(user, AnonymousUser) or not getattr(user, "is_authenticated", False):
            return False
        role = resolve_report_role(user)
        return role in self.roles

    def build(self, request, filters: dict, selected_ids: list[str]) -> ReportResult:
        result = self.builder(request, filters, selected_ids)
        if not result.columns:
            result.columns = list(self.columns)
        if not result.orientation:
            result.orientation = self.orientation
        return result


_REPORTS: dict[str, ReportDefinition] = {}


def resolve_report_role(user) -> str:
    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return "admin"
    if hasattr(user, "groups") and user.groups.filter(name="Instructors").exists():
        return "instructor"
    return "student"


def register_report(definition: ReportDefinition) -> ReportDefinition:
    _REPORTS[definition.id] = definition
    return definition


def get_report(report_id: str) -> ReportDefinition | None:
    return _REPORTS.get(report_id)


def all_reports() -> Iterable[ReportDefinition]:
    return _REPORTS.values()


def reports_for_user(user, scope: str | None = None) -> list[ReportDefinition]:
    reports = [
        report
        for report in all_reports()
        if report.can_access(user) and (scope is None or report.scope == scope)
    ]
    return sorted(reports, key=lambda report: (report.scope, report.title))
