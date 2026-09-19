<?php

namespace Tests\Feature;

use App\Models\GiaProposal;
use App\Models\Notification;
use App\Models\Project;
use App\Models\Proposal;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SiteVisitSchedulingTest extends TestCase
{
    use RefreshDatabase;

    private User $focal;

    private User $officer;

    private User $proponent;

    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-09-19 10:00:00');

        $focalRole = Role::create(['name' => 'GIA Focal', 'code' => 'FOCAL', 'program_type' => 'GIA']);
        $staffRole = Role::create(['name' => 'RPMO', 'code' => 'RPMO', 'program_type' => 'BOTH']);
        $proponentRole = Role::create(['name' => 'GIA Project Leader', 'code' => 'GIA_PROJECT_LEADER', 'program_type' => 'GIA']);

        $this->focal = User::factory()->create(['program_type' => 'GIA', 'is_active' => true]);
        $this->focal->role()->attach($focalRole->id, ['assigned_at' => now()]);
        $this->officer = User::factory()->create(['program_type' => 'BOTH', 'is_active' => true]);
        $this->officer->role()->attach($staffRole->id, ['assigned_at' => now()]);
        $this->proponent = User::factory()->create(['program_type' => 'GIA', 'is_active' => true]);
        $this->proponent->role()->attach($proponentRole->id, ['assigned_at' => now()]);

        $proposal = Proposal::create([
            'submitted_by' => $this->proponent->id,
            'assigned_focal_id' => $this->focal->id,
            'program_type' => 'GIA',
            'reference_number' => 'GIA-VISIT-001',
            'title' => 'Community Science Project',
            'status' => 'APPROVED',
            'submitted_at' => now()->subMonths(2),
            'approved_at' => now()->subMonth(),
        ]);
        GiaProposal::create([
            'proposal_id' => $proposal->id,
            'proponent_category' => 'Higher Education Institution',
            'organization_name' => 'Davao State University',
            'office_address' => 'Mati City',
            'position' => 'Project Leader',
            'contact_number' => '09171234567',
            'research_type' => 'Technology Transfer',
            'research_category' => 'Community Development',
        ]);
        $this->project = Project::create([
            'proposal_id' => $proposal->id,
            'created_by' => $this->proponent->id,
            'approved_by' => $this->focal->id,
            'program_type' => 'GIA',
            'status' => 'active',
            'approved_at' => now()->subMonth(),
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_focal_can_schedule_a_broadcast_visit_and_both_parties_are_notified(): void
    {
        Sanctum::actingAs($this->focal);

        $response = $this->postJson('/api/site-visits', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.project_title', 'Community Science Project')
            ->assertJsonPath('data.visibility', 'BROADCAST')
            ->assertJsonCount(1, 'data.personnel');

        $visitId = $response->json('data.id');
        $this->assertDatabaseHas('site_visit_assignees', [
            'site_visit_id' => $visitId,
            'user_id' => $this->officer->id,
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->officer->id,
            'type' => 'SITE_VISIT_SCHEDULED',
            'is_read' => false,
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->proponent->id,
            'type' => 'SITE_VISIT_SCHEDULED',
            'is_read' => false,
        ]);

        Sanctum::actingAs($this->proponent);
        $this->getJson('/api/site-visits/mine')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $visitId);
    }

    public function test_client_cannot_suppress_the_proponent_notification(): void
    {
        Sanctum::actingAs($this->focal);
        $this->postJson('/api/site-visits', [...$this->payload(), 'visibility' => 'INTERNAL'])
            ->assertCreated()
            ->assertJsonPath('data.visibility', 'BROADCAST');

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->proponent->id,
            'type' => 'SITE_VISIT_SCHEDULED',
        ]);

        Sanctum::actingAs($this->proponent);
        $this->getJson('/api/site-visits/mine')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_notification_read_state_is_private_and_persistent(): void
    {
        $notification = Notification::create([
            'user_id' => $this->officer->id,
            'type' => 'SITE_VISIT_SCHEDULED',
            'title' => 'Field assignment',
            'message' => 'Visit scheduled.',
            'is_read' => false,
        ]);

        Sanctum::actingAs($this->proponent);
        $this->patchJson("/api/notifications/{$notification->id}/read")->assertForbidden();

        Sanctum::actingAs($this->officer);
        $this->patchJson("/api/notifications/{$notification->id}/read")->assertOk();
        $this->assertDatabaseHas('notifications', ['id' => $notification->id, 'is_read' => true]);
    }

    public function test_calendar_includes_overdue_monitoring_deadlines(): void
    {
        Sanctum::actingAs($this->focal);

        $this->getJson('/api/site-visits?month=2026-09')
            ->assertOk()
            ->assertJsonPath('data.access.can_schedule', true)
            ->assertJsonFragment([
                'label' => '1st Semester 2026 report',
                'status' => 'OVERDUE',
            ]);
    }

    public function test_focal_receives_an_upcoming_monitoring_deadline_notification(): void
    {
        Carbon::setTestNow('2026-06-20 10:00:00');
        Sanctum::actingAs($this->focal);

        $this->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonFragment([
                'type' => 'MONITORING_DEADLINE_DUE',
                'program' => 'GIA',
            ]);
    }

    private function payload(): array
    {
        return [
            'project_id' => $this->project->id,
            'scheduled_date' => '2026-09-25',
            'start_time' => '09:00',
            'end_time' => '11:00',
            'purpose' => 'QUARTERLY_MONITORING',
            'assigned_user_ids' => [$this->officer->id],
            'facility_location' => 'Mati City',
            'proponent_instructions' => 'Prepare the latest progress records.',
        ];
    }
}
