<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class StudentPerformance extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'subject_id',
        'grade_level_id',
        'performance_metric_id',
        'raw_score',
        'percentage_score',
        'level',
        'last_calculated_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'raw_score' => 'float',
        'percentage_score' => 'float',
        'last_calculated_at' => 'datetime',
    ];

    /**
     * Get the user that this performance belongs to.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the subject that this performance belongs to.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * Get the grade level that this performance belongs to.
     */
    public function gradeLevel(): BelongsTo
    {
        return $this->belongsTo(GradeLevel::class);
    }

    /**
     * Get the performance metric that this performance belongs to.
     */
    public function performanceMetric(): BelongsTo
    {
        return $this->belongsTo(PerformanceMetric::class);
    }

    /**
     * Get the performance level for this performance record.
     */
    public function performanceLevel(): BelongsTo
    {
        return $this->belongsTo(PerformanceLevel::class, 'level', 'name');
    }

    /**
     * Get the performance level based on percentage score (fallback method).
     */
    public function getPerformanceLevelByScore(): ?PerformanceLevel
    {
        return PerformanceLevel::where('min_score', '<=', $this->percentage_score)
            ->where('max_score', '>=', $this->percentage_score)
            ->first();
    }

    /**
     * Get the effective performance level (from relationship or calculated).
     */
    public function getEffectivePerformanceLevel(): ?PerformanceLevel
    {
        
        if (empty($this->level)) {
            return $this->getPerformanceLevelByScore();
        }

        
        try {
            $level = $this->performanceLevel;
            return $level ?? $this->getPerformanceLevelByScore();
        } catch (\Exception $e) {
            
            return $this->getPerformanceLevelByScore();
        }
    }

    /**
     * Get the proficiency level description based on percentage.
     */
    public function getProficiencyLevelAttribute(): string
    {
        if ($this->percentage_score >= 80) {
            return 'Distinction';
        } elseif ($this->percentage_score >= 65) {
            return 'Credit';
        } elseif ($this->percentage_score >= 50) {
            return 'Pass';
        } else {
            return 'Needs Improvement';
        }
    }

    /**
     * Get the color code for this performance level.
     */
    public function getColorCodeAttribute(): string
    {
        if ($this->percentage_score >= 80) {
            return '#28a745'; 
        } elseif ($this->percentage_score >= 65) {
            return '#17a2b8'; 
        } elseif ($this->percentage_score >= 50) {
            return '#ffc107'; 
        } else {
            return '#dc3545'; 
        }
    }
}
