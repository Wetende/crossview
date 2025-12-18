<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\InvalidGradingLogicException;
use App\Exceptions\InvalidHierarchyStructureException;
use App\Models\AcademicBlueprint;
use InvalidArgumentException;
use JsonException;

final class BlueprintSerializationService
{
    public function __construct(
        private readonly BlueprintValidationService $validator
    ) {}

    /**
     * Serialize a blueprint to JSON string.
     */
    public function serializeToJson(AcademicBlueprint $blueprint): string
    {
        $data = [
            'name' => $blueprint->name,
            'description' => $blueprint->description,
            'hierarchy_structure' => $blueprint->hierarchy_structure,
            'grading_logic' => $blueprint->grading_logic,
            'progression_rules' => $blueprint->progression_rules,
            'gamification_enabled' => $blueprint->gamification_enabled,
            'certificate_enabled' => $blueprint->certificate_enabled,
            'version' => '1.0',
            'exported_at' => now()->toIso8601String(),
        ];

        return json_encode($data, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
    }

    /**
     * Deserialize JSON string to a Blueprint object.
     *
     * @throws InvalidArgumentException When JSON is malformed
     * @throws InvalidHierarchyStructureException When hierarchy structure is invalid
     * @throws InvalidGradingLogicException When grading logic is invalid
     */
    public function deserializeFromJson(string $json): AcademicBlueprint
    {
        try {
            $data = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            throw new InvalidArgumentException(
                "Invalid JSON format: {$e->getMessage()}"
            );
        }

        // Handle non-array JSON values (null, bool, int, string)
        if (!is_array($data)) {
            throw new InvalidArgumentException(
                "Invalid JSON format: expected object, got " . gettype($data)
            );
        }

        $this->validateDeserializedData($data);

        // Validate hierarchy structure
        $this->validator->validateHierarchyStructure($data['hierarchy_structure'] ?? []);

        // Validate grading logic
        $this->validator->validateGradingLogic($data['grading_logic'] ?? []);

        $blueprint = new AcademicBlueprint();
        $blueprint->name = $data['name'];
        $blueprint->description = $data['description'] ?? null;
        $blueprint->hierarchy_structure = $data['hierarchy_structure'];
        $blueprint->grading_logic = $data['grading_logic'];
        $blueprint->progression_rules = $data['progression_rules'] ?? null;
        $blueprint->gamification_enabled = $data['gamification_enabled'] ?? false;
        $blueprint->certificate_enabled = $data['certificate_enabled'] ?? false;

        return $blueprint;
    }

    /**
     * Import a blueprint from JSON and save to database.
     */
    public function importFromJson(string $json): AcademicBlueprint
    {
        $blueprint = $this->deserializeFromJson($json);
        $blueprint->save();

        return $blueprint;
    }

    /**
     * Export a blueprint to a file.
     */
    public function exportToFile(AcademicBlueprint $blueprint, string $path): bool
    {
        $json = $this->serializeToJson($blueprint);

        return file_put_contents($path, $json) !== false;
    }

    /**
     * Import a blueprint from a file.
     */
    public function importFromFile(string $path): AcademicBlueprint
    {
        if (!file_exists($path)) {
            throw new InvalidArgumentException("File not found: {$path}");
        }

        $json = file_get_contents($path);

        if ($json === false) {
            throw new InvalidArgumentException("Could not read file: {$path}");
        }

        return $this->importFromJson($json);
    }

    /**
     * Validate the structure of deserialized data.
     */
    private function validateDeserializedData(array $data): void
    {
        $requiredFields = ['name', 'hierarchy_structure', 'grading_logic'];

        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                throw new InvalidArgumentException(
                    "Missing required field: {$field}"
                );
            }
        }

        if (!is_string($data['name']) || empty(trim($data['name']))) {
            throw new InvalidArgumentException(
                "Field 'name' must be a non-empty string"
            );
        }

        if (!is_array($data['hierarchy_structure'])) {
            throw new InvalidArgumentException(
                "Field 'hierarchy_structure' must be an array"
            );
        }

        if (!is_array($data['grading_logic'])) {
            throw new InvalidArgumentException(
                "Field 'grading_logic' must be an array"
            );
        }
    }
}
