<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use App\Models\TeacherPaymentDetail;
use App\Models\TeacherPayout;
use App\Models\Payment;
use App\Models\UserSubscription;
use App\Models\Enrollment;
use App\Models\Course; 
use App\Models\SubscriptionTier;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

final class FinancialSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();
        $this->command->info('Seeding financial data (teacher payments, payouts, student payments)...');

        $teachers = User::whereHas('roles', fn ($q) => $q->where('name', 'teacher'))->get();
        $students = User::whereHas('roles', fn ($q) => $q->where('name', 'student'))->get();
        $courses = Course::where('is_published', true)->where('price', '>', 0)->get(); 
        $subscriptionTiers = SubscriptionTier::where('price', '>', 0)->get(); 

        
        if ($teachers->isNotEmpty()) {
            foreach ($teachers as $teacher) {
                if ($faker->boolean(80) && !TeacherPaymentDetail::where('user_id', $teacher->id)->exists()) { 
                    TeacherPaymentDetail::factory()->create(['user_id' => $teacher->id]);
                }
            }
            $this->command->info('Teacher payment details seeded.');
        }

        
        $teachersWithPaymentDetails = User::whereHas('paymentDetail')->get();
        if ($teachersWithPaymentDetails->isNotEmpty()) {
            foreach ($teachersWithPaymentDetails as $teacher) {
                
                $existingPayout = TeacherPayout::where('user_id', $teacher->id)->exists();

                if ($faker->boolean(50) && !$existingPayout) { 
                    $payoutCount = $faker->numberBetween(1, 3);
                    for ($i = 0; $i < $payoutCount; $i++) {
                        TeacherPayout::factory()->create([
                            'user_id' => $teacher->id,
                            'amount' => $faker->randomFloat(2, 50, 1000),
                            'period_start' => $faker->dateTimeBetween('-6 months', '-1 month'),
                            'period_end' => $faker->dateTimeBetween('-1 month', 'now'),
                            'status' => $faker->randomElement(['pending', 'processing', 'paid', 'failed']),
                        ]);
                    }
                }
            }
            $this->command->info('Teacher payouts seeded.');
        }

        
        if ($students->isNotEmpty()) {
            foreach ($students as $student) {
                
                $paidEnrollments = Enrollment::where('user_id', $student->id)
                                    ->whereHas('course', fn ($q) => $q->where('price', '>', 0))
                                    ->with('course')->get();
                foreach ($paidEnrollments as $enrollment) {
                    if ($faker->boolean(90) &&
                        !Payment::where('user_id', $student->id)
                            ->where('payable_id', $enrollment->course->id)
                            ->where('payable_type', Course::class)
                            ->exists()) { 
                        Payment::factory()->create([
                            'user_id' => $student->id,
                            'payable_id' => $enrollment->course->id,
                            'payable_type' => Course::class,
                            'amount' => $enrollment->course->price,
                            'currency' => 'USD',
                            'payment_gateway' => $faker->randomElement(['card', 'paypal']),
                            'gateway_reference_id' => 'txn_' . Str::random(),
                            'status' => 'completed',
                            'paid_at' => Carbon::instance($enrollment->enrolled_at)->subDays($faker->numberBetween(0, 3)),
                        ]);
                    }
                }

                
                $activeSubscriptions = UserSubscription::where('user_id', $student->id)
                                        ->where('status', 'active')
                                        ->whereHas('tier', fn ($q) => $q->where('price', '>', 0))
                                        ->with('tier')->get();
                foreach ($activeSubscriptions as $userSub) {
                    
                    $existingPayment = Payment::where('user_id', $student->id)
                        ->where('payable_id', $userSub->id)
                        ->where('payable_type', UserSubscription::class)
                        ->exists();

                    if (!$existingPayment) {
                        
                        $paymentCount = $faker->numberBetween(1, 3);
                        for ($j = 0; $j < $paymentCount; $j++) {
                            Payment::factory()->create([
                               'user_id' => $student->id,
                               'payable_id' => $userSub->id, 
                               'payable_type' => UserSubscription::class,
                               'amount' => $userSub->tier->price, 
                               'currency' => 'USD',
                               'payment_gateway' => $faker->randomElement(['card', 'paypal']),
                               'gateway_reference_id' => 'txn_' . Str::random(),
                               'status' => 'completed',
                               'paid_at' => $faker->dateTimeBetween($userSub->started_at, $userSub->expires_at),
                            ]);
                        }
                    }
                }
            }
            $this->command->info('Student payments seeded.');
        }
        $this->command->info('Financial data seeding completed.');
    }
}
