<?php

declare(strict_types=1);

namespace Tests\Feature\BlueprintEngine;

use App\Models\AcademicBlueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * **Feature: blueprint-engine, Property 1: Blueprint Persistence Integrity**
 * **Validates: Requirements 1.1, 1.2**
 *
 * For any valid AcademicBlueprint with hierarchy_structure and grading_logic,
 * saving to the database and retrieving should return an equivalent object
 * with all JSON fields intact.
 */
final class BlueprintPersistenceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @dataProvider validBlueprintDataProvider
     */
    public function test_blueprint_persistence_preserves_all_json_fields(
        array $hierarchyStructure,
        array $gradingLogic,
        ?array $progressionRules
    ): void {
        $blueprint = AcademicBlueprint::create([
            'name' => 'Test Blueprint ' . uniqid(),
            'description' => 'Test description',
            'hierarchy_structure' => $hierarchyStructure,
            'grading_logic' => $gradingLogic,
            'progression_rules' => $progressionRules,
            'gamification_enabled' => true,
            'certificate_enabled' => false,
        ]);

        $retrieved = AcademicBlueprint::find($blueprint->id);

        $this->assertNotNull($retrieved);
        $this->assertEquals($hierarchyStructure, $retrieved->hierarchy_structure);
        $this->assertEquals($gradingLogic, $retrieved->grading_logic);
        $this->assertEquals($progressionRules, $retrieved->progression_rules);
        $this->assertTrue($retrieved->gamification_enabled);
        $this->assertFalse($retrieved->certificate_enabled);
    }

    public static function validBlueprintDataProvider(): array
    {
        $cases = [];

        // Generate 100 test cases for property-based testing
        $hierarchies = [
            ['Course', 'Section', 'Lesson'],
            ['Year', 'Unit', 'Session'],
            ['Level', 'Module', 'Competency', 'Element'],
            ['Track', 'Course', 'Lesson'],
            ['Program'],
            ['A', 'B', 'C', 'D', 'E'],
        ];

        $gradingLogics = [
            ['type' => 'weighted', 'pass_mark' => 40],
            ['type' => 'weighted', 'pass_mark' => 50, 'components' => [['name' => 'Test', 'weight' => 1.0]]],
            ['type' => 'competency', 'competency_labels' => ['pass' => 'C', 'fail' => 'NYC']],
            ['type' => 'pass_fail'],
            ['type' => 'weighted', 'pass_mark' => 0],
            ['type' => 'weighted', 'pass_mark' => 100],
        ];

        $progressionRules = [
            null,
            ['sequential' => true],
            ['sequential' => false, 'prerequisites' => []],
            ['sequential' => true, 'prerequisites' => [1, 2, 3]],
        ];

        for ($i = 0; $i < 100; $i++) {
            $hierarchy = $hierarchies[array_rand($hierarchies)];
            $grading = $gradingLogics[array_rand($gradingLogics)];
            $progression = $progressionRules[array_rand($progressionRules)];

            $cases["case_{$i}"] = [$hierarchy, $grading, $progression];
        }

        return $cases;
    }

    public function test_blueprint_hierarchy_depth_calculation(): void
    {
        $blueprint = AcademicBlueprint::factory()->create([
            'hierarchy_structure' => ['Level', 'Module', 'Competency', 'Element'],
        ]);

        $this->assertEquals(4, $blueprint->getHierarchyDepth());
    }

    public function test_blueprint_label_for_depth(): void
    {
        $blueprint = AcademicBlueprint::factory()->create([
            'hierarchy_structure' => ['Year', 'Unit', 'Session'],
        ]);

        $this->assertEquals('Year', $blueprint->getLabelForDepth(0));
        $this->assertEquals('Unit', $blueprint->getLabelForDepth(1));
        $this->assertEquals('Session', $blueprint->getLabelForDepth(2));
        $this->assertEquals('Unknown', $blueprint->getLabelForDepth(3));
        $this->assertEquals('Unknown', $blueprint->getLabelForDepth(-1));
    }
}
