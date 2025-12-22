"""Tenants app URLs."""

from django.urls import path

from apps.tenants import views

app_name = "tenants"

urlpatterns = [
    # Admin Settings
    path("admin/settings/", views.admin_settings, name="admin.settings"),
    path("admin/settings/branding/", views.admin_branding, name="admin.branding"),
    # Super Admin Dashboard
    path("superadmin/", views.superadmin_dashboard, name="superadmin.dashboard"),
    # Super Admin Tenants
    path("superadmin/tenants/", views.superadmin_tenants, name="superadmin.tenants"),
    path(
        "superadmin/tenants/create/",
        views.superadmin_tenant_create,
        name="superadmin.tenant.create",
    ),
    path(
        "superadmin/tenants/<int:pk>/",
        views.superadmin_tenant_detail,
        name="superadmin.tenant",
    ),
    path(
        "superadmin/tenants/<int:pk>/edit/",
        views.superadmin_tenant_edit,
        name="superadmin.tenant.edit",
    ),
    path(
        "superadmin/tenants/<int:pk>/suspend/",
        views.superadmin_tenant_suspend,
        name="superadmin.tenant.suspend",
    ),
    path(
        "superadmin/tenants/<int:pk>/impersonate/",
        views.superadmin_tenant_impersonate,
        name="superadmin.tenant.impersonate",
    ),
    path(
        "superadmin/exit-impersonation/",
        views.superadmin_exit_impersonation,
        name="superadmin.exit_impersonation",
    ),
    # Super Admin Presets
    path("superadmin/presets/", views.superadmin_presets, name="superadmin.presets"),
    path(
        "superadmin/presets/create/",
        views.superadmin_preset_create,
        name="superadmin.preset.create",
    ),
    path(
        "superadmin/presets/<int:pk>/edit/",
        views.superadmin_preset_edit,
        name="superadmin.preset.edit",
    ),
    # Super Admin Settings
    path("superadmin/settings/", views.superadmin_settings, name="superadmin.settings"),
    # Super Admin Logs
    path("superadmin/logs/", views.superadmin_logs, name="superadmin.logs"),
]
