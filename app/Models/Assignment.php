<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

final class Assignment extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'course_section_id',
        'title',
        'description',
        'instructions',
        'due_date',
        'points_possible',
        'allowed_submission_types',
        'unlock_date',
        'order',
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'unlock_date' => 'datetime',
        'allowed_submission_types' => 'array',
    ];

    public function courseSection(): BelongsTo
    {
        return $this->belongsTo(CourseSection::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(AssignmentSubmission::class);
    }

    
    public function lessonLinkingThis(): HasOne 
    {
        return $this->hasOne(Lesson::class, 'linked_assignment_id');
    }
}
