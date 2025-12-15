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
        Schema::create('student_rankings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('subject_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('grade_level_id')->constrained()->onDelete('cascade');
            $table->integer('rank');
            $table->integer('total_students');
            $table->decimal('percentile', 5, 2);
            $table->decimal('score', 10, 2)->nullable();
            $table->string('ranking_period')->nullable(); 
            $table->string('ranking_type'); 
            $table->timestamp('calculated_at')->nullable();
            $table->timestamps();

            
            $table->index(['subject_id', 'grade_level_id', 'ranking_period', 'ranking_type'], 'student_rankings_lookup_index');

            
            $table->unique(['user_id', 'subject_id', 'grade_level_id', 'ranking_period', 'ranking_type'], 'student_ranking_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_rankings');
    }
};
