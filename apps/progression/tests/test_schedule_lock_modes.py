"""
Drip schedule locks follow the course's drip mode.

The builder keeps the other mode's saved value when an instructor switches
modes, so the lock checker must only apply the field for the active mode.
"""

from datetime import timedelta

import pytest
from django.utils import timezone

from apps.progression.services import ProgressionEngine, ScheduleLockChecker
from apps.progression.tests.factories import (
    CurriculumNodeFactory,
    EnrollmentFactory,
    ProgramFactory,
)


def _scheduled_node(drip_mode, **schedule):
    program = ProgramFactory(drip_enabled=True, drip_mode=drip_mode)
    node = CurriculumNodeFactory(program=program, **schedule)
    enrollment = EnrollmentFactory(program=program)
    return enrollment, node


@pytest.mark.django_db
def test_absolute_mode_ignores_hidden_relative_days():
    enrollment, node = _scheduled_node(
        "absolute",
        unlock_after_days=30,
        unlock_date=timezone.now() - timedelta(days=1),
    )

    result = ScheduleLockChecker().is_unlocked(enrollment, node)

    assert result.can_access is True
    assert ProgressionEngine().can_access(enrollment, node).can_access is True


@pytest.mark.django_db
def test_absolute_mode_still_locks_until_the_date():
    enrollment, node = _scheduled_node(
        "absolute",
        unlock_after_days=30,
        unlock_date=timezone.now() + timedelta(days=2),
    )

    result = ScheduleLockChecker().is_unlocked(enrollment, node)

    assert result.can_access is False
    assert result.lock_reason == "scheduled"


@pytest.mark.django_db
def test_relative_mode_ignores_hidden_unlock_date():
    enrollment, node = _scheduled_node(
        "relative",
        unlock_after_days=None,
        unlock_date=timezone.now() + timedelta(days=10),
    )

    assert ScheduleLockChecker().is_unlocked(enrollment, node).can_access is True


@pytest.mark.django_db
def test_relative_mode_still_locks_by_days():
    enrollment, node = _scheduled_node(
        "relative",
        unlock_after_days=5,
        unlock_date=timezone.now() - timedelta(days=1),
    )

    result = ScheduleLockChecker().is_unlocked(enrollment, node)

    assert result.can_access is False
    assert result.lock_reason == "drip"


@pytest.mark.django_db
@pytest.mark.parametrize("drip_mode", ["none", "mixed"])
def test_legacy_modes_apply_both_schedules(drip_mode):
    enrollment, node = _scheduled_node(
        drip_mode,
        unlock_after_days=30,
        unlock_date=timezone.now() - timedelta(days=1),
    )

    result = ScheduleLockChecker().is_unlocked(enrollment, node)

    assert result.can_access is False
    assert result.lock_reason == "drip"
