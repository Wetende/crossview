<?php

declare(strict_types=1);

namespace Tests\Feature\BlueprintEngine;

use App\Models\AcademicBlueprint;
use App\Services\BlueprintSerializationService;
use App\Services\BlueprintValidationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * **Feature: blueprint-engine, Property 13: Blueprint Serialization Round-Trip**
 * **Validates: Requirements 7.1, 7.2**
 *
 * For any valid AcademicBlueprint, serializing to JSON and deserializing back
 * should produce an equivalent Blueprint object.
 */
final class SerializationRoundTripTest extends TestCase
{
    use RefreshDatabase;

    private BlueprintSerializationService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new BlueprintSerializationService(
            new BlueprintValidationService()
        );
    }

    #[DataProvider('blueprintConfigProvider')]
    public function test_serialization_round_trip_preserves_data(
        string $name,
        array $hierarchy,
        array $grading,
        ?array $progression,
        bool $gamification,
        bool $certificate
    ): void {
        $original = AcademicBlueprint::factory()->create([
            'name' => $name,
            'description' => 'Test description',
            'hierarchy_structure' => $hierarchy,
            'grading_logic' => $grading,
            'progression_rules' => $progression,
            'gamification_enabled' => $gamification,
            'certificate_enabled' => $certificate,
        ]);

        $json = $this->service->serializeToJson($original);
        $deserialized = $this->service->deserializeFromJson($json);

        $this->assertEquals($original->name, $deserialized->name);
        $this->assertEquals($original->description, $deserialized->description);
        $this->assertEquals($original->hierarchy_structure, $deserialized->hierarchy_structure);
        $this->assertEquals($original->grading_logic, $deserialized->grading_logic);
        $this->assertEquals($original->progression_rules, $deserialized->progression_rules);
        $this->assertEquals($original->gamification_enabled, $deserialized->gamification_enabled);
        $this->assertEquals($original->certificate_enabled, $deserialized->certificate_enabled);
    }

    public static function blueprintConfigProvider(): array
    {
        return [
            'theology_standard' => [
                'CCT Theology Standard',
                ['Year', 'Unit', 'Session'],
                ['type' => 'weighted', 'pass_mark' => 40],
                ['sequential' => true],
                true,
                true,
            ],
            'tvet_competency' => [
                'TVET CDACC Level 6',
                ['Level', 'Module', 'Competency', 'Element'],
                ['type' => 'competency', 'competency_labels' => ['pass' => 'C', 'fail' => 'NYC']],
                null,
                false,
                true,
            ],
            'online_course' => [
                'Online Course Standard',
                ['Course', 'Section', 'Lesson'],
                ['type' => 'pass_fail'],
                ['sequential' => false],
                true,
                false,
            ],
            'minimal_config' => [
                'Minimal',
                ['Module'],
                ['type' => 'weighted', 'pass_mark' => 50],
                null,
                false,
                false,
            ],
            'complex_hierarchy' => [
                'Complex Program',
                ['Program', 'Year', 'Semester', 'Module', 'Unit'],
                ['type' => 'weighted', 'pass_mark' => 60, 'components' => [
                    ['name' => 'CAT', 'weight' => 0.3],
                    ['name' => 'Exam', 'weight' => 0.7],
                ]],
                ['sequential' => true, 'prerequisites' => [1, 2, 3]],
                true,
                true,
            ],
        ];
    }

    /**
     * Property test: For any randomly generated valid blueprint,
     * round-trip should preserve all data.
     */
    #[DataProvider('randomBlueprintProvider')]
    public function test_random_blueprint_round_trip(array $config): void
    {
        $original = AcademicBlueprint::factory()->create($config);

        $json = $this->service->serializeToJson($original);
        $deserialized = $this->service->deserializeFromJson($json);

        $this->assertEquals($original->name, $deserialized->name);
        $this->assertEquals($original->hierarchy_structure, $deserialized->hierarchy_structure);
        $this->assertEquals($original->grading_logic, $deserialized->grading_logic);
    }

    public static function randomBlueprintProvider(): array
    {
        $cases = [];

        $hierarchies = [
            ['Course', 'Section', 'Lesson'],
            ['Year', 'Unit', 'Session'],
            ['Level', 'Module', 'Competency'],
            ['Program', 'Track', 'Module', 'Topic'],
        ];

        $gradingLogics = [
            ['type' => 'weighted', 'pass_mark' => 40],
            ['type' => 'weighted', 'pass_mark' => 50],
            ['type' => 'weighted', 'pass_mark' => 60],
            ['type' => 'competency'],
            ['type' => 'pass_fail'],
        ];

        for ($i = 0; $i < 20; $i++) {
            $cases["random_{$i}"] = [[
                'name' => "Blueprint {$i}",
                'hierarchy_structure' => $hierarchies[array_rand($hierarchies)],
                'grading_logic' => $gradingLogics[array_rand($gradingLogics)],
            ]];
        }

        return $cases;
    }

    public function test_serialized_json_is_valid(): void
    {
        $blueprint = AcademicBlueprint::factory()->create();

        $json = $this->service->serializeToJson($blueprint);

        $this->assertJson($json);

        $decoded = json_decode($json, true);
        $this->assertIsArray($decoded);
        $this->assertArrayHasKey('name', $decoded);
        $this->assertArrayHasKey('hierarchy_structure', $decoded);
        $this->assertArrayHasKey('grading_logic', $decoded);
        $this->assertArrayHasKey('version', $decoded);
        $this->assertArrayHasKey('exported_at', $decoded);
    }

    public function test_deserialized_blueprint_can_be_saved(): void
    {
        $original = AcademicBlueprint::factory()->create();

        $json = $this->service->serializeToJson($original);
        $deserialized = $this->service->deserializeFromJson($json);

        // Modify name to avoid unique constraint
        $deserialized->name = 'Imported: ' . $deserialized->name;
        $deserialized->save();

        $this->assertDatabaseHas('academic_blueprints', [
            'id' => $deserialized->id,
            'name' => $deserialized->name,
        ]);
    }
}
