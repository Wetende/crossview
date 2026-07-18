import pytest
from cryptography.fernet import Fernet
from django.contrib.auth.models import Group

from apps.core.tests.factories import UserFactory
from apps.google_classroom.configuration import encrypt_refresh_token
from apps.google_classroom.models import ClassroomCourseLink, ClassroomOAuthCredential
from apps.progression.models import InstructorAssignment
from apps.progression.tests.factories import ProgramFactory


@pytest.fixture
def classroom_settings(settings):
    settings.GOOGLE_CLASSROOM_ENABLED = True
    settings.GOOGLE_CLASSROOM_CLIENT_ID = "classroom-client"
    settings.GOOGLE_CLASSROOM_CLIENT_SECRET = "classroom-secret"
    settings.GOOGLE_CLASSROOM_REDIRECT_URI = (
        "https://courses.example.test/api/google-classroom/oauth/callback/"
    )
    settings.GOOGLE_CLASSROOM_TOKEN_ENCRYPTION_KEY = Fernet.generate_key().decode()
    settings.PLATFORM_PUBLIC_BASE_URL = "https://courses.example.test"
    return settings


@pytest.fixture
def instructor(db):
    user = UserFactory(email="teacher@example.test")
    group, _ = Group.objects.get_or_create(name="Instructors")
    user.groups.add(group)
    return user


@pytest.fixture
def program(instructor):
    value = ProgramFactory(name="Portable Course")
    InstructorAssignment.objects.create(instructor=instructor, program=value)
    return value


@pytest.fixture
def credential(classroom_settings, instructor):
    return ClassroomOAuthCredential.objects.create(
        user=instructor,
        google_user_id="teacher-google-id",
        google_email="teacher@example.test",
        refresh_token_ciphertext=encrypt_refresh_token("refresh-token"),
        granted_scopes=[
            "https://www.googleapis.com/auth/classroom.courses",
            "https://www.googleapis.com/auth/classroom.courses.readonly",
            "https://www.googleapis.com/auth/classroom.rosters",
            "https://www.googleapis.com/auth/classroom.rosters.readonly",
            "https://www.googleapis.com/auth/classroom.profile.emails",
            "https://www.googleapis.com/auth/classroom.coursework.students",
            "https://www.googleapis.com/auth/classroom.courseworkmaterials",
            "https://www.googleapis.com/auth/classroom.announcements",
            "https://www.googleapis.com/auth/classroom.topics",
        ],
    )


@pytest.fixture
def course_link(program, credential):
    return ClassroomCourseLink.objects.create(
        program=program,
        credential=credential,
        classroom_course_id="remote-course-1",
        classroom_name="Remote Portable Course",
        enrollment_code="JOIN42",
        alternate_link="https://classroom.google.com/c/remote-course-1",
        course_state="ACTIVE",
    )
