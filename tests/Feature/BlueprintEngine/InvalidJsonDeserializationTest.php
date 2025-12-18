<?php

declare(strict_types=1);

namespace Tests\Feature\BlueprintEngine;

use App\Exceptions\InvalidGradingLogicException;
use App\Exceptions\InvalidHierarchyStructureException;
use App\Services\BlueprintSerializationService;
use App\Services\BlueprintValidationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * **Feature: blueprint-engine, Property 14: Invalid JSON Deserialization Throws Exception**
 * **Validates: Requirements 7.3**
 *
 * For any malformed or schema-invalid JSON string, deserializing should throw
 * a validation exception with error details, not silently fail or create invalid objects.
 */
final class InvalidJsonDeserializationTest extends TestCase
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

    #[DataProvider('malformedJsonProvider')]
    public function test_rejects_malformed_json(string $invalidJson): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid JSON format');

        $this->service->deserializeFromJson($invalidJson);
    }

    public static function malformedJsonProvider(): array
    {
        return [
            'empty_string' => [''],
            'not_json' => ['not json at all'],
            'unclosed_brace' => ['{"name": "test"'],
            'unclosed_bracket' => ['["item"'],
            'trailing_comma' => ['{"name": "test",}'],
            'single_quotes' => ["{'name': 'test'}"],
            'unquoted_key' => ['{name: "test"}'],
            'invalid_escape' => ['{"name": "test\x"}'],
        ];
    }

    #[DataProvider('missingFieldsProvider')]
    public function test_rejects_json_missing_required_fields(string $json, string $missingField): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: {$missingField}");

        $this->service->deserializeFromJson($json);
    }

    public static function missingFieldsProvider(): array
    {
        return [
            'missing_name' => [
                '{"hierarchy_structure": ["Course"], "grading_logic": {"type": "weighted", "pass_mark": 40}}',
                'name',
            ],
            'missing_hierarchy' => [
                '{"name": "Test", "grading_logic": {"type": "weighted", "pass_mark": 40}}',
                'hierarchy_structure',
            ],
            'missing_grading' => [
                '{"name": "Test", "hierarchy_structure": ["Course"]}',
                'grading_logic',
            ],
        ];
    }

    #[DataProvider('invalidFieldTypesProvider')]
    public function test_rejects_json_with_invalid_field_types(string $json): void
    {
        $this->expectException(InvalidArgumentException::class);

        $this->service->deserializeFromJson($json);
    }

    public static function invalidFieldTypesProvider(): array
    {
        return [
            'name_is_number' => [
                '{"name": 123, "hierarchy_structure": ["Course"], "grading_logic": {"type": "weighted", "pass_mark": 40}}',
            ],
            'name_is_empty' => [
                '{"name": "", "hierarchy_structure": ["Course"], "grading_logic": {"type": "weighted", "pass_mark": 40}}',
            ],
            'name_is_whitespace' => [
                '{"name": "   ", "hierarchy_structure": ["Course"], "grading_logic": {"type": "weighted", "pass_mark": 40}}',
            ],
            'hierarchy_is_string' => [
                '{"name": "Test", "hierarchy_structure": "Course", "grading_logic": {"type": "weighted", "pass_mark": 40}}',
            ],
            'grading_is_string' => [
                '{"name": "Test", "hierarchy_structure": ["Course"], "grading_logic": "weighted"}',
            ],
        ];
    }

    public function test_rejects_empty_hierarchy_structure(): void
    {
        $json = json_encode([
            'name' => 'Test',
            'hierarchy_structure' => [],
            'grading_logic' => ['type' => 'weighted', 'pass_mark' => 40],
        ]);

        $this->expectException(InvalidHierarchyStructureException::class);

        $this->service->deserializeFromJson($json);
    }

    public function test_rejects_invalid_grading_type(): void
    {
        $json = json_encode([
            'name' => 'Test',
            'hierarchy_structure' => ['Course'],
            'grading_logic' => ['type' => 'invalid_type'],
        ]);

        $this->expectException(InvalidGradingLogicException::class);

        $this->service->deserializeFromJson($json);
    }

    public function test_rejects_weighted_grading_without_pass_mark(): void
    {
        $json = json_encode([
            'name' => 'Test',
            'hierarchy_structure' => ['Course'],
            'grading_logic' => ['type' => 'weighted'],
        ]);

        $this->expectException(InvalidGradingLogicException::class);

        $this->service->deserializeFromJson($json);
    }

    /**
     * Property test: For any random invalid JSON variation,
     * deserialization should always throw an exception.
     */
    #[DataProvider('randomInvalidJsonProvider')]
    public function test_random_invalid_json_throws_exception(string $invalidJson, string $expectedExceptionClass): void
    {
        $this->expectException($expectedExceptionClass);

        $this->service->deserializeFromJson($invalidJson);
    }

    public static function randomInvalidJsonProvider(): array
    {
        $cases = [];

        // Malformed JSON cases
        $malformed = [
            '{invalid}',
            '{"unclosed": ',
            '[1, 2, 3',
            'null',
            'true',
            '123',
            '"string"',
        ];

        foreach ($malformed as $i => $json) {
            $cases["malformed_{$i}"] = [$json, InvalidArgumentException::class];
        }

        // Missing fields cases
        $missingFields = [
            '{}',
            '{"name": "Test"}',
            '{"hierarchy_structure": ["Course"]}',
            '{"grading_logic": {"type": "weighted"}}',
        ];

        foreach ($missingFields as $i => $json) {
            $cases["missing_field_{$i}"] = [$json, InvalidArgumentException::class];
        }

        // Invalid hierarchy cases
        $invalidHierarchy = [
            '{"name": "Test", "hierarchy_structure": [], "grading_logic": {"type": "weighted", "pass_mark": 40}}',
        ];

        foreach ($invalidHierarchy as $i => $json) {
            $cases["invalid_hierarchy_{$i}"] = [$json, InvalidHierarchyStructureException::class];
        }

        // Invalid grading cases
        $invalidGrading = [
            '{"name": "Test", "hierarchy_structure": ["Course"], "grading_logic": {"type": "invalid"}}',
            '{"name": "Test", "hierarchy_structure": ["Course"], "grading_logic": {"type": "weighted"}}',
        ];

        foreach ($invalidGrading as $i => $json) {
            $cases["invalid_grading_{$i}"] = [$json, InvalidGradingLogicException::class];
        }

        return $cases;
    }
}
