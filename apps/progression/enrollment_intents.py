from urllib.parse import urlencode

from django.core import signing
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.core.services.course_prerequisites import CoursePrerequisiteService
from apps.commerce.services import program_price_minor
from apps.platform.models import PlatformSettings
from apps.progression.models import (
    Enrollment,
    EnrollmentIntent,
    EnrollmentRequest,
)


ENROLLMENT_INTENT_SALT = "lms.enrollment-intent"
ENROLLMENT_INTENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7
OPEN_INTENT_STATUSES = {
    EnrollmentIntent.STATUS_AWAITING_IDENTITY,
    EnrollmentIntent.STATUS_AWAITING_PAYMENT,
    EnrollmentIntent.STATUS_AWAITING_APPROVAL,
}


def normalize_email(value: str) -> str:
    return str(value or "").strip().lower()


class EnrollmentIntentService:
    @staticmethod
    def capture(*, program, name: str, email: str, phone: str, user=None):
        normalized_email = normalize_email(email)
        normalized_name = str(name or "").strip()
        normalized_phone = str(phone or "").strip()
        if not normalized_name or not normalized_email or not normalized_phone:
            raise ValidationError("Name, email and phone number are required.")

        intent = (
            EnrollmentIntent.objects.filter(
                program=program,
                email__iexact=normalized_email,
                status__in=OPEN_INTENT_STATUSES,
            )
            .order_by("-created_at")
            .first()
        )
        if not intent:
            return EnrollmentIntent.objects.create(
                program=program,
                user=user if getattr(user, "is_authenticated", False) else None,
                name=normalized_name,
                email=normalized_email,
                phone=normalized_phone,
            )

        intent.name = normalized_name
        intent.phone = normalized_phone
        if getattr(user, "is_authenticated", False):
            intent.user = user
        intent.save(update_fields=["name", "phone", "user", "updated_at"])
        return intent

    @staticmethod
    def resume_token(intent: EnrollmentIntent) -> str:
        return signing.dumps(
            {"intent_id": intent.id, "email": normalize_email(intent.email)},
            salt=ENROLLMENT_INTENT_SALT,
        )

    @classmethod
    def resume_url(cls, intent: EnrollmentIntent) -> str:
        return "/programs/enrollment/resume/?" + urlencode(
            {"intent": cls.resume_token(intent)}
        )

    @staticmethod
    def from_token(token: str) -> EnrollmentIntent:
        try:
            payload = signing.loads(
                token,
                salt=ENROLLMENT_INTENT_SALT,
                max_age=ENROLLMENT_INTENT_MAX_AGE_SECONDS,
            )
            intent_id = int(payload["intent_id"])
        except (
            signing.BadSignature,
            signing.SignatureExpired,
            KeyError,
            TypeError,
            ValueError,
        ) as error:
            raise ValidationError("This enrollment link is invalid or has expired.") from error

        intent = EnrollmentIntent.objects.select_related("program").filter(
            pk=intent_id,
            status__in=OPEN_INTENT_STATUSES,
        ).first()
        if not intent or not intent.program_id or not intent.program.is_published:
            raise ValidationError("This enrollment request is no longer available.")
        return intent

    @staticmethod
    def _enrollment_mode() -> str:
        platform = PlatformSettings.get_settings()
        features = platform.get_default_features_for_mode()
        if isinstance(platform.features, dict):
            features.update(platform.features)
        return str(features.get("enrollment_mode") or "instructor_approval")

    @classmethod
    def continue_for_user(cls, intent: EnrollmentIntent, user):
        if normalize_email(user.email) != normalize_email(intent.email):
            raise ValidationError(
                f"Please sign in with {intent.email} to continue this enrollment."
            )

        evaluation = CoursePrerequisiteService.evaluate(user, intent.program)
        if evaluation.required and not evaluation.eligible:
            raise ValidationError(evaluation.blocking_message)

        user_update_fields = []
        if intent.phone and not user.phone:
            user.phone = intent.phone
            user_update_fields.append("phone")
        if user_update_fields:
            user.save(update_fields=user_update_fields)

        amount_minor, _ = program_price_minor(intent.program)
        if amount_minor > 0:
            intent.user = user
            intent.status = EnrollmentIntent.STATUS_AWAITING_PAYMENT
            intent.save(update_fields=["user", "status", "updated_at"])
            query = urlencode(
                {
                    "mode": "direct",
                    "programId": intent.program_id,
                    "enrollmentIntentId": intent.id,
                }
            )
            return "payment", f"/checkout/?{query}"

        if cls._enrollment_mode() != "open":
            EnrollmentRequest.objects.get_or_create(
                user=user,
                program=intent.program,
                defaults={"status": "pending", "message": "Enrollment details captured."},
            )
            intent.user = user
            intent.status = EnrollmentIntent.STATUS_AWAITING_APPROVAL
            intent.save(update_fields=["user", "status", "updated_at"])
            return "approval", f"/programs/{intent.program.slug}/"

        with transaction.atomic():
            enrollment, _ = Enrollment.objects.get_or_create(
                user=user,
                program=intent.program,
                defaults={"status": "active", "access_source": "free"},
            )
            intent.user = user
            intent.enrollment = enrollment
            intent.status = EnrollmentIntent.STATUS_ENROLLED
            intent.converted_at = timezone.now()
            intent.save(
                update_fields=[
                    "user",
                    "enrollment",
                    "status",
                    "converted_at",
                    "updated_at",
                ]
            )
        return "enrolled", f"/student/programs/{intent.program_id}/"

    @staticmethod
    def attach_order(*, intent: EnrollmentIntent, order, user) -> None:
        if intent.user_id != user.id or intent.program_id not in {
            item.program_id for item in order.items.all()
        }:
            raise ValidationError("This enrollment request does not match the checkout.")
        intent.order = order
        intent.status = EnrollmentIntent.STATUS_AWAITING_PAYMENT
        intent.save(update_fields=["order", "status", "updated_at"])

    @staticmethod
    def complete_paid_order(order) -> None:
        intents = EnrollmentIntent.objects.filter(
            order=order,
            status=EnrollmentIntent.STATUS_AWAITING_PAYMENT,
        )
        for intent in intents.select_related("program"):
            enrollment = Enrollment.objects.filter(
                user=order.user,
                program_id=intent.program_id,
            ).first()
            if not enrollment:
                continue
            intent.enrollment = enrollment
            intent.status = EnrollmentIntent.STATUS_ENROLLED
            intent.converted_at = order.paid_at or timezone.now()
            intent.save(
                update_fields=[
                    "enrollment",
                    "status",
                    "converted_at",
                    "updated_at",
                ]
            )
