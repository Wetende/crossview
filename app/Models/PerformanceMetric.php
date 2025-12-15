<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class PerformanceMetric extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'type',
        'icon_path',
        'color_code',
        'is_active',
        'display_order',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'is_active' => 'boolean',
        'display_order' => 'integer',
    ];

    /**
     * Get the subject performance metrics for this performance metric.
     */
    public function subjectPerformanceMetrics(): HasMany
    {
        return $this->hasMany(SubjectPerformanceMetric::class);
    }

    /**
     * Get the subjects that use this performance metric.
     */
    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'subject_performance_metrics')
            ->withPivot('weight', 'is_active')
            ->withTimestamps();
    }

    /**
     * Get the student performances for this metric.
     */
    public function studentPerformances(): HasMany
    {
        return $this->hasMany(StudentPerformance::class);
    }

    /**
     * Get the icon URL attribute.
     */
    public function getIconUrlAttribute(): ?string
    {
        if (empty($this->icon_path)) {
            return null;
        }

        if (str_starts_with($this->icon_path, 'http')) {
            return $this->icon_path;
        }

        return asset('storage/' . $this->icon_path);
    }
}
