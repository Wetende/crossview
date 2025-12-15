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
        Schema::create('question_matching_pairs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->string('matching_pair_key'); 
            $table->string('prompt_text')->nullable(); 
            $table->string('prompt_image_url')->nullable(); 
            $table->string('answer_text')->nullable(); 
            $table->string('answer_image_url')->nullable(); 
            $table->integer('order')->default(0); 
            $table->integer('points')->default(1); 
            $table->timestamps();


            $table->index('question_id');
            $table->unique(['question_id', 'matching_pair_key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('question_matching_pairs');
    }
};
