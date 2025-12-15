<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use App\Models\TeacherProfile;
use App\Models\StudentProfile;
use App\Models\ParentProfile;
use App\Models\GradeLevel; 
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Faker\Factory as Faker;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        
        $adminRole = Role::where('name', 'admin')->firstOrFail();
        $teacherRole = Role::where('name', 'teacher')->firstOrFail();
        $studentRole = Role::where('name', 'student')->firstOrFail();
        $parentRole = Role::where('name', 'parent')->firstOrFail();


        $gradeLevels = GradeLevel::all();
        if ($gradeLevels->isEmpty()) {
            
            
            $this->command->error('No grade levels found. Please seed grade levels before users.');
            
            
            return; 
        }

        
        $userCount = User::count();
        if ($userCount > 4) { 
            $this->command->info('Additional users already exist. Skipping user creation.');
            return;
        }

        
        for ($i = 0; $i < $faker->numberBetween(2, 3); $i++) {
            $firstName = $faker->firstName;
            $lastName = $faker->lastName;
            $email = strtolower($firstName . '.' . $lastName . $i . '@studysafari.app');

            User::factory()->create([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'name' => $firstName . ' ' . $lastName,
                'email' => $email,
            ])->roles()->attach($adminRole->id);
        }
        $this->command->info('Admin users seeded.');

        
        $teacherUsers = [];
        for ($i = 0; $i < $faker->numberBetween(5, 10); $i++) {
            $firstName = $faker->firstName;
            $lastName = $faker->lastName;
            $email = strtolower($firstName . '.' . $lastName . $i . '@studysafari.app');

            $user = User::factory()->create([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'name' => $firstName . ' ' . $lastName,
                'email' => $email,
            ]);
            $user->roles()->attach($teacherRole->id);

            TeacherProfile::factory()->create([
                'user_id' => $user->id,
                'bio' => $faker->paragraph,
                'qualifications' => $faker->randomElement(['MSc. Education', 'Certified Physics Instructor', 'PhD in History', 'B.A. English Literature']),
                'school_affiliation' => $faker->company,
                'available_for_tutoring' => $faker->boolean(30) 
            ]);

            $teacherUsers[] = $user;
        }
        $this->command->info('Teacher users and profiles seeded.');

        
        $studentUsers = [];
        for ($i = 0; $i < $faker->numberBetween(20, 30); $i++) {
            $firstName = $faker->firstName;
            $lastName = $faker->lastName;
            $email = strtolower($firstName . '.' . $lastName . $i . '@studysafari.app');

            $user = User::factory()->create([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'name' => $firstName . ' ' . $lastName,
                'email' => $email,
            ]);
            $user->roles()->attach($studentRole->id);

            StudentProfile::factory()->create([
                'user_id' => $user->id,
                'date_of_birth' => $faker->dateTimeBetween('-18 years', '-6 years')->format('Y-m-d'),
                'grade_level_id' => $gradeLevels->isNotEmpty() ? $gradeLevels->random()->id : null,
                'learning_interests' => json_encode($faker->randomElements(['Math', 'Coding', 'History', 'Science', 'Art', 'Music'], $faker->numberBetween(1, 3))),
            ]);

            $studentUsers[] = $user;
        }
        $this->command->info('Student users and profiles seeded.');

        
        $parentUsers = [];
        for ($i = 0; $i < $faker->numberBetween(10, 15); $i++) {
            $firstName = $faker->firstName;
            $lastName = $faker->lastName;
            $email = strtolower($firstName . '.' . $lastName . $i . '@studysafari.app');

            $user = User::factory()->create([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'name' => $firstName . ' ' . $lastName,
                'email' => $email,
            ]);
            $user->roles()->attach($parentRole->id);

            ParentProfile::factory()->create([
                'user_id' => $user->id,
                'occupation' => $faker->jobTitle,
                'relationship_to_student' => $faker->randomElement(['Mother', 'Father', 'Guardian', 'Grandparent']),
            ]);

            $parentUsers[] = $user;
        }
        $this->command->info('Parent users and profiles seeded.');

        
        foreach ($parentUsers as $parent) {
            
            $studentsToLink = collect($studentUsers)->random($faker->numberBetween(1, min(2, count($studentUsers))));
            foreach ($studentsToLink as $student) {
                
                if (!$parent->linkedStudents()->where('student_user_id', $student->id)->exists()) {
                    $isActive = $faker->boolean(80); 
                    $parent->linkedStudents()->attach($student->id, [
                        'status' => $isActive ? 'active' : 'pending',
                        'requested_at' => now(),
                        'actioned_at' => $isActive ? now() : null,
                    ]);
                }
            }
        }
        $this->command->info('Parents linked to students.');

        
        $defaultUsers = [
            [
                'first_name' => 'Admin',
                'last_name' => 'User',
                'email' => 'admin@studysafari.app',
                'role_id' => $adminRole->id,
            ],
            [
                'first_name' => 'Teacher',
                'last_name' => 'User',
                'email' => 'teacher@studysafari.app',
                'role_id' => $teacherRole->id,
            ],
            [
                'first_name' => 'Student',
                'last_name' => 'User',
                'email' => 'student@studysafari.app',
                'role_id' => $studentRole->id,
            ],
            [
                'first_name' => 'Parent',
                'last_name' => 'User',
                'email' => 'parent@studysafari.app',
                'role_id' => $parentRole->id,
            ],
        ];

        foreach ($defaultUsers as $userData) {
            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                [
                'first_name' => $userData['first_name'],
                'last_name' => $userData['last_name'],
                'name' => $userData['first_name'] . ' ' . $userData['last_name'],
                'email_verified_at' => now(),
                'password' => Hash::make('password'), 
                'remember_token' => Str::random(10),
                ]
            );

            if (!$user->roles->contains($userData['role_id'])) {
                $user->roles()->attach($userData['role_id']);
            }

            
            if ($user->wasRecentlyCreated) {
                if ($user->hasRole('teacher') && !$user->teacherProfile) {
                    TeacherProfile::factory()->create(['user_id' => $user->id]);
                }
                if ($user->hasRole('student') && !$user->studentProfile) {
                    StudentProfile::factory()->create([
                       'user_id' => $user->id,
                       'grade_level_id' => $gradeLevels->isNotEmpty() ? $gradeLevels->random()->id : null,
                    ]);
                }
                if ($user->hasRole('parent') && !$user->parentProfile) {
                    ParentProfile::factory()->create(['user_id' => $user->id]);
                }
            }
        }
        $this->command->info('Default admin, teacher, student, and parent users ensured.');
    }
}
