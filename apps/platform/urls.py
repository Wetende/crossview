"""Platform app URLs - Single-Tenant Mode."""

from django.urls import path

from apps.platform import views

app_name = "tenants"

urlpatterns = [
    # Admin Settings
    path("admin/settings/", views.admin_settings, name="admin.settings"),
    # path("admin/settings/branding/", views.admin_branding, name="admin.branding"),
    
    # Super Admin Dashboard
    path("superadmin/", views.superadmin_dashboard, name="superadmin.dashboard"),
    
    # Super Admin Blueprints/Presets
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
    
    # Super Admin Logs
    path("superadmin/logs/", views.superadmin_logs, name="superadmin.logs"),
    
    # Setup Wizard (Single-Tenant Mode)
    path("setup/", views.setup_wizard, name="setup.wizard"),
    path("setup/institution/", views.setup_institution, name="setup.institution"),
    path("setup/mode/", views.setup_mode, name="setup.mode"),
    path("setup/branding/", views.setup_branding, name="setup.branding"),
    path("setup/features/", views.setup_features, name="setup.features"),
    
    # Platform Settings (post-setup editing)
    path("superadmin/platform/", views.platform_settings, name="platform.settings"),
]
