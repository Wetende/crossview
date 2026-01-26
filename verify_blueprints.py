from apps.platform.models import PresetBlueprint
from apps.blueprints.models import AcademicBlueprint

print("--- Preset Blueprints ---")
for p in PresetBlueprint.objects.all():
    print(f"Code: {p.code}, Name: {p.name}")

print("\n--- Active Academic Blueprints ---")
for b in AcademicBlueprint.objects.all():
    print(f"ID: {b.id}, Name: {b.name}, Structure: {b.hierarchy_structure}")
