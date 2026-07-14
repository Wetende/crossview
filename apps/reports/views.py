import csv

from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.http import Http404, HttpResponse, HttpResponseBadRequest
from django.utils import timezone
from inertia import render

from .models import ReportExportLog
from .registry import get_report, reports_for_user
from .utils import (
    ReportFilterError,
    clean_filters,
    display_datetime,
    escape_csv_cell,
    parse_selected_ids,
    request_ip,
)


@login_required
def reports_index(request, scope: str):
    reports = reports_for_user(request.user, scope=scope)
    return render(
        request,
        "Reports/Index",
        {
            "scope": scope,
            "reports": [
                {
                    "id": report.id,
                    "title": report.title,
                    "description": report.description,
                    "formats": list(report.formats),
                    "sharedEngine": report.shared_engine,
                }
                for report in reports
            ],
        },
    )


@login_required
def report_print(request, scope: str, report_id: str):
    report = get_report(report_id)
    if report is None or report.scope != scope:
        raise Http404("Report not found")
    if not report.can_access(request.user):
        raise PermissionDenied("You do not have access to this report.")

    export_format = request.GET.get("format") or "print"
    if export_format not in report.formats:
        raise Http404("Report format not found")

    filters = clean_filters(request.GET.dict())
    selected_ids = parse_selected_ids(request.GET.get("ids"))
    try:
        result = report.build(request, filters, selected_ids)
    except ReportFilterError as exc:
        return HttpResponseBadRequest(str(exc))

    ReportExportLog.objects.create(
        user=request.user,
        report_id=report.id,
        scope=scope,
        export_format=export_format,
        filters=filters,
        selected_ids=selected_ids,
        row_count=len(result.rows),
        ip_address=request_ip(request),
    )

    if export_format == "csv":
        return _csv_response(report, result)

    generated_at = timezone.now()
    return render(
        request,
        "Reports/Print",
        {
            "scope": scope,
            "report": {
                "id": report.id,
                "title": result.title or report.title,
                "description": report.description,
                "sharedEngine": report.shared_engine,
                "orientation": result.orientation,
                "isTruncated": result.is_truncated,
                "totalCount": result.total_count,
            },
            "columns": [
                {"key": column.key, "label": column.label, "align": column.align}
                for column in result.columns
            ],
            "rows": result.rows,
            "filters": result.filters,
            "summary": result.summary,
            "generatedAt": generated_at.isoformat(),
            "generatedAtDisplay": display_datetime(generated_at),
            "generatedBy": request.user.get_full_name()
            or request.user.email
            or request.user.username,
        },
    )


def _csv_response(report, result):
    response = HttpResponse(content_type="text/csv")
    stamp = timezone.now().strftime("%Y%m%d-%H%M")
    response["Content-Disposition"] = (
        f'attachment; filename="{report.id.replace(".", "-")}-{stamp}.csv"'
    )
    writer = csv.writer(response)
    writer.writerow([escape_csv_cell(column.label) for column in result.columns])
    for row in result.rows:
        writer.writerow(
            [escape_csv_cell(row.get(column.key, "")) for column in result.columns]
        )
    return response
