<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\LegacyMigrationService;
use Illuminate\Console\Command;

final class MigrateLegacyBlueprintCommand extends Command
{
    protected $signature = 'blueprint:migrate-legacy
                            {--dry-run : Preview changes without making them}
                            {--rollback : Rollback a previous migration}';

    protected $description = 'Migrate legacy Course/Section/Lesson structure to Blueprint Engine curriculum nodes';

    public function __construct(
        private readonly LegacyMigrationService $migrationService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        if ($this->option('rollback')) {
            return $this->handleRollback();
        }

        return $this->handleMigration();
    }

    private function handleMigration(): int
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->info('Running in DRY-RUN mode. No changes will be made.');
            $this->newLine();
        }

        $this->info('Starting legacy data migration...');
        $this->newLine();

        try {
            $report = $this->migrationService->migrate($dryRun);

            $this->displayReport($report);

            if ($dryRun) {
                $this->newLine();
                $this->warn('This was a dry run. Run without --dry-run to apply changes.');
            } else {
                $this->newLine();
                $this->info('Migration completed successfully!');
            }

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Migration failed: ' . $e->getMessage());
            $this->newLine();
            $this->error('All changes have been rolled back.');

            return Command::FAILURE;
        }
    }

    private function handleRollback(): int
    {
        if (!$this->confirm('This will remove all curriculum nodes and reset blueprint associations. Continue?')) {
            $this->info('Rollback cancelled.');
            return Command::SUCCESS;
        }

        $this->info('Rolling back migration...');

        try {
            $this->migrationService->rollbackMigration();

            $this->info('Rollback completed successfully!');
            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Rollback failed: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }

    private function displayReport(array $report): void
    {
        $this->info('Migration Report');
        $this->info('================');
        $this->newLine();

        $this->table(
            ['Entity', 'Total', 'Migrated', 'Failed'],
            [
                [
                    'Courses',
                    $report['summary']['courses']['total'],
                    $report['summary']['courses']['migrated'],
                    $report['summary']['courses']['failed'],
                ],
                [
                    'Sections',
                    $report['summary']['sections']['total'],
                    $report['summary']['sections']['migrated'],
                    $report['summary']['sections']['failed'],
                ],
                [
                    'Lessons',
                    $report['summary']['lessons']['total'],
                    $report['summary']['lessons']['migrated'],
                    $report['summary']['lessons']['failed'],
                ],
            ]
        );

        // Display errors if any
        $hasErrors = false;

        foreach (['courses', 'sections', 'lessons'] as $entity) {
            if (!empty($report['errors'][$entity])) {
                $hasErrors = true;
                $this->newLine();
                $this->warn(ucfirst($entity) . ' Errors:');

                foreach ($report['errors'][$entity] as $error) {
                    $id = $error["{$entity}_id"] ?? $error['course_id'] ?? $error['section_id'] ?? $error['lesson_id'] ?? 'unknown';
                    $this->error("  - ID {$id}: {$error['error']}");
                }
            }
        }

        if (!$hasErrors) {
            $this->newLine();
            $this->info('No errors encountered during migration.');
        }

        $this->newLine();
        $this->info("Timestamp: {$report['timestamp']}");
    }
}
