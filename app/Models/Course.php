<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

final class Course extends Model
{
    use HasFactory;
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'blueprint_id',
        'user_id',
        'title',
        'slug',
        'description',
        'short_description',
        'thumbnail_path',
        'price',
        'pricing_type',
        'level',
        'language',
        'requirements',
        'what_you_will_learn',
        'tags',
        'duration_in_minutes',
        'is_featured',
        'is_published',
        'published_at',
        'subscription_required',
        'required_subscription_tier_id',
        'position',
        'category_id',
        'subject_id',
        'grade_level_id',
        'instructor_info',
        'is_recommended',
        'allow_certificate',
        'certificate_template_id',
        'enable_coupon',
        'sale_price',
        'sale_start_date',
        'sale_end_date',
        'enable_bulk_purchase',
        'enable_gift_option',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'approval_status',
        'submitted_at',
        'approved_at',
        'rejected_at',
        'reviewed_by_admin_id',
        'rejection_reason',
        'approval_notes',
        'draft_notes',
        'editing_locked',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'price' => 'decimal:2',
        'pricing_type' => 'string',
        'requirements' => 'array',
        'what_you_will_learn' => 'array',
        'tags' => 'array',
        'is_featured' => 'boolean',
        'is_published' => 'boolean',
        'published_at' => 'datetime',
        'subscription_required' => 'boolean',
        'position' => 'integer',
        'duration_in_minutes' => 'integer',
        'is_recommended' => 'boolean',
        'allow_certificate' => 'boolean',
        'enable_coupon' => 'boolean',
        'sale_price' => 'decimal:2',
        'sale_start_date' => 'datetime',
        'sale_end_date' => 'datetime',
        'enable_bulk_purchase' => 'boolean',
        'enable_gift_option' => 'boolean',
        'approval_status' => 'string',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'approval_notes' => 'array',
        'draft_notes' => 'array',
        'editing_locked' => 'boolean',
    ];

    /**
     * Get the academic blueprint for this course.
     */
    public function blueprint(): BelongsTo
    {
        return $this->belongsTo(AcademicBlueprint::class, 'blueprint_id');
    }

    /**
     * Get the curriculum nodes for this course.
     */
    public function curriculumNodes(): HasMany
    {
        return $this->hasMany(CurriculumNode::class);
    }

    /**
     * Get the teacher who owns the course.
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Alias for teacher() relationship for backward compatibility.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the subscription tier required for this course.
     */
    public function requiredSubscriptionTier(): BelongsTo
    {
        return $this->belongsTo(SubscriptionTier::class, 'required_subscription_tier_id');
    }

    /**
     * Get the admin who reviewed this course.
     */
    public function reviewedByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_admin_id');
    }

    /**
     * Get the category that owns the course.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the subject that owns the course.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * Get the grade level that owns the course.
     */
    public function gradeLevel(): BelongsTo
    {
        return $this->belongsTo(GradeLevel::class);
    }

    /**
     * Get the lessons for the course.
     */
    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class);
    }

    /**
     * Get the sections for the course.
     */
    public function sections(): HasMany
    {
        return $this->hasMany(CourseSection::class)->orderBy('order');
    }

    /**
     * Get the quizzes for the course through its sections.
     */
    public function quizzes(): HasManyThrough
    {
        return $this->hasManyThrough(
            Quiz::class,
            CourseSection::class,
            'course_id',
            'course_section_id',
            'id',
            'id'
        );
    }

    /**
     * Get the assignments for the course through its sections.
     */
    public function assignments(): HasManyThrough
    {
        return $this->hasManyThrough(
            Assignment::class,
            CourseSection::class,
            'course_id',
            'course_section_id',
            'id',
            'id'
        );
    }

    /**
     * Get the discussion forum for the course.
     */
    public function discussionForum(): HasOne
    {
        return $this->hasOne(DiscussionForum::class);
    }

    /**
     * Get the reviews for the course.
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(CourseReview::class);
    }

    /**
     * Get the purchases for the course.
     */
    public function purchases(): HasMany
    {
        return $this->hasMany(CoursePurchase::class);
    }

    /**
     * Get the FAQs for the course.
     */
    public function faqs(): HasMany
    {
        return $this->hasMany(CourseFAQ::class);
    }

    /**
     * Get the average rating for the course.
     */
    public function getAverageRatingAttribute(): float
    {
        $avgRating = $this->reviews()->avg('rating');

        
        return $avgRating !== null ? (float) $avgRating : 0.0;
    }

    /**
     * Get the total number of students enrolled in the course.
     */
    public function getTotalStudentsAttribute(): int
    {
        return $this->purchases()->count();
    }

    /**
     * Get the total duration of the course in minutes.
     */
    public function calculateTotalDuration(): int
    {
        return (int) $this->lessons()->sum('lesson_duration');
    }

    /**
     * Get the published lessons for the course.
     */
    public function publishedLessons(): HasMany
    {
        return $this->lessons()->where('is_published', true)->orderBy('position');
    }

    /**
     * Get the notices for the course.
     */
    public function notices(): HasMany
    {
        return $this->hasMany(CourseNotice::class);
    }

    /**
     * Scope a query to only include published courses.
     */
    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    /**
     * Scope a query to only include courses with specific status.
     */
    public function scopeStatus($query, $status)
    {
        if ($status === 'published') {
            return $query->where('is_published', true);
        } elseif ($status === 'draft') {
            return $query->where('is_published', false);
        }

        return $query;
    }

    /**
     * Scope a query to only include featured courses.
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope a query to only include courses submitted for approval.
     */
    public function scopeSubmittedForApproval($query)
    {
        return $query->where('approval_status', 'submitted');
    }

    /**
     * Scope a query to only include courses pending approval.
     */
    public function scopePendingApproval($query)
    {
        return $query->where('approval_status', 'submitted');
    }

    /**
     * Scope a query to only include approved courses.
     */
    public function scopeApproved($query)
    {
        return $query->where('approval_status', 'approved');
    }

    /**
     * Scope a query to only include rejected courses.
     */
    public function scopeRejected($query)
    {
        return $query->where('approval_status', 'rejected');
    }

    /**
     * Get the enrollments for this course.
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * Get the students enrolled in the course.
     */
    public function students(): HasManyThrough
    {
        return $this->hasManyThrough(User::class, Enrollment::class, 'course_id', 'id', 'id', 'user_id')
                    ->where('enrollments.status', 'active');
    }

    /**
     * Check if the course is free to access.
     */
    public function isFree(): bool
    {
        return $this->pricing_type === 'free' || (!$this->pricing_type && $this->price <= 0 && !$this->subscription_required);
    }

    /**
     * Check if the course can be purchased directly.
     */
    public function canBePurchased(): bool
    {
        return $this->pricing_type === 'purchase' || $this->pricing_type === 'both';
    }

    /**
     * Check if the course requires a subscription.
     */
    public function requiresSubscription(): bool
    {
        return $this->pricing_type === 'subscription' || $this->pricing_type === 'both';
    }

    /**
     * Check if the course has multiple access methods.
     */
    public function hasMultipleAccessMethods(): bool
    {
        return $this->pricing_type === 'both';
    }

    /**
     * Get the effective price for the course (considering sale price).
     */
    public function getEffectivePrice(): float
    {
        if ($this->sale_price && $this->isSaleActive()) {
            return (float) $this->sale_price;
        }
        return (float) $this->price;
    }

    /**
     * Check if a sale is currently active.
     */
    public function isSaleActive(): bool
    {
        if (!$this->sale_price || !$this->sale_start_date || !$this->sale_end_date) {
            return false;
        }

        $now = now();
        return $now->between($this->sale_start_date, $this->sale_end_date);
    }

    /**
     * Check if a user can access this course with their subscription.
     */
    public function canUserAccessViaSubscription(?User $user): bool
    {
        if (!$this->requiresSubscription() || !$user) {
            return false;
        }

        $activeSubscription = $user->activeSubscription();
        if (!$activeSubscription || !$activeSubscription->tier) {
            return false;
        }

        if (!$this->required_subscription_tier_id) {
            return true; 
        }

        return $activeSubscription->tier->level >= $this->requiredSubscriptionTier->level;
    }

    /**
     * Get access status for a specific user.
     */
    public function getAccessStatusForUser(?User $user): array
    {
        if (!$user) {
            return [
                'status' => 'requires_auth',
                'can_access' => false,
                'message' => 'Please log in to access this course'
            ];
        }

        
        $enrollment = $user->enrollments()
            ->where('course_id', $this->id)
            ->where('status', 'active')
            ->first();

        if ($enrollment) {
            return [
                'status' => 'enrolled',
                'can_access' => true,
                'message' => 'You are enrolled in this course',
                'enrollment' => $enrollment
            ];
        }

        
        if ($this->isFree()) {
            return [
                'status' => 'can_enroll_free',
                'can_access' => false,
                'message' => 'This is a free course - click to enroll'
            ];
        }

        
        $canAccessViaSubscription = $this->canUserAccessViaSubscription($user);
        $canPurchase = $this->canBePurchased();

        if ($canAccessViaSubscription && $canPurchase) {
            return [
                'status' => 'can_subscribe_or_purchase',
                'can_access' => false,
                'message' => 'You can access via subscription or purchase',
                'price' => $this->getEffectivePrice(),
                'subscription_tier' => $user->activeSubscriptionTier()
            ];
        } elseif ($canAccessViaSubscription) {
            return [
                'status' => 'can_enroll_subscription',
                'can_access' => false,
                'message' => 'You can access this course with your subscription',
                'subscription_tier' => $user->activeSubscriptionTier()
            ];
        } elseif ($canPurchase) {
            return [
                'status' => 'can_purchase',
                'can_access' => false,
                'message' => 'Purchase this course for lifetime access',
                'price' => $this->getEffectivePrice()
            ];
        } elseif ($this->requiresSubscription()) {
            return [
                'status' => 'requires_higher_tier',
                'can_access' => false,
                'message' => 'This course requires a higher subscription tier',
                'required_tier' => $this->requiredSubscriptionTier,
                'current_tier' => $user->activeSubscriptionTier()
            ];
        }

        return [
            'status' => 'unavailable',
            'can_access' => false,
            'message' => 'This course is not available for enrollment'
        ];
    }

    /**
     * Check if the course is submitted for approval.
     */
    public function isSubmittedForApproval(): bool
    {
        return $this->approval_status === 'submitted';
    }

    /**
     * Check if the course is pending approval.
     */
    public function isPendingApproval(): bool
    {
        return $this->approval_status === 'submitted';
    }

    /**
     * Check if the course is approved.
     */
    public function isApproved(): bool
    {
        return $this->approval_status === 'approved';
    }

    /**
     * Check if the course is rejected.
     */
    public function isRejected(): bool
    {
        return $this->approval_status === 'rejected';
    }

    /**
     * Check if the course is in draft status.
     */
    public function isDraft(): bool
    {
        return $this->approval_status === 'draft';
    }

    /**
     * Check if the course editing is locked.
     */
    public function isEditingLocked(): bool
    {
        return $this->editing_locked || $this->approval_status === 'submitted';
    }

    /**
     * Check if the course can be submitted for approval.
     */
    public function canBeSubmittedForApproval(): bool
    {
        return $this->approval_status === 'draft' &&
               $this->meetsSubmissionRequirements();
    }

    /**
     * Check if the course meets the minimum requirements for submission.
     */
    public function meetsSubmissionRequirements(): bool
    {
        
        $hasDuration = $this->calculateTotalDuration() > 0;

        return !empty($this->title) &&
               !empty($this->description) && strlen($this->description) >= 50 &&
               $this->sections()->whereHas('lessons')->count() > 0 &&
               $hasDuration &&
               ($this->pricing_type === 'free' ||
                ($this->pricing_type === 'purchase' && $this->price > 0) ||
                ($this->pricing_type === 'subscription' && $this->required_subscription_tier_id) ||
                ($this->pricing_type === 'both' && $this->price > 0 && $this->required_subscription_tier_id));
    }

    /**
     * Submit the course for approval.
     */
    public function submitForApproval(): void
    {
        $this->update([
            'approval_status' => 'submitted',
            'submitted_at' => now(),
            'editing_locked' => true,
        ]);

        
        $admins = User::whereHas('roles', function ($query) {
            $query->where('name', 'admin');
        })->get();

        foreach ($admins as $admin) {
            $admin->notify(new \App\Notifications\CourseSubmittedForApprovalNotification($this, $this->user));
        }
    }

    /**
     * Approve the course by an admin.
     */
    public function approveByAdmin(User $admin, ?string $notes = null): void
    {
        $this->update([
            'approval_status' => 'approved',
            'approved_at' => now(),
            'reviewed_by_admin_id' => $admin->id,
            'is_published' => true,
            'published_at' => now(),
            'editing_locked' => false,
            'approval_notes' => $notes ? ['approval_notes' => $notes] : null,
        ]);

        
        $this->user->notify(new \App\Notifications\CourseApprovedNotification($this, $admin, $notes));
    }

    /**
     * Reject the course by an admin.
     */
    public function rejectByAdmin(User $admin, string $reason, ?string $notes = null): void
    {
        $this->update([
            'approval_status' => 'rejected',
            'rejected_at' => now(),
            'reviewed_by_admin_id' => $admin->id,
            'rejection_reason' => $reason,
            'editing_locked' => false,
            'approval_notes' => $notes ? ['rejection_notes' => $notes] : null,
        ]);

        
        $this->user->notify(new \App\Notifications\CourseRejectedNotification($this, $admin, $reason, $notes));
    }

    /**
     * Lock the course for review.
     */
    public function lockForReview(): void
    {
        $this->update(['editing_locked' => true]);
    }

    /**
     * Unlock the course for editing.
     */
    public function unlockForEditing(): void
    {
        $this->update(['editing_locked' => false]);
    }

     public function getRouteKeyName()
    {
        return 'slug';
    }

    /**
     * Validate pricing setup for publishing.
     */
    public function validatePricingSetup(): array
    {
        $errors = [];

        switch ($this->pricing_type) {
            case 'purchase':
            case 'both':
                if (!$this->price || $this->price <= 0) {
                    $errors[] = 'Course price is required and must be greater than 0 for purchase options';
                }
                if ($this->pricing_type === 'both' && !$this->required_subscription_tier_id) {
                    $errors[] = 'Subscription tier is required when both purchase and subscription options are enabled';
                }
                break;

            case 'subscription':
                if (!$this->required_subscription_tier_id) {
                    $errors[] = 'Subscription tier is required for subscription-only courses';
                }
                break;

            case 'free':
                
                break;

            default:
                $errors[] = 'Invalid pricing type specified';
        }

        return $errors;
    }
}
