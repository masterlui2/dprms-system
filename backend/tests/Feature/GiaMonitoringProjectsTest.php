<?php

namespace Tests\Feature;

use App\Models\GiaDeliverableTracking;
use App\Models\GiaProgressReport;
use App\Models\GiaProposal;
use App\Models\Project;
use App\Models\ProjectBudget;
use App\Models\ProjectMonitoringRecord;
use App\Models\Proposal;
use App\Models\Role;
use App\Models\SetupProposal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GiaMonitoringProjectsTest extends TestCase
{
    use RefreshDatabase;

    private User $giaFocal;
    private User $director;
    private Role $focalRole;

    protected function setUp(): void
    {
        parent::setUp();

        $this->focalRole = Role::create([
            'name' => 'CEST Focal',
            'code' => 'FOCAL',
            'program_type' => 'GIA',
            'description' => 'GIA CEST monitoring focal',
        ]);
        $directorRole = Role::create([
            'name' => 'Provincial Director',
            'code' => 'PROVINCIAL_DIRECTOR',
            'program_type' => 'BOTH',
            'description' => 'Provincial read-only viewer',
        ]);

        $this->giaFocal = User::factory()->create(['program_type' => 'GIA']);
        $this->giaFocal->role()->attach($this->focalRole->id, ['assigned_at' => now()]);
        $this->director = User::factory()->create(['program_type' => 'BOTH']);
        $this->director->role()->attach($directorRole->id, ['assigned_at' => now()]);
    }

    public function test_it_returns_only_active_gia_projects(): void
    {
        $activeGia = $this->createProject('GIA', 'active', 'Davao State University');
        $this->createProject('GIA', 'completed', 'Completed GIA Agency');
        $this->createProject('SETUP', 'active', 'SETUP Enterprise');

        Sanctum::actingAs($this->giaFocal);

        $this->getJson('/api/gia/monitoring/projects')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $activeGia->id)
            ->assertJsonPath('data.0.implementing_agency', 'Davao State University')
            ->assertJsonPath('statistics.active_grants', 1)
            ->assertJsonPath('access.can_edit', true)
            ->assertJsonPath('access.read_only', false);
    }

    public function test_agency_search_and_monitoring_status_filters_query_live_records(): void
    {
        $matched = $this->createProject('GIA', 'active', 'Coastal Science Institute');
        $this->createProject('GIA', 'active', 'Highland Research Council');
        ProjectMonitoringRecord::create([
            'proposal_id' => $matched->proposal_id,
            'assigned_monitor' => $this->giaFocal->id,
            'program_type' => 'GIA',
            'implementation_status' => 'IN_PROGRESS',
            'overall_compliance' => 55,
            'last_monitored_at' => now(),
        ]);

        Sanctum::actingAs($this->giaFocal);

        $this->getJson('/api/gia/monitoring/projects?search=coastal&agency=Coastal%20Science%20Institute&status=IN_PROGRESS')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $matched->id)
            ->assertJsonPath('data.0.monitoring_status', 'IN_PROGRESS')
            ->assertJsonPath('filters.agencies.0', 'Coastal Science Institute')
            ->assertJsonPath('filters.agencies.1', 'Highland Research Council');
    }

    public function test_it_returns_live_grant_and_milestone_statistics_with_semestral_context(): void
    {
        $project = $this->createProject('GIA', 'active', 'Regional Innovation Agency');
        ProjectBudget::create([
            'proposal_id' => $project->proposal_id,
            'created_by' => $this->director->id,
            'program_type' => 'GIA',
            'total_amount' => 500,
            'currency' => 'PHP',
            'fiscal_year' => 2026,
            'status' => 'ACTIVE',
        ]);
        $monitoring = ProjectMonitoringRecord::create([
            'proposal_id' => $project->proposal_id,
            'assigned_monitor' => $this->giaFocal->id,
            'program_type' => 'GIA',
            'implementation_status' => 'IN_PROGRESS',
            'overall_compliance' => 50,
            'last_monitored_at' => now()->subDay(),
        ]);
        GiaDeliverableTracking::create([
            'monitoring_record_id' => $monitoring->id,
            'deliverable_number' => 1,
            'deliverable_title' => 'Community technology pilot',
            'expected_completion' => '2026-10-31',
            'status' => 'IN_PROGRESS',
            'completion_percentage' => 50,
        ]);
        GiaDeliverableTracking::create([
            'monitoring_record_id' => $monitoring->id,
            'deliverable_number' => 2,
            'deliverable_title' => 'Policy adoption package',
            'expected_completion' => '2026-12-15',
            'status' => 'DELAYED',
            'completion_percentage' => 30,
        ]);
        GiaProgressReport::create([
            'monitoring_record_id' => $monitoring->id,
            'submitted_by' => $this->giaFocal->id,
            'report_type' => 'PROGRESS',
            'reporting_period' => '2nd Semester 2026',
            'reporting_year' => 2026,
            'status' => 'UNDER_REVIEW',
            'due_date' => '2026-12-31',
        ]);

        Sanctum::actingAs($this->giaFocal);

        $this->getJson('/api/gia/monitoring/projects?year=2026&semester=2')
            ->assertOk()
            ->assertJsonPath('statistics.active_grants', 1)
            ->assertJsonPath('statistics.monitored_projects', 1)
            ->assertJsonPath('statistics.total_grant_amount', 500)
            ->assertJsonPath('statistics.average_milestone_progress', 40)
            ->assertJsonPath('statistics.pending_milestones', 2)
            ->assertJsonPath('statistics.delayed_milestones', 1)
            ->assertJsonPath('data.0.milestone_progress', 40)
            ->assertJsonCount(2, 'data.0.milestones')
            ->assertJsonPath('data.0.latest_report.reporting_period', '2nd Semester 2026')
            ->assertJsonPath('data.0.semestral_context.year', 2026)
            ->assertJsonPath('data.0.semestral_context.semester', 2);
    }

    public function test_director_has_read_only_access_but_other_roles_are_denied(): void
    {
        Sanctum::actingAs($this->director);
        $this->getJson('/api/gia/monitoring/projects')
            ->assertOk()
            ->assertJsonPath('access.can_edit', false)
            ->assertJsonPath('access.read_only', true);

        $setupFocal = User::factory()->create(['program_type' => 'SETUP']);
        $setupFocal->role()->attach($this->focalRole->id, ['assigned_at' => now()]);
        Sanctum::actingAs($setupFocal);
        $this->getJson('/api/gia/monitoring/projects')->assertForbidden();

        $bothProgramFocal = User::factory()->create(['program_type' => 'BOTH']);
        $bothProgramFocal->role()->attach($this->focalRole->id, ['assigned_at' => now()]);
        Sanctum::actingAs($bothProgramFocal);
        $this->getJson('/api/gia/monitoring/projects')->assertForbidden();

        $staffRole = Role::create([
            'name' => 'GIA Project Staff',
            'code' => 'PROJECT_STAFF',
            'program_type' => 'GIA',
            'description' => 'GIA project staff',
        ]);
        $projectStaff = User::factory()->create(['program_type' => 'GIA']);
        $projectStaff->role()->attach($staffRole->id, ['assigned_at' => now()]);
        Sanctum::actingAs($projectStaff);
        $this->getJson('/api/gia/monitoring/projects')->assertForbidden();
    }

    public function test_gia_project_results_are_paginated_six_per_page(): void
    {
        foreach (range(1, 7) as $index) {
            $this->createProject('GIA', 'active', "Implementing Agency {$index}");
        }

        Sanctum::actingAs($this->giaFocal);

        $this->getJson('/api/gia/monitoring/projects?page=1')
            ->assertOk()
            ->assertJsonCount(6, 'data')
            ->assertJsonPath('pagination.current_page', 1)
            ->assertJsonPath('pagination.last_page', 2)
            ->assertJsonPath('pagination.per_page', 6)
            ->assertJsonPath('pagination.total', 7);

        $this->getJson('/api/gia/monitoring/projects?page=2')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('pagination.current_page', 2);
    }

    private function createProject(string $program, string $status, string $organization): Project
    {
        $owner = User::factory()->create(['program_type' => $program]);
        $proposal = Proposal::create([
            'submitted_by' => $owner->id,
            'program_type' => $program,
            'reference_number' => sprintf('%s-%s', $program, fake()->unique()->numerify('####')),
            'title' => "{$organization} Technology Project",
            'status' => 'APPROVED',
            'submitted_at' => now()->subMonth(),
            'approved_at' => now(),
        ]);

        if ($program === 'GIA') {
            GiaProposal::create([
                'proposal_id' => $proposal->id,
                'proponent_category' => 'Higher Education Institution',
                'organization_name' => $organization,
                'office_address' => 'Davao Region',
                'position' => 'Project Leader',
                'contact_number' => '09171234567',
                'research_type' => 'Technology Transfer',
                'research_category' => 'Community Development',
                'form_snapshot' => ['projectLeader' => 'Dr. GIA Lead'],
            ]);
        } else {
            SetupProposal::create([
                'proposal_id' => $proposal->id,
                'business_name' => $organization,
                'business_type' => 'SOLE-PROPRIETORSHIP',
                'industry_sector' => 'Food Processing',
                'enterprise_size' => 'MICRO',
                'years_in_operation' => 3,
                'business_address' => 'Davao Region',
                'region' => 'Region XI',
                'province' => 'Davao Region',
                'city_municipality' => 'Mati City',
            ]);
        }

        return Project::create([
            'proposal_id' => $proposal->id,
            'created_by' => $owner->id,
            'approved_by' => $this->director->id,
            'program_type' => $program,
            'status' => $status,
            'approved_at' => now(),
        ]);
    }
}
