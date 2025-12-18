<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_blueprints', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->json('hierarchy_structure');
            $table->json('grading_logic');
            $table->json('progression_rules')->nullable();
            $table->boolean('gamification_enabled')->default(false);
            $table->boolean('certificate_enabled')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academic_blueprints');
    }
};
