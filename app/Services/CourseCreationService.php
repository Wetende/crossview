<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Course;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

final readonly class CourseCreationService
{
    /**
     * Create a new course instance
     */
    public function createCourse(array $data, ?UploadedFile $thumbnail, User $user, ?int $assignedTeacherId = null): Course
    {
        // Generate a unique slug
        $slug = $this->generateUniqueSlug($data['title']);
        
        // Handle thumbnail upload if provided
        $thumbnailPath = null;
        if ($thumbnail) {
            $thumbnailPath = $thumbnail->store('courses/thumbnails', 'public');
        }
        
        // Determine the instructor
        $instructor = $assignedTeacherId 
            ? User::findOrFail($assignedTeacherId) 
            : $user;
        
        // Get or create teacher profile if needed
        $teacherProfile = $this->getOrCreateTeacherProfile($instructor);
        
        // Generate instructor info
        $instructorInfo = $teacherProfile 
            ? $teacherProfile->generateCourseInstructorInfo()
            : "{$instructor->name} is an experienced educator dedicated to providing quality learning experiences.";
        
        // Create course data array
        $courseData = [
            'user_id' => $instructor->id,
            'title' => $data['title'],
            'slug' => $slug,
            'description' => $data['description'],
            'thumbnail_path' => $thumbnailPath,
            'instructor_info' => $instructorInfo,
            'is_published' => $data['is_published'] ?? false,
        ];
        
        // Add optional fields if present
        if (isset($data['short_description'])) {
            $courseData['short_description'] = $data['short_description'];
        }
        
        if (isset($data['language'])) {
            $courseData['language'] = $data['language'];
        }
        
        if (isset($data['level'])) {
            $courseData['level'] = $data['level'];
        }
        
        if (isset($data['category_id'])) {
            $courseData['category_id'] = $data['category_id'];
        }
        
        if (isset($data['subject_id'])) {
            $courseData['subject_id'] = $data['subject_id'];
        }
        
        if (isset($data['grade_level_id'])) {
            $courseData['grade_level_id'] = $data['grade_level_id'];
        }
        
        if (isset($data['tags'])) {
            $courseData['tags'] = $data['tags'];
        }
        
        if (isset($data['what_you_will_learn'])) {
            $courseData['what_you_will_learn'] = $data['what_you_will_learn'];
        }
        
        if (isset($data['requirements'])) {
            $courseData['requirements'] = $data['requirements'];
        }
        
        if (isset($data['price'])) {
            $courseData['price'] = $data['price'];
        }
        
        if (isset($data['required_subscription_tier_id'])) {
            $courseData['required_subscription_tier_id'] = $data['required_subscription_tier_id'];
        }
        
        // Create and return the course
        return Course::create($courseData);
    }
    
    /**
     * Generate a unique slug for the course
     */
    private function generateUniqueSlug(string $title): string
    {
        $slug = Str::slug($title);
        $baseSlug = $slug;
        $counter = 1;
        
        while (Course::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter++;
        }
        
        return $slug;
    }
    
    /**
     * Get or create a teacher profile for the user
     */
    private function getOrCreateTeacherProfile(User $user): ?TeacherProfile
    {
        if ($user->teacherProfile) {
            return $user->teacherProfile;
        }
        
        if ($user->hasRole('teacher') || $user->hasRole('admin')) {
            return TeacherProfile::create([
                'user_id' => $user->id,
                'bio' => 'Educator with access to course creation and management.',
                'position' => 'Educator',
                'school_affiliation' => 'Cross View College of Theology and Technology',
                'qualifications' => 'Educational content management expertise.',
                'hourly_rate' => null,
                'available_for_tutoring' => false,
            ]);
        }
        
        return null;
    }
} 