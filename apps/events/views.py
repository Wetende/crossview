"""
Events views - Public event pages using Inertia.
"""
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect
from inertia import render

from .models import Event, EventRegistration


def index(request):
    """
    Renders the events listing page with published events.
    """
    events_qs = Event.objects.filter(is_published=True).order_by('-start_datetime')
    
    events_data = []
    for event in events_qs:
        events_data.append({
            "id": event.id,
            "title": event.title,
            "slug": event.slug,
            "start_date": event.start_datetime.isoformat(),
            "end_date": event.end_datetime.isoformat(),
            "location": event.location,
            "image": event.image.url if event.image else "/static/images/course-placeholder.jpg",
            "description": event.description[:200] + "..." if len(event.description) > 200 else event.description,
        })

    return render(request, "Public/Events", {
        "events": events_data
    })


def detail(request, slug):
    """
    Renders the single event detail page.
    """
    event = get_object_or_404(Event, slug=slug, is_published=True)
    
    # Check if user is already registered
    is_registered = False
    if request.user.is_authenticated:
        is_registered = EventRegistration.objects.filter(
            event=event, user=request.user
        ).exists()
    
    event_data = {
        "id": event.id,
        "title": event.title,
        "slug": event.slug,
        "start_date": event.start_datetime.isoformat(),
        "end_date": event.end_datetime.isoformat(),
        "location": event.location,
        "image": event.image.url if event.image else "/static/images/course-placeholder.jpg",
        "description": event.description,
        "tab_content": event.tab_content or {},
        "what_you_learn": event.what_you_learn or [],
        "external_url": event.external_url,
    }

    return render(request, "Public/EventDetail", {
        "event": event_data,
        "isRegistered": is_registered,
    })


@login_required
def join(request, slug):
    """
    Handle event registration (JOIN button).
    """
    event = get_object_or_404(Event, slug=slug, is_published=True)
    
    # Check if external URL is set - redirect there instead
    if event.external_url:
        return redirect(event.external_url)
    
    # Check if already registered
    registration, created = EventRegistration.objects.get_or_create(
        event=event,
        user=request.user
    )
    
    if created:
        messages.success(request, f"You have successfully registered for '{event.title}'!")
    else:
        messages.info(request, f"You are already registered for '{event.title}'.")
    
    return redirect("events.detail", slug=slug)
