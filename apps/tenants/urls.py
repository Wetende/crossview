"""Tenants app URLs."""

from django.urls import path

from apps.tenants import views

app_name = "tenants"

urlpatterns = [
    # Admin Settings
    path("admin/settings/", views.admin_settings, name="admin.settings"),
    path("admin/settings/branding/", views.admin_branding, name="admin.branding"),
]
