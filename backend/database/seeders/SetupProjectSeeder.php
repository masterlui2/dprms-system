<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\Proposal;
use App\Models\Role;
use App\Models\SetupProposal;
use App\Models\User;
use Illuminate\Database\Seeder;

class SetupProjectSeeder extends Seeder
{
    public function run(): void
    {
        $proponent = User::query()
            ->where('email', 'setup.proponent@dost.gov.ph')
            ->first() ?? User::query()->first();

        $director = User::query()
            ->where('email', 'director@dost.gov.ph')
            ->first() ?? $proponent;

        $focal = User::query()
            ->where('email', 'setup.focal@dost.gov.ph')
            ->first();

        if (! $proponent || ! $director) {
            return;
        }

        $proposal = Proposal::query()->firstOrCreate(
            ['reference_number' => 'SETUP-2026-0001'],
            [
                'submitted_by' => $proponent->id,
                'focal_id' => $focal?->id,
                'program_type' => 'SETUP',
                'title' => 'Upgrading of Food Processing and Packaging Facility',
                'status' => 'APPROVED',
                'submitted_at' => today()->subMonths(3),
                'approved_at' => today()->subMonths(2),
            ]
        );

        SetupProposal::query()->firstOrCreate(
            ['proposal_id' => $proposal->id],
            [
                'business_name' => 'Mati Agri-Food Processing Enterprise',
                'business_type' => 'SOLE-PROPRIETORSHIP',
                'industry_sector' => 'Food Processing',
                'enterprise_size' => 'MICRO',
                'years_in_operation' => 5,
                'business_address' => 'Barangay Central, Mati City, Davao Oriental',
                'region' => 'Region XI',
                'province' => 'Davao Oriental',
                'city_municipality' => 'Mati City',
                'form_snapshot' => [
                    'businessName' => 'Mati Agri-Food Processing Enterprise',
                    'contactPerson' => $proponent->name ?? 'Maria SETUP Proponent',
                    'contactNumber' => '09171234567',
                ],
            ]
        );

        Project::query()->firstOrCreate(
            ['proposal_id' => $proposal->id],
            [
                'created_by' => $proponent->id,
                'approved_by' => $director->id,
                'program_type' => 'SETUP',
                'status' => 'active',
                'approved_at' => today()->subMonths(2),
                'notes' => 'Active SETUP Project awaiting Repayment Ledger Initialization.',
            ]
        );
    }
}
