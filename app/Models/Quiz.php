<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

final class Quiz extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'course_section_id',
        'user_id',
        'title',
        'description',
        'time_limit',
        'time_limit_unit',
        'passing_grade',
        'max_attempts',
        'is_published',
        'randomize_questions',
        'show_correct_answer',
        'retake_penalty_percent',
        'style',
        'order',
        'subject_id',
    ];

    protected $casts = [
        'randomize_questions' => 'boolean',
        'show_correct_answer' => 'boolean',
        'is_published' => 'boolean',
        'passing_grade' => 'decimal:2',
        'retake_penalty_percent' => 'decimal:2',
        'time_limit' => 'integer',
        'max_attempts' => 'integer',
        'order' => 'integer',
    ];

    public function courseSection(): BelongsTo
    {
        return $this->belongsTo(CourseSection::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class)->orderBy('order');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function quizAttempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->hasOneThrough(Course::class, CourseSection::class, 'id', 'id', 'course_section_id', 'course_id');
    }
}
