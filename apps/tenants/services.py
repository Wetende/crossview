"""
Tenant services - Business logic for tenant management.
"""

from typing import Optional
from datetime import timedelta
from django.db.models import Count, Q
from django.utils import timezone
from django.core.exceptions import ValidationError

from apps.tenants.models import Tenant, PresetBlueprint


class PlatformStatsService:
    """Service for platform-wide statistics."""

    @staticmethod
    def get_dashboard_stats() -> dict:
        """Get platform-wide stats for super admin dashboard."""
        total_tenants = Tenant.objects.count()
        active_tenants = Tenant.objects.filter(is_active=True).count()

        from apps.core.models import User

        total_users = User.objects.count()

        return {
            "totalTenants": total_tenants,
            "activeTenants": active_tenants,
            "totalUsers": total_users,
        }

    @staticmethod
    def get_growth_data(months: int = 12) -> tuple[list, list]:
        """Get tenant and user growth data for the last N months."""
        from apps.core.models import User

        now = timezone.now()
        tenant_growth = []
        user_growth = []

        for i in range(months - 1, -1, -1):
            month_start = (now - timedelta(days=30 * i)).replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1)

            tenant_count = Tenant.objects.filter(created_at__lt=month_end).count()
            user_count = User.objects.filter(date_joined__lt=month_end).count()

            tenant_growth.append(
                {"month": month_start.strftime("%b"), "count": tenant_count}
            )
            user_growth.append(
                {"month": month_start.strftime("%b"), "count": user_count}
            )

        return tenant_growth, user_growth

    @staticmethod
    def get_recent_tenants(limit: int = 10) -> list:
        """Get recently created tenants."""
        tenants = Tenant.objects.order_by("-created_at")[:limit]
        return [
            {
                "id": t.id,
                "name": t.name,
                "subdomain": t.subdomain,
                "isActive": t.is_active,
                "createdAt": t.created_at.isoformat(),
            }
            for t in tenants
        ]


class TenantService:
    """Service for tenant CRUD operations."""

    @staticmethod
    def list_tenants(
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list, int]:
        """List tenants with filtering and pagination."""
        from apps.core.models import User, Program

        queryset = Tenant.objects.all()

        if status == "active":
            queryset = queryset.filter(is_active=True)
        elif status == "inactive":
            queryset = queryset.filter(is_active=False)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(subdomain__icontains=search)
            )

        total = queryset.count()
        queryset = queryset.order_by("-created_at")
        tenants = queryset[(page - 1) * per_page : page * per_page]

        # Get counts
        tenant_ids = [t.id for t in tenants]
        user_counts = dict(
            User.objects.filter(tenant_id__in=tenant_ids)
            .values("tenant_id")
            .annotate(count=Count("id"))
            .values_list("tenant_id", "count")
        )
        program_counts = dict(
            Program.objects.filter(tenant_id__in=tenant_ids)
            .values("tenant_id")
            .annotate(count=Count("id"))
            .values_list("tenant_id", "count")
        )

        tenants_data = [
            {
                "id": t.id,
                "name": t.name,
                "subdomain": t.subdomain,
                "adminEmail": t.admin_email,
                "isActive": t.is_active,
                "userCount": user_counts.get(t.id, 0),
                "programCount": program_counts.get(t.id, 0),
                "createdAt": t.created_at.isoformat(),
            }
            for t in tenants
        ]

        return tenants_data, total

    @staticmethod
    def get_tenant_detail(tenant_id: int) -> dict:
        """Get detailed tenant information."""
        from apps.core.models import User, Program

        tenant = Tenant.objects.get(pk=tenant_id)
        admin_user = User.objects.filter(tenant=tenant, is_staff=True).first()
        user_count = User.objects.filter(tenant=tenant).count()
        program_count = Program.objects.filter(tenant=tenant).count()

        return {
            "tenant": {
                "id": tenant.id,
                "name": tenant.name,
                "subdomain": tenant.subdomain,
                "adminEmail": tenant.admin_email,
                "isActive": tenant.is_active,
                "createdAt": tenant.created_at.isoformat(),
                "activatedAt": (
                    tenant.activated_at.isoformat() if tenant.activated_at else None
                ),
            },
            "stats": {
                "userCount": user_count,
                "programCount": program_count,
            },
            "admin": {
                "id": admin_user.id if admin_user else None,
                "email": admin_user.email if admin_user else None,
                "name": admin_user.get_full_name() if admin_user else None,
            },
        }

    @staticmethod
    def create_tenant(
        name: str,
        subdomain: str,
        admin_email: str,
        admin_name: str = "",
    ) -> Tenant:
        """Create a new tenant with admin user."""
        from apps.core.models import User
        import secrets

        # Validation
        if Tenant.objects.filter(subdomain=subdomain).exists():
            raise ValidationError({"subdomain": "Subdomain already exists"})
        if User.objects.filter(email=admin_email).exists():
            raise ValidationError({"adminEmail": "Email already exists"})

        # Create tenant
        tenant = Tenant.objects.create(
            name=name,
            subdomain=subdomain,
            admin_email=admin_email,
            is_active=True,
            activated_at=timezone.now(),
        )

        # Create admin user
        temp_password = secrets.token_urlsafe(12)
        names = admin_name.split(" ", 1) if admin_name else [""]
        first_name = names[0] if names else ""
        last_name = names[1] if len(names) > 1 else ""

        User.objects.create_user(
            username=admin_email,
            email=admin_email,
            password=temp_password,
            first_name=first_name,
            last_name=last_name,
            tenant=tenant,
            is_staff=True,
        )

        # TODO: Send welcome email with temp password

        return tenant

    @staticmethod
    def update_tenant(
        tenant_id: int,
        name: str,
        subdomain: str,
        admin_email: Optional[str] = None,
    ) -> Tenant:
        """Update tenant details."""
        tenant = Tenant.objects.get(pk=tenant_id)

        # Validation
        if Tenant.objects.filter(subdomain=subdomain).exclude(pk=tenant_id).exists():
            raise ValidationError({"subdomain": "Subdomain already exists"})

        tenant.name = name
        tenant.subdomain = subdomain
        if admin_email:
            tenant.admin_email = admin_email

        tenant.save()
        return tenant

    @staticmethod
    def toggle_tenant_status(tenant_id: int) -> Tenant:
        """Suspend or reactivate a tenant."""
        tenant = Tenant.objects.get(pk=tenant_id)
        tenant.is_active = not tenant.is_active
        tenant.save()
        return tenant

    @staticmethod
    def delete(tenant: Tenant) -> None:
        """Delete a tenant and all related data."""
        tenant.delete()


class PresetBlueprintService:
    """Service for preset blueprint management."""

    @staticmethod
    def list_presets() -> list:
        """List all preset blueprints."""
        presets = PresetBlueprint.objects.order_by("name")
        return [
            {
                "id": p.id,
                "name": p.name,
                "code": p.code,
                "description": p.description or "",
                "regulatoryBody": p.regulatory_body or "",
                "hierarchyLabels": p.hierarchy_labels or [],
                "gradingConfig": p.grading_config or {},
                "isActive": p.is_active,
            }
            for p in presets
        ]

    @staticmethod
    def create_preset(
        name: str,
        code: str,
        hierarchy_labels: list,
        description: str = "",
        regulatory_body: str = "",
        grading_config: Optional[dict] = None,
        is_active: bool = True,
    ) -> PresetBlueprint:
        """Create a new preset blueprint."""
        if PresetBlueprint.objects.filter(code=code).exists():
            raise ValidationError({"code": "Code already exists"})
        if not hierarchy_labels:
            raise ValidationError(
                {"hierarchyLabels": "At least one hierarchy level is required"}
            )

        return PresetBlueprint.objects.create(
            name=name,
            code=code,
            description=description,
            regulatory_body=regulatory_body,
            hierarchy_labels=hierarchy_labels,
            grading_config=grading_config or {},
            is_active=is_active,
        )

    @staticmethod
    def update_preset(
        preset_id: int,
        name: str,
        code: str,
        hierarchy_labels: list,
        description: str = "",
        regulatory_body: str = "",
        grading_config: Optional[dict] = None,
        is_active: Optional[bool] = None,
    ) -> PresetBlueprint:
        """Update a preset blueprint."""
        preset = PresetBlueprint.objects.get(pk=preset_id)

        if PresetBlueprint.objects.filter(code=code).exclude(pk=preset_id).exists():
            raise ValidationError({"code": "Code already exists"})
        if not hierarchy_labels:
            raise ValidationError(
                {"hierarchyLabels": "At least one hierarchy level is required"}
            )

        preset.name = name
        preset.code = code
        preset.description = description
        preset.regulatory_body = regulatory_body
        preset.hierarchy_labels = hierarchy_labels
        if grading_config is not None:
            preset.grading_config = grading_config
        if is_active is not None:
            preset.is_active = is_active

        preset.save()
        return preset
