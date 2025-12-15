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
        Schema::create('student_performances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            $table->foreignId('grade_level_id')->constrained()->onDelete('cascade');
            $table->foreignId('performance_metric_id')->constrained()->onDelete('cascade');
            $table->decimal('raw_score', 10, 2)->default(0);
            $table->decimal('percentage_score', 5, 2)->default(0);
            $table->string('level')->nullable(); 
            $table->timestamp('last_calculated_at')->nullable();
            $table->timestamps();

            
            $table->index(['user_id', 'subject_id', 'grade_level_id']);

            
            $table->unique(['user_id', 'subject_id', 'grade_level_id', 'performance_metric_id'], 'student_performance_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_performances');
    }
};
