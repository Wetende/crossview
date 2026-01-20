"""Content app URLs - Inertia patterns + DRF for transition."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'content'

# New Inertia-style URLs
urlpatterns = [
    # Inertia endpoints (use these from browser)
    path('blocks/', views.content_blocks_list, name='blocks.list'),
    path('blocks/create/', views.content_block_create, name='blocks.create'),
    path('blocks/<int:pk>/update/', views.content_block_update, name='blocks.update'),
    path('blocks/<int:pk>/delete/', views.content_block_delete, name='blocks.delete'),
    path('blocks/reorder/', views.content_blocks_reorder, name='blocks.reorder'),
]

# DRF router kept for backward compatibility - TODO: remove after migration
router = DefaultRouter()
router.register(r'blocks', views.ContentBlockViewSet, basename='contentblock')
urlpatterns += [
    path('api/', include(router.urls)),  # /content/api/blocks/
]
