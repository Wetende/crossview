"""
Notification URL patterns - Inertia-based routes.
"""

from django.urls import path
from . import views

app_name = 'notifications'

urlpatterns = [
    # Full notifications page
    path('', views.notifications_index, name='index'),
    
    # Mark a single notification as read
    path('<int:pk>/read/', views.mark_read, name='read'),
    
    # Mark all notifications as read
    path('mark-all-read/', views.mark_all_read, name='mark_all_read'),
]
