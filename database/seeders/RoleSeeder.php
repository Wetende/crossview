<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

final class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'admin',
                'display_name' => 'Administrator',
                'is_default' => false,
            ],
            [
                'name' => 'teacher',
                'display_name' => 'Teacher',
                'is_default' => false,
            ],
            [
                'name' => 'student',
                'display_name' => 'Student',
                'is_default' => true,
            ],
            [
                'name' => 'parent',
                'display_name' => 'Parent',
                'is_default' => false,
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['name' => $role['name']],
                [
                    'display_name' => $role['display_name'],
                    'is_default' => $role['is_default']
                ]
            );
        }
    }
}
