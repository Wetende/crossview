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
        Schema::create('course_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('order')->default(0)->index();
            $table->boolean('is_published')->default(true)->index();
            $table->dateTime('unlock_date')->nullable()->index();
            $table->integer('unlock_after_days')->nullable()->comment('Relative to course enrollment/purchase date');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['course_id', 'order']);
            $table->index(['course_id', 'is_published']);
            $table->index(['course_id', 'unlock_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_sections');
    }
};
