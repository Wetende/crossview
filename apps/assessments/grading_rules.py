"""Helpers for evaluating grading outcomes across assessment modules."""

from __future__ import annotations

import re
from typing import Any, Optional


_PASS_STATUS_ALIASES = {
    "pass",
    "passed",
    "competent",
    "credit",
    "distinction",
    "meeting",
    "exceeding",
    "complete",
    "completed",
}
_FAIL_STATUS_ALIASES = {
    "fail",
    "failed",
    "referral",
    "not_yet_competent",
    "not yet competent",
    "below_expectation",
    "below expectation",
    "approaching",
    "incomplete",
}


def _safe_float(value, default: Optional[float] = None) -> Optional[float]:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def normalize_grading_type(grading_config: dict | None) -> str:
    grading_config = grading_config or {}
    raw = str(
        grading_config.get("type") or grading_config.get("mode") or "percentage"
    ).strip().lower()
    if raw == "summative":
        return "weighted"
    return raw


def normalize_component_key(value: Any) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "_", str(value or "").strip().lower())
    return normalized.strip("_")


def normalize_weight(value: Any) -> float:
    weight = _safe_float(value, 0.0) or 0.0
    if weight > 1:
        return weight / 100.0
    return weight


def component_config_key(component: dict | None) -> str:
    component = component or {}
    return str(
        component.get("key") or component.get("name") or component.get("label") or ""
    ).strip()


def component_aliases(component: dict | None) -> set[str]:
    component = component or {}
    aliases = {
        normalize_component_key(component.get("key")),
        normalize_component_key(component.get("name")),
        normalize_component_key(component.get("label")),
    }
    aliases.discard("")
    return aliases


def configured_levels(grading_config: dict | None) -> list[str]:
    grading_config = grading_config or {}
    raw_levels = grading_config.get("levels")
    levels: list[str] = []

    if isinstance(raw_levels, list):
        for entry in raw_levels:
            if isinstance(entry, dict):
                label = str(entry.get("label") or entry.get("name") or "").strip()
            else:
                label = str(entry or "").strip()
            if label:
                levels.append(label)

    if levels:
        return levels

    labels = grading_config.get("competency_labels")
    if isinstance(labels, dict):
        fail_label = str(labels.get("fail") or "").strip()
        pass_label = str(labels.get("pass") or "").strip()
        derived = [label for label in [fail_label, pass_label] if label]
        if derived:
            return derived

    return []


def _status_passes_levels(
    status: str,
    levels: list[str],
    pass_threshold: Any,
) -> Optional[bool]:
    normalized_status = normalize_component_key(status)
    if not normalized_status or not levels:
        return None

    normalized_levels = [normalize_component_key(level) for level in levels]
    threshold_key = normalize_component_key(pass_threshold)
    if (
        threshold_key
        and threshold_key in normalized_levels
        and normalized_status in normalized_levels
    ):
        return normalized_levels.index(normalized_status) >= normalized_levels.index(
            threshold_key
        )
    return None


def _coerce_component_pass(value: Any) -> Optional[bool]:
    if isinstance(value, bool):
        return value

    if isinstance(value, (int, float)):
        return float(value) >= 50.0

    normalized = normalize_component_key(value)
    if not normalized:
        return None
    if normalized in {normalize_component_key(v) for v in _PASS_STATUS_ALIASES}:
        return True
    if normalized in {normalize_component_key(v) for v in _FAIL_STATUS_ALIASES}:
        return False

    numeric = _safe_float(value)
    if numeric is not None:
        return numeric >= 50.0
    return None


def _banded_level(total: float, levels: list[str]) -> Optional[str]:
    if not levels:
        return None
    if len(levels) == 1:
        return levels[0]

    step = 100.0 / len(levels)
    bounded_total = min(100.0, max(0.0, float(total)))
    index = min(len(levels) - 1, int(bounded_total // step))
    if bounded_total == 100.0:
        index = len(levels) - 1
    return levels[index]


def evaluate_result(result_data: dict | None, grading_config: dict | None) -> dict:
    """Return normalized pass/fail semantics for a stored or computed result."""

    result_data = result_data or {}
    grading_config = grading_config or {}
    grading_type = normalize_grading_type(grading_config)
    levels = configured_levels(grading_config)
    pass_threshold = grading_config.get("pass_threshold")
    numeric_threshold = _safe_float(
        grading_config.get(
            "pass_mark",
            grading_config.get("passMark", grading_config.get("threshold")),
        )
    )

    total = _safe_float(result_data.get("total"))
    status = str(result_data.get("status") or "").strip() or None
    components = result_data.get("components") if isinstance(result_data, dict) else {}
    if not isinstance(components, dict):
        components = {}

    status_pass = None
    if status:
        status_pass = _status_passes_levels(status, levels, pass_threshold)
        if status_pass is None:
            normalized_status = normalize_component_key(status)
            if normalized_status in {
                normalize_component_key(value) for value in _PASS_STATUS_ALIASES
            }:
                status_pass = True
            elif normalized_status in {
                normalize_component_key(value) for value in _FAIL_STATUS_ALIASES
            }:
                status_pass = False

    passed: Optional[bool]
    derived_status = status

    if grading_type in {"weighted", "percentage", "pass_fail"}:
        threshold = numeric_threshold if numeric_threshold is not None else 50.0
        passed = total >= threshold if total is not None else status_pass
        if derived_status is None and passed is not None:
            derived_status = "Pass" if passed else "Fail"
    elif grading_type in {"competency", "checklist"}:
        component_flags = [
            flag
            for flag in (_coerce_component_pass(value) for value in components.values())
            if flag is not None
        ]
        pass_all_required = bool(grading_config.get("pass_all_required", True))
        if component_flags:
            passed = all(component_flags) if pass_all_required else any(component_flags)
        elif status_pass is not None:
            passed = status_pass
        elif total is not None:
            threshold = numeric_threshold if numeric_threshold is not None else 100.0
            passed = total >= threshold if pass_all_required else total > 0.0
        else:
            passed = None

        if derived_status is None and passed is not None:
            if grading_type == "competency":
                if levels:
                    threshold_key = normalize_component_key(pass_threshold)
                    if threshold_key in [normalize_component_key(level) for level in levels]:
                        threshold_index = [
                            normalize_component_key(level) for level in levels
                        ].index(threshold_key)
                        fail_index = max(0, threshold_index - 1)
                        derived_status = (
                            levels[threshold_index] if passed else levels[fail_index]
                        )
                    else:
                        derived_status = "Competent" if passed else "Not Yet Competent"
                else:
                    derived_status = "Competent" if passed else "Not Yet Competent"
            else:
                derived_status = "Pass" if passed else "Fail"
    elif grading_type == "rubric":
        if derived_status is None and total is not None:
            derived_status = _banded_level(total, levels)
        passed = _status_passes_levels(
            derived_status or "",
            levels,
            pass_threshold,
        )
        if passed is None and total is not None and numeric_threshold is not None:
            passed = total >= numeric_threshold
        if passed is None:
            passed = status_pass
        if derived_status is None and passed is not None:
            derived_status = "Pass" if passed else "Fail"
    else:
        threshold = numeric_threshold if numeric_threshold is not None else 50.0
        passed = total >= threshold if total is not None else status_pass
        if derived_status is None and passed is not None:
            derived_status = "Pass" if passed else "Fail"

    return {
        "grading_type": grading_type,
        "total": total,
        "status": derived_status,
        "passed": passed,
        "numeric_threshold": numeric_threshold,
        "pass_threshold": pass_threshold,
        "levels": levels,
    }


def result_passed(result_data: dict | None, grading_config: dict | None) -> bool:
    return bool(evaluate_result(result_data, grading_config).get("passed"))
