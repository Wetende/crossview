<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        
        DB::table('courses')->where('level', 'Beginner')->update(['level' => 'S1']);
        DB::table('courses')->where('level', 'Intermediate')->update(['level' => 'S3']);
        DB::table('courses')->where('level', 'Advanced')->update(['level' => 'S5']);
        DB::table('courses')->where('level', 'All Levels')->update(['level' => 'S2']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        
        DB::table('courses')->where('level', 'S1')->update(['level' => 'Beginner']);
        DB::table('courses')->where('level', 'S3')->update(['level' => 'Intermediate']);
        DB::table('courses')->where('level', 'S5')->update(['level' => 'Advanced']);
        DB::table('courses')->where('level', 'S2')->update(['level' => 'All Levels']);
    }
};
