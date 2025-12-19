"""
Property tests for query scoping.
**Property 3: Query Scoping**
**Property 4: Cross-Tenant Access Denial**
**Validates: Requirements 2.1, 2.2**
"""
import pytest

from apps.tenants.models import Tenant
from apps.tenants.context import TenantContext
from apps.blueprints.models import AcademicBlueprint


@pytest.mark.django_db
class TestQueryScoping:
    """
    Property tests for automatic query scoping.
    Feature: multi-tenancy, Property 3: Query Scoping
    """
    
    def setup_method(self):
        """Set up test fixtures."""
        TenantContext.clear()
    
    def teardown_method(self):
        """Clean up after tests."""
        TenantContext.clear()
    
    def _create_tenant(self, subdomain: str) -> Tenant:
        """Helper to create a tenant."""
        return Tenant.objects.create(
            name=f"Test Tenant {subdomain}",
            subdomain=subdomain,
            admin_email=f"admin@{subdomain}.test.com",
        )
    
    def test_query_scoped_to_current_tenant(self):
        """
        Property: For any query on tenant-scoped model, WHERE tenant_id = current_tenant_id SHALL be applied.
        **Validates: Requirements 2.1**
        """
        tenant1 = self._create_tenant("scope1")
        tenant2 = self._create_tenant("scope2")
        
        # Create blueprints for each tenant
        bp1 = AcademicBlueprint.objects.create(
            tenant=tenant1,
            name="Blueprint 1",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []},
        )
        bp2 = AcademicBlueprint.objects.create(
            tenant=tenant2,
            name="Blueprint 2",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []},
        )
        
        # Set tenant1 context
        TenantContext.set(tenant1)
        
        # Query should only return tenant1's blueprints
        blueprints = list(AcademicBlueprint.objects.all())
        assert len(blueprints) == 1
        assert blueprints[0].id == bp1.id
    
    def test_different_tenant_context_returns_different_data(self):
        """
        Property: Changing tenant context SHALL change query results.
        **Validates: Requirements 2.1**
        """
        tenant1 = self._create_tenant("context1")
        tenant2 = self._create_tenant("context2")
        
        AcademicBlueprint.objects.create(
            tenant=tenant1,
            name="Tenant1 Blueprint",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []},
        )
        AcademicBlueprint.objects.create(
            tenant=tenant2,
            name="Tenant2 Blueprint",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []},
        )
        
        # Query as tenant1
        TenantContext.set(tenant1)
        t1_blueprints = list(AcademicBlueprint.objects.all())
        assert len(t1_blueprints) == 1
        assert t1_blueprints[0].name == "Tenant1 Blueprint"
        
        # Query as tenant2
        TenantContext.set(tenant2)
        t2_blueprints = list(AcademicBlueprint.objects.all())
        assert len(t2_blueprints) == 1
        assert t2_blueprints[0].name == "Tenant2 Blueprint"
    
    def test_all_objects_bypasses_tenant_filter(self):
        """
        Property: all_objects manager SHALL bypass tenant filtering.
        **Validates: Requirements 2.1**
        """
        tenant1 = self._create_tenant("bypass1")
        tenant2 = self._create_tenant("bypass2")
        
        AcademicBlueprint.objects.create(
            tenant=tenant1,
            name="BP1",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []},
        )
        AcademicBlueprint.objects.create(
            tenant=tenant2,
            name="BP2",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []},
        )
        
        # Set tenant1 context
        TenantContext.set(tenant1)
        
        # all_objects should return all blueprints
        all_blueprints = list(AcademicBlueprint.all_objects.all())
        assert len(all_blueprints) >= 2
    
    def test_no_context_returns_all_data(self):
        """
        Property: Without tenant context, queries SHALL return all data.
        **Validates: Requirements 2.1**
        """
        tenant1 = self._create_tenant("nocontext1")
        tenant2 = self._create_tenant("nocontext2")
        
        AcademicBlueprint.objects.create(
            tenant=tenant1,
            name="NC BP1",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []},
        )
        AcademicBlueprint.objects.create(
            tenant=tenant2,
            name="NC BP2",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []},
        )
        
        # No context set
        TenantContext.clear()
        
        # Should return all blueprints
        blueprints = list(AcademicBlueprint.objects.filter(name__startswith="NC"))
        assert len(blueprints) == 2


@pytest.mark.django_db
class TestCrossTenantAccessDenial:
    """
    Property tests for cross-tenant access denial.
    Feature: multi-tenancy, Property 4: Cross-Tenant Access Denial
    """
    
    def setup_method(self):
        """Set up test fixtures."""
        TenantContext.clear()
    
    def teardown_method(self):
        """Clean up after tests."""
        TenantContext.clear()
    
    def _create_tenant(self, subdomain: str) -> Tenant:
        """Helper to create a tenant."""
        return Tenant.objects.create(
            name=f"Test Tenant {subdomain}",
            subdomain=subdomain,
            admin_email=f"admin@{subdomain}.test.com",
        )
    
    def test_cannot_access_other_tenant_data_via_objects(self):
        """
        Property: Tenant A SHALL NOT access Tenant B's data via objects manager.
        **Validates: Requirements 2.2**
        """
        tenant1 = self._create_tenant("access1")
        tenant2 = self._create_tenant("access2")
        
        # Create blueprint for tenant2
        bp2 = AcademicBlueprint.objects.create(
            tenant=tenant2,
            name="Tenant2 Only",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []},
        )
        
        # Set tenant1 context
        TenantContext.set(tenant1)
        
        # Try to access tenant2's blueprint
        result = AcademicBlueprint.objects.filter(id=bp2.id).first()
        assert result is None
    
    def test_cannot_get_other_tenant_data_by_id(self):
        """
        Property: get() for other tenant's data SHALL raise DoesNotExist.
        **Validates: Requirements 2.2**
        """
        tenant1 = self._create_tenant("gettest1")
        tenant2 = self._create_tenant("gettest2")
        
        bp2 = AcademicBlueprint.objects.create(
            tenant=tenant2,
            name="Tenant2 Blueprint",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []},
        )
        
        TenantContext.set(tenant1)
        
        with pytest.raises(AcademicBlueprint.DoesNotExist):
            AcademicBlueprint.objects.get(id=bp2.id)
    
    def test_filter_excludes_other_tenant_data(self):
        """
        Property: filter() SHALL exclude other tenant's data.
        **Validates: Requirements 2.2**
        """
        tenant1 = self._create_tenant("filter1")
        tenant2 = self._create_tenant("filter2")
        
        AcademicBlueprint.objects.create(
            tenant=tenant1,
            name="Shared Name",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []},
        )
        AcademicBlueprint.objects.create(
            tenant=tenant2,
            name="Shared Name",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []},
        )
        
        TenantContext.set(tenant1)
        
        # Filter by name should only return tenant1's blueprint
        results = list(AcademicBlueprint.objects.filter(name="Shared Name"))
        assert len(results) == 1
        assert results[0].tenant_id == tenant1.id
