"""
Events models - Event management for the platform.
"""
from django.db import models
from django.utils.text import slugify
from apps.core.models import TimeStampedModel


class Event(TimeStampedModel):
    """
    Represents an event (workshop, webinar, conference, etc.).
    Displayed on the public events page with full details.
    """
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField(blank=True, default='', help_text="HTML content for event description")
    
    # Date/Time
    start_datetime = models.DateTimeField(help_text="Event start date and time")
    end_datetime = models.DateTimeField(help_text="Event end date and time")
    
    # Location
    location = models.CharField(max_length=255, help_text="e.g., 'Chicago, WY82601, US'")
    
    # Media
    image = models.ImageField(upload_to='events/', blank=True, null=True)
    
    # Rich Content (for tabs and bullet points)
    tab_content = models.JSONField(
        default=dict,
        blank=True,
        help_text='{"location": "...", "event_target": "..."}'
    )
    what_you_learn = models.JSONField(
        default=list,
        blank=True,
        help_text="List of learning outcomes/features"
    )
    
    # Publishing
    is_published = models.BooleanField(default=False)
    
    # Optional external registration link
    external_url = models.URLField(blank=True, null=True, help_text="External JOIN/registration URL")

    class Meta:
        db_table = 'events'
        ordering = ['-start_datetime']
        indexes = [
            models.Index(fields=['is_published', 'start_datetime']),
            models.Index(fields=['slug']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
            # Ensure uniqueness
            original_slug = self.slug
            counter = 1
            while Event.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1
        super().save(*args, **kwargs)


class EventRegistration(TimeStampedModel):
    """
    Tracks user registrations for events.
    """
    event = models.ForeignKey(
        'Event',
        on_delete=models.CASCADE,
        related_name='registrations'
    )
    user = models.ForeignKey(
        'core.User',
        on_delete=models.CASCADE,
        related_name='event_registrations'
    )
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'event_registrations'
        unique_together = [['event', 'user']]
        ordering = ['-registered_at']

    def __str__(self):
        return f"{self.user} registered for {self.event}"
