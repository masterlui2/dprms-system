<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $adminRole = Role::query()->updateOrCreate(
            ['code' => 'admin'],
            [
                'description' => 'Full system access for DOST administrators.',
                'name' => 'System Administrator',
                'program_type' => 'BOTH',
            ],
        );

        Role::query()->updateOrCreate(
            ['code' => 'proponent'],
            [
                'description' => 'Portal access for proposal proponents.',
                'name' => 'Project Proponent',
                'program_type' => 'BOTH',
            ],
        );

        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@dost.gov.ph'],
            [
                'is_active' => true,
                'name' => 'DOST Admin',
                'password' => Hash::make('Admin@'),
            ],
        );

        $admin->role()->syncWithoutDetaching([
            $adminRole->id => ['assigned_at' => now()],
        ]);
    }
}
