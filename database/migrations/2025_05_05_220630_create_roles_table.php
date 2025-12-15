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
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('display_name');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        
        DB::table('roles')->insert([
            ['name' => 'student', 'display_name' => 'Student', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'teacher', 'display_name' => 'Teacher', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'parent', 'display_name' => 'Parent', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'admin', 'display_name' => 'Administrator', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
