<?php

declare(strict_types=1);

namespace Tests\Feature\BlueprintEngine;

use App\Models\AcademicBlueprint;
use App\Models\Course;
use App\Models\CurriculumNode;
use App\Repositories\CurriculumNodeRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * **Feature: blueprint-engine, Property 10: Node Ordering Consistency**
 * **Validates: Requirements 5.2**
 *
 * For any set of sibling CurriculumNodes, fetching them should return
 * nodes ordered by their position field in ascending order.
 */
final class NodeOrderingTest extends TestCase
{
    use RefreshDatabase;

    private CurriculumNodeRepository $repository;
    private Course $course;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = new CurriculumNodeRepository();

        $blueprint = AcademicBlueprint::factory()->create([
            'hierarchy_structure' => ['Course', 'Section', 'Lesson'],
        ]);

        $this->course = Course::factory()->create([
            'blueprint_id' => $blueprint->id,
        ]);
    }

    #[DataProvider('siblingCountProvider')]
    public function test_siblings_are_returned_in_position_order(int $siblingCount): void
    {
        $parent = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Parent',
            'position' => 0,
        ]);

        // Create siblings in random order
        $positions = range(0, $siblingCount - 1);
        shuffle($positions);

        foreach ($positions as $position) {
            CurriculumNode::create([
                'course_id' => $this->course->id,
                'parent_id' => $parent->id,
                'node_type' => 'section',
                'title' => "Section at position {$position}",
                'position' => $position,
            ]);
        }

        $children = $this->repository->getChildren($parent->id);

        $this->assertCount($siblingCount, $children);

        // Verify ordering
        for ($i = 0; $i < $siblingCount; $i++) {
            $this->assertEquals($i, $children[$i]->position);
        }
    }

    public static function siblingCountProvider(): array
    {
        return [
            'two_siblings' => [2],
            'five_siblings' => [5],
            'ten_siblings' => [10],
            'twenty_siblings' => [20],
        ];
    }

    public function test_reorder_siblings_updates_positions(): void
    {
        $parent = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Parent',
            'position' => 0,
        ]);

        $nodes = [];
        for ($i = 0; $i < 5; $i++) {
            $nodes[] = CurriculumNode::create([
                'course_id' => $this->course->id,
                'parent_id' => $parent->id,
                'node_type' => 'section',
                'title' => "Section {$i}",
                'position' => $i,
            ]);
        }

        // Reverse the order
        $newOrder = array_reverse(array_map(fn ($n) => $n->id, $nodes));

        $this->repository->reorderSiblings($newOrder);

        // Verify new positions
        foreach ($newOrder as $newPosition => $nodeId) {
            $node = CurriculumNode::find($nodeId);
            $this->assertEquals($newPosition, $node->position);
        }
    }

    public function test_tree_retrieval_maintains_sibling_order(): void
    {
        $root = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Root',
            'position' => 0,
        ]);

        // Create sections in reverse order
        for ($i = 4; $i >= 0; $i--) {
            CurriculumNode::create([
                'course_id' => $this->course->id,
                'parent_id' => $root->id,
                'node_type' => 'section',
                'title' => "Section {$i}",
                'position' => $i,
            ]);
        }

        $tree = $this->repository->getTreeForCourse($this->course->id);

        // Skip root, verify sections are in order
        $sections = $tree->slice(1)->values();

        for ($i = 0; $i < 5; $i++) {
            $this->assertEquals($i, $sections[$i]->position);
            $this->assertEquals("Section {$i}", $sections[$i]->title);
        }
    }

    public function test_root_nodes_are_ordered_by_position(): void
    {
        // Create root nodes in random order
        $positions = [3, 1, 4, 0, 2];

        foreach ($positions as $position) {
            CurriculumNode::create([
                'course_id' => $this->course->id,
                'parent_id' => null,
                'node_type' => 'course',
                'title' => "Root at position {$position}",
                'position' => $position,
            ]);
        }

        $roots = $this->repository->getRootNodes($this->course->id);

        $this->assertCount(5, $roots);

        for ($i = 0; $i < 5; $i++) {
            $this->assertEquals($i, $roots[$i]->position);
        }
    }

    /**
     * Property test: For any random ordering of siblings,
     * after reordering, positions should match the new order.
     */
    #[DataProvider('randomOrderProvider')]
    public function test_random_reordering_produces_correct_positions(array $newOrder): void
    {
        $parent = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Parent',
            'position' => 0,
        ]);

        $nodeIds = [];
        for ($i = 0; $i < count($newOrder); $i++) {
            $node = CurriculumNode::create([
                'course_id' => $this->course->id,
                'parent_id' => $parent->id,
                'node_type' => 'section',
                'title' => "Section {$i}",
                'position' => $i,
            ]);
            $nodeIds[] = $node->id;
        }

        // Reorder according to the provided order
        $reorderedIds = array_map(fn ($idx) => $nodeIds[$idx], $newOrder);

        $this->repository->reorderSiblings($reorderedIds);

        // Verify positions match new order
        foreach ($reorderedIds as $expectedPosition => $nodeId) {
            $node = CurriculumNode::find($nodeId);
            $this->assertEquals($expectedPosition, $node->position);
        }
    }

    public static function randomOrderProvider(): array
    {
        $cases = [];

        // Generate various permutations
        for ($i = 0; $i < 10; $i++) {
            $size = rand(3, 8);
            $order = range(0, $size - 1);
            shuffle($order);
            $cases["random_order_{$i}"] = [$order];
        }

        return $cases;
    }
}
