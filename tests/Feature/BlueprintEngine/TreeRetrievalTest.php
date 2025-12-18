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
 * **Feature: blueprint-engine, Property 6: Recursive Tree Retrieval Completeness**
 * **Validates: Requirements 2.3**
 *
 * For any program with a curriculum tree of N nodes, querying the tree
 * should return exactly N nodes with correct parent-child relationships preserved.
 */
final class TreeRetrievalTest extends TestCase
{
    use RefreshDatabase;

    private CurriculumNodeRepository $repository;
    private AcademicBlueprint $blueprint;
    private Course $course;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = new CurriculumNodeRepository();

        $this->blueprint = AcademicBlueprint::factory()->create([
            'hierarchy_structure' => ['Course', 'Section', 'Lesson', 'Topic'],
        ]);

        $this->course = Course::factory()->create([
            'blueprint_id' => $this->blueprint->id,
        ]);
    }

    #[DataProvider('treeStructureProvider')]
    public function test_tree_retrieval_returns_all_nodes(array $structure): void
    {
        $totalNodes = $this->createTreeFromStructure($structure);

        $retrieved = $this->repository->getTreeForCourse($this->course->id);

        $this->assertCount($totalNodes, $retrieved);
    }

    public static function treeStructureProvider(): array
    {
        return [
            'single_root' => [['children' => 0]],
            'root_with_one_child' => [['children' => 1]],
            'root_with_three_children' => [['children' => 3]],
            'two_level_tree' => [
                ['children' => 2, 'grandchildren' => 2],
            ],
            'three_level_tree' => [
                ['children' => 2, 'grandchildren' => 2, 'greatgrandchildren' => 1],
            ],
        ];
    }

    public function test_subtree_retrieval_returns_correct_count(): void
    {
        // Create a tree: root -> 2 sections -> 3 lessons each
        $root = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Root',
            'position' => 0,
        ]);

        $sections = [];
        for ($i = 0; $i < 2; $i++) {
            $section = CurriculumNode::create([
                'course_id' => $this->course->id,
                'parent_id' => $root->id,
                'node_type' => 'section',
                'title' => "Section {$i}",
                'position' => $i,
            ]);
            $sections[] = $section;

            for ($j = 0; $j < 3; $j++) {
                CurriculumNode::create([
                    'course_id' => $this->course->id,
                    'parent_id' => $section->id,
                    'node_type' => 'lesson',
                    'title' => "Lesson {$i}.{$j}",
                    'position' => $j,
                ]);
            }
        }

        // Get subtree from first section (should have 1 section + 3 lessons = 4)
        $subtree = $this->repository->getSubtree($sections[0]->id);
        $this->assertCount(4, $subtree);

        // Get subtree from root (should have all 9 nodes)
        $fullTree = $this->repository->getSubtree($root->id);
        $this->assertCount(9, $fullTree);
    }

    public function test_ancestors_returns_correct_path(): void
    {
        $root = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Root',
            'position' => 0,
        ]);

        $section = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => $root->id,
            'node_type' => 'section',
            'title' => 'Section',
            'position' => 0,
        ]);

        $lesson = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => $section->id,
            'node_type' => 'lesson',
            'title' => 'Lesson',
            'position' => 0,
        ]);

        $ancestors = $this->repository->getAncestors($lesson->id);

        $this->assertCount(2, $ancestors);
        $this->assertEquals($root->id, $ancestors[0]->id);
        $this->assertEquals($section->id, $ancestors[1]->id);
    }

    public function test_tree_retrieval_preserves_ordering(): void
    {
        $root = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Root',
            'position' => 0,
        ]);

        // Create children in reverse order
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

        // Skip root, check children are ordered by position
        $children = $tree->slice(1)->values();
        for ($i = 0; $i < 4; $i++) {
            $this->assertEquals($i, $children[$i]->position);
        }
    }

    private function createTreeFromStructure(array $structure): int
    {
        $count = 0;
        $nodeTypes = ['course', 'section', 'lesson', 'topic'];

        $root = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => null,
            'node_type' => $nodeTypes[0],
            'title' => 'Root',
            'position' => 0,
        ]);
        $count++;

        if (isset($structure['children']) && $structure['children'] > 0) {
            for ($i = 0; $i < $structure['children']; $i++) {
                $child = CurriculumNode::create([
                    'course_id' => $this->course->id,
                    'parent_id' => $root->id,
                    'node_type' => $nodeTypes[1],
                    'title' => "Child {$i}",
                    'position' => $i,
                ]);
                $count++;

                if (isset($structure['grandchildren']) && $structure['grandchildren'] > 0) {
                    for ($j = 0; $j < $structure['grandchildren']; $j++) {
                        $grandchild = CurriculumNode::create([
                            'course_id' => $this->course->id,
                            'parent_id' => $child->id,
                            'node_type' => $nodeTypes[2],
                            'title' => "Grandchild {$i}.{$j}",
                            'position' => $j,
                        ]);
                        $count++;

                        if (isset($structure['greatgrandchildren']) && $structure['greatgrandchildren'] > 0) {
                            for ($k = 0; $k < $structure['greatgrandchildren']; $k++) {
                                CurriculumNode::create([
                                    'course_id' => $this->course->id,
                                    'parent_id' => $grandchild->id,
                                    'node_type' => $nodeTypes[3],
                                    'title' => "Great-grandchild {$i}.{$j}.{$k}",
                                    'position' => $k,
                                ]);
                                $count++;
                            }
                        }
                    }
                }
            }
        }

        return $count;
    }
}
