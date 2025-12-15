<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class TeacherProfile extends Model
{
    use HasFactory;

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'user_id';

    /**
     * Indicates if the model's ID is auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'bio',
        'qualifications',
        'school_affiliation',
        'position',
        'hourly_rate',
        'available_for_tutoring',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'hourly_rate' => 'decimal:2',
        'available_for_tutoring' => 'boolean',
    ];

    /**
     * Get the user that owns the profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Generate instructor information for course creation.
     */
    public function generateCourseInstructorInfo(): string
    {
        $info = [];

        
        if (!empty($this->bio)) {
            $info[] = $this->bio;
        }

        
        $credentials = [];
        if (!empty($this->position)) {
            $credentials[] = $this->position;
        }
        if (!empty($this->school_affiliation)) {
            $credentials[] = $this->school_affiliation;
        }
        if (!empty($credentials)) {
            $info[] = implode(' at ', $credentials);
        }

        
        if (!empty($this->qualifications)) {
            $info[] = "Qualifications: " . $this->qualifications;
        }

        
        if (empty($info)) {
            $userName = $this->user->name ?? 'Instructor';
            return "{$userName} is an experienced educator dedicated to providing quality learning experiences.";
        }

        return implode("\n\n", $info);
    }

    /**
     * Check if the teacher profile is complete enough for course creation.
     */
    public function isProfileComplete(): bool
    {
        return !empty($this->bio) || (!empty($this->position) && !empty($this->school_affiliation));
    }

    /**
     * Get profile completeness percentage.
     */
    public function getCompletenessPercentage(): int
    {
        $totalFields = 5; 
        $completedFields = 0;

        if (!empty($this->bio)) {
            $completedFields++;
        }
        if (!empty($this->qualifications)) {
            $completedFields++;
        }
        if (!empty($this->position)) {
            $completedFields++;
        }
        if (!empty($this->school_affiliation)) {
            $completedFields++;
        }
        if (!empty($this->hourly_rate)) {
            $completedFields++;
        }

        return (int) round(($completedFields / $totalFields) * 100);
    }

    /**
     * Get missing profile fields.
     */
    public function getMissingFields(): array
    {
        $missingFields = [];

        if (empty($this->bio)) {
            $missingFields[] = 'bio';
        }
        if (empty($this->qualifications)) {
            $missingFields[] = 'qualifications';
        }
        if (empty($this->position)) {
            $missingFields[] = 'position';
        }
        if (empty($this->school_affiliation)) {
            $missingFields[] = 'school_affiliation';
        }

        return $missingFields;
    }

    /**
     * Check if profile has minimum required information for publishing courses.
     */
    public function hasMinimumInfoForPublishing(): bool
    {
        
        return !empty($this->bio) || (!empty($this->position) && !empty($this->school_affiliation));
    }

    /**
     * Get user-friendly field names for display.
     */
    public function getFieldDisplayNames(): array
    {
        return [
            'bio' => 'Professional Bio',
            'qualifications' => 'Qualifications & Certifications',
            'position' => 'Position/Title',
            'school_affiliation' => 'School/Institution',
            'hourly_rate' => 'Hourly Rate'
        ];
    }
}
