<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Jobs\GenerateRankingsJob;
use App\Models\RankingSchedule;
use Illuminate\Console\Command;

class GenerateRankingsCommand extends Command
{
    protected $signature = 'rankings:generate {schedule_id? : The ID of a specific schedule to run}';

    protected $description = 'Generate student performance rankings';

    public function handle(): int
    {
        $scheduleId = $this->argument('schedule_id');

        if ($scheduleId) {
            $schedule = RankingSchedule::find($scheduleId);

            if (!$schedule) {
                $this->error("Schedule with ID {$scheduleId} not found.");
                return Command::FAILURE;
            }

            $this->info("Dispatching rankings generation for schedule: {$schedule->name}");
            GenerateRankingsJob::dispatch($schedule);
        } else {
            $scheduleCount = RankingSchedule::where('is_active', true)->count();

            if ($scheduleCount === 0) {
                $this->warn('No active ranking schedules found.');
                return Command::FAILURE;
            }

            $this->info("Dispatching rankings generation for all due schedules...");
            GenerateRankingsJob::dispatch();
        }

        $this->info('Rankings generation job dispatched successfully.');
        return Command::SUCCESS;
    }
}
