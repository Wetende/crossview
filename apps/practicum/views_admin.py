"""
Rubric admin views - CRUD operations for rubric management.
Accessible by both Instructors and Admins.
"""

import json
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, get_object_or_404
from django.contrib import messages
from django.core.paginator import Paginator
from inertia import render

from apps.practicum.models import Rubric
from apps.platform.models import PlatformSettings


def _get_post_data(request) -> dict:
    """Get POST data from request, handling both form-encoded and JSON data."""
    if request.POST:
        return request.POST.dict()
    if request.body:
        try:
            return json.loads(request.body)
        except (json.JSONDecodeError, ValueError):
            pass
    return {}


def _can_manage_rubrics(user) -> bool:
    """Check if user can access rubric management (instructor or admin)."""
    if user.is_staff or user.is_superuser:
        return True
    # Check if user is in Instructors group
    return user.groups.filter(name='Instructors').exists()


def _is_admin(user) -> bool:
    """Check if user is admin or superadmin."""
    return user.is_staff or user.is_superuser


def _can_edit_rubric(user, rubric) -> bool:
    """Check if user can edit a specific rubric."""
    if _is_admin(user):
        return True  # Admins can edit any rubric
    # Instructors can only edit rubrics they created
    return rubric.created_by_id == user.id if hasattr(rubric, 'created_by_id') else True


def _is_practicum_enabled() -> bool:
    """Check if practicum feature is enabled."""
    settings = PlatformSettings.get_settings()
    return settings.is_feature_enabled('practicum')


@login_required
def rubrics_list(request):
    """
    List all rubrics.
    Instructors see all rubrics (for use in grading).
    Admins see all rubrics with full management.
    """
    if not _can_manage_rubrics(request.user):
        return redirect('/dashboard/')
    
    if not _is_practicum_enabled():
        messages.warning(request, "Practicum feature is not enabled.")
        return redirect('/dashboard/')
    
    # Get all rubrics
    rubrics = Rubric.objects.all().order_by('-created_at')
    
    # Pagination
    page = request.GET.get('page', 1)
    paginator = Paginator(rubrics, 10)
    page_obj = paginator.get_page(page)
    
    rubrics_data = [
        {
            'id': r.id,
            'name': r.name,
            'description': r.description or '',
            'dimensionsCount': len(r.dimensions) if r.dimensions else 0,
            'maxScore': r.max_score,
            'createdAt': r.created_at.isoformat() if r.created_at else None,
        }
        for r in page_obj
    ]
    
    # Determine user role for the layout
    role = 'admin' if _is_admin(request.user) else 'instructor'
    
    return render(
        request,
        'Rubrics/Index',
        {
            'rubrics': rubrics_data,
            'pagination': {
                'page': page_obj.number,
                'totalPages': paginator.num_pages,
                'total': paginator.count,
                'perPage': 10,
            },
            'role': role,
            'canCreate': True,
        },
    )


@login_required
def rubric_create(request):
    """Create a new rubric."""
    if not _can_manage_rubrics(request.user):
        return redirect('/dashboard/')
    
    if not _is_practicum_enabled():
        return redirect('/dashboard/')
    
    if request.method == 'POST':
        data = _get_post_data(request)
        
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        dimensions = data.get('dimensions', [])
        max_score = data.get('maxScore', 100)
        
        if not name:
            messages.error(request, "Name is required.")
            return render(
                request,
                'Rubrics/Form',
                {
                    'mode': 'create',
                    'formData': data,
                    'role': 'admin' if _is_admin(request.user) else 'instructor',
                },
            )
        
        # Validate dimensions
        if not dimensions or len(dimensions) == 0:
            messages.error(request, "At least one dimension is required.")
            return render(
                request,
                'Rubrics/Form',
                {
                    'mode': 'create',
                    'formData': data,
                    'role': 'admin' if _is_admin(request.user) else 'instructor',
                },
            )
        
        # Create rubric
        rubric = Rubric.objects.create(
            name=name,
            description=description,
            dimensions=dimensions,
            max_score=max_score,
        )
        
        messages.success(request, f"Rubric '{rubric.name}' created successfully.")
        return redirect('practicum:rubrics')
    
    role = 'admin' if _is_admin(request.user) else 'instructor'
    return render(
        request,
        'Rubrics/Form',
        {
            'mode': 'create',
            'role': role,
        },
    )


@login_required
def rubric_edit(request, pk: int):
    """Edit an existing rubric."""
    if not _can_manage_rubrics(request.user):
        return redirect('/dashboard/')
    
    if not _is_practicum_enabled():
        return redirect('/dashboard/')
    
    rubric = get_object_or_404(Rubric, pk=pk)
    
    # Check permissions
    if not _can_edit_rubric(request.user, rubric):
        messages.error(request, "You don't have permission to edit this rubric.")
        return redirect('practicum:rubrics')
    
    if request.method == 'POST':
        data = _get_post_data(request)
        
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        dimensions = data.get('dimensions', [])
        max_score = data.get('maxScore', 100)
        
        if not name:
            messages.error(request, "Name is required.")
            return render(
                request,
                'Rubrics/Form',
                {
                    'mode': 'edit',
                    'rubric': _serialize_rubric(rubric),
                    'formData': data,
                    'role': 'admin' if _is_admin(request.user) else 'instructor',
                },
            )
        
        # Update rubric
        rubric.name = name
        rubric.description = description
        rubric.dimensions = dimensions
        rubric.max_score = max_score
        rubric.save()
        
        messages.success(request, f"Rubric '{rubric.name}' updated successfully.")
        return redirect('practicum:rubrics')
    
    role = 'admin' if _is_admin(request.user) else 'instructor'
    return render(
        request,
        'Rubrics/Form',
        {
            'mode': 'edit',
            'rubric': _serialize_rubric(rubric),
            'role': role,
        },
    )


@login_required
def rubric_delete(request, pk: int):
    """Delete a rubric (POST only)."""
    if not _can_manage_rubrics(request.user):
        return redirect('/dashboard/')
    
    if request.method != 'POST':
        return redirect('practicum:rubrics')
    
    rubric = get_object_or_404(Rubric, pk=pk)
    
    # Check permissions
    if not _can_edit_rubric(request.user, rubric):
        messages.error(request, "You don't have permission to delete this rubric.")
        return redirect('practicum:rubrics')
    
    name = rubric.name
    rubric.delete()
    
    messages.success(request, f"Rubric '{name}' deleted successfully.")
    return redirect('practicum:rubrics')


def _serialize_rubric(rubric) -> dict:
    """Serialize a rubric for the frontend."""
    return {
        'id': rubric.id,
        'name': rubric.name,
        'description': rubric.description or '',
        'dimensions': rubric.dimensions or [],
        'maxScore': rubric.max_score,
        'createdAt': rubric.created_at.isoformat() if rubric.created_at else None,
        'updatedAt': rubric.updated_at.isoformat() if rubric.updated_at else None,
    }
