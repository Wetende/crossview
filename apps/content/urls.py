"""Content app URLs - Inertia patterns + API for Course Builder."""
from django.urls import path
from . import views

app_name = 'content'

# JSON endpoints for Course Builder
urlpatterns = [
    # Retrieve blocks for a node (GET)
    path('blocks/', views.content_blocks_list, name='blocks.list'),
    
    # Create block (POST)
    path('blocks/create/', views.content_block_create, name='blocks.create'),
    
    # Update block (POST)
    path('blocks/<int:pk>/update/', views.content_block_update, name='blocks.update'),
    
    # Delete block (POST)
    path('blocks/<int:pk>/delete/', views.content_block_delete, name='blocks.delete'),
    
    # Reorder blocks (POST)
    path('blocks/reorder/', views.content_blocks_reorder, name='blocks.reorder'),
]
