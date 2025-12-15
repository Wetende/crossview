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
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_section_id')->constrained('course_sections')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->comment('HTML content');
            $table->text('instructions')->nullable()->comment('HTML content');
            $table->dateTime('due_date')->nullable();
            $table->integer('points_possible')->unsigned()->nullable();
            $table->json('allowed_submission_types')->nullable()->comment("e.g., ['pdf', 'docx', 'zip']");
            $table->dateTime('unlock_date')->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assignments');
    }
};
