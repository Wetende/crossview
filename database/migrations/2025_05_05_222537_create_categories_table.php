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
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->foreignId('parent_category_id')->nullable();
            $table->timestamps();

            
            $table->foreign('parent_category_id')->references('id')->on('categories')->onDelete('set null');
        });

        
        DB::table('categories')->insert([
            ['name' => 'Primary School', 'slug' => 'primary-school', 'description' => 'Courses for primary school students', 'parent_category_id' => null, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Secondary School', 'slug' => 'secondary-school', 'description' => 'Courses for secondary school students', 'parent_category_id' => null, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'University', 'slug' => 'university', 'description' => 'Courses for university students', 'parent_category_id' => null, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
