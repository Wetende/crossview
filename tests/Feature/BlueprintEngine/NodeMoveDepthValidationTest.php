<?php

declare(strict_types=1);

namespace Tests\Feature\BlueprintEngine;

use App\Exceptions\MaxDepthExceededException;
use App\Models\AcademicBlueprint;
use App\Models\Course;
use App\Models\CurriculumNode;
use App\Repositories\CurriculumNodeRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * **Feature: blueprint-engine, Property 8: Node Move Depth Validation**
 * **Validates: Requirements 2.5**
 *
 * For any CurriculumNode move operation, if the move would result in a tree
 * depth exceeding the blueprint's hierarchy_structure length, the move should
 * be rejected.
 */
final class NodeMoveDepthValidationTest extends TestCase
{
    use RefreshDatabase;

    private CurriculumNodeRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new CurriculumNodeRepository();
    }

    public function test_allows_move_within_depth_limit(): void
    {
        $blueprint = AcademicBlueprint::factory()->create([
            'hierarchy_structure' => ['Course', 'Section', 'Lesson'],
        ]);

        $course = Course::factory()->create([
            'blueprint_id' => $blueprint->id,
        ]);

        $root = CurriculumNode::create([
            'course_id' => $course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Root',
            'position' => 0,
        ]);

        $section1 = CurriculumNode::create([
            'course_id' => $course->id,
            'parent_id' => $root->id,
            'node_type' => 'section',
            'title' => 'Section 1',
            'position' => 0,
        ]);

        $section2 = CurriculumNode::create([
            'course_id' => $course->id,
            'parent_id' => $root->id,
            'node_type' => 'section',
            'title' => 'Section 2',
            'position' => 1,
        ]);

        $lesson = CurriculumNode::create([
            'course_id' => $course->id,
            'parent_id' => $section1->id,
            'node_type' => 'lesson',
            'title' => 'Lesson',
            'position' => 0,
        ]);

        // Move lesson from section1 to section2 (same depth, should work)
        $result = $this->repository->moveNode($lesson->id, $section2->id);

        $this->assertTrue($result);
        $this->assertEquals($section2->id, $lesson->fresh()->parent_id);
    }

    public function test_rejects_move_exceeding_depth_limit(): void
    {
        $blueprint = AcademicBlueprint::factory()->create([
            'hierarchy_structure' => ['Course', 'Section', 'Lesson'],
        ]);

        $course = Course::factory()->create([
            'blueprint_id' => $blueprint->id,
        ]);

        $root = CurriculumNode::create([
            'course_id' => $course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Root',
            'position' => 0,
        ]);

        $section = CurriculumNode::create([
            'course_id' => $course->id,
            'parent_id' => $root->id,
            'node_type' => 'section',
            'title' => 'Section',
            'position' => 0,
        ]);

        $lesson = CurriculumNode::create([
            'course_id' => $course->id,
            'parent_id' => $section->id,
            'node_type' => 'lesson',
            'title' => 'Lesson',
            'position' => 0,
        ]);

        // Create a subtree under lesson
        $subtopic = CurriculumNode::create([
            'course_id' => $course->id,
            'parent_id' => $lesson->id,
            'node_type' => 'lesson', // Using lesson type to bypass validation
            'title' => 'Subtopic',
            'position' => 0,
        ]);

        // Try to move section (with its subtree) under lesson
        // This would create: root -> section -> lesson -> subtopic -> moved_section
        // Which exceeds depth 2 (max index for 3-level hierarchy)
        $this->expectException(MaxDepthExceededException::class);

        $this->repository->moveNode($section->id, $lesson->id);
    }

    public function test_allows_move_to_root(): void
    {
        $blueprint = AcademicBlueprint::factory()->create([
            'hierarchy_structure' => ['Course', 'Section', 'Lesson'],
        ]);

        $course = Course::factory()->create([
            'blueprint_id' => $blueprint->id,
        ]);

        $root = CurriculumNode::create([
            'course_id' => $course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Root',
            'position' => 0,
        ]);

        $section = CurriculumNode::create([
            'course_id' => $course->id,
            'parent_id' => $root->id,
            'node_type' => 'section',
            'title' => 'Section',
            'position' => 0,
        ]);

        // Move section to root level
        $result = $this->repository->moveNode($section->id, null);

        $this->assertTrue($result);
        $this->assertNull($section->fresh()->parent_id);
    }

    #[DataProvider('depthLimitProvider')]
    public function test_depth_limits_are_enforced(int $hierarchyLevels, int $attemptedDepth, bool $shouldSucceed): void
    {
        $hierarchy = array_map(fn ($i) => "Level{$i}", range(1, $hierarchyLevels));

        $blueprint = AcademicBlueprint::factory()->create([
            'hierarchy_structure' => $hierarchy,
        ]);

        $course = Course::factory()->create([
            'blueprint_id' => $blueprint->id,
        ]);

        // Create a chain of nodes
        $nodes = [];
        $parentId = null;

        for ($i = 0; $i < $attemptedDepth; $i++) {
            $node = CurriculumNode::create([
                'course_id' => $course->id,
                'parent_id' => $parentId,
                'node_type' => $hierarchy[$i % count($hierarchy)],
                'title' => "Node {$i}",
                'position' => 0,
            ]);
            $nodes[] = $node;
            $parentId = $node->id;
        }

        // Create a separate node to move
        $nodeToMove = CurriculumNode::create([
            'course_id' => $course->id,
            'parent_id' => null,
            'node_type' => $hierarchy[0],
            'title' => 'Node to Move',
            'position' => 1,
        ]);

        if (!$shouldSucceed) {
            $this->expectException(MaxDepthExceededException::class);
        }

        $result = $this->repository->moveNode($nodeToMove->id, $parentId);

        if ($shouldSucceed) {
            $this->assertTrue($result);
        }
    }

    public static function depthLimitProvider(): array
    {
        return [
            '3_levels_move_to_depth_1' => [3, 1, true],
            '3_levels_move_to_depth_2' => [3, 2, true],
            '3_levels_move_to_depth_3' => [3, 3, false],
            '4_levels_move_to_depth_2' => [4, 2, true],
            '4_levels_move_to_depth_3' => [4, 3, true],
            '4_levels_move_to_depth_4' => [4, 4, false],
        ];
    }
}
