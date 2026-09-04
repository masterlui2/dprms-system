<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectMonitoringRecord;
use App\Models\Proposal;
use App\Models\Role;
use App\Models\SetupProgressReport;
use App\Models\SetupProposal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SetupMonitoringProjectsTest extends TestCase
{
    use RefreshDatabase;

    private User $setupStaff;

    protected function setUp(): void
    {
        parent::setUp();

        $staffRole = Role::create([
            'name' => 'SETUP Project Staff',
            'code' => 'PROJECT_STAFF',
            'program_type' => 'SETUP',
            'description' => 'SETUP project monitoring staff',
        ]);

        $this->setupStaff = User::factory()->create(['program_type' => 'SETUP']);
        $this->setupStaff->role()->attach($staffRole->id, ['assigned_at' => now()]);
    }

    public function test_it_returns_only_active_setup_projects(): void
    {
        $activeSetup = $this->createProject('SETUP', 'active', 'Mati Food Works', 'Mati City');
        $this->createProject('SETUP', 'completed', 'Completed Enterprise', 'Mati City');
        $this->createProject('GIA', 'active', 'GIA Organization', 'Tagum City');

        Sanctum::actingAs($this->setupStaff);

        $response = $this->getJson('/api/setup/monitoring/projects');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $activeSetup->id)
            ->assertJsonPath('data.0.enterprise_name', 'Mati Food Works')
            ->assertJsonPath('statistics.active_projects', 1);
    }

    public function test_search_and_district_filters_run_against_the_database(): void
    {
        $matched = $this->createProject('SETUP', 'active', 'Coastal Food Processing', 'Mati City');
        $this->createProject('SETUP', 'active', 'Highland Coffee Works', 'Tagum City');

        Sanctum::actingAs($this->setupStaff);

        $response = $this->getJson('/api/setup/monitoring/projects?search=coastal&district=Mati%20City');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $matched->id)
            ->assertJsonPath('data.0.district', 'Mati City')
            ->assertJsonPath('filters.districts.0', 'Mati City')
            ->assertJsonPath('filters.districts.1', 'Tagum City');
    }

    public function test_it_returns_live_monitoring_statistics_and_quarter_context(): void
    {
        $project = $this->createProject('SETUP', 'active', 'Monitored Enterprise', 'Mati City');
        $monitoringRecord = ProjectMonitoringRecord::create([
            'proposal_id' => $project->proposal_id,
            'assigned_monitor' => $this->setupStaff->id,
            'program_type' => 'SETUP',
            'implementation_status' => 'IN_PROGRESS',
            'overall_compliance' => 75,
            'last_monitored_at' => now()->subDay(),
        ]);

        SetupProgressReport::create([
            'monitoring_record_id' => $monitoringRecord->id,
            'submitted_by' => $this->setupStaff->id,
            'report_type' => 'QUARTERLY',
            'reporting_period' => 'Q3 2026',
            'reporting_quarter' => 3,
            'reporting_year' => 2026,
            'status' => 'DRAFT',
            'due_date' => '2026-09-30',
        ]);

        Sanctum::actingAs($this->setupStaff);

        $response = $this->getJson('/api/setup/monitoring/projects?year=2026&quarter=3');

        $response->assertOk()
            ->assertJsonPath('statistics.active_projects', 1)
            ->assertJsonPath('statistics.monitored_count', 1)
            ->assertJsonPath('statistics.pending_reports', 1)
            ->assertJsonPath('data.0.monitored', true)
            ->assertJsonPath('data.0.pending_reports', 1)
            ->assertJsonPath('data.0.latest_report.status', 'DRAFT')
            ->assertJsonPath('data.0.quarterly_context.year', 2026)
            ->assertJsonPath('data.0.quarterly_context.quarter', 3);
    }

    public function test_gia_only_staff_cannot_access_setup_monitoring_projects(): void
    {
        $giaRole = Role::where('code', 'PROJECT_STAFF')->firstOrFail();
        $giaStaff = User::factory()->create(['program_type' => 'GIA']);
        $giaStaff->role()->attach($giaRole->id, ['assigned_at' => now()]);

        Sanctum::actingAs($giaStaff);

        $this->getJson('/api/setup/monitoring/projects')->assertForbidden();
    }

    public function test_project_results_are_paginated_six_per_page(): void
    {
        foreach (range(1, 7) as $index) {
            $this->createProject('SETUP', 'active', "Enterprise {$index}", 'Mati City');
        }

        Sanctum::actingAs($this->setupStaff);

        $this->getJson('/api/setup/monitoring/projects?page=1')
            ->assertOk()
            ->assertJsonCount(6, 'data')
            ->assertJsonPath('pagination.current_page', 1)
            ->assertJsonPath('pagination.last_page', 2)
            ->assertJsonPath('pagination.per_page', 6)
            ->assertJsonPath('pagination.total', 7);

        $this->getJson('/api/setup/monitoring/projects?page=2')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('pagination.current_page', 2);
    }

    private function createProject(
        string $program,
        string $status,
        string $enterprise,
        string $city,
    ): Project {
        $owner = User::factory()->create(['program_type' => $program]);
        $proposal = Proposal::create([
            'submitted_by' => $owner->id,
            'program_type' => $program,
            'reference_number' => sprintf('%s-%s', $program, fake()->unique()->numerify('####')),
            'title' => "{$enterprise} Modernization",
            'status' => 'APPROVED',
            'submitted_at' => now()->subMonth(),
            'approved_at' => now(),
        ]);

        if ($program === 'SETUP') {
            SetupProposal::create([
                'proposal_id' => $proposal->id,
                'business_name' => $enterprise,
                'business_type' => 'SOLE-PROPRIETORSHIP',
                'industry_sector' => 'Food Processing',
                'enterprise_size' => 'MICRO',
                'years_in_operation' => 3,
                'business_address' => "{$city}, Davao Region",
                'region' => 'Region XI',
                'province' => 'Davao Region',
                'city_municipality' => $city,
            ]);
        }

        return Project::create([
            'proposal_id' => $proposal->id,
            'created_by' => $owner->id,
            'approved_by' => $this->setupStaff->id,
            'program_type' => $program,
            'status' => $status,
            'approved_at' => now(),
        ]);
    }
}
