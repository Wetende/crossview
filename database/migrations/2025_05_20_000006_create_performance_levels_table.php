<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('performance_levels', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->decimal('min_score', 5, 2);
            $table->decimal('max_score', 5, 2);
            $table->string('color_code', 50)->nullable();
            $table->text('description')->nullable();
            $table->integer('display_order')->default(0);
            $table->timestamps();
        });

        
        DB::table('performance_levels')->insert([
            [
                'name' => 'Distinction',
                'min_score' => 80.00,
                'max_score' => 100.00,
                'color_code' => '#28a745',
                'description' => 'Excellent understanding and application of subject knowledge',
                'display_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Credit',
                'min_score' => 65.00,
                'max_score' => 79.99,
                'color_code' => '#17a2b8',
                'description' => 'Good understanding and application of subject knowledge',
                'display_order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Pass',
                'min_score' => 50.00,
                'max_score' => 64.99,
                'color_code' => '#ffc107',
                'description' => 'Satisfactory understanding of subject knowledge',
                'display_order' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Needs Improvement',
                'min_score' => 0.00,
                'max_score' => 49.99,
                'color_code' => '#dc3545',
                'description' => 'Limited understanding of subject knowledge, requires additional support',
                'display_order' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('performance_levels');
    }
};
