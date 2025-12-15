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
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->foreignId('course_section_id')->nullable()->constrained()->onDelete('set null');
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('lesson_type')->comment('Types: text, video, stream, quiz_link, assignment_link');
            $table->integer('order')->default(0)->index();
            $table->boolean('is_published')->default(false)->index();
            $table->boolean('is_preview_allowed')->default(false)->index();
            $table->timestamp('unlock_date')->nullable()->index();
            $table->integer('unlock_after_purchase_days')->nullable();
            $table->text('short_description')->nullable();
            $table->text('content')->nullable();
            $table->boolean('enable_print')->default(true);
            $table->boolean('enable_copy')->default(true);
            $table->integer('lesson_duration')->nullable();

            // Video-related fields
            $table->string('video_url')->nullable();
            $table->string('video_source')->nullable()->comment('youtube, vimeo, local, etc.');
            $table->string('video_upload_path')->nullable();
            $table->text('video_embed_code')->nullable();
            $table->boolean('auto_play')->default(false);
            $table->boolean('show_controls')->default(true);
            $table->boolean('allow_download')->default(false);
            $table->boolean('enable_p_in_p')->default(false)->comment('Enable picture-in-picture');
            $table->boolean('enable_download')->default(false);

            // Stream-related fields
            $table->string('stream_url')->nullable();
            $table->string('stream_password')->nullable();
            $table->timestamp('stream_start_time')->nullable()->index();
            $table->text('stream_details')->nullable();
            $table->boolean('is_recorded')->default(false);
            $table->string('recording_url')->nullable();
            $table->boolean('notify_students')->default(true);
            $table->boolean('allow_chat')->default(true);
            $table->boolean('require_attendance')->default(false);
            $table->boolean('allow_bulk_download')->default(true);
            $table->boolean('track_downloads')->default(true);
            $table->boolean('require_completion')->default(false);

            // Linked content
            $table->foreignId('quiz_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('assignment_id')->nullable()->constrained()->onDelete('set null');
            $table->text('instructions')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes for better performance
            $table->index(['course_id', 'order']);
            $table->index(['course_section_id', 'order']);
            $table->index(['course_id', 'is_published']);
            $table->index(['lesson_type', 'is_published']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};
