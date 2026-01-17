"""
Notification views - Inertia-based views for notification management.
"""

from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from inertia import render

from .models import Notification
from .services import NotificationService


@login_required
def notifications_index(request):
    """
    Full notifications page - displays all notifications with pagination.
    This is the 'View All' page accessible from the notification panel.
    """
    page = int(request.GET.get('page', 1))
    per_page = 20
    
    user = request.user
    queryset = Notification.objects.filter(recipient=user).order_by('-created_at')
    
    total = queryset.count()
    offset = (page - 1) * per_page
    notifications = queryset[offset:offset + per_page]
    
    # Serialize notifications
    notifications_data = [
        {
            'id': n.id,
            'type': n.notification_type,
            'title': n.title,
            'message': n.message,
            'priority': n.priority,
            'is_read': n.is_read,
            'action_url': n.action_url,
            'created_at': n.created_at.isoformat(),
            'read_at': n.read_at.isoformat() if n.read_at else None,
        }
        for n in notifications
    ]
    
    return render(request, 'Notifications/Index', {
        'notifications': notifications_data,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'has_more': offset + per_page < total,
            'total_pages': (total + per_page - 1) // per_page,
        },
        'unread_count': NotificationService.get_unread_count(user),
    })


@login_required
@require_POST
def mark_read(request, pk):
    """
    Mark a single notification as read.
    Returns redirect back to the referring page.
    """
    NotificationService.mark_as_read(pk, request.user)
    
    # Redirect back to the referring page
    referer = request.META.get('HTTP_REFERER')
    if referer:
        return redirect(referer)
    return redirect('/')


@login_required
@require_POST
def mark_all_read(request):
    """
    Mark all notifications as read for the current user.
    Returns redirect back to the referring page.
    """
    NotificationService.mark_all_as_read(request.user)
    
    # Redirect back to the referring page
    referer = request.META.get('HTTP_REFERER')
    if referer:
        return redirect(referer)
    return redirect('/')
