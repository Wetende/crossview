<?php

declare(strict_types=1);

namespace App\Models;


use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Cache; 




final class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory;
    use Notifiable;
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'name',
        'email',
        'password',
        'profile_picture_path',
        'phone_number',
        'email_verified_at',
        'phone_verified_at',
        'notification_preferences',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'password' => 'hashed',
            'notification_preferences' => 'json',
        ];
    }

    /**
     * Get the roles that belong to the user.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }

    /**
     * Get the courses created by the user as a teacher.
     */
    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    /**
     * Get the teacher profile associated with the user.
     */
    public function teacherProfile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(TeacherProfile::class);
    }

    /**
     * Get the student profile associated with the user.
     */
    public function studentProfile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(StudentProfile::class);
    }

    /**
     * Get the subjects that a teacher specializes in.
     */
    public function specializedSubjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'teacher_subjects');
    }

    /**
     * Get the payment details associated with the teacher user.
     */
    public function paymentDetail(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(TeacherPaymentDetail::class);
    }

    /**
     * Get the user's course purchases.
     */
    public function coursePurchases(): HasMany
    {
        return $this->hasMany(CoursePurchase::class);
    }

    /**
     * Get the user's subscriptions.
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(UserSubscription::class);
    }

    /**
     * Get the user's payments.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Get the user's lesson completions.
     */
    public function lessonCompletions(): HasMany
    {
        return $this->hasMany(LessonCompletion::class);
    }

    /**
     * Get the user's quiz attempts.
     */
    public function quizAttempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    /**
     * Get the user's forum topics.
     */
    public function forumTopics(): HasMany
    {
        return $this->hasMany(ForumTopic::class);
    }

    /**
     * Get the user's forum posts.
     */
    public function forumPosts(): HasMany
    {
        return $this->hasMany(ForumPost::class);
    }

    /**
     * Get the user's course reviews.
     */
    public function courseReviews(): HasMany
    {
        return $this->hasMany(CourseReview::class);
    }

    /**
     * Get the user's payouts (for teachers).
     */
    public function payouts(): HasMany
    {
        return $this->hasMany(TeacherPayout::class);
    }

    /**
     * Get the user's enrollments.
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * Get the user's orders.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Get the user's points.
     */
    public function points(): HasMany
    {
        return $this->hasMany(UserPoint::class);
    }

    /**
     * Get the user's leaderboard entries.
     */
    public function leaderboardEntries(): HasMany
    {
        return $this->hasMany(LeaderboardEntry::class);
    }

    /**
     * Scope a query to only include users of a specific role.
     */
    public function scopeRole($query, string $roleName)
    {
        return $query->whereHas('roles', function ($query) use ($roleName) {
            $query->where('name', $roleName);
        });
    }

    /**
     * Check if the user has a specific role.
     */
    public function hasRole(string $roleName): bool
    {
        return $this->roles()->where('name', $roleName)->exists();
    }

    /**
     * Check if the user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    /**
     * Check if the user is a teacher.
     */
    public function isTeacher(): bool
    {
        return $this->hasRole('teacher');
    }

    /**
     * Check if the user is a student.
     */
    public function isStudent(): bool
    {
        return $this->hasRole('student');
    }

    /**
     * Check if the user is a parent.
     */
    public function isParent(): bool
    {
        return $this->hasRole('parent');
    }

    /**
     * Get the user's currently active subscription.
     * Uses Cache for performance within a single request lifecycle.
     */
    public function activeSubscription(): ?UserSubscription
    {
        return Cache::remember("user_{$this->id}_active_subscription", now()->addMinutes(1), function () {
            return $this->subscriptions()->currentlyActive()->latest('started_at')->first();
        });
    }

    /**
     * Check if the user has an active subscription.
     */
    public function hasActiveSubscription(): bool
    {
        return $this->activeSubscription() !== null;
    }

    /**
     * Get the tier of the user's currently active subscription.
     */
    public function activeSubscriptionTier(): ?SubscriptionTier
    {
        return $this->activeSubscription()?->tier;
    }

    /**
     * Count the number of currently active enrollments obtained via subscription.
     */
    public function countActiveSubscriptionEnrollments(): int
    {
        
        return $this->enrollments()
                    ->where('access_type', 'subscription')
                    ->where('status', 'active') 
                    ->count();
    }

    /**
     * Check if the user is allowed to enroll in more courses based on subscription limit.
     */
    public function isEnrollmentAllowedByMaxCoursesLimit(): bool
    {
        $activeSubscription = $this->activeSubscription();
        if (!$activeSubscription || !$activeSubscription->tier) {
            return false; 
        }

        $maxCourses = $activeSubscription->tier->max_courses;
        if ($maxCourses === null || $maxCourses < 0) { 
            return true;
        }

        return $this->countActiveSubscriptionEnrollments() < $maxCourses;
    }

    /**
     * Check if the user can access a specific course via their subscription.
     */
    public function canAccessCourseViaSubscription(Course $course): bool
    {
        
        if (!$this->hasActiveSubscription()) {
            return false;
        }

        
        
        return true;
    }

    /**
     * Get the students linked to this parent.
     */
    public function linkedStudents(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'parent_student',
            'parent_user_id',
            'student_user_id'
        )->withPivot(['status', 'requested_at', 'actioned_at', 'created_at'])
        ->wherePivot('status', 'active');
    }

    /**
     * Get the parents linked to this student.
     */
    public function linkedParents(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'parent_student',
            'student_user_id',
            'parent_user_id'
        )->withPivot(['status', 'requested_at', 'actioned_at', 'created_at'])
        ->wherePivot('status', 'active');
    }

    /**
     * Get the invite codes generated by this student user.
     */
    public function inviteCodes(): HasMany
    {
        return $this->hasMany(InviteCode::class, 'student_user_id');
    }

    /**
     * Get the badges belonging to the user.
     */
    public function badges(): BelongsToMany
    {
        return $this->belongsToMany(Badge::class, 'user_badges')
            ->withPivot('earned_at', 'award_reason')
            ->withTimestamps();
    }

    /**
     * Get the user's badge awards.
     */
    public function userBadges(): HasMany
    {
        return $this->hasMany(UserBadge::class);
    }

    /**
     * Get the user's active subscription as an attribute.
     * This allows using $user->activeSubscription syntax.
     */
    public function getActiveSubscriptionAttribute(): ?UserSubscription
    {
        return $this->activeSubscription();
    }

    /**
     * Check if the user is subscribed to a specific tier.
     */
    public function isSubscribedToTier(int $tierId): bool
    {
        return $this->hasActiveSubscription() &&
               $this->activeSubscription->subscription_tier_id === $tierId;
    }

    /**
     * Check if the user has access to a subscription level.
     */
    public function hasSubscriptionLevel(int $level): bool
    {
        return $this->hasActiveSubscription() &&
               $this->activeSubscription->tier->level >= $level;
    }

    /**
     * Get the subscription tier level of the user.
     */
    public function getSubscriptionLevelAttribute(): int
    {
        return $this->hasActiveSubscription() ?
               $this->activeSubscription->tier->level :
               -1; 
    }
}
