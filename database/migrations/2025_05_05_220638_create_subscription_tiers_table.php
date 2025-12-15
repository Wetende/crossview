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
        Schema::create('subscription_tiers', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->integer('level'); 
            $table->integer('duration_days')->comment('0 for unlimited/lifetime');
            $table->integer('max_courses')->nullable()->comment('Maximum number of concurrent course enrollments allowed by this tier. Null for unlimited.');
            $table->json('features')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        
        DB::table('subscription_tiers')->insert([
            [
                'name' => 'Free',
                'description' => 'Basic access with limited features',
                'price' => 0.00,
                'level' => 0,
                'duration_days' => 0,
                'features' => json_encode(['Limited courses', 'Basic quizzes']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Bronze',
                'description' => 'Standard access with more features',
                'price' => 10.00,
                'level' => 1,
                'duration_days' => 30,
                'features' => json_encode(['All free features', 'Access to premium courses', 'Advanced quizzes']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Silver',
                'description' => 'Enhanced access with priority support',
                'price' => 20.00,
                'level' => 2,
                'duration_days' => 30,
                'features' => json_encode(['All bronze features', 'Priority support', 'Live sessions']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Gold',
                'description' => 'Full access to all platform features',
                'price' => 30.00,
                'level' => 3,
                'duration_days' => 30,
                'features' => json_encode(['All silver features', 'One-on-one tutoring', 'Exclusive content']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_tiers');
    }
};
