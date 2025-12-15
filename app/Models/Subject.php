<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

final class Subject extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon_path',
        'color_code',
        'is_active',
        'has_performance_tracking',
        'subject_category_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'has_performance_tracking' => 'boolean',
    ];

    /**
     * Get the category that the subject belongs to.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(SubjectCategory::class, 'subject_category_id');
    }

    /**
     * Get the courses for this subject.
     */
    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    /**
     * Get the quizzes for this subject.
     */
    public function quizzes(): HasMany
    {
        return $this->hasMany(Quiz::class);
    }

    /**
     * Get the past papers for this subject.
     */
    public function pastPapers(): HasMany
    {
        return $this->hasMany(PastPaper::class);
    }

    /**
     * Get the teachers who teach this subject.
     */
    public function teachers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'teacher_subjects', 'subject_id', 'teacher_user_id');
    }

    /**
     * Get the performance metrics associated with this subject.
     */
    public function performanceMetrics(): BelongsToMany
    {
        return $this->belongsToMany(PerformanceMetric::class, 'subject_performance_metrics')
            ->withPivot('weight', 'is_active')
            ->withTimestamps();
    }

    /**
     * Get the student performances for this subject.
     */
    public function studentPerformances(): HasMany
    {
        return $this->hasMany(StudentPerformance::class);
    }

    /**
     * Get the student rankings for this subject.
     */
    public function studentRankings(): HasMany
    {
        return $this->hasMany(StudentRanking::class);
    }
}
