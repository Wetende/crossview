"""
Property tests for billing and limits.
**Property 10: Limit Assignment**
**Property 11: Limit Enforcement**
**Property 12: Usage Statistics**
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**
"""
import pytest
from unittest.mock import patch

from apps.tenants.models import Tenant, TenantLimits, SubscriptionTier
from apps.tenants.services import TenantService, BillingService, LimitExceededError


@pytest.mark.django_db
class TestLimitAssignment:
    """
    Property tests for limit assignment.
    Feature: multi-tenancy, Property 10: Limit Assignment
    """
    
    def test_tenant_created_with_default_limits(self):
        """
        Property: For any tenant creation, limits SHALL be assigned.
        **Validates: Requirements 6.1**
        """
        service = TenantService()
        
        with patch.object(service, 'send_welcome_email'):
            tenant = service.create(
                name="Limits Test",
                subdomain="limitstest",
                admin_email="admin@limitstest.com",
            )
        
        assert hasattr(tenant, 'limits')
        limits = tenant.limits
        assert limits.max_students > 0
        assert limits.max_storage_mb > 0
        assert limits.max_programs > 0
    
    def test_tenant_created_with_tier_limits(self):
        """
        Property: For any tenant with subscription tier, limits SHALL match tier.
        **Validates: Requirements 6.1**
        """
        tier = SubscriptionTier.objects.create(
            name="Premium",
            code="premium",
            max_students=500,
            max_storage_mb=10000,
            max_programs=50,
        )
        
        service = TenantService()
        
        with patch.object(service, 'send_welcome_email'):
            tenant = service.create(
                name="Premium Tenant",
                subdomain="premiumtenant",
                admin_email="admin@premium.com",
                subscription_tier=tier,
            )
        
        limits = tenant.limits
        assert limits.max_students == 500
        assert limits.max_storage_mb == 10000
        assert limits.max_programs == 50
    
    def test_assign_tier_updates_limits(self):
        """
        Property: Assigning a tier SHALL update tenant limits.
        **Validates: Requirements 6.1**
        """
        service = TenantService()
        billing = BillingService()
        
        with patch.object(service, 'send_welcome_email'):
            tenant = service.create(
                name="Upgrade Test",
                subdomain="upgradetest",
                admin_email="admin@upgrade.com",
            )
        
        # Create and assign new tier
        tier = SubscriptionTier.objects.create(
            name="Enterprise",
            code="enterprise",
            max_students=1000,
            max_storage_mb=50000,
            max_programs=100,
        )
        
        billing.assign_tier(tenant, tier)
        
        tenant.refresh_from_db()
        limits = tenant.limits
        assert limits.max_students == 1000
        assert limits.max_storage_mb == 50000
        assert limits.max_programs == 100


@pytest.mark.django_db
class TestLimitEnforcement:
    """
    Property tests for limit enforcement.
    Feature: multi-tenancy, Property 11: Limit Enforcement
    """
    
    def _create_tenant_with_limits(self, subdomain: str, max_students: int = 10) -> Tenant:
        """Helper to create a tenant with specific limits."""
        tenant = Tenant.objects.create(
            name=f"Test Tenant {subdomain}",
            subdomain=subdomain,
            admin_email=f"admin@{subdomain}.test.com",
        )
        TenantLimits.objects.create(
            tenant=tenant,
            max_students=max_students,
            max_storage_mb=100,
            max_programs=5,
        )
        return tenant
    
    def test_check_limit_returns_true_when_within_limits(self):
        """
        Property: check_limit SHALL return True when within limits.
        **Validates: Requirements 6.2**
        """
        tenant = self._create_tenant_with_limits("enforce1", max_students=10)
        billing = BillingService()
        
        assert billing.check_limit(tenant, 'students') is True
    
    def test_check_limit_returns_false_when_exceeded(self):
        """
        Property: check_limit SHALL return False when limit exceeded.
        **Validates: Requirements 6.2**
        """
        tenant = self._create_tenant_with_limits("enforce2", max_students=5)
        tenant.limits.current_students = 5
        tenant.limits.save()
        
        billing = BillingService()
        
        assert billing.check_limit(tenant, 'students') is False
    
    def test_enforce_limit_raises_when_exceeded(self):
        """
        Property: enforce_limit SHALL raise error when limit exceeded.
        **Validates: Requirements 6.2, 6.3**
        """
        tenant = self._create_tenant_with_limits("enforce3", max_students=5)
        tenant.limits.current_students = 5
        tenant.limits.save()
        
        billing = BillingService()
        
        with pytest.raises(LimitExceededError) as exc_info:
            billing.enforce_limit(tenant, 'students')
        
        assert exc_info.value.resource == 'students'
        assert exc_info.value.current == 5
        assert exc_info.value.maximum == 5
    
    def test_enforce_limit_passes_when_within_limits(self):
        """
        Property: enforce_limit SHALL pass when within limits.
        **Validates: Requirements 6.2**
        """
        tenant = self._create_tenant_with_limits("enforce4", max_students=10)
        billing = BillingService()
        
        # Should not raise
        billing.enforce_limit(tenant, 'students')
    
    def test_storage_limit_enforcement(self):
        """
        Property: Storage limit SHALL be enforced.
        **Validates: Requirements 6.3**
        """
        tenant = self._create_tenant_with_limits("enforce5")
        tenant.limits.current_storage_mb = 100
        tenant.limits.save()
        
        billing = BillingService()
        
        with pytest.raises(LimitExceededError) as exc_info:
            billing.enforce_limit(tenant, 'storage')
        
        assert exc_info.value.resource == 'storage'
    
    def test_programs_limit_enforcement(self):
        """
        Property: Programs limit SHALL be enforced.
        **Validates: Requirements 6.2**
        """
        tenant = self._create_tenant_with_limits("enforce6")
        tenant.limits.current_programs = 5
        tenant.limits.save()
        
        billing = BillingService()
        
        with pytest.raises(LimitExceededError) as exc_info:
            billing.enforce_limit(tenant, 'programs')
        
        assert exc_info.value.resource == 'programs'
    
    def test_increment_usage(self):
        """
        Property: increment_usage SHALL increase current usage.
        **Validates: Requirements 6.2**
        """
        tenant = self._create_tenant_with_limits("enforce7")
        billing = BillingService()
        
        initial = tenant.limits.current_students
        billing.increment_usage(tenant, 'students', 3)
        
        tenant.limits.refresh_from_db()
        assert tenant.limits.current_students == initial + 3
    
    def test_decrement_usage(self):
        """
        Property: decrement_usage SHALL decrease current usage.
        **Validates: Requirements 6.2**
        """
        tenant = self._create_tenant_with_limits("enforce8")
        tenant.limits.current_students = 5
        tenant.limits.save()
        
        billing = BillingService()
        billing.decrement_usage(tenant, 'students', 2)
        
        tenant.limits.refresh_from_db()
        assert tenant.limits.current_students == 3
    
    def test_decrement_usage_does_not_go_negative(self):
        """
        Property: decrement_usage SHALL NOT result in negative values.
        **Validates: Requirements 6.2**
        """
        tenant = self._create_tenant_with_limits("enforce9")
        tenant.limits.current_students = 2
        tenant.limits.save()
        
        billing = BillingService()
        billing.decrement_usage(tenant, 'students', 10)
        
        tenant.limits.refresh_from_db()
        assert tenant.limits.current_students == 0


@pytest.mark.django_db
class TestUsageStatistics:
    """
    Property tests for usage statistics.
    Feature: multi-tenancy, Property 12: Usage Statistics
    """
    
    def _create_tenant_with_usage(self, subdomain: str) -> Tenant:
        """Helper to create a tenant with usage data."""
        tenant = Tenant.objects.create(
            name=f"Test Tenant {subdomain}",
            subdomain=subdomain,
            admin_email=f"admin@{subdomain}.test.com",
        )
        TenantLimits.objects.create(
            tenant=tenant,
            max_students=100,
            max_storage_mb=5000,
            max_programs=10,
            current_students=25,
            current_storage_mb=1250,
            current_programs=3,
        )
        return tenant
    
    def test_get_usage_stats_returns_all_metrics(self):
        """
        Property: get_usage_stats SHALL return all usage metrics.
        **Validates: Requirements 6.4**
        """
        tenant = self._create_tenant_with_usage("stats1")
        billing = BillingService()
        
        stats = billing.get_usage_stats(tenant)
        
        assert stats.current_students == 25
        assert stats.max_students == 100
        assert stats.current_storage_mb == 1250
        assert stats.max_storage_mb == 5000
        assert stats.current_programs == 3
        assert stats.max_programs == 10
    
    def test_usage_stats_percentages(self):
        """
        Property: Usage stats SHALL include percentage calculations.
        **Validates: Requirements 6.4**
        """
        tenant = self._create_tenant_with_usage("stats2")
        billing = BillingService()
        
        stats = billing.get_usage_stats(tenant)
        
        assert stats.students_percentage == 25.0
        assert stats.storage_percentage == 25.0
        assert stats.programs_percentage == 30.0
    
    def test_usage_stats_reflect_current_state(self):
        """
        Property: Usage stats SHALL reflect current state after changes.
        **Validates: Requirements 6.4**
        """
        tenant = self._create_tenant_with_usage("stats3")
        billing = BillingService()
        
        # Increment usage
        billing.increment_usage(tenant, 'students', 10)
        
        stats = billing.get_usage_stats(tenant)
        assert stats.current_students == 35
