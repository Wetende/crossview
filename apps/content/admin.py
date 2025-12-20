from django.contrib import admin
from .models import ContentVersion, ParsedImage


@admin.register(ContentVersion)
class ContentVersionAdmin(admin.ModelAdmin):
    list_display = [
        "node",
        "version",
        "source_file_name",
        "page_count",
        "is_published",
        "parsed_at",
    ]
    list_filter = ["is_published", "is_manually_edited"]
    search_fields = ["node__title", "source_file_name"]
    ordering = ["-created_at"]
    date_hierarchy = "created_at"
    raw_id_fields = ["node"]


@admin.register(ParsedImage)
class ParsedImageAdmin(admin.ModelAdmin):
    list_display = ["content_version", "page_number", "width", "height", "file_size"]
    search_fields = ["content_version__node__title"]
    ordering = ["content_version", "page_number"]
    raw_id_fields = ["content_version"]
