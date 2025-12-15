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
        
        if (!Schema::hasTable('subjects') || !Schema::hasTable('grade_levels')) {
            return;
        }

        Schema::create('performance_calculation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            $table->foreignId('grade_level_id')->constrained()->onDelete('cascade');
            $table->string('calculation_type'); 
            $table->decimal('previous_score', 10, 2)->nullable();
            $table->decimal('new_score', 10, 2);
            $table->text('calculation_details')->nullable(); 
            $table->string('trigger_event')->nullable(); 
            $table->timestamps();

            
            $table->index(['user_id', 'subject_id', 'grade_level_id', 'calculation_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('performance_calculation_logs');
    }
};
