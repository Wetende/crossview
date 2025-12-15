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
        Schema::create('leaderboard_entries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('leaderboard_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedInteger('rank');
            $table->unsignedInteger('points');
            $table->json('achievements')->nullable(); 
            $table->boolean('is_public')->default(true); 
            $table->timestamps();

            
            $table->foreign('leaderboard_id')->references('id')->on('leaderboards')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            
            $table->unique(['leaderboard_id', 'user_id']);

            
            $table->index(['leaderboard_id', 'rank']);
            $table->index(['user_id', 'leaderboard_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leaderboard_entries');
    }
};
