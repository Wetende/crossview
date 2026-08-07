from urllib.parse import urlencode

from django.core import signing
from django.core.exceptions import ValidationError
from django.utils.crypto import get_random_string
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
ENROLLMENT_ACCESS_SESSION_KEY = "enrollment_access"
OPEN_INTENT_STATUSES = {
    EnrollmentIntent.STATUS_AWAITING_IDENTITY,
    EnrollmentIntent.STATUS_AWAITING_PAYMENT,
    EnrollmentIntent.STATUS_AWAITING_APPROVAL,
}


def normalize_email(value: str) -> str:
    return str(value or "").strip().lower()


def split_full_name(value: str) -> tuple[str, str]:
    parts = str(value or "").strip().split(maxsplit=1)
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], parts[1]


class EnrollmentIntentService:
    @staticmethod
    def _unique_username(email: str) -> str:
        from apps.core.models import User

        base = normalize_email(email)[:140] or "learner"
        candidate = base
        suffix = 1
        while User.objects.filter(username=candidate).exists():
            suffix += 1
            candidate = f"{base[:135]}-{suffix}"
        return candidate

    @staticmethod
    def _update_user_details(user, *, name: str, phone: str) -> None:
        first_name, last_name = split_full_name(name)
        update_fields = []
        if first_name and not user.first_name:
            user.first_name = first_name
            update_fields.append("first_name")
        if last_name and not user.last_name:
            user.last_name = last_name
            update_fields.append("last_name")
        if phone and not user.phone:
            user.phone = phone
            update_fields.append("phone")
        if update_fields:
            user.save(update_fields=update_fields)

    @classmethod
    @transaction.atomic
    def provision_user(cls, intent: EnrollmentIntent):
        """Create or link the learner account represented by an intent."""
        from apps.core.models import User

        user = User.objects.filter(email__iexact=intent.email).order_by("id").first()
        account_state = "existing"
        temporary_password = None

        if not user:
            first_name, last_name = split_full_name(intent.name)
            temporary_password = "Aa7" + get_random_string(
                10,
                allowed_chars=(
                    "abcdefghjkmnpqrstuvwxyz"
                    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
                ),
            )
            user = User.objects.create_user(
                username=cls._unique_username(intent.email),
                email=normalize_email(intent.email),
                password=temporary_password,
                first_name=first_name,
                last_name=last_name,
            )
            if intent.phone:
                user.phone = intent.phone
                user.save(update_fields=["phone"])
            account_state = "created"
        else:
            cls._update_user_details(user, name=intent.name, phone=intent.phone)

        if intent.user_id != user.id:
            intent.user = user
            intent.save(update_fields=["user", "updated_at"])
        return user, account_state, temporary_password

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
        return "/enrollment-intents/resume/?" + urlencode(
            {"intent": cls.resume_token(intent)}
        )

    @classmethod
    def login_url(cls, intent: EnrollmentIntent) -> str:
        return "/login/?" + urlencode({"next": cls.resume_url(intent)})

    @staticmethod
    def email_inbox_url(email: str) -> str:
        domain = normalize_email(email).split("@")[-1]
        inboxes = {
            "gmail.com": "https://mail.google.com/mail/",
            "googlemail.com": "https://mail.google.com/mail/",
            "outlook.com": "https://outlook.live.com/mail/",
            "hotmail.com": "https://outlook.live.com/mail/",
            "live.com": "https://outlook.live.com/mail/",
            "yahoo.com": "https://mail.yahoo.com/",
            "icloud.com": "https://www.icloud.com/mail/",
            "proton.me": "https://mail.proton.me/",
            "protonmail.com": "https://mail.proton.me/",
        }
        return inboxes.get(domain, "")

    @classmethod
    def access_payload(
        cls,
        intent: EnrollmentIntent,
        *,
        account_state: str,
        outcome: str,
    ) -> dict:
        if outcome == "payment":
            title = "Account ready"
            message = "Your details are saved. Sign in to complete secure payment."
        elif outcome == "approval":
            title = "Enrollment request sent"
            message = "Your request is awaiting review. We will notify you when it is approved."
        else:
            title = "You're enrolled"
            message = f"Your learner account is ready for {intent.program.name}."
        return {
            "programId": intent.program_id,
            "courseName": intent.program.name,
            "email": intent.email,
            "accountState": account_state,
            "outcome": outcome,
            "title": title,
            "message": message,
            "emailInboxUrl": cls.email_inbox_url(intent.email),
            "loginUrl": cls.login_url(intent),
        }

    @staticmethod
    def store_access_payload(request, payload: dict) -> None:
        request.session[ENROLLMENT_ACCESS_SESSION_KEY] = payload
        request.session.modified = True

    @staticmethod
    def pop_access_payload(request, program) -> dict | None:
        payload = request.session.get(ENROLLMENT_ACCESS_SESSION_KEY)
        if not isinstance(payload, dict):
            return None
        if int(payload.get("programId") or 0) != program.id:
            return None
        return request.session.pop(ENROLLMENT_ACCESS_SESSION_KEY, None)

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

        intent = EnrollmentIntent.objects.select_related(
            "program", "enrollment"
        ).filter(
            pk=intent_id,
            status__in=OPEN_INTENT_STATUSES | {EnrollmentIntent.STATUS_ENROLLED},
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

        if (
            intent.status == EnrollmentIntent.STATUS_ENROLLED
            and intent.enrollment_id
            and intent.enrollment.user_id == user.id
            and intent.enrollment.status in {"active", "completed"}
        ):
            return "enrolled", f"/student/programs/{intent.program_id}/"

        evaluation = CoursePrerequisiteService.evaluate(user, intent.program)
        if evaluation.required and not evaluation.eligible:
            raise ValidationError(evaluation.blocking_message)

        cls._update_user_details(user, name=intent.name, phone=intent.phone)

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
