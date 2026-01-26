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
    Supports filtering by month (YYYY-MM).
    """
    events_qs = Event.objects.filter(is_published=True).order_by('-start_datetime')
    
    # Filter by month if provided
    current_month_label = None
    month_param = request.GET.get('month')
    if month_param:
        try:
            year, month = map(int, month_param.split('-'))
            events_qs = events_qs.filter(start_datetime__year=year, start_datetime__month=month)
            from datetime import date
            current_month_label = date(year, month, 1).strftime("%B %Y")
        except (ValueError, TypeError):
            pass

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
        "events": events_data,
        "currentMonth": current_month_label,
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
    
    # Calculate Archives (Months with events)
    from django.db.models.functions import TruncMonth
    from django.db.models import Count
    
    archive_qs = (
        Event.objects.filter(is_published=True)
        .annotate(month=TruncMonth('start_datetime'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('-month')
    )
    
    archives = []
    for entry in archive_qs:
        if entry['month']:
            archives.append({
                "label": entry['month'].strftime("%B %Y"),
                "value": entry['month'].strftime("%Y-%m"),
                "count": entry['count']
            })

    # Global "About Us" content
    about_text = (
        "Crossview is a comprehensive Learning Management System (LMS) designed for "
        "online education. Empowering students and instructors with "
        "modern tools for seamless learning experiences."
    )
    
    event_data = {
        "id": event.id,
        "title": event.title,
        "slug": event.slug,
        "start_date": event.start_datetime.isoformat(),
        "end_date": event.end_datetime.isoformat(),
        "location": event.location,
        "map_embed_code": event.map_embed_code,
        "image": event.image.url if event.image else "/static/images/course-placeholder.jpg",
        "description": event.description,
        "tab_content": event.tab_content or {},
        "what_you_learn": event.what_you_learn or [],
        "external_url": event.external_url,
    }

    return render(request, "Public/EventDetail", {
        "event": event_data,
        "isRegistered": is_registered,
        "archives": archives,
        "about": about_text,
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
