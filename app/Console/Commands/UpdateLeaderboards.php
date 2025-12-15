<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\LeaderboardService;
use Illuminate\Console\Command;

final class UpdateLeaderboards extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'leaderboards:update {--leaderboard-id= : ID of a specific leaderboard to update}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update all active leaderboards or a specific leaderboard';

    /**
     * Execute the console command.
     */
    public function handle(LeaderboardService $leaderboardService): int
    {
        $leaderboardId = $this->option('leaderboard-id');

        if ($leaderboardId) {
            $leaderboard = \App\Models\Leaderboard::find($leaderboardId);

            if (!$leaderboard) {
                $this->error("Leaderboard with ID {$leaderboardId} not found.");
                return Command::FAILURE;
            }

            $this->info("Updating leaderboard: {$leaderboard->name}");
            $leaderboardService->updateLeaderboard($leaderboard);
            $this->info("Leaderboard updated successfully.");

            return Command::SUCCESS;
        }

        $this->info('Updating all active leaderboards...');
        $startTime = now();

        $leaderboardService->updateAllActiveLeaderboards();

        $timeTaken = now()->diffInSeconds($startTime);
        $this->info("All leaderboards updated successfully in {$timeTaken} seconds.");

        return Command::SUCCESS;
    }
}
