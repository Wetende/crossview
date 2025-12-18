<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AcademicBlueprint;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\CurriculumNode;
use App\Models\Lesson;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

final class LegacyMigrationService
{
    private array $migrationReport = [
        'courses' => ['total' => 0, 'migrated' => 0, 'errors' => []],
        'sections' => ['total' => 0, 'migrated' => 0, 'errors' => []],
        'lessons' => ['total' => 0, 'migrated' => 0, 'errors' => []],
    ];

    private ?AcademicBlueprint $defaultBlueprint = null;
    private array $courseNodeMap = [];
    private array $sectionNodeMap = [];

    /**
     * Create the default theology blueprint for legacy data.
     */
    public function createDefaultTheologyBlueprint(): AcademicBlueprint
    {
        return AcademicBlueprint::firstOrCreate(
            ['name' => 'Legacy Theology'],
            [
                'description' => 'Default blueprint for migrated legacy Course/Section/Lesson structure',
                'hierarchy_structure' => ['Course', 'Section', 'Lesson'],
                'grading_logic' => [
                    'type' => 'weighted',
                    'pass_mark' => 40,
                    'components' => [
                        ['name' => 'CAT', 'weight' => 0.3],
                        ['name' => 'Exam', 'weight' => 0.7],
                    ],
                ],
                'progression_rules' => [
                    'sequential' => false,
                ],
                'gamification_enabled' => true,
                'certificate_enabled' => true,
            ]
        );
    }

    /**
     * Run the full migration process.
     */
    public function migrate(bool $dryRun = false): array
    {
        $this->resetReport();

        if (!$dryRun) {
            DB::beginTransaction();
        }

        try {
            $this->defaultBlueprint = $this->createDefaultTheologyBlueprint();

            $this->migrateCoursesToNodes($dryRun);
            $this->migrateSectionsToNodes($dryRun);
            $this->migrateLessonsToNodes($dryRun);

            if (!$dryRun) {
                DB::commit();
            }
        } catch (\Exception $e) {
            if (!$dryRun) {
                DB::rollBack();
            }

            Log::error('Legacy migration failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }

        return $this->generateReport();
    }

    /**
     * Migrate courses to root curriculum nodes.
     */
    public function migrateCoursesToNodes(bool $dryRun = false): Collection
    {
        // Get courses that need migration: either no blueprint or no curriculum nodes yet
        $courses = Course::where(function ($query) {
            $query->whereNull('blueprint_id')
                  ->orWhereDoesntHave('curriculumNodes');
        })->get();

        $this->migrationReport['courses']['total'] = $courses->count();
        $migratedNodes = collect();

        foreach ($courses as $course) {
            try {
                // Skip if course already has curriculum nodes
                if ($course->curriculumNodes()->exists()) {
                    continue;
                }

                if ($dryRun) {
                    $this->migrationReport['courses']['migrated']++;
                    continue;
                }

                // Update course to use default blueprint
                $course->update(['blueprint_id' => $this->defaultBlueprint->id]);

                // Create root node for course
                $node = CurriculumNode::create([
                    'course_id' => $course->id,
                    'parent_id' => null,
                    'node_type' => 'course',
                    'title' => $course->title,
                    'code' => $course->slug,
                    'description' => $course->description,
                    'properties' => $this->mapCourseProperties($course),
                    'completion_rules' => [],
                    'position' => $course->position ?? 0,
                    'is_published' => $course->is_published ?? false,
                ]);

                $this->courseNodeMap[$course->id] = $node->id;
                $migratedNodes->push($node);
                $this->migrationReport['courses']['migrated']++;
            } catch (\Exception $e) {
                $this->migrationReport['courses']['errors'][] = [
                    'course_id' => $course->id,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return $migratedNodes;
    }

    /**
     * Migrate course sections to child nodes.
     */
    public function migrateSectionsToNodes(bool $dryRun = false): Collection
    {
        // Get sections for courses that have been migrated (have blueprint_id set)
        $sections = CourseSection::whereHas('course', function ($query) {
            $query->whereNotNull('blueprint_id');
        })->get();

        $this->migrationReport['sections']['total'] = $sections->count();
        $migratedNodes = collect();

        foreach ($sections as $section) {
            try {
                // Check if section already has a corresponding node
                $existingNode = CurriculumNode::where('course_id', $section->course_id)
                    ->where('node_type', 'section')
                    ->whereJsonContains('properties->legacy_section_id', $section->id)
                    ->first();

                if ($existingNode) {
                    $this->sectionNodeMap[$section->id] = $existingNode->id;
                    continue;
                }

                $parentNodeId = $this->courseNodeMap[$section->course_id] ?? null;

                if (!$parentNodeId && !$dryRun) {
                    // Try to find existing course node
                    $parentNode = CurriculumNode::where('course_id', $section->course_id)
                        ->whereNull('parent_id')
                        ->first();
                    $parentNodeId = $parentNode?->id;
                }

                if (!$parentNodeId && !$dryRun) {
                    throw new \Exception("Parent course node not found for section {$section->id}");
                }

                if ($dryRun) {
                    $this->migrationReport['sections']['migrated']++;
                    continue;
                }

                $node = CurriculumNode::create([
                    'course_id' => $section->course_id,
                    'parent_id' => $parentNodeId,
                    'node_type' => 'section',
                    'title' => $section->title,
                    'description' => $section->description,
                    'properties' => $this->mapSectionProperties($section),
                    'completion_rules' => [],
                    'position' => $section->order ?? 0,
                    'is_published' => $section->is_published ?? false,
                ]);

                $this->sectionNodeMap[$section->id] = $node->id;
                $migratedNodes->push($node);
                $this->migrationReport['sections']['migrated']++;
            } catch (\Exception $e) {
                $this->migrationReport['sections']['errors'][] = [
                    'section_id' => $section->id,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return $migratedNodes;
    }

    /**
     * Migrate lessons to child nodes.
     */
    public function migrateLessonsToNodes(bool $dryRun = false): Collection
    {
        // Get lessons for courses that have been migrated (have blueprint_id set)
        $lessons = Lesson::whereHas('course', function ($query) {
            $query->whereNotNull('blueprint_id');
        })->get();

        $this->migrationReport['lessons']['total'] = $lessons->count();
        $migratedNodes = collect();

        foreach ($lessons as $lesson) {
            try {
                // Check if lesson already has a corresponding node
                $existingNode = CurriculumNode::where('course_id', $lesson->course_id)
                    ->where('node_type', 'lesson')
                    ->whereJsonContains('properties->legacy_lesson_id', $lesson->id)
                    ->first();

                if ($existingNode) {
                    continue;
                }

                $parentNodeId = $this->sectionNodeMap[$lesson->course_section_id] ?? null;

                if (!$parentNodeId && !$dryRun) {
                    // Try to find existing section node by legacy_section_id
                    $parentNode = CurriculumNode::where('course_id', $lesson->course_id)
                        ->where('node_type', 'section')
                        ->whereJsonContains('properties->legacy_section_id', $lesson->course_section_id)
                        ->first();
                    $parentNodeId = $parentNode?->id;
                }

                if (!$parentNodeId && !$dryRun) {
                    // Fall back to course node if section not found
                    $parentNode = CurriculumNode::where('course_id', $lesson->course_id)
                        ->whereNull('parent_id')
                        ->first();
                    $parentNodeId = $parentNode?->id;
                }

                if ($dryRun) {
                    $this->migrationReport['lessons']['migrated']++;
                    continue;
                }

                $node = CurriculumNode::create([
                    'course_id' => $lesson->course_id,
                    'parent_id' => $parentNodeId,
                    'node_type' => 'lesson',
                    'title' => $lesson->title,
                    'code' => $lesson->slug,
                    'description' => $lesson->short_description,
                    'properties' => $this->mapLessonProperties($lesson),
                    'completion_rules' => $this->mapLessonCompletionRules($lesson),
                    'position' => $lesson->order ?? 0,
                    'is_published' => $lesson->is_published ?? false,
                ]);

                $migratedNodes->push($node);
                $this->migrationReport['lessons']['migrated']++;
            } catch (\Exception $e) {
                $this->migrationReport['lessons']['errors'][] = [
                    'lesson_id' => $lesson->id,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return $migratedNodes;
    }

    /**
     * Rollback migration by removing curriculum nodes.
     */
    public function rollbackMigration(): void
    {
        DB::transaction(function () {
            // Remove all curriculum nodes
            CurriculumNode::query()->forceDelete();

            // Reset blueprint associations
            Course::whereNotNull('blueprint_id')->update(['blueprint_id' => null]);

            // Optionally remove the legacy blueprint
            AcademicBlueprint::where('name', 'Legacy Theology')->forceDelete();
        });
    }

    /**
     * Generate migration report.
     */
    public function generateReport(): array
    {
        return [
            'summary' => [
                'courses' => [
                    'total' => $this->migrationReport['courses']['total'],
                    'migrated' => $this->migrationReport['courses']['migrated'],
                    'failed' => count($this->migrationReport['courses']['errors']),
                ],
                'sections' => [
                    'total' => $this->migrationReport['sections']['total'],
                    'migrated' => $this->migrationReport['sections']['migrated'],
                    'failed' => count($this->migrationReport['sections']['errors']),
                ],
                'lessons' => [
                    'total' => $this->migrationReport['lessons']['total'],
                    'migrated' => $this->migrationReport['lessons']['migrated'],
                    'failed' => count($this->migrationReport['lessons']['errors']),
                ],
            ],
            'errors' => [
                'courses' => $this->migrationReport['courses']['errors'],
                'sections' => $this->migrationReport['sections']['errors'],
                'lessons' => $this->migrationReport['lessons']['errors'],
            ],
            'timestamp' => now()->toIso8601String(),
        ];
    }

    private function mapCourseProperties(Course $course): array
    {
        return [
            'legacy_course_id' => $course->id,
            'thumbnail_path' => $course->thumbnail_path,
            'price' => $course->price,
            'pricing_type' => $course->pricing_type,
            'level' => $course->level,
            'language' => $course->language,
            'requirements' => $course->requirements,
            'what_you_will_learn' => $course->what_you_will_learn,
            'tags' => $course->tags,
            'duration_in_minutes' => $course->duration_in_minutes,
            'is_featured' => $course->is_featured,
            'category_id' => $course->category_id,
            'subject_id' => $course->subject_id,
            'grade_level_id' => $course->grade_level_id,
        ];
    }

    private function mapSectionProperties(CourseSection $section): array
    {
        return [
            'legacy_section_id' => $section->id,
            'unlock_date' => $section->unlock_date?->toIso8601String(),
            'unlock_after_days' => $section->unlock_after_days,
        ];
    }

    private function mapLessonProperties(Lesson $lesson): array
    {
        $properties = [
            'legacy_lesson_id' => $lesson->id,
            'lesson_type' => $lesson->lesson_type?->value,
            'content' => $lesson->content,
            'lesson_duration' => $lesson->lesson_duration,
            'is_preview_allowed' => $lesson->is_preview_allowed,
        ];

        // Video content
        if ($lesson->video_url) {
            $properties['video_url'] = $lesson->video_url;
            $properties['video_source'] = $lesson->video_source;
            $properties['video_upload_path'] = $lesson->video_upload_path;
            $properties['video_embed_code'] = $lesson->video_embed_code;
            $properties['enable_p_in_p'] = $lesson->enable_p_in_p;
            $properties['auto_play'] = $lesson->auto_play;
            $properties['show_controls'] = $lesson->show_controls;
        }

        // Stream content
        if ($lesson->stream_url) {
            $properties['stream_url'] = $lesson->stream_url;
            $properties['stream_password'] = $lesson->stream_password;
            $properties['stream_start_time'] = $lesson->stream_start_time?->toIso8601String();
            $properties['stream_details'] = $lesson->stream_details;
            $properties['is_recorded'] = $lesson->is_recorded;
            $properties['recording_url'] = $lesson->recording_url;
        }

        // Attachments
        $attachments = $lesson->attachments()->get()->map(function ($attachment) {
            return [
                'name' => $attachment->name ?? $attachment->file_name,
                'url' => $attachment->file_path ?? $attachment->url,
                'type' => $attachment->file_type ?? 'file',
            ];
        })->toArray();

        if (!empty($attachments)) {
            $properties['attachments'] = $attachments;
        }

        return $properties;
    }

    private function mapLessonCompletionRules(Lesson $lesson): array
    {
        return [
            'require_completion' => $lesson->require_completion ?? false,
            'enable_download' => $lesson->enable_download ?? false,
            'allow_download' => $lesson->allow_download ?? false,
        ];
    }

    private function resetReport(): void
    {
        $this->migrationReport = [
            'courses' => ['total' => 0, 'migrated' => 0, 'errors' => []],
            'sections' => ['total' => 0, 'migrated' => 0, 'errors' => []],
            'lessons' => ['total' => 0, 'migrated' => 0, 'errors' => []],
        ];
        $this->courseNodeMap = [];
        $this->sectionNodeMap = [];
    }
}
