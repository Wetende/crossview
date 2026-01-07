"""
Factory Boy factories for progression app models.
"""

import factory
from factory.django import DjangoModelFactory
from django.utils import timezone

from apps.progression.models import Enrollment, NodeCompletion, InstructorAssignment
from apps.assessments.models import AssessmentResult
from apps.core.models import Program
from apps.curriculum.models import CurriculumNode
from apps.blueprints.models import AcademicBlueprint
from apps.core.tests.factories import UserFactory


class AcademicBlueprintFactory(DjangoModelFactory):
    """Factory for AcademicBlueprint model."""

    class Meta:
        model = AcademicBlueprint

    name = factory.Sequence(lambda n: f"Blueprint {n}")
    description = factory.Faker("paragraph")
    hierarchy_structure = ["Year", "Unit", "Session"]
    grading_logic = {
        "type": "weighted",
        "components": [
            {"name": "CAT", "weight": 0.3},
            {"name": "Exam", "weight": 0.7},
        ],
    }
    progression_rules = {"sequential": False}
    gamification_enabled = False
    certificate_enabled = True


class ProgramFactory(DjangoModelFactory):
    """Factory for Program model."""

    class Meta:
        model = Program

    blueprint = factory.SubFactory(AcademicBlueprintFactory)
    name = factory.Sequence(lambda n: f"Program {n}")
    code = factory.Sequence(lambda n: f"PRG-{n:04d}")
    description = factory.Faker("paragraph")
    is_published = True


class CurriculumNodeFactory(DjangoModelFactory):
    """Factory for CurriculumNode model."""

    class Meta:
        model = CurriculumNode

    program = factory.SubFactory(ProgramFactory)
    parent = None
    node_type = "Session"
    title = factory.Sequence(lambda n: f"Node {n}")
    code = factory.Sequence(lambda n: f"NODE-{n:04d}")
    description = factory.Faker("sentence")
    properties = {"content_html": "<p>Sample content</p>"}
    completion_rules = {}
    position = factory.Sequence(lambda n: n)
    is_published = True

    class Params:
        # Trait for root nodes (Year level)
        root = factory.Trait(
            node_type="Year",
            parent=None,
        )
        # Trait for unit nodes
        unit = factory.Trait(
            node_type="Unit",
        )
        # Trait for session nodes (leaf)
        session = factory.Trait(
            node_type="Session",
        )


class EnrollmentFactory(DjangoModelFactory):
    """Factory for Enrollment model."""

    class Meta:
        model = Enrollment

    user = factory.SubFactory(UserFactory)
    program = factory.SubFactory(ProgramFactory)
    status = "active"
    enrolled_at = factory.LazyFunction(timezone.now)

    class Params:
        # Note: Don't use 'completed' trait as it triggers certificate generation signal
        withdrawn = factory.Trait(
            status="withdrawn",
        )

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Override create to handle status without triggering signals."""
        # For completed status, we need to be careful about signals
        status = kwargs.get("status", "active")
        if status == "completed":
            # Create as active first, then update status directly
            kwargs["status"] = "active"
            obj = super()._create(model_class, *args, **kwargs)
            # Update status directly without triggering save signals
            model_class.objects.filter(pk=obj.pk).update(status="completed")
            obj.refresh_from_db()
            return obj
        return super()._create(model_class, *args, **kwargs)


class NodeCompletionFactory(DjangoModelFactory):
    """Factory for NodeCompletion model."""

    class Meta:
        model = NodeCompletion

    enrollment = factory.SubFactory(EnrollmentFactory)
    node = factory.SubFactory(
        CurriculumNodeFactory,
        program=factory.SelfAttribute("..enrollment.program"),
    )
    completed_at = factory.LazyFunction(timezone.now)
    completion_type = "view"
    metadata = {}


class InstructorAssignmentFactory(DjangoModelFactory):
    """Factory for InstructorAssignment model."""

    class Meta:
        model = InstructorAssignment

    instructor = factory.SubFactory(UserFactory)
    program = factory.SubFactory(ProgramFactory)
    assigned_at = factory.LazyFunction(timezone.now)


class AssessmentResultFactory(DjangoModelFactory):
    """Factory for AssessmentResult model."""

    class Meta:
        model = AssessmentResult

    enrollment = factory.SubFactory(EnrollmentFactory)
    node = factory.SubFactory(
        CurriculumNodeFactory,
        program=factory.SelfAttribute("..enrollment.program"),
    )
    result_data = factory.LazyFunction(
        lambda: {
            "total": 75.0,
            "status": "Pass",
            "letter_grade": "B",
            "components": {
                "CAT": 70.0,
                "Exam": 80.0,
            },
        }
    )
    lecturer_comments = factory.Faker("paragraph")
    is_published = True
    published_at = factory.LazyFunction(timezone.now)
    graded_by = factory.SubFactory(UserFactory)

    class Params:
        # Trait for unpublished results
        unpublished = factory.Trait(
            is_published=False,
            published_at=None,
        )
        # Trait for failed results
        failed = factory.Trait(
            result_data={
                "total": 35.0,
                "status": "Fail",
                "letter_grade": "F",
                "components": {
                    "CAT": 30.0,
                    "Exam": 40.0,
                },
            }
        )
        # Trait for competency-based results
        competency = factory.Trait(
            result_data={
                "total": None,
                "status": "Competent",
                "letter_grade": None,
                "components": {
                    "Skill 1": "Competent",
                    "Skill 2": "Competent",
                },
            }
        )


class PracticumSubmissionFactory(DjangoModelFactory):
    """Factory for PracticumSubmission model."""

    class Meta:
        model = "practicum.PracticumSubmission"

    enrollment = factory.SubFactory(EnrollmentFactory)
    node = factory.SubFactory(
        CurriculumNodeFactory,
        program=factory.SelfAttribute("..enrollment.program"),
    )
    version = 1
    status = "pending"
    # Adjusted path to remove tenant reference
    file_path = factory.LazyAttribute(
        lambda o: f"practicum/{o.enrollment.id}/{o.node.id}/v{o.version}.mp3"
    )
    file_type = "mp3"
    file_size = factory.Faker("random_int", min=1000, max=10000000)
    submitted_at = factory.LazyFunction(timezone.now)

    class Params:
        approved = factory.Trait(status="approved")
        revision_required = factory.Trait(status="revision_required")
        rejected = factory.Trait(status="rejected")


class RubricFactory(DjangoModelFactory):
    """Factory for Rubric model."""

    class Meta:
        model = "practicum.Rubric"

    name = factory.Sequence(lambda n: f"Rubric {n}")
    description = factory.Faker("paragraph")
    dimensions = [
        {"name": "Content", "weight": 0.4, "max_score": 25},
        {"name": "Delivery", "weight": 0.3, "max_score": 25},
        {"name": "Technical", "weight": 0.3, "max_score": 25},
    ]
    max_score = 100


class SubmissionReviewFactory(DjangoModelFactory):
    """Factory for SubmissionReview model."""

    class Meta:
        model = "practicum.SubmissionReview"

    submission = factory.SubFactory(PracticumSubmissionFactory)
    reviewer = factory.SubFactory(UserFactory)
    status = "approved"
    dimension_scores = {"Content": 20, "Delivery": 18, "Technical": 22}
    total_score = factory.LazyAttribute(
        lambda o: sum(o.dimension_scores.values()) if o.dimension_scores else None
    )
    comments = factory.Faker("paragraph")
    reviewed_at = factory.LazyFunction(timezone.now)


class CertificateFactory(DjangoModelFactory):
    """Factory for Certificate model."""

    class Meta:
        model = "certifications.Certificate"

    enrollment = factory.SubFactory(EnrollmentFactory)
    template = factory.SubFactory(
        "apps.progression.tests.factories.CertificateTemplateFactory"
    )
    serial_number = factory.Sequence(lambda n: f"CERT-{n:08d}")
    student_name = factory.LazyAttribute(
        lambda o: f"{o.enrollment.user.first_name} {o.enrollment.user.last_name}"
    )
    program_title = factory.LazyAttribute(lambda o: o.enrollment.program.name)
    completion_date = factory.LazyFunction(lambda: timezone.now().date())
    issue_date = factory.LazyFunction(lambda: timezone.now().date())
    # Adjusted path to remove tenant reference
    pdf_path = factory.LazyAttribute(
        lambda o: f"certificates/{o.serial_number}.pdf"
    )
    is_revoked = False

    class Params:
        revoked = factory.Trait(
            is_revoked=True,
            revoked_at=factory.LazyFunction(timezone.now),
            revocation_reason="Academic misconduct",
        )


class CertificateTemplateFactory(DjangoModelFactory):
    """Factory for CertificateTemplate model."""

    class Meta:
        model = "certifications.CertificateTemplate"

    name = factory.Sequence(lambda n: f"Template {n}")
    template_html = """
    <html>
    <body>
        <h1>Certificate of Completion</h1>
        <p>This certifies that {{student_name}}</p>
        <p>has completed {{program_title}}</p>
        <p>on {{completion_date}}</p>
        <p>Serial: {{serial_number}}</p>
    </body>
    </html>
    """
    is_default = False
