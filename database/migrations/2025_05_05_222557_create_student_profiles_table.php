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
        Schema::create('student_profiles', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->onDelete('cascade'); 
            $table->date('date_of_birth')->nullable();
            $table->foreignId('grade_level_id')->nullable();
            $table->string('school_name')->nullable();
            $table->json('learning_interests')->nullable();
            $table->timestamps();

            
            if (Schema::hasTable('grade_levels')) {
                $table->foreign('grade_level_id')->references('id')->on('grade_levels')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_profiles');
    }
};
