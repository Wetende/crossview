"""
Tenant services - Registration, provisioning, presets, billing.
Requirements: 1.1, 1.2, 1.3, 1.4, 2.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4
"""
import logging
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

from django.db import transaction
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string

from .models import Tenant, TenantBranding, TenantLimits, PresetBlueprint, SubscriptionTier
from .context import TenantContext

logger = logging.getLogger(__name__)
User = get_user_model()


class TenantCreationError(Exception):
    """Raised when tenant creation fails."""
    pass


class LimitExceededError(Exception):
    """Raised when a tenant limit is exceeded."""
    def __init__(self, resource: str, current: int, maximum: int):
        self.resource = resource
        self.current = current
        self.maximum = maximum
        super().__init__(f"{resource} limit exceeded: {current}/{maximum}")


@dataclass
class UsageStats:
    """Usage statistics for a tenant."""
    current_students: int
    max_students: int
    current_storage_mb: int
    max_storage_mb: int
    current_programs: int
    max_programs: int
    
    @property
    def students_percentage(self) -> float:
        return (self.current_students / self.max_students * 100) if self.max_students > 0 else 0
    
    @property
    def storage_percentage(self) -> float:
        return (self.current_storage_mb / self.max_storage_mb * 100) if self.max_storage_mb > 0 else 0
    
    @property
    def programs_percentage(self) -> float:
        return (self.current_programs / self.max_programs * 100) if self.max_programs > 0 else 0


class PresetService:
    """
    Service for managing preset blueprints.
    Requirements: 5.1, 5.2, 5.3, 5.4
    """
    
    def get_all(self) -> List[PresetBlueprint]:
        """Get all active preset blueprints."""
        return list(PresetBlueprint.objects.filter(is_active=True))
    
    def get_by_code(self, code: str) -> PresetBlueprint:
        """Get a preset blueprint by code."""
        return PresetBlueprint.objects.get(code=code, is_active=True)
    
    def copy_to_tenant(self, preset_code: str, tenant: Tenant) -> 'AcademicBlueprint':
        """
        Create a tenant-specific blueprint from a preset.
        Requirements: 5.2
        """
        from apps.blueprints.models import AcademicBlueprint
        
        preset = self.get_by_code(preset_code)
        
        return AcademicBlueprint.objects.create(
            tenant=tenant,
            name=preset.name,
            description=preset.description,
            hierarchy_structure=preset.hierarchy_labels,
            grading_logic=preset.grading_config,
            progression_rules=preset.structure_rules,
        )
    
    def seed_presets(self) -> None:
        """
        Seed the database with regulatory presets.
        Requirements: 5.1
        """
        presets = [
            {
                'code': 'tvet_cdacc',
                'name': 'TVET CDACC Standard',
                'description': 'TVETA/CDACC compliant curriculum structure for TVET institutions',
                'regulatory_body': 'TVETA/CDACC',
                'hierarchy_labels': ['Qualification', 'Module', 'Unit of Competency', 'Element'],
                'grading_config': {
                    'mode': 'cbet',
                    'scale': ['Competent', 'Not Yet Competent'],
                    'pass_threshold': 50,
                    'components': {
                        'theory': 30,
                        'practical': 70,
                    },
                    'requires_portfolio': True,
                },
                'structure_rules': {
                    'module_types': ['Basic', 'Common', 'Core'],
                },
            },
            {
                'code': 'nita_trade',
                'name': 'NITA Trade Test',
                'description': 'NITA Trade Test structure for artisan certification',
                'regulatory_body': 'NITA',
                'hierarchy_labels': ['Trade Area', 'Grade Level', 'Practical Project'],
                'grading_config': {
                    'mode': 'visual_review',
                    'checklist': ['Safety Gear', 'Tools', 'Finished Product Quality'],
                    'levels': ['Grade III', 'Grade II', 'Grade I'],
                },
                'structure_rules': {},
            },
            {
                'code': 'ntsa_driving',
                'name': 'NTSA Driving Curriculum',
                'description': 'NTSA compliant driving school curriculum',
                'regulatory_body': 'NTSA',
                'hierarchy_labels': ['License Class', 'Unit', 'Lesson Type'],
                'grading_config': {
                    'mode': 'instructor_checklist',
                    'lesson_types': ['Theory', 'Yard Training', 'Roadwork'],
                    'components': ['Theory Test', 'Maneuver Test', 'Road Test'],
                    'requires_hours_logged': True,
                },
                'structure_rules': {},
            },
            {
                'code': 'cbc_k12',
                'name': 'CBC K-12 Standard',
                'description': 'KICD Competency-Based Curriculum for K-12',
                'regulatory_body': 'KICD',
                'hierarchy_labels': ['Grade', 'Learning Area', 'Strand', 'Sub-strand'],
                'grading_config': {
                    'mode': 'rubric',
                    'scale': ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation'],
                    'competencies': ['Communication', 'Critical Thinking', 'Digital Literacy'],
                },
                'structure_rules': {},
            },
            {
                'code': 'cct_theology',
                'name': 'CCT Theology Standard',
                'description': 'Crossview College of Theology curriculum structure',
                'regulatory_body': 'Internal',
                'hierarchy_labels': ['Program', 'Year', 'Unit', 'Session'],
                'grading_config': {
                    'mode': 'summative',
                    'components': {
                        'cat': 30,
                        'exam': 70,
                    },
                    'pass_mark': 40,
                    'practicum_enabled': True,
                },
                'structure_rules': {},
            },
        ]
        
        for preset_data in presets:
            PresetBlueprint.objects.update_or_create(
                code=preset_data['code'],
                defaults=preset_data
            )
        
        logger.info(f"Seeded {len(presets)} preset blueprints")


class BillingService:
    """
    Service for managing tenant billing and limits.
    Requirements: 6.1, 6.2, 6.3, 6.4
    """
    
    def check_limit(self, tenant: Tenant, resource: str) -> bool:
        """
        Check if a tenant can add more of a resource.
        Requirements: 6.2, 6.3
        
        Returns True if within limits, False if limit exceeded.
        """
        limits = tenant.limits
        
        if resource == 'students':
            return limits.current_students < limits.max_students
        elif resource == 'storage':
            return limits.current_storage_mb < limits.max_storage_mb
        elif resource == 'programs':
            return limits.current_programs < limits.max_programs
        
        return True
    
    def enforce_limit(self, tenant: Tenant, resource: str) -> None:
        """
        Enforce a limit, raising an error if exceeded.
        Requirements: 6.2, 6.3
        """
        limits = tenant.limits
        
        if resource == 'students' and limits.current_students >= limits.max_students:
            raise LimitExceededError('students', limits.current_students, limits.max_students)
        elif resource == 'storage' and limits.current_storage_mb >= limits.max_storage_mb:
            raise LimitExceededError('storage', limits.current_storage_mb, limits.max_storage_mb)
        elif resource == 'programs' and limits.current_programs >= limits.max_programs:
            raise LimitExceededError('programs', limits.current_programs, limits.max_programs)
    
    def increment_usage(self, tenant: Tenant, resource: str, amount: int = 1) -> None:
        """Increment usage for a resource."""
        limits = tenant.limits
        
        if resource == 'students':
            limits.current_students += amount
        elif resource == 'storage':
            limits.current_storage_mb += amount
        elif resource == 'programs':
            limits.current_programs += amount
        
        limits.save()
    
    def decrement_usage(self, tenant: Tenant, resource: str, amount: int = 1) -> None:
        """Decrement usage for a resource."""
        limits = tenant.limits
        
        if resource == 'students':
            limits.current_students = max(0, limits.current_students - amount)
        elif resource == 'storage':
            limits.current_storage_mb = max(0, limits.current_storage_mb - amount)
        elif resource == 'programs':
            limits.current_programs = max(0, limits.current_programs - amount)
        
        limits.save()
    
    def get_usage_stats(self, tenant: Tenant) -> UsageStats:
        """
        Get current usage statistics for a tenant.
        Requirements: 6.4
        """
        limits = tenant.limits
        return UsageStats(
            current_students=limits.current_students,
            max_students=limits.max_students,
            current_storage_mb=limits.current_storage_mb,
            max_storage_mb=limits.max_storage_mb,
            current_programs=limits.current_programs,
            max_programs=limits.max_programs,
        )
    
    def assign_tier(self, tenant: Tenant, tier: SubscriptionTier) -> None:
        """
        Assign a subscription tier to a tenant.
        Requirements: 6.1
        """
        tenant.subscription_tier = tier
        tenant.save()
        
        # Update limits based on tier
        limits = tenant.limits
        limits.max_students = tier.max_students
        limits.max_storage_mb = tier.max_storage_mb
        limits.max_programs = tier.max_programs
        limits.save()


class TenantService:
    """
    Main service for tenant management.
    Requirements: 1.1, 1.2, 1.3, 1.4, 2.4
    """
    
    def __init__(
        self,
        preset_service: PresetService = None,
        billing_service: BillingService = None
    ):
        self.preset_service = preset_service or PresetService()
        self.billing_service = billing_service or BillingService()
    
    @transaction.atomic
    def create(
        self,
        name: str,
        subdomain: str,
        admin_email: str,
        preset_code: str = None,
        subscription_tier: SubscriptionTier = None,
        **kwargs
    ) -> Tenant:
        """
        Create a new tenant with full provisioning.
        Requirements: 1.1, 1.2, 1.3
        """
        # Validate subdomain uniqueness
        if Tenant.objects.filter(subdomain=subdomain).exists():
            raise TenantCreationError(f"Subdomain '{subdomain}' is already taken")
        
        # Create tenant
        tenant = Tenant.objects.create(
            name=name,
            subdomain=subdomain,
            admin_email=admin_email,
            subscription_tier=subscription_tier,
            **kwargs
        )
        
        # Provision tenant
        admin_user, password = self.provision(tenant, preset_code)
        
        # Send welcome email
        self.send_welcome_email(tenant, admin_user, password)
        
        return tenant
    
    def provision(self, tenant: Tenant, preset_code: str = None) -> tuple:
        """
        Provision a tenant with admin user, branding, limits, and optional blueprint.
        Requirements: 1.2, 1.3
        
        Returns (admin_user, password) tuple.
        """
        # Create admin user
        password = get_random_string(12)
        admin_user = User.objects.create_user(
            username=f"admin_{tenant.subdomain}",
            email=tenant.admin_email,
            password=password,
            tenant=tenant,
            is_staff=True,
        )
        
        # Create branding with defaults
        TenantBranding.objects.create(
            tenant=tenant,
            institution_name=tenant.name,
        )
        
        # Create limits (from tier or defaults)
        if tenant.subscription_tier:
            TenantLimits.objects.create(
                tenant=tenant,
                max_students=tenant.subscription_tier.max_students,
                max_storage_mb=tenant.subscription_tier.max_storage_mb,
                max_programs=tenant.subscription_tier.max_programs,
            )
        else:
            TenantLimits.objects.create(tenant=tenant)
        
        # Copy preset blueprint if provided
        if preset_code:
            self.preset_service.copy_to_tenant(preset_code, tenant)
        
        # Mark as activated
        tenant.activated_at = timezone.now()
        tenant.save()
        
        return admin_user, password
    
    def send_welcome_email(self, tenant: Tenant, admin_user, password: str) -> None:
        """
        Send welcome email with login credentials.
        Requirements: 1.4
        """
        try:
            subject = f"Welcome to {settings.SITE_NAME} - Your account is ready"
            message = f"""
Hello,

Your institution "{tenant.name}" has been set up on {settings.SITE_NAME}.

Login Details:
- URL: https://{tenant.subdomain}.{settings.BASE_DOMAIN}
- Email: {admin_user.email}
- Password: {password}

Please change your password after first login.

Best regards,
The {settings.SITE_NAME} Team
            """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[admin_user.email],
                fail_silently=True,
            )
            logger.info(f"Welcome email sent to {admin_user.email}")
        except Exception as e:
            logger.error(f"Failed to send welcome email: {e}")
    
    @transaction.atomic
    def delete(self, tenant: Tenant) -> None:
        """
        Delete a tenant and all associated data.
        Requirements: 2.4
        
        Django's CASCADE will handle related objects.
        """
        tenant_name = tenant.name
        tenant_id = tenant.id
        
        # Delete tenant (cascades to all related objects)
        tenant.delete()
        
        logger.info(f"Deleted tenant {tenant_name} (ID: {tenant_id}) and all associated data")
    
    def update_branding(
        self,
        tenant: Tenant,
        logo_path: str = None,
        primary_color: str = None,
        secondary_color: str = None,
        institution_name: str = None,
        tagline: str = None,
        favicon_path: str = None,
    ) -> TenantBranding:
        """
        Update tenant branding configuration.
        Requirements: 4.1
        """
        branding = tenant.branding
        
        if logo_path is not None:
            branding.logo_path = logo_path
        if primary_color is not None:
            branding.primary_color = primary_color
        if secondary_color is not None:
            branding.secondary_color = secondary_color
        if institution_name is not None:
            branding.institution_name = institution_name
        if tagline is not None:
            branding.tagline = tagline
        if favicon_path is not None:
            branding.favicon_path = favicon_path
        
        branding.save()
        return branding
    
    def get_branding(self, tenant: Tenant) -> Dict[str, Any]:
        """
        Get branding configuration with defaults.
        Requirements: 4.3
        """
        try:
            branding = tenant.branding
            return {
                'logo_path': branding.logo_path,
                'favicon_path': branding.favicon_path,
                'primary_color': branding.primary_color or '#3B82F6',
                'secondary_color': branding.secondary_color or '#1E40AF',
                'institution_name': branding.institution_name or tenant.name,
                'tagline': branding.tagline or '',
            }
        except TenantBranding.DoesNotExist:
            # Return defaults
            return {
                'logo_path': None,
                'favicon_path': None,
                'primary_color': '#3B82F6',
                'secondary_color': '#1E40AF',
                'institution_name': tenant.name,
                'tagline': '',
            }
