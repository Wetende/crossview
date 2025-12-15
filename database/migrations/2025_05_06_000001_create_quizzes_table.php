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
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_section_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('time_limit')->nullable()->comment('Time limit in minutes');
            $table->boolean('randomize_questions')->default(false);
            $table->boolean('show_correct_answer')->default(false);
            $table->decimal('passing_grade', 5, 2)->nullable()->comment('Percentage required to pass');
            $table->decimal('retake_penalty_percent', 5, 2)->default(0.00);
            $table->string('style')->nullable(); 
            $table->integer('order')->default(0);
            $table->foreignId('subject_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quizzes');
    }
};
