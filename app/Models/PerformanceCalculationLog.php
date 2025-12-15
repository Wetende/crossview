<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class PerformanceCalculationLog extends Model
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
        'previous_score',
        'new_score',
        'change',
        'calculated_by',
        'calculation_type',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'previous_score' => 'float',
        'new_score' => 'float',
        'change' => 'float',
    ];

    /**
     * Get the user that this calculation log belongs to.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the subject that this calculation log belongs to.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * Get the grade level that this calculation log belongs to.
     */
    public function gradeLevel(): BelongsTo
    {
        return $this->belongsTo(GradeLevel::class);
    }

    /**
     * Get the performance metric that this calculation log belongs to.
     */
    public function performanceMetric(): BelongsTo
    {
        return $this->belongsTo(PerformanceMetric::class);
    }

    /**
     * Get the user who calculated this performance.
     */
    public function calculatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'calculated_by');
    }
}
