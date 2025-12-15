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
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained()->onDelete('cascade');
            $table->text('text')->comment('The question prompt/stem');
            $table->string('question_type')->comment('Supported types: single_choice, multiple_choice, true_false, matching, image_matching, fill_in_the_gap, keywords');
            $table->integer('points')->default(1);
            $table->integer('order')->default(0)->index();
            $table->text('hint')->nullable();
            $table->text('explanation')->nullable();
            $table->string('image_path')->nullable();
            $table->boolean('add_to_my_library')->default(false)->index();
            $table->foreignId('subject_topic_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();


            $table->index(['quiz_id', 'order']);
            $table->index(['subject_topic_id', 'question_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
