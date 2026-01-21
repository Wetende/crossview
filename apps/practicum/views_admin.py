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

from apps.assessments.models import Rubric
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
    return user.groups.filter(name='Instructors').exists()


def _is_admin(user) -> bool:
    """Check if user is admin or superadmin."""
    return user.is_staff or user.is_superuser


def _can_create_scope(user, scope: str) -> bool:
    """Check if user can create rubric with given scope."""
    if scope == 'global':
        return user.is_superuser
    elif scope == 'program':
        return _is_admin(user)
    elif scope == 'course':
        return _can_manage_rubrics(user)
    return False


def _get_accessible_rubrics(user):
    """Get rubrics accessible to user based on role and scope."""
    if user.is_superuser:
        return Rubric.objects.all()
    elif _is_admin(user):
        # Admins see global + program rubrics for their programs
        from apps.core.models import Program
        user_programs = Program.objects.filter(
            instructor_assignments__instructor=user
        ).values_list('id', flat=True)
        return Rubric.objects.filter(
            Q(scope='global') | 
            Q(scope='program', program_id__in=user_programs) |
            Q(scope='course', owner=user)
        )
    else:
        # Instructors see global + program (for their programs) + their course rubrics
        from apps.core.models import Program
        user_programs = Program.objects.filter(
            instructor_assignments__instructor=user
        ).values_list('id', flat=True)
        return Rubric.objects.filter(
            Q(scope='global') |
            Q(scope='program', program_id__in=user_programs) |
            Q(scope='course', owner=user)
        )


def _can_edit_rubric(user, rubric) -> bool:
    """Check if user can edit a specific rubric."""
    if user.is_superuser:
        return True
    if rubric.scope == 'global':
        return False  # Only superadmin can edit global
    if rubric.scope == 'program':
        return _is_admin(user) and rubric.program_id in user.assigned_programs.values_list('id', flat=True)
    if rubric.scope == 'course':
        return rubric.owner_id == user.id
    return False


def _is_practicum_enabled() -> bool:
    """Check if practicum feature is enabled."""
    settings = PlatformSettings.get_settings()
    return settings.is_feature_enabled('practicum')


@login_required
def rubrics_list(request):
    """
    List rubrics accessible to user based on scope.
    """
    if not _can_manage_rubrics(request.user):
        return redirect('/dashboard/')
    
    if not _is_practicum_enabled():
        messages.warning(request, "Practicum feature is not enabled.")
        return redirect('/dashboard/')
    
    # Get accessible rubrics
    rubrics = _get_accessible_rubrics(request.user).order_by('-created_at')
    
    # Filter by scope if requested
    scope_filter = request.GET.get('scope')
    if scope_filter in ['global', 'program', 'course']:
        rubrics = rubrics.filter(scope=scope_filter)
    
    # Pagination
    page = request.GET.get('page', 1)
    paginator = Paginator(rubrics, 10)
    page_obj = paginator.get_page(page)
    
    rubrics_data = [
        {
            'id': r.id,
            'name': r.name,
            'description': r.description or '',
            'scope': r.scope,
            'scopeDisplay': r.get_scope_display(),
            'owner': {'id': r.owner_id, 'name': r.owner.get_full_name()} if r.owner else None,
            'program': {'id': r.program_id, 'name': r.program.name} if r.program else None,
            'dimensionsCount': len(r.dimensions) if r.dimensions else 0,
            'maxScore': r.max_score,
            'canEdit': _can_edit_rubric(request.user, r),
            'createdAt': r.created_at.isoformat() if r.created_at else None,
        }
        for r in page_obj
    ]
    
    role = 'admin' if _is_admin(request.user) else 'instructor'
    
    return render(
        request,
        'Rubrics/Index',
        {
            'rubrics': rubrics_data,
            'canCreateGlobal': request.user.is_superuser,
            'canCreateProgram': _is_admin(request.user),
            'canCreateCourse': _can_manage_rubrics(request.user),
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
    """Create a new rubric with scope and ownership."""
    if not _can_manage_rubrics(request.user):
        return redirect('/dashboard/')
    
    if not _is_practicum_enabled():
        return redirect('/dashboard/')
    
    # Check if instructor is blocked by enforce_standard_rubrics
    from apps.core.models import Program
    from apps.blueprints.models import AcademicBlueprint
    
    enforce_standard = False
    if not _is_admin(request.user):
        # Check if any of instructor's programs enforce standard rubrics
        user_programs = Program.objects.filter(
            instructor_assignments__instructor=request.user
        ).select_related('blueprint')
        
        for prog in user_programs:
            if prog.blueprint:
                flags = prog.blueprint.get_effective_feature_flags()
                if flags.get('enforce_standard_rubrics', False):
                    enforce_standard = True
                    break
        
        if enforce_standard:
            messages.warning(
                request,
                "This program uses standardized rubrics. Only admins can create rubrics. "
                "Please contact your program administrator."
            )
            return redirect('practicum:rubrics')
    
    if request.method == 'POST':
        data = _get_post_data(request)
        
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        dimensions = data.get('dimensions', [])
        max_score = data.get('maxScore', 100)
        scope = data.get('scope', 'course')
        program_id = data.get('programId')
        
        # Validate scope permission
        if not _can_create_scope(request.user, scope):
            messages.error(request, f"You don't have permission to create {scope} rubrics.")
            return redirect('practicum:rubrics')
        
        # Validate program for program-scoped rubrics
        if scope == 'program' and not program_id:
            messages.error(request, "Program is required for program-scoped rubrics.")
            return render(request, 'Rubrics/Form', {
                'mode': 'create',
                'formData': data,
                'role': 'admin' if _is_admin(request.user) else 'instructor',
            })
        
        if not name:
            messages.error(request, "Name is required.")
            return render(request, 'Rubrics/Form', {
                'mode': 'create',
                'formData': data,
                'role': 'admin' if _is_admin(request.user) else 'instructor',
            })
        
        if not dimensions or len(dimensions) == 0:
            messages.error(request, "At least one dimension is required.")
            return render(request, 'Rubrics/Form', {
                'mode': 'create',
                'formData': data,
                'role': 'admin' if _is_admin(request.user) else 'instructor',
            })
        
        # Create rubric with scope and ownership
        rubric = Rubric.objects.create(
            name=name,
            description=description,
            dimensions=dimensions,
            max_score=max_score,
            scope=scope,
            owner=request.user,
            program_id=program_id if scope == 'program' else None,
        )
        
        messages.success(request, f"Rubric '{rubric.name}' created successfully.")
        return redirect('practicum:rubrics')
    
    # Get user's programs for program selector
    from apps.core.models import Program
    user_programs = []
    if _is_admin(request.user):
        user_programs = list(Program.objects.filter(
            instructor_assignments__instructor=request.user
        ).values('id', 'name'))
    
    role = 'admin' if _is_admin(request.user) else 'instructor'
    return render(
        request,
        'Rubrics/Form',
        {
            'mode': 'create',
            'role': role,
            'canCreateGlobal': request.user.is_superuser,
            'canCreateProgram': _is_admin(request.user),
            'userPrograms': user_programs,
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
