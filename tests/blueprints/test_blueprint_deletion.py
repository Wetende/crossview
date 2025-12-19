"""
Property test for Blueprint Deletion Protection.

**Feature: blueprint-engine, Property 3: Blueprint Deletion Protection**
**Validates: Requirements 1.5**

Tests that blueprints with associated programs cannot be deleted.
"""
import pytest
from hypothesis import given, strategies as st, settings as hyp_settings

from apps.blueprints.models import AcademicBlueprint
from apps.blueprints.exceptions import BlueprintInUseException
from apps.core.models import Program


@pytest.mark.django_db(transaction=True)
class TestBlueprintDeletionProtection:
    """
    Property 3: Blueprint Deletion Protection
    
    *For any* blueprint with associated programs, deletion should be prevented
    and raise BlueprintInUseException.
    """

    @given(
        num_programs=st.integers(min_value=1, max_value=5)
    )
    @hyp_settings(max_examples=20, deadline=None)
    def test_blueprint_with_programs_cannot_be_deleted(self, num_programs):
        """
        **Feature: blueprint-engine, Property 3: Blueprint Deletion Protection**
        **Validates: Requirements 1.5**
        
        For any blueprint with N programs (N >= 1), deletion should raise exception.
        """
        # Create blueprint
        blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Year", "Unit"],
            grading_logic={"type": "weighted", "components": [{"name": "test", "weight": 100}]}
        )
        
        # Create associated programs
        programs = []
        for i in range(num_programs):
            program = Program.objects.create(
                name=f"Program {i}",
                blueprint=blueprint
            )
            programs.append(program)
        
        # Attempt to delete should raise exception
        with pytest.raises(BlueprintInUseException):
            blueprint.delete()
        
        # Blueprint should still exist
        assert AcademicBlueprint.objects.filter(pk=blueprint.pk).exists()
        
        # Cleanup
        for program in programs:
            program.delete()
        blueprint.delete()

    def test_blueprint_without_programs_can_be_deleted(self):
        """Blueprints without programs should be deletable."""
        blueprint = AcademicBlueprint.objects.create(
            name="Deletable Blueprint",
            hierarchy_structure=["Year"],
            grading_logic={"type": "pass_fail"}
        )
        
        pk = blueprint.pk
        blueprint.delete()
        
        assert not AcademicBlueprint.objects.filter(pk=pk).exists()

    def test_blueprint_deletable_after_programs_removed(self):
        """Blueprint should be deletable after all programs are removed."""
        blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint",
            hierarchy_structure=["Year"],
            grading_logic={"type": "pass_fail"}
        )
        
        program = Program.objects.create(
            name="Test Program",
            blueprint=blueprint
        )
        
        # Can't delete with program
        with pytest.raises(BlueprintInUseException):
            blueprint.delete()
        
        # Remove program association
        program.blueprint = None
        program.save()
        
        # Now can delete
        pk = blueprint.pk
        blueprint.delete()
        assert not AcademicBlueprint.objects.filter(pk=pk).exists()
        
        # Cleanup
        program.delete()
