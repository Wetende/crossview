"""
Property tests for preset blueprints.
**Property 2: Preset Blueprint Copying**
**Property 9: Preset Copy Isolation**
**Validates: Requirements 1.3, 5.2, 5.3, 5.4**
"""
import pytest

from apps.tenants.models import Tenant, PresetBlueprint
from apps.tenants.services import PresetService
from apps.blueprints.models import AcademicBlueprint


@pytest.mark.django_db
class TestPresetBlueprintCopying:
    """
    Property tests for preset blueprint copying.
    Feature: multi-tenancy, Property 2: Preset Blueprint Copying
    """
    
    def _create_tenant(self, subdomain: str) -> Tenant:
        """Helper to create a tenant."""
        return Tenant.objects.create(
            name=f"Test Tenant {subdomain}",
            subdomain=subdomain,
            admin_email=f"admin@{subdomain}.test.com",
        )
    
    def _create_preset(self, code: str) -> PresetBlueprint:
        """Helper to create a preset blueprint."""
        return PresetBlueprint.objects.create(
            name=f"Preset {code}",
            code=code,
            description=f"Test preset {code}",
            regulatory_body="Test Body",
            hierarchy_labels=["Level1", "Level2", "Level3"],
            grading_config={"type": "weighted", "components": [], "pass_mark": 50},
            structure_rules={"rule1": "value1"},
        )
    
    def test_preset_copied_to_tenant(self):
        """
        Property: For any preset selection, an AcademicBlueprint SHALL be created for the tenant.
        **Validates: Requirements 1.3, 5.2**
        """
        tenant = self._create_tenant("presetcopy")
        preset = self._create_preset("test_preset")
        
        service = PresetService()
        blueprint = service.copy_to_tenant(preset.code, tenant)
        
        assert blueprint.id is not None
        assert blueprint.tenant_id == tenant.id
        assert AcademicBlueprint.objects.filter(tenant=tenant).exists()
    
    def test_copied_blueprint_matches_preset_config(self):
        """
        Property: Copied blueprint SHALL have configuration matching the preset.
        **Validates: Requirements 5.2**
        """
        tenant = self._create_tenant("configmatch")
        preset = self._create_preset("config_preset")
        
        service = PresetService()
        blueprint = service.copy_to_tenant(preset.code, tenant)
        
        assert blueprint.name == preset.name
        assert blueprint.hierarchy_structure == preset.hierarchy_labels
        assert blueprint.grading_logic == preset.grading_config
    
    def test_multiple_tenants_get_separate_copies(self):
        """
        Property: Each tenant SHALL get their own copy of the preset.
        **Validates: Requirements 5.2**
        """
        tenant1 = self._create_tenant("multicopy1")
        tenant2 = self._create_tenant("multicopy2")
        preset = self._create_preset("multi_preset")
        
        service = PresetService()
        bp1 = service.copy_to_tenant(preset.code, tenant1)
        bp2 = service.copy_to_tenant(preset.code, tenant2)
        
        assert bp1.id != bp2.id
        assert bp1.tenant_id == tenant1.id
        assert bp2.tenant_id == tenant2.id


@pytest.mark.django_db
class TestPresetCopyIsolation:
    """
    Property tests for preset copy isolation.
    Feature: multi-tenancy, Property 9: Preset Copy Isolation
    """
    
    def _create_tenant(self, subdomain: str) -> Tenant:
        """Helper to create a tenant."""
        return Tenant.objects.create(
            name=f"Test Tenant {subdomain}",
            subdomain=subdomain,
            admin_email=f"admin@{subdomain}.test.com",
        )
    
    def _create_preset(self, code: str) -> PresetBlueprint:
        """Helper to create a preset blueprint."""
        return PresetBlueprint.objects.create(
            name=f"Preset {code}",
            code=code,
            hierarchy_labels=["Original1", "Original2"],
            grading_config={"type": "weighted", "components": [], "pass_mark": 50},
        )
    
    def test_preset_update_does_not_affect_tenant_copy(self):
        """
        Property: For any preset update, existing tenant copies SHALL remain unchanged.
        **Validates: Requirements 5.3**
        """
        tenant = self._create_tenant("isolation1")
        preset = self._create_preset("isolation_preset")
        
        service = PresetService()
        blueprint = service.copy_to_tenant(preset.code, tenant)
        
        original_hierarchy = blueprint.hierarchy_structure.copy()
        
        # Update the preset
        preset.hierarchy_labels = ["Updated1", "Updated2", "Updated3"]
        preset.save()
        
        # Tenant's blueprint should be unchanged
        blueprint.refresh_from_db()
        assert blueprint.hierarchy_structure == original_hierarchy
        assert blueprint.hierarchy_structure != preset.hierarchy_labels
    
    def test_tenant_modification_does_not_affect_preset(self):
        """
        Property: Tenant blueprint modifications SHALL NOT affect the preset.
        **Validates: Requirements 5.4**
        """
        tenant = self._create_tenant("isolation2")
        preset = self._create_preset("isolation_preset2")
        
        original_preset_hierarchy = preset.hierarchy_labels.copy()
        
        service = PresetService()
        blueprint = service.copy_to_tenant(preset.code, tenant)
        
        # Modify tenant's blueprint
        blueprint.hierarchy_structure = ["Modified1", "Modified2"]
        blueprint.save()
        
        # Preset should be unchanged
        preset.refresh_from_db()
        assert preset.hierarchy_labels == original_preset_hierarchy
    
    def test_tenant_modification_does_not_affect_other_tenants(self):
        """
        Property: One tenant's modifications SHALL NOT affect other tenants' copies.
        **Validates: Requirements 5.4**
        """
        tenant1 = self._create_tenant("isolation3")
        tenant2 = self._create_tenant("isolation4")
        preset = self._create_preset("shared_preset")
        
        service = PresetService()
        bp1 = service.copy_to_tenant(preset.code, tenant1)
        bp2 = service.copy_to_tenant(preset.code, tenant2)
        
        original_bp2_hierarchy = bp2.hierarchy_structure.copy()
        
        # Modify tenant1's blueprint
        bp1.hierarchy_structure = ["Tenant1Modified"]
        bp1.save()
        
        # Tenant2's blueprint should be unchanged
        bp2.refresh_from_db()
        assert bp2.hierarchy_structure == original_bp2_hierarchy
