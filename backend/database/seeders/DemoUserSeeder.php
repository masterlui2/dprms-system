<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Local DPRMS accounts for exercising each of the six application roles.
 * All accounts use the password listed below; change or remove this seeder
 * before using the application outside of a local/demo environment.
 */
class DemoUserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['name' => 'DOST System Administrator', 'email' => 'admin@dost.gov.ph', 'role' => 'SYSTEM_ADMIN'],
            ['name' => 'Paolo Project Staff', 'email' => 'staff@dost.gov.ph', 'role' => 'PROJECT_STAFF'],
            ['name' => 'Faith Focal Reviewer', 'email' => 'focal@dost.gov.ph', 'role' => 'FOCAL'],
            ['name' => 'Pat Provincial Director', 'email' => 'director@dost.gov.ph', 'role' => 'PROVINCIAL_DIRECTOR'],
            ['name' => 'Rico RPMO Viewer', 'email' => 'rpmo@dost.gov.ph', 'role' => 'RPMO'],
            ['name' => 'Maria Proponent', 'email' => 'proponent@dost.gov.ph', 'role' => 'PROPONENT'],
        ];

        foreach ($users as $data) {
            $role = Role::query()->where('code', $data['role'])->firstOrFail();
            $user = User::query()->updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'is_active' => true,
                    'password' => Hash::make('Dprms@123'),
                ],
            );

            $user->role()->sync([
                $role->id => ['assigned_at' => now()],
            ]);
        }
    }
}
