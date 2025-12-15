<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('badges', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('icon_path')->nullable();
            $table->integer('points')->default(0);
            $table->json('criteria')->nullable(); 
            $table->string('criteria_type')->nullable()
                ->comment('Type of criteria for badge (course_completion_count, quiz_score_above, login_streak_days)');
            $table->string('criteria_value')->nullable()
                ->comment('Value required for the criteria (e.g., "5" for 5 courses, "80" for 80% score)');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('badges');
    }
};
