<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description');
            $table->text('short_description')->nullable();
            $table->string('thumbnail_path')->nullable();
            $table->decimal('price', 10, 2)->default(0.00);
            $table->enum('pricing_type', ['free', 'subscription', 'purchase', 'both'])
                  ->default('free')
                  ->comment('Defines how this course can be accessed: free, subscription only, purchase only, or both subscription and purchase');
            $table->string('level')->nullable();
            $table->string('language')->default('en');
            $table->json('requirements')->nullable();
            $table->json('what_you_will_learn')->nullable();
            $table->text('instructor_info')->nullable();
            $table->json('tags')->nullable();
            $table->integer('duration_in_minutes')->default(0);
            $table->boolean('is_featured')->default(false)->index();
            $table->boolean('is_recommended')->default(false)->index();
            $table->boolean('allow_certificate')->default(false);
            $table->unsignedBigInteger('certificate_template_id')->nullable();
            $table->boolean('is_published')->default(false)->index();
            $table->enum('approval_status', ['draft', 'submitted', 'approved', 'rejected'])
                  ->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->foreignId('reviewed_by_admin_id')
                  ->nullable()
                  ->constrained('users')
                  ->onDelete('set null');
            $table->text('rejection_reason')->nullable();
            $table->json('approval_notes')->nullable();
            $table->json('draft_notes')->nullable();
            $table->boolean('editing_locked')->default(false);
            $table->timestamp('published_at')->nullable()->index();
            $table->boolean('subscription_required')->default(false);
            $table->unsignedBigInteger('required_subscription_tier_id')->nullable();
            $table->boolean('enable_coupon')->default(false);
            $table->decimal('sale_price', 8, 2)->nullable();
            $table->dateTime('sale_start_date')->nullable();
            $table->dateTime('sale_end_date')->nullable();
            $table->boolean('enable_bulk_purchase')->default(false);
            $table->boolean('enable_gift_option')->default(false);
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->string('meta_keywords')->nullable();
            $table->integer('position')->default(0)->index();
            $table->foreignId('category_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('subject_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('grade_level_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'is_published']);
            $table->index(['category_id', 'is_published']);
            $table->index(['subject_id', 'is_published']);
            $table->index(['grade_level_id', 'is_published']);
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->foreign('certificate_template_id')
                ->references('id')
                ->on('certificate_templates')
                ->onDelete('set null');

            $table->foreign('required_subscription_tier_id')
                ->references('id')
                ->on('subscription_tiers')
                ->onDelete('set null');
        });
        
        // Add the generated virtual column
        DB::statement('ALTER TABLE courses ADD COLUMN name VARCHAR(255) GENERATED ALWAYS AS (title) VIRTUAL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
