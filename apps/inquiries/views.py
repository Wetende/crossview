import json

from django.http import JsonResponse
from django.views.decorators.cache import never_cache
from django.views.decorators.debug import sensitive_post_parameters
from django.views.decorators.http import require_POST

from .forms import InquirySubmissionForm
from .models import Inquiry
from .services import send_inquiry_notification


def _request_data(request) -> dict:
    content_type = (request.content_type or "").split(";", 1)[0].strip().lower()
    if content_type == "application/json":
        try:
            payload = json.loads(request.body or b"{}")
        except (TypeError, ValueError, UnicodeDecodeError) as exc:
            raise ValueError("Request body must contain valid JSON.") from exc
        if not isinstance(payload, dict):
            raise ValueError("Request body must be a JSON object.")
        return payload
    return request.POST.dict()


def _normalized_submission(payload: dict) -> dict:
    program_id = payload.get("program_id") or payload.get("programId")
    return {
        "name": payload.get("name") or payload.get("fullName") or "",
        "email": payload.get("email") or "",
        "phone": payload.get("phone") or "",
        "subject": payload.get("subject") or "",
        "message": payload.get("message") or "",
        "kind": (
            payload.get("kind")
            or payload.get("inquiryType")
            or (Inquiry.Kind.PROGRAM if program_id else Inquiry.Kind.GENERAL)
        ),
        "source": payload.get("source") or "website",
        "program_id": program_id,
    }


def _error_payload(form: InquirySubmissionForm) -> dict:
    errors = form.errors.get_json_data(escape_html=True)
    return {
        field: [entry["message"] for entry in entries]
        for field, entries in errors.items()
    }


@sensitive_post_parameters("email", "phone", "message")
@never_cache
@require_POST
def submit_inquiry(request):
    try:
        payload = _request_data(request)
    except ValueError as exc:
        return JsonResponse({"message": str(exc)}, status=400)

    # A conventional hidden field: bots receive a success response without
    # creating a record or triggering email.
    if str(payload.get("website") or "").strip():
        return JsonResponse(
            {"message": "Thank you. Your inquiry has been received."},
            status=201,
        )

    form = InquirySubmissionForm(_normalized_submission(payload))
    if not form.is_valid():
        return JsonResponse(
            {
                "message": "Please correct the highlighted fields.",
                "errors": _error_payload(form),
            },
            status=422,
        )

    cleaned = form.cleaned_data
    inquiry = Inquiry.objects.create(
        name=cleaned["name"],
        email=cleaned["email"].lower(),
        phone=cleaned["phone"],
        subject=cleaned["subject"],
        message=cleaned["message"],
        kind=cleaned["kind"],
        source=cleaned["source"],
        program=cleaned["program"],
        submitted_by=request.user if request.user.is_authenticated else None,
    )
    send_inquiry_notification(inquiry)

    return JsonResponse(
        {
            "message": "Thank you. Your inquiry has been received.",
            "inquiryId": inquiry.pk,
        },
        status=201,
    )
