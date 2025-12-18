<?php

declare(strict_types=1);

namespace Tests\Feature\BlueprintEngine;

use App\Exceptions\InvalidGradingLogicException;
use App\Exceptions\InvalidHierarchyStructureException;
use App\Models\AcademicBlueprint;
use App\Services\BlueprintValidationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * **Feature: blueprint-engine, Property 2: Blueprint Validation Rejects Invalid Configurations**
 * **Validates: Requirements 1.3, 1.4**
 *
 * For any blueprint with an empty hierarchy_structure array OR grading_logic
 * missing required fields for its type, the Blueprint Engine should reject
 * the save operation with a validation error.
 */
final class BlueprintValidationTest extends TestCase
{
    use RefreshDatabase;

    private BlueprintValidationService $validator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->validator = new BlueprintValidationService();
    }

    /**
     * @dataProvider invalidHierarchyStructureProvider
     */
    public function test_rejects_invalid_hierarchy_structures(array $invalidStructure): void
    {
        $this->expectException(InvalidHierarchyStructureException::class);

        $this->validator->validateHierarchyStructure($invalidStructure);
    }

    public static function invalidHierarchyStructureProvider(): array
    {
        return [
            'empty_array' => [[]],
            'array_with_empty_string' => [['']],
            'array_with_whitespace_only' => [['   ']],
            'array_with_null' => [[null]],
            'array_with_integer' => [[123]],
            'array_with_mixed_invalid' => [['Valid', '', 'Also Valid']],
            'array_with_boolean' => [[true]],
            'array_with_array' => [[['nested']]],
        ];
    }

    /**
     * @dataProvider validHierarchyStructureProvider
     */
    public function test_accepts_valid_hierarchy_structures(array $validStructure): void
    {
        // Should not throw
        $this->validator->validateHierarchyStructure($validStructure);
        $this->assertTrue(true);
    }

    public static function validHierarchyStructureProvider(): array
    {
        return [
            'single_level' => [['Course']],
            'two_levels' => [['Course', 'Lesson']],
            'three_levels' => [['Year', 'Unit', 'Session']],
            'four_levels' => [['Level', 'Module', 'Competency', 'Element']],
            'five_levels' => [['A', 'B', 'C', 'D', 'E']],
        ];
    }

    /**
     * @dataProvider invalidGradingLogicProvider
     */
    public function test_rejects_invalid_grading_logic(array $invalidLogic): void
    {
        $this->expectException(InvalidGradingLogicException::class);

        $this->validator->validateGradingLogic($invalidLogic);
    }

    public static function invalidGradingLogicProvider(): array
    {
        return [
            'missing_type' => [[]],
            'invalid_type' => [['type' => 'invalid']],
            'weighted_missing_pass_mark' => [['type' => 'weighted']],
            'weighted_negative_pass_mark' => [['type' => 'weighted', 'pass_mark' => -1]],
            'weighted_pass_mark_over_100' => [['type' => 'weighted', 'pass_mark' => 101]],
            'weighted_non_numeric_pass_mark' => [['type' => 'weighted', 'pass_mark' => 'fifty']],
            'null_type' => [['type' => null]],
        ];
    }

    /**
     * @dataProvider validGradingLogicProvider
     */
    public function test_accepts_valid_grading_logic(array $validLogic): void
    {
        // Should not throw
        $this->validator->validateGradingLogic($validLogic);
        $this->assertTrue(true);
    }

    public static function validGradingLogicProvider(): array
    {
        return [
            'weighted_basic' => [['type' => 'weighted', 'pass_mark' => 40]],
            'weighted_zero_pass' => [['type' => 'weighted', 'pass_mark' => 0]],
            'weighted_full_pass' => [['type' => 'weighted', 'pass_mark' => 100]],
            'weighted_with_components' => [[
                'type' => 'weighted',
                'pass_mark' => 50,
                'components' => [['name' => 'Test', 'weight' => 1.0]],
            ]],
            'competency_basic' => [['type' => 'competency']],
            'competency_with_labels' => [[
                'type' => 'competency',
                'competency_labels' => ['pass' => 'C', 'fail' => 'NYC'],
            ]],
            'pass_fail_basic' => [['type' => 'pass_fail']],
        ];
    }

    public function test_model_saving_triggers_validation(): void
    {
        $this->expectException(InvalidHierarchyStructureException::class);

        AcademicBlueprint::create([
            'name' => 'Invalid Blueprint',
            'hierarchy_structure' => [],
            'grading_logic' => ['type' => 'weighted', 'pass_mark' => 40],
        ]);
    }

    public function test_model_saving_validates_grading_logic(): void
    {
        $this->expectException(InvalidGradingLogicException::class);

        AcademicBlueprint::create([
            'name' => 'Invalid Blueprint',
            'hierarchy_structure' => ['Course'],
            'grading_logic' => ['type' => 'invalid'],
        ]);
    }

    /**
     * Property test: For any random combination of invalid inputs,
     * validation should always reject.
     *
     * @dataProvider randomInvalidCombinationsProvider
     */
    public function test_random_invalid_combinations_are_rejected(
        array $hierarchy,
        array $grading,
        string $expectedExceptionClass
    ): void {
        $this->expectException($expectedExceptionClass);

        AcademicBlueprint::create([
            'name' => 'Test Blueprint',
            'hierarchy_structure' => $hierarchy,
            'grading_logic' => $grading,
        ]);
    }

    public static function randomInvalidCombinationsProvider(): array
    {
        $cases = [];

        // Generate 50 invalid hierarchy cases
        for ($i = 0; $i < 50; $i++) {
            $cases["invalid_hierarchy_{$i}"] = [
                [],
                ['type' => 'weighted', 'pass_mark' => rand(0, 100)],
                InvalidHierarchyStructureException::class,
            ];
        }

        // Generate 50 invalid grading cases
        for ($i = 0; $i < 50; $i++) {
            $cases["invalid_grading_{$i}"] = [
                ['Course', 'Section', 'Lesson'],
                ['type' => 'weighted'], // Missing pass_mark
                InvalidGradingLogicException::class,
            ];
        }

        return $cases;
    }
}
