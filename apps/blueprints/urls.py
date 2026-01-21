"""Blueprints app URLs."""

from django.urls import path

from apps.blueprints import views

app_name = "blueprints"

urlpatterns = [
    # Admin Blueprint Management (Superadmin only for create/edit/delete)
    path("admin/blueprints/", views.admin_blueprints, name="admin.blueprints"),
    path(
        "admin/blueprints/create/",
        views.admin_blueprint_create,
        name="admin.blueprint.create",
    ),
    path(
        "admin/blueprints/<int:pk>/",
        views.admin_blueprint_detail,
        name="admin.blueprint",
    ),
    path(
        "admin/blueprints/<int:pk>/edit/",
        views.admin_blueprint_edit,
        name="admin.blueprint.edit",
    ),
    path(
        "admin/blueprints/<int:pk>/delete/",
        views.admin_blueprint_delete,
        name="admin.blueprint.delete",
    ),
]
