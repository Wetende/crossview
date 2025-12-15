<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\RankingSchedule;
use App\Services\RankingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateRankingsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The specific schedule to process.
     */
    private ?RankingSchedule $schedule;

    /**
     * Create a new job instance.
     */
    public function __construct(?RankingSchedule $schedule = null)
    {
        $this->schedule = $schedule;
    }

    /**
     * Execute the job.
     */
    public function handle(RankingService $rankingService): void
    {
        try {
            if ($this->schedule) {
                
                Log::info("Starting to process ranking schedule: {$this->schedule->name}");
                $results = $rankingService->processSchedule($this->schedule);
                Log::info("Finished processing ranking schedule: {$this->schedule->name}", $results);
            } else {
                
                Log::info("Starting to process all active ranking schedules");
                $schedules = RankingSchedule::where('is_active', true)->get();

                foreach ($schedules as $schedule) {
                    try {
                        $results = $rankingService->processSchedule($schedule);
                        Log::info("Processed ranking schedule: {$schedule->name}", $results);
                    } catch (\Exception $e) {
                        Log::error("Error processing ranking schedule {$schedule->name}: {$e->getMessage()}");
                    }
                }

                Log::info("Finished processing all active ranking schedules");
            }
        } catch (\Exception $e) {
            Log::error("Error in GenerateRankingsJob: {$e->getMessage()}");
            throw $e; 
        }
    }
}
