"""
Tenant services - Business logic for tenant management.
"""

from typing import Optional
from datetime import timedelta
from django.db.models import Count, Sum, Q
from django.utils import timezone
from django.core.exceptions import ValidationError

from apps.tenants.models import Tenant, SubscriptionTier, TenantLimits, PresetBlueprint


class PlatformStatsService:
    """Service for platform-wide statistics."""

    @staticmethod
    def get_dashboard_stats() -> dict:
        """Get platform-wide stats for super admin dashboard."""
        total_tenants = Tenant.objects.count()
        active_tenants = Tenant.objects.filter(is_active=True).count()

        from apps.core.models import User

        total_users = User.objects.count()

        # Monthly revenue (simplified)
        monthly_revenue = (
            Tenant.objects.filter(is_active=True, subscription_tier__isnull=False)
            .select_related("subscription_tier")
            .aggregate(total=Sum("subscription_tier__price_monthly"))
        )["total"] or 0

        return {
            "totalTenants": total_tenants,
            "activeTenants": active_tenants,
            "totalUsers": total_users,
            "monthlyRevenue": float(monthly_revenue),
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
    def get_tier_distribution() -> list:
        """Get distribution of tenants across subscription tiers."""
        return list(
            SubscriptionTier.objects.filter(is_active=True)
            .annotate(tenant_count=Count("tenants"))
            .values("name", "tenant_count")
            .order_by("-tenant_count")
        )

    @staticmethod
    def get_recent_tenants(limit: int = 10) -> list:
        """Get recently created tenants."""
        tenants = Tenant.objects.select_related("subscription_tier").order_by(
            "-created_at"
        )[:limit]
        return [
            {
                "id": t.id,
                "name": t.name,
                "subdomain": t.subdomain,
                "tierName": t.subscription_tier.name if t.subscription_tier else "Free",
                "isActive": t.is_active,
                "createdAt": t.created_at.isoformat(),
            }
            for t in tenants
        ]


class TenantService:
    """Service for tenant CRUD operations."""

    @staticmethod
    def list_tenants(
        tier_id: Optional[int] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list, int]:
        """List tenants with filtering and pagination."""
        from apps.core.models import User, Program

        queryset = Tenant.objects.select_related("subscription_tier")

        if tier_id:
            queryset = queryset.filter(subscription_tier_id=tier_id)

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
                "tierName": t.subscription_tier.name if t.subscription_tier else "Free",
                "tierId": t.subscription_tier_id,
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

        tenant = Tenant.objects.select_related("subscription_tier").get(pk=tenant_id)
        limits = getattr(tenant, "limits", None)
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
            "subscription": {
                "tierName": (
                    tenant.subscription_tier.name
                    if tenant.subscription_tier
                    else "Free"
                ),
                "tierId": tenant.subscription_tier_id,
            },
            "limits": {
                "maxStudents": limits.max_students if limits else 100,
                "maxPrograms": limits.max_programs if limits else 10,
                "maxStorageMb": limits.max_storage_mb if limits else 5000,
                "currentStudents": limits.current_students if limits else 0,
                "currentPrograms": limits.current_programs if limits else 0,
                "currentStorageMb": limits.current_storage_mb if limits else 0,
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
        tier_id: Optional[int] = None,
    ) -> Tenant:
        """Create a new tenant with admin user."""
        from apps.core.models import User
        import secrets

        # Validation
        if Tenant.objects.filter(subdomain=subdomain).exists():
            raise ValidationError({"subdomain": "Subdomain already exists"})
        if User.objects.filter(email=admin_email).exists():
            raise ValidationError({"adminEmail": "Email already exists"})

        # Get tier
        tier = None
        if tier_id:
            tier = SubscriptionTier.objects.filter(pk=tier_id).first()

        # Create tenant
        tenant = Tenant.objects.create(
            name=name,
            subdomain=subdomain,
            admin_email=admin_email,
            subscription_tier=tier,
            is_active=True,
            activated_at=timezone.now(),
        )

        # Create limits
        TenantLimits.objects.create(
            tenant=tenant,
            max_students=tier.max_students if tier else 100,
            max_programs=tier.max_programs if tier else 10,
            max_storage_mb=tier.max_storage_mb if tier else 5000,
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
        tier_id: Optional[int] = None,
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

        # Update tier if changed
        if tier_id and tier_id != tenant.subscription_tier_id:
            tier = SubscriptionTier.objects.filter(pk=tier_id).first()
            tenant.subscription_tier = tier

            # Update limits
            if hasattr(tenant, "limits") and tier:
                tenant.limits.max_students = tier.max_students
                tenant.limits.max_programs = tier.max_programs
                tenant.limits.max_storage_mb = tier.max_storage_mb
                tenant.limits.save()

        tenant.save()
        return tenant

    @staticmethod
    def toggle_tenant_status(tenant_id: int) -> Tenant:
        """Suspend or reactivate a tenant."""
        tenant = Tenant.objects.get(pk=tenant_id)
        tenant.is_active = not tenant.is_active
        tenant.save()
        return tenant


class SubscriptionTierService:
    """Service for subscription tier management."""

    @staticmethod
    def list_tiers() -> list:
        """List all subscription tiers with tenant counts."""
        tiers = SubscriptionTier.objects.annotate(
            tenant_count=Count("tenants")
        ).order_by("price_monthly")

        return [
            {
                "id": t.id,
                "name": t.name,
                "code": t.code,
                "priceMonthly": float(t.price_monthly),
                "maxStudents": t.max_students,
                "maxPrograms": t.max_programs,
                "maxStorageMb": t.max_storage_mb,
                "features": t.features or {},
                "isActive": t.is_active,
                "tenantCount": t.tenant_count,
            }
            for t in tiers
        ]

    @staticmethod
    def create_tier(
        name: str,
        code: str,
        price_monthly: float = 0,
        max_students: int = 100,
        max_programs: int = 10,
        max_storage_mb: int = 5000,
        features: Optional[dict] = None,
        is_active: bool = True,
    ) -> SubscriptionTier:
        """Create a new subscription tier."""
        if SubscriptionTier.objects.filter(code=code).exists():
            raise ValidationError({"code": "Code already exists"})

        return SubscriptionTier.objects.create(
            name=name,
            code=code,
            price_monthly=price_monthly,
            max_students=max_students,
            max_programs=max_programs,
            max_storage_mb=max_storage_mb,
            features=features or {},
            is_active=is_active,
        )

    @staticmethod
    def update_tier(
        tier_id: int,
        name: str,
        code: str,
        price_monthly: Optional[float] = None,
        max_students: Optional[int] = None,
        max_programs: Optional[int] = None,
        max_storage_mb: Optional[int] = None,
        features: Optional[dict] = None,
        is_active: Optional[bool] = None,
    ) -> SubscriptionTier:
        """Update a subscription tier."""
        tier = SubscriptionTier.objects.get(pk=tier_id)

        if SubscriptionTier.objects.filter(code=code).exclude(pk=tier_id).exists():
            raise ValidationError({"code": "Code already exists"})

        tier.name = name
        tier.code = code
        if price_monthly is not None:
            tier.price_monthly = price_monthly
        if max_students is not None:
            tier.max_students = max_students
        if max_programs is not None:
            tier.max_programs = max_programs
        if max_storage_mb is not None:
            tier.max_storage_mb = max_storage_mb
        if features is not None:
            tier.features = features
        if is_active is not None:
            tier.is_active = is_active

        tier.save()
        return tier


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
