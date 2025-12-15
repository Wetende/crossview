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
        
        if (Schema::hasTable('subjects')) {
            return;
        }

        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('icon_path')->nullable();
            $table->string('color_code')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('has_performance_tracking')->default(false);
            $table->integer('position')->default(0);
            $table->string('curriculum_code')->nullable();
            $table->timestamps();
        });

        
        DB::table('subjects')->insert([
            [
                'name' => 'Mathematics',
                'slug' => 'mathematics',
                'description' => 'Study of numbers, quantities, and shapes',
                'icon_path' => null,
                'color_code' => '#4287f5',
                'is_active' => true,
                'has_performance_tracking' => true,
                'position' => 1,
                'curriculum_code' => 'M1',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Physics',
                'slug' => 'physics',
                'description' => 'Study of matter, energy, and the interaction between them',
                'icon_path' => null,
                'color_code' => '#f54242',
                'is_active' => true,
                'has_performance_tracking' => true,
                'position' => 2,
                'curriculum_code' => 'P1',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Chemistry',
                'slug' => 'chemistry',
                'description' => 'Study of substances, their properties, and reactions',
                'icon_path' => null,
                'color_code' => '#42f56f',
                'is_active' => true,
                'has_performance_tracking' => true,
                'position' => 3,
                'curriculum_code' => 'C1',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Biology',
                'slug' => 'biology',
                'description' => 'Study of living organisms',
                'icon_path' => null,
                'color_code' => '#f5ce42',
                'is_active' => true,
                'has_performance_tracking' => true,
                'position' => 4,
                'curriculum_code' => 'B1',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'English',
                'slug' => 'english',
                'description' => 'Study of the English language',
                'icon_path' => null,
                'color_code' => '#42f5f2',
                'is_active' => true,
                'has_performance_tracking' => true,
                'position' => 5,
                'curriculum_code' => 'E1',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'History',
                'slug' => 'history',
                'description' => 'Study of past events',
                'icon_path' => null,
                'color_code' => '#8942f5',
                'is_active' => true,
                'has_performance_tracking' => true,
                'position' => 6,
                'curriculum_code' => 'H1',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Geography',
                'slug' => 'geography',
                'description' => 'Study of places and relationships between people and their environments',
                'icon_path' => null,
                'color_code' => '#f542d4',
                'is_active' => true,
                'has_performance_tracking' => true,
                'position' => 7,
                'curriculum_code' => 'G1',
                'created_at' => now(),
                'updated_at' => now()
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subjects');
    }
};
