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
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); 
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->timestamp('enrolled_at');
            $table->timestamp('completed_at')->nullable();
            $table->decimal('progress', 5, 2)->default(0.00)->comment('Overall course progress percentage');
            $table->enum('access_type', ['subscription', 'purchase'])->default('subscription');
            $table->enum('status', ['active', 'completed', 'restricted_tier', 'restricted_limit'])
                  ->default('active')
                  ->comment('Current status of the enrollment');
            $table->index('status');
            $table->foreignId('course_purchase_id')->nullable();
            $table->foreignId('order_id')->nullable()->comment('Reference to order if enrolled through shop');
            $table->timestamp('expiry_date')->nullable()->comment('Date when enrollment expires, if applicable');
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['user_id', 'course_id']);

            if (Schema::hasTable('course_purchases')) {
                $table->foreign('course_purchase_id')->references('id')->on('course_purchases')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
