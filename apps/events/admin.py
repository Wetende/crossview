from django.contrib import admin
from .models import Event, EventRegistration


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "start_datetime",
        "end_datetime",
        "location",
        "is_published",
        "created_at",
    ]
    list_filter = ["is_published", "start_datetime"]
    search_fields = ["title", "location", "description"]
    prepopulated_fields = {"slug": ("title",)}
    ordering = ["-start_datetime"]
    date_hierarchy = "start_datetime"
    
    fieldsets = (
        (None, {
            'fields': ('title', 'slug', 'description')
        }),
        ('Schedule', {
            'fields': ('start_datetime', 'end_datetime', 'location')
        }),
        ('Media', {
            'fields': ('image',)
        }),
        ('Content', {
            'fields': ('tab_content', 'what_you_learn'),
            'classes': ('collapse',)
        }),
        ('Publishing', {
            'fields': ('is_published', 'external_url')
        }),
    )


@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ["event", "user", "registered_at"]
    list_filter = ["event", "registered_at"]
    search_fields = ["user__email", "event__title"]
    raw_id_fields = ["user", "event"]
    ordering = ["-registered_at"]
