<?php

namespace App\Console;

use App\Jobs\GenerateRankingsJob;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {



        $schedule->command('subscriptions:check-expirations')->daily()->at('01:00');


        $schedule->command('leaderboards:update')->hourly();


        $schedule->job(new GenerateRankingsJob())->hourly();


    }

    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }
}
