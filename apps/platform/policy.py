"""Deployment policy helpers for configurable and product-locked LMS forks.

The canonical engine remains fully configurable when ``LMS_PLATFORM_POLICY`` is
absent. Forks may opt into immutable product decisions through Django settings
without adding tenant-specific branches to the shared engine.
"""

from copy import deepcopy

from django.conf import settings as django_settings
from django.core.exceptions import PermissionDenied


DEFAULT_PLATFORM_CAPABILITIES = {
    "manageIdentity": True,
    "manageBranding": True,
    "manageDeployment": True,
    "managePresets": True,
    "manageBlueprints": True,
    "manageFeatures": True,
    "runSetup": True,
    "manageRegistration": True,
    "showAdminSettings": True,
    "showSubscription": True,
}

POLICY_FIELD_MAP = {
    "institution_name": "institution_name",
    "tagline": "tagline",
    "primary_color": "primary_color",
    "secondary_color": "secondary_color",
    "deployment_mode": "deployment_mode",
    "setup_complete": "is_setup_complete",
}

_MISSING = object()


def get_platform_policy() -> dict:
    """Return a defensive copy of the configured deployment policy."""
    policy = getattr(django_settings, "LMS_PLATFORM_POLICY", {})
    return deepcopy(policy) if isinstance(policy, dict) else {}


def get_platform_capabilities() -> dict:
    """Return all known capabilities with fork overrides applied."""
    capabilities = dict(DEFAULT_PLATFORM_CAPABILITIES)
    configured = get_platform_policy().get("capabilities", {})
    if isinstance(configured, dict):
        for name in capabilities:
            if name in configured:
                capabilities[name] = bool(configured[name])
    return capabilities


def platform_capability_enabled(name: str) -> bool:
    """Return whether a deployment-level platform capability is available."""
    return get_platform_capabilities().get(name, False)


def require_platform_capability(name: str) -> None:
    """Reject a mutation or route disabled by the deployment policy."""
    if not platform_capability_enabled(name):
        raise PermissionDenied("This platform setting is locked for this deployment.")


def get_policy_value(name: str, default=None):
    """Return a configured policy value, preserving explicit falsey values."""
    return get_platform_policy().get(name, default)


def is_policy_value_locked(name: str) -> bool:
    """Return whether the fork explicitly controls a policy value."""
    return name in get_platform_policy()


def get_feature_overrides() -> dict:
    """Return immutable feature decisions configured by a fork."""
    overrides = get_platform_policy().get("feature_overrides", {})
    return deepcopy(overrides) if isinstance(overrides, dict) else {}


def get_locked_blueprint_mode() -> str | None:
    """Return the fork-controlled blueprint mode, when configured."""
    mode = get_platform_policy().get("blueprint_mode")
    return str(mode).strip() if mode else None


def apply_platform_policy(instance) -> set[str]:
    """Apply model-backed locks and return the names of changed model fields."""
    policy = get_platform_policy()
    changed_fields: set[str] = set()

    for policy_name, field_name in POLICY_FIELD_MAP.items():
        value = policy.get(policy_name, _MISSING)
        if value is _MISSING or getattr(instance, field_name) == value:
            continue
        setattr(instance, field_name, value)
        changed_fields.add(field_name)

    feature_overrides = get_feature_overrides()
    if feature_overrides:
        current_features = (
            dict(instance.features) if isinstance(instance.features, dict) else {}
        )
        effective_features = {**current_features, **feature_overrides}
        if effective_features != current_features:
            instance.features = effective_features
            changed_fields.add("features")

    return changed_fields


def get_effective_features(instance) -> dict:
    """Merge mode defaults, stored flags, and immutable fork overrides."""
    features = dict(instance.get_default_features_for_mode())
    if isinstance(instance.features, dict):
        features.update(instance.features)
    features.update(get_feature_overrides())
    return features
