<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('assignment_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->string('submission_type')->default('file'); 
            $table->string('file_path')->nullable(); 
            $table->text('url')->nullable(); 
            $table->longText('text_content')->nullable(); 
            $table->boolean('is_late')->default(false); 
            $table->decimal('grade', 8, 2)->nullable(); 
            $table->timestamp('graded_at')->nullable();
            $table->text('teacher_feedback')->nullable();
            $table->foreignId('grading_teacher_id')->nullable()->constrained('users'); 
            $table->timestamps();
            $table->softDeletes();

            
            $table->index('assignment_id');
            $table->index('user_id');
            $table->index('grading_teacher_id');
            $table->index('is_late');
            $table->index('submission_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assignment_submissions');
    }
};
