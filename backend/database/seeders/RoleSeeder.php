<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'MSME Proponent',
                'code' => 'MSME_PROPONENT',
                'program_type' => 'SETUP',
                'description' => 'Submits SETUP proposals and monitors project implementation.',
            ],
            [
                'name' => 'GIA Project Leader',
                'code' => 'GIA_PROJECT_LEADER',
                'program_type' => 'GIA',
                'description' => 'Submits GIA proposals and milestone reports.',
            ],
            [
                'name' => 'PSTO Staff',
                'code' => 'PSTO_STAFF',
                'program_type' => 'SETUP',
                'description' => 'Conducts field validation, encodes TNA findings, and monitors projects.',
            ],
            [
                'name' => 'PSTO Director',
                'code' => 'PSTO_DIRECTOR',
                'program_type' => 'SETUP',
                'description' => 'Oversees provincial SETUP operations.',
            ],
            [
                'name' => 'RPMO Staff',
                'code' => 'RPMO_STAFF',
                'program_type' => 'SETUP',
                'description' => 'Performs regional proposal screening and monitoring.',
            ],
            [
                'name' => 'RTEC Board Member',
                'code' => 'RTEC_BOARD_MEMBER',
                'program_type' => 'SETUP',
                'description' => 'Evaluates SETUP proposals and submits recommendations.',
            ],
            [
                'name' => 'Regional Director',
                'code' => 'REGIONAL_DIRECTOR',
                'program_type' => 'SETUP',
                'description' => 'Approves or disapproves SETUP proposals.',
            ],
            [
                'name' => 'Sectoral Council Staff',
                'code' => 'SECTORAL_COUNCIL_STAFF',
                'program_type' => 'GIA',
                'description' => 'Screens GIA proposals and coordinates technical reviews.',
            ],
            [
                'name' => 'Technical Panel Reviewer',
                'code' => 'TECHNICAL_PANEL_REVIEWER',
                'program_type' => 'GIA',
                'description' => 'Performs anonymous technical evaluation of GIA proposals.',
            ],
            [
                'name' => 'ExeCom Member',
                'code' => 'EXECOM_MEMBER',
                'program_type' => 'GIA',
                'description' => 'Approves portfolio-level GIA grants.',
            ],
            [
                'name' => 'Finance & Accounting Officer',
                'code' => 'FINANCE_OFFICER',
                'program_type' => 'BOTH',
                'description' => 'Manages financial records, billing, repayments, and disbursements.',
            ],
            [
                'name' => 'System Administrator',
                'code' => 'SYSTEM_ADMIN',
                'program_type' => 'BOTH',
                'description' => 'Manages users, system configuration, and platform administration.',
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['code' => $role['code']],
                $role
            );
        }
    }
}
