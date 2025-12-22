"""Curriculum app URLs."""

from django.urls import path

from apps.curriculum import views

app_name = "curriculum"

urlpatterns = [
    # Admin Curriculum Builder
    path("admin/curriculum/", views.admin_curriculum_builder, name="admin.builder"),
    # Node CRUD (JSON API for builder)
    path(
        "admin/curriculum/nodes/create/",
        views.admin_node_create,
        name="admin.node.create",
    ),
    path(
        "admin/curriculum/nodes/<int:pk>/",
        views.admin_node_detail,
        name="admin.node.detail",
    ),
    path(
        "admin/curriculum/nodes/<int:pk>/update/",
        views.admin_node_update,
        name="admin.node.update",
    ),
    path(
        "admin/curriculum/nodes/<int:pk>/delete/",
        views.admin_node_delete,
        name="admin.node.delete",
    ),
    path(
        "admin/curriculum/nodes/reorder/",
        views.admin_node_reorder,
        name="admin.node.reorder",
    ),
]
