<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

final class AssignmentSubmission extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'assignment_id',
        'user_id',
        'submitted_at',
        'submission_type', 
        'file_path',
        'url',
        'text_content',
        'is_late',
        'grade',
        'graded_at',
        'teacher_feedback',
        'grading_teacher_id',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'grade' => 'decimal:2',
        'graded_at' => 'datetime',
        'is_late' => 'boolean',
    ];

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(Assignment::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function gradingTeacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'grading_teacher_id');
    }
}
