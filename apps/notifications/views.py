"""
Notification views - Inertia-based views for notification management.
"""

from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from inertia import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status as drf_status

from .models import Notification, NotificationPreference
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


# =============================================================================
# REST API endpoints
# =============================================================================


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_list_notifications(request):
    """
    API: list notifications for the authenticated user.
    """
    page = max(int(request.GET.get("page", 1)), 1)
    per_page = max(int(request.GET.get("per_page", 20)), 1)

    queryset = Notification.objects.filter(recipient=request.user).order_by("-created_at")
    total = queryset.count()
    offset = (page - 1) * per_page
    rows = queryset[offset : offset + per_page]

    notifications = [
        {
            "id": n.id,
            "type": n.notification_type,
            "title": n.title,
            "message": n.message,
            "priority": n.priority,
            "is_read": n.is_read,
            "action_url": n.action_url,
            "created_at": n.created_at.isoformat(),
            "read_at": n.read_at.isoformat() if n.read_at else None,
        }
        for n in rows
    ]

    return Response(
        {
            "notifications": notifications,
            "total": total,
            "page": page,
            "per_page": per_page,
            "has_more": offset + per_page < total,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_unread_count(request):
    """
    API: get unread notification count.
    """
    return Response({"count": NotificationService.get_unread_count(request.user)})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_mark_read(request, pk):
    """
    API: mark one notification as read.
    """
    updated = NotificationService.mark_as_read(pk, request.user)
    return Response({"updated": updated})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_mark_all_read(request):
    """
    API: mark all notifications as read.
    """
    updated = NotificationService.mark_all_as_read(request.user)
    return Response({"updated": updated})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def api_delete_notification(request, pk):
    """
    API: delete a notification belonging to the authenticated user.
    """
    deleted, _ = Notification.objects.filter(id=pk, recipient=request.user).delete()
    if deleted == 0:
        return Response({"detail": "Not found."}, status=drf_status.HTTP_404_NOT_FOUND)
    return Response({"deleted": True})


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def api_preferences(request):
    """
    API: get or update notification preferences for the current user.
    """
    preferences, _ = NotificationPreference.objects.get_or_create(user=request.user)

    if request.method == "POST":
        data = request.data or {}
        if "in_app_enabled" in data:
            preferences.in_app_enabled = bool(data.get("in_app_enabled"))
        if "email_enabled" in data:
            preferences.email_enabled = bool(data.get("email_enabled"))
        if data.get("email_digest"):
            requested_digest = data.get("email_digest")
            valid_digests = {choice[0] for choice in NotificationPreference.EMAIL_DIGEST_CHOICES}
            if requested_digest not in valid_digests:
                return Response(
                    {"email_digest": "Select a valid email delivery preference."},
                    status=drf_status.HTTP_400_BAD_REQUEST,
                )
            preferences.email_digest = requested_digest
        if "type_preferences" in data and isinstance(data.get("type_preferences"), dict):
            preferences.type_preferences = data.get("type_preferences")
        preferences.save()

    return Response(
        {
            "in_app_enabled": preferences.in_app_enabled,
            "email_enabled": preferences.email_enabled,
            "email_digest": preferences.email_digest,
            "type_preferences": preferences.type_preferences or {},
        }
    )
