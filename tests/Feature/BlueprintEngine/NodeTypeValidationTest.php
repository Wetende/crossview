<?php

declare(strict_types=1);

namespace Tests\Feature\BlueprintEngine;

use App\Exceptions\InvalidNodeTypeException;
use App\Models\AcademicBlueprint;
use App\Models\Course;
use App\Models\CurriculumNode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * **Feature: blueprint-engine, Property 5: Node Type Validation Against Blueprint**
 * **Validates: Requirements 2.2**
 *
 * For any CurriculumNode, the node_type must be one of the labels defined
 * in the associated program's blueprint hierarchy_structure. Invalid node_types
 * should be rejected.
 */
final class NodeTypeValidationTest extends TestCase
{
    use RefreshDatabase;

    #[DataProvider('validNodeTypeProvider')]
    public function test_accepts_valid_node_types(array $hierarchy, string $nodeType): void
    {
        $blueprint = AcademicBlueprint::factory()->create([
            'hierarchy_structure' => $hierarchy,
        ]);

        $course = Course::factory()->create([
            'blueprint_id' => $blueprint->id,
        ]);

        $node = CurriculumNode::create([
            'course_id' => $course->id,
            'parent_id' => null,
            'node_type' => $nodeType,
            'title' => 'Test Node',
            'position' => 0,
        ]);

        $this->assertDatabaseHas('curriculum_nodes', ['id' => $node->id]);
    }

    public static function validNodeTypeProvider(): array
    {
        return [
            'course_in_standard' => [['Course', 'Section', 'Lesson'], 'course'],
            'section_in_standard' => [['Course', 'Section', 'Lesson'], 'section'],
            'lesson_in_standard' => [['Course', 'Section', 'Lesson'], 'lesson'],
            'year_in_theology' => [['Year', 'Unit', 'Session'], 'year'],
            'unit_in_theology' => [['Year', 'Unit', 'Session'], 'unit'],
            'session_in_theology' => [['Year', 'Unit', 'Session'], 'session'],
            'level_in_tvet' => [['Level', 'Module', 'Competency'], 'level'],
            'module_in_tvet' => [['Level', 'Module', 'Competency'], 'module'],
            'competency_in_tvet' => [['Level', 'Module', 'Competency'], 'competency'],
            'case_insensitive_course' => [['Course', 'Section', 'Lesson'], 'COURSE'],
            'case_insensitive_mixed' => [['Course', 'Section', 'Lesson'], 'Section'],
        ];
    }

    #[DataProvider('invalidNodeTypeProvider')]
    public function test_rejects_invalid_node_types(array $hierarchy, string $invalidType): void
    {
        $blueprint = AcademicBlueprint::factory()->create([
            'hierarchy_structure' => $hierarchy,
        ]);

        $course = Course::factory()->create([
            'blueprint_id' => $blueprint->id,
        ]);

        $this->expectException(InvalidNodeTypeException::class);

        CurriculumNode::create([
            'course_id' => $course->id,
            'parent_id' => null,
            'node_type' => $invalidType,
            'title' => 'Test Node',
            'position' => 0,
        ]);
    }

    public static function invalidNodeTypeProvider(): array
    {
        return [
            'invalid_in_standard' => [['Course', 'Section', 'Lesson'], 'chapter'],
            'year_not_in_standard' => [['Course', 'Section', 'Lesson'], 'year'],
            'competency_not_in_theology' => [['Year', 'Unit', 'Session'], 'competency'],
            'random_type' => [['Course', 'Section', 'Lesson'], 'random'],
            'empty_type' => [['Course', 'Section', 'Lesson'], ''],
            'numeric_type' => [['Course', 'Section', 'Lesson'], '123'],
        ];
    }

    public function test_allows_any_type_when_no_blueprint(): void
    {
        $course = Course::factory()->create([
            'blueprint_id' => null,
        ]);

        $node = CurriculumNode::create([
            'course_id' => $course->id,
            'parent_id' => null,
            'node_type' => 'any_type_works',
            'title' => 'Test Node',
            'position' => 0,
        ]);

        $this->assertDatabaseHas('curriculum_nodes', ['id' => $node->id]);
    }

    /**
     * Property test: For any random invalid type not in hierarchy,
     * validation should always reject.
     */
    #[DataProvider('randomInvalidTypesProvider')]
    public function test_random_invalid_types_are_rejected(string $invalidType): void
    {
        $blueprint = AcademicBlueprint::factory()->create([
            'hierarchy_structure' => ['Course', 'Section', 'Lesson'],
        ]);

        $course = Course::factory()->create([
            'blueprint_id' => $blueprint->id,
        ]);

        $this->expectException(InvalidNodeTypeException::class);

        CurriculumNode::create([
            'course_id' => $course->id,
            'parent_id' => null,
            'node_type' => $invalidType,
            'title' => 'Test Node',
            'position' => 0,
        ]);
    }

    public static function randomInvalidTypesProvider(): array
    {
        $invalidTypes = [
            'chapter', 'module', 'unit', 'topic', 'page', 'article',
            'video', 'quiz', 'assignment', 'resource', 'folder',
            'year', 'semester', 'week', 'day', 'hour',
        ];

        $cases = [];
        foreach ($invalidTypes as $type) {
            $cases["invalid_{$type}"] = [$type];
        }

        return $cases;
    }
}
