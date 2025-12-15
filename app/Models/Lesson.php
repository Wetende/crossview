<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Enums\LessonType;

final class Lesson extends Model
{
    use HasFactory;
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'course_id',
        'course_section_id',
        'title',
        'slug',
        'lesson_type',
        'order',
        'is_published',
        'is_preview_allowed',
        'unlock_date',
        'unlock_after_purchase_days',
        'short_description',
        'content',
        'lesson_duration',
        'video_url',
        'video_source',
        'video_upload_path',
        'video_embed_code',
        'enable_p_in_p',
        'enable_download',
        'auto_play',
        'show_controls',
        'allow_download',
        'stream_url',
        'stream_password',
        'stream_start_time',
        'stream_details',
        'is_recorded',
        'recording_url',
        'notify_students',
        'allow_chat',
        'require_attendance',
        'quiz_id',
        'assignment_id',
        'instructions',
        'enable_print',
        'enable_copy',
        'allow_bulk_download',
        'track_downloads',
        'require_completion',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'lesson_type' => LessonType::class,
        'order' => 'integer',
        'is_published' => 'boolean',
        'is_preview_allowed' => 'boolean',
        'unlock_date' => 'datetime',
        'lesson_duration' => 'integer',
        'enable_p_in_p' => 'boolean',
        'enable_download' => 'boolean',
        'auto_play' => 'boolean',
        'show_controls' => 'boolean',
        'allow_download' => 'boolean',
        'stream_start_time' => 'datetime',
        'is_recorded' => 'boolean',
        'notify_students' => 'boolean',
        'allow_chat' => 'boolean',
        'require_attendance' => 'boolean',
        'enable_print' => 'boolean',
        'enable_copy' => 'boolean',
        'allow_bulk_download' => 'boolean',
        'track_downloads' => 'boolean',
        'require_completion' => 'boolean',
    ];

    /**
     * Get the course that owns the lesson.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the quiz for the lesson.
     */
    public function quiz(): HasOne
    {
        return $this->hasOne(Quiz::class);
    }

    /**
     * Get the attachments for the lesson.
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(LessonAttachment::class);
    }

    /**
     * Get the completions for the lesson.
     */
    public function completions(): HasMany
    {
        return $this->hasMany(LessonCompletion::class);
    }

    /**
     * Check if the lesson is completed by a specific user
     */
    public function isCompletedByUser(int $userId): bool
    {
        return $this->completions()
            ->where('user_id', $userId)
            ->exists();
    }

    /**
     * Get the course section that owns the lesson.
     */
    public function section(): BelongsTo
    {
        return $this->belongsTo(CourseSection::class, 'course_section_id');
    }

    /**
     * Get the course section that owns the lesson.
     */
    public function courseSection(): BelongsTo
    {
        return $this->belongsTo(CourseSection::class, 'course_section_id');
    }

    /**
     * Get the previous lesson in the same course
     */
    public function getPreviousLesson(): ?Lesson
    {
        $courseSection = $this->section;

        
        if (!$courseSection) {
            return null;
        }

        $courseSections = $this->course->sections()->orderBy('order')->get();
        $currentSectionIndex = $courseSections->search(function ($section) use ($courseSection) {
            return $section->id === $courseSection->id;
        });

        
        $previousLesson = Lesson::where('course_section_id', $this->course_section_id)
            ->where('order', '<', $this->order)
            ->where('is_published', true)
            ->orderBy('order', 'desc')
            ->first();

        if ($previousLesson) {
            return $previousLesson;
        }

        
        if ($currentSectionIndex > 0) {
            for ($i = $currentSectionIndex - 1; $i >= 0; $i--) {
                $previousSection = $courseSections[$i];
                $lastLessonInPreviousSection = Lesson::where('course_section_id', $previousSection->id)
                    ->where('is_published', true)
                    ->orderBy('order', 'desc')
                    ->first();

                if ($lastLessonInPreviousSection) {
                    return $lastLessonInPreviousSection;
                }
            }
        }

        return null;
    }

    /**
     * Get the next lesson in the same course
     */
    public function getNextLesson(): ?Lesson
    {
        $courseSection = $this->section;

        
        if (!$courseSection) {
            return null;
        }

        $courseSections = $this->course->sections()->orderBy('order')->get();
        $currentSectionIndex = $courseSections->search(function ($section) use ($courseSection) {
            return $section->id === $courseSection->id;
        });

        
        $nextLesson = Lesson::where('course_section_id', $this->course_section_id)
            ->where('order', '>', $this->order)
            ->where('is_published', true)
            ->orderBy('order')
            ->first();

        if ($nextLesson) {
            return $nextLesson;
        }

        
        if ($currentSectionIndex !== false && $currentSectionIndex < $courseSections->count() - 1) {
            for ($i = $currentSectionIndex + 1; $i < $courseSections->count(); $i++) {
                $nextSection = $courseSections[$i];
                $firstLessonInNextSection = Lesson::where('course_section_id', $nextSection->id)
                    ->where('is_published', true)
                    ->orderBy('order')
                    ->first();

                if ($firstLessonInNextSection) {
                    return $firstLessonInNextSection;
                }
            }
        }

        return null;
    }

    /**
     * Scope a query to only include published lessons.
     */
    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    /**
     * Scope a query to only include free lessons.
     */
    public function scopeFree($query)
    {
        return $query;
    }

    public function linkedQuiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class, 'quiz_id');
    }

    public function linkedAssignment(): BelongsTo
    {
        return $this->belongsTo(Assignment::class, 'assignment_id');
    }
}
