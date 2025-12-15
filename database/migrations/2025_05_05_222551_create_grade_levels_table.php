<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB; 
use Illuminate\Support\Str;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('grade_levels', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->integer('level_order')->unique(); 
            $table->text('description')->nullable();
            $table->string('age_range')->nullable(); 
            $table->string('curriculum_code')->nullable(); 
            $table->boolean('is_active')->default(true); 
            $table->timestamps();
            $table->softDeletes();
        });

        // Insert initial grade levels with slugs
        DB::table('grade_levels')->insert([
            [
                'name' => 'S1',
                'slug' => 's1',
                'level_order' => 1,
                'description' => 'Senior 1',
                'age_range' => '12-13',
                'curriculum_code' => 'S1',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'S2',
                'slug' => 's2',
                'level_order' => 2,
                'description' => 'Senior 2',
                'age_range' => '13-14',
                'curriculum_code' => 'S2',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'S3',
                'slug' => 's3',
                'level_order' => 3,
                'description' => 'Senior 3',
                'age_range' => '14-15',
                'curriculum_code' => 'S3',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'S4',
                'slug' => 's4',
                'level_order' => 4,
                'description' => 'Senior 4',
                'age_range' => '15-16',
                'curriculum_code' => 'S4',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'S5',
                'slug' => 's5',
                'level_order' => 5,
                'description' => 'Senior 5',
                'age_range' => '16-17',
                'curriculum_code' => 'S5',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'S6',
                'slug' => 's6',
                'level_order' => 6,
                'description' => 'Senior 6',
                'age_range' => '17-18',
                'curriculum_code' => 'S6',
                'is_active' => true,
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
        Schema::dropIfExists('grade_levels');
    }
};
