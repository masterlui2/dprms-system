<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Proposal;
use App\Models\QuarterlyMetrics;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportingAndSystemAdministrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_proponent_report_dashboard_only_contains_owned_projects(): void
    {
        $role = Role::create([
            'name' => 'Proponent',
            'code' => 'PROPONENT',
            'program_type' => 'GIA',
        ]);
        $owner = User::factory()->create(['program_type' => 'GIA']);
        $otherOwner = User::factory()->create(['program_type' => 'GIA']);
        $owner->role()->attach($role->id, ['assigned_at' => now()]);

        $ownedProject = $this->createProject($owner, 'GIA', 'Owned project');
        $this->createProject($otherOwner, 'GIA', 'Other project');
        QuarterlyMetrics::create([
            'project_id' => $ownedProject->id,
            'submitted_by' => $owner->id,
            'quarter' => 3,
            'year' => 2026,
            'submitted_at' => now(),
        ]);

        Sanctum::actingAs($owner);

        $this->getJson('/api/reports/dashboard?year=2026')
            ->assertOk()
            ->assertJsonPath('data.summary.projects', 1)
            ->assertJsonPath('data.summary.reports', 1)
            ->assertJsonPath('data.summary.submission_rate', 100)
            ->assertJsonCount(1, 'data.projects')
            ->assertJsonPath('data.projects.0.title', 'Owned project');
    }

    public function test_gia_project_leader_report_dashboard_only_contains_owned_projects(): void
    {
        $role = Role::create([
            'name' => 'GIA Project Leader',
            'code' => 'GIA_PROJECT_LEADER',
            'program_type' => 'GIA',
        ]);
        $leader = User::factory()->create(['program_type' => 'GIA']);
        $otherLeader = User::factory()->create(['program_type' => 'GIA']);
        $leader->role()->attach($role->id, ['assigned_at' => now()]);

        $ownedProject = $this->createProject($leader, 'GIA', 'Leader project');
        $this->createProject($otherLeader, 'GIA', 'Other leader project');
        QuarterlyMetrics::create([
            'project_id' => $ownedProject->id,
            'submitted_by' => $leader->id,
            'quarter' => 2,
            'year' => 2026,
            'submitted_at' => now(),
        ]);

        Sanctum::actingAs($leader);

        $this->getJson('/api/reports/dashboard?year=2026')
            ->assertOk()
            ->assertJsonPath('data.summary.projects', 1)
            ->assertJsonPath('data.summary.reports', 1)
            ->assertJsonCount(1, 'data.projects')
            ->assertJsonPath('data.projects.0.title', 'Leader project');
    }

    public function test_system_admin_can_manage_other_users_and_actions_are_audited(): void
    {
        $adminRole = Role::create([
            'name' => 'System Administrator',
            'code' => 'SYSTEM_ADMIN',
            'program_type' => 'BOTH',
        ]);
        $focalRole = Role::create([
            'name' => 'Focal',
            'code' => 'FOCAL',
            'program_type' => 'SETUP',
        ]);
        $admin = User::factory()->create(['is_active' => true]);
        $target = User::factory()->create(['is_active' => true]);
        $admin->role()->attach($adminRole->id, ['assigned_at' => now()]);

        Sanctum::actingAs($admin);

        $this->getJson('/api/system-administration/overview')
            ->assertOk()
            ->assertJsonCount(2, 'data.users')
            ->assertJsonCount(2, 'data.roles');

        $this->patchJson("/api/system-administration/users/{$target->id}/status", [
            'is_active' => false,
        ])->assertOk()->assertJsonPath('data.is_active', false);

        $this->putJson("/api/system-administration/users/{$target->id}/role", [
            'role_id' => $focalRole->id,
        ])->assertOk()->assertJsonPath('data.role.0.code', 'FOCAL');

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $admin->id,
            'action' => 'UPDATE_USER_STATUS',
            'record_id' => $target->id,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $admin->id,
            'action' => 'UPDATE_USER_ROLE',
            'record_id' => $target->id,
        ]);
    }

    public function test_system_admin_cannot_remove_own_access(): void
    {
        $adminRole = Role::create([
            'name' => 'System Administrator',
            'code' => 'SYSTEM_ADMIN',
            'program_type' => 'BOTH',
        ]);
        $admin = User::factory()->create(['is_active' => true]);
        $admin->role()->attach($adminRole->id, ['assigned_at' => now()]);
        Sanctum::actingAs($admin);

        $this->patchJson("/api/system-administration/users/{$admin->id}/status", [
            'is_active' => false,
        ])->assertUnprocessable();
    }

    private function createProject(User $owner, string $program, string $title): Project
    {
        $proposal = Proposal::create([
            'submitted_by' => $owner->id,
            'program_type' => $program,
            'reference_number' => $program.'-'.fake()->unique()->numerify('####'),
            'title' => $title,
            'status' => 'APPROVED',
            'submitted_at' => now(),
            'approved_at' => now(),
        ]);

        return Project::create([
            'proposal_id' => $proposal->id,
            'created_by' => $owner->id,
            'approved_by' => $owner->id,
            'program_type' => $program,
            'status' => 'active',
            'approved_at' => now(),
        ]);
    }
}
