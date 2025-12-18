<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('curriculum_nodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('curriculum_nodes')->cascadeOnDelete();
            $table->string('node_type', 50);
            $table->string('title', 255);
            $table->string('code', 50)->nullable();
            $table->text('description')->nullable();
            $table->json('properties')->nullable();
            $table->json('completion_rules')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->boolean('is_published')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['course_id', 'parent_id'], 'idx_course_parent');
            $table->index('node_type', 'idx_node_type');
            $table->index('position', 'idx_position');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('curriculum_nodes');
    }
};
