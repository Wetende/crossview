from django.contrib import admin
from .models import CurriculumNode


@admin.register(CurriculumNode)
class CurriculumNodeAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "node_type",
        "program",
        "parent",
        "position",
        "is_published",
    ]
    list_filter = ["node_type", "is_published", "program"]
    search_fields = ["title", "code", "description"]
    ordering = ["program", "position"]
    raw_id_fields = ["parent", "program"]
