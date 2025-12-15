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
        
        if (!Schema::hasTable('subjects')) {
            return;
        }

        Schema::create('past_papers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->string('file_path');
            $table->string('year');
            $table->string('exam_board')->nullable();
            $table->string('paper_type')->nullable(); 
            $table->text('description')->nullable();
            $table->boolean('is_free')->default(false);
            $table->decimal('price', 8, 2)->nullable();
            $table->integer('download_count')->default(0);
            $table->timestamps();

            
            $table->index(['subject_id', 'year', 'exam_board']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('past_papers');
    }
};
