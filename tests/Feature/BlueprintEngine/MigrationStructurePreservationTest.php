<?php

declare(strict_types=1);

namespace Tests\Feature\BlueprintEngine;

use App\Models\Course;
use App\Models\CourseSection;
use App\Models\CurriculumNode;
use App\Models\Lesson;
use App\Services\LegacyMigrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * **Feature: blueprint-engine, Property 11: Migration Structure Preservation**
 * **Validates: Requirements 6.2, 6.3, 6.4**
 *
 * For any existing Course with Sections and Lessons, after migration the total
 * count of CurriculumNodes should equal (1 course + N sections + M lessons),
 * and parent-child relationships should mirror the original structure.
 */
final class MigrationStructurePreservationTest extends TestCase
{
    use RefreshDatabase;

    private LegacyMigrationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new LegacyMigrationService();
    }

    #[DataProvider('courseStructureProvider')]
    public function test_migration_preserves_structure_count(int $sectionCount, int $lessonsPerSection): void
    {
        // Create legacy structure
        $course = Course::factory()->create(['blueprint_id' => null]);

        $sections = [];
        for ($i = 0; $i < $sectionCount; $i++) {
            $section = CourseSection::factory()->create([
                'course_id' => $course->id,
                'order' => $i,
            ]);
            $sections[] = $section;

            for ($j = 0; $j < $lessonsPerSection; $j++) {
                Lesson::factory()->create([
                    'course_id' => $course->id,
                    'course_section_id' => $section->id,
                    'order' => $j,
                ]);
            }
        }

        $expectedNodeCount = 1 + $sectionCount + ($sectionCount * $lessonsPerSection);

        // Run migration
        $this->service->migrate();

        // Verify node count
        $actualNodeCount = CurriculumNode::where('course_id', $course->id)->count();
        $this->assertEquals($expectedNodeCount, $actualNodeCount);
    }

    public static function courseStructureProvider(): array
    {
        return [
            'one_section_one_lesson' => [1, 1],
            'one_section_three_lessons' => [1, 3],
            'two_sections_two_lessons' => [2, 2],
            'three_sections_three_lessons' => [3, 3],
            'five_sections_two_lessons' => [5, 2],
        ];
    }

    public function test_migration_preserves_parent_child_relationships(): void
    {
        $course = Course::factory()->create(['blueprint_id' => null]);

        $section1 = CourseSection::factory()->create([
            'course_id' => $course->id,
            'title' => 'Section 1',
            'order' => 0,
        ]);

        $section2 = CourseSection::factory()->create([
            'course_id' => $course->id,
            'title' => 'Section 2',
            'order' => 1,
        ]);

        $lesson1 = Lesson::factory()->create([
            'course_id' => $course->id,
            'course_section_id' => $section1->id,
            'title' => 'Lesson 1.1',
        ]);

        $lesson2 = Lesson::factory()->create([
            'course_id' => $course->id,
            'course_section_id' => $section2->id,
            'title' => 'Lesson 2.1',
        ]);

        $this->service->migrate();

        // Verify course node is root
        $courseNode = CurriculumNode::where('course_id', $course->id)
            ->where('node_type', 'course')
            ->first();

        $this->assertNotNull($courseNode);
        $this->assertNull($courseNode->parent_id);

        // Verify sections are children of course
        $sectionNodes = CurriculumNode::where('course_id', $course->id)
            ->where('node_type', 'section')
            ->get();

        $this->assertCount(2, $sectionNodes);
        foreach ($sectionNodes as $sectionNode) {
            $this->assertEquals($courseNode->id, $sectionNode->parent_id);
        }

        // Verify lessons are children of their respective sections
        $lessonNodes = CurriculumNode::where('course_id', $course->id)
            ->where('node_type', 'lesson')
            ->get();

        $this->assertCount(2, $lessonNodes);
        foreach ($lessonNodes as $lessonNode) {
            $this->assertNotNull($lessonNode->parent_id);
            $parent = CurriculumNode::find($lessonNode->parent_id);
            $this->assertEquals('section', $parent->node_type);
        }
    }

    public function test_migration_preserves_ordering(): void
    {
        $course = Course::factory()->create(['blueprint_id' => null]);

        // Create sections in reverse order
        for ($i = 4; $i >= 0; $i--) {
            $section = CourseSection::factory()->create([
                'course_id' => $course->id,
                'title' => "Section {$i}",
                'order' => $i,
            ]);

            for ($j = 2; $j >= 0; $j--) {
                Lesson::factory()->create([
                    'course_id' => $course->id,
                    'course_section_id' => $section->id,
                    'title' => "Lesson {$i}.{$j}",
                    'order' => $j,
                ]);
            }
        }

        $this->service->migrate();

        // Verify section ordering
        $sectionNodes = CurriculumNode::where('course_id', $course->id)
            ->where('node_type', 'section')
            ->orderBy('position')
            ->get();

        for ($i = 0; $i < 5; $i++) {
            $this->assertEquals($i, $sectionNodes[$i]->position);
        }
    }

    public function test_migration_creates_default_blueprint(): void
    {
        $course = Course::factory()->create(['blueprint_id' => null]);

        $this->service->migrate();

        $course->refresh();

        $this->assertNotNull($course->blueprint_id);
        $this->assertEquals('Legacy Theology', $course->blueprint->name);
        $this->assertEquals(['Course', 'Section', 'Lesson'], $course->blueprint->hierarchy_structure);
    }

    /**
     * Property test: For any random course structure,
     * migration should preserve the exact count.
     */
    #[DataProvider('randomStructureProvider')]
    public function test_random_structure_count_preserved(int $sections, int $lessons): void
    {
        $course = Course::factory()->create(['blueprint_id' => null]);

        for ($i = 0; $i < $sections; $i++) {
            $section = CourseSection::factory()->create([
                'course_id' => $course->id,
                'order' => $i,
            ]);

            for ($j = 0; $j < $lessons; $j++) {
                Lesson::factory()->create([
                    'course_id' => $course->id,
                    'course_section_id' => $section->id,
                    'order' => $j,
                ]);
            }
        }

        $expectedCount = 1 + $sections + ($sections * $lessons);

        $this->service->migrate();

        $actualCount = CurriculumNode::where('course_id', $course->id)->count();
        $this->assertEquals($expectedCount, $actualCount);
    }

    public static function randomStructureProvider(): array
    {
        $cases = [];

        for ($i = 0; $i < 10; $i++) {
            $sections = rand(1, 5);
            $lessons = rand(1, 4);
            $cases["random_{$i}"] = [$sections, $lessons];
        }

        return $cases;
    }
}
