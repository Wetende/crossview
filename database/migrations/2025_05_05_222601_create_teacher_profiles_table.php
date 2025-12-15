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
        Schema::create('teacher_profiles', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->onDelete('cascade'); 
            $table->text('bio')->nullable();
            $table->text('qualifications')->nullable();
            $table->string('school_affiliation')->nullable();
            $table->string('position')->nullable();
            $table->decimal('hourly_rate', 10, 2)->nullable();
            $table->boolean('available_for_tutoring')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teacher_profiles');
    }
};
