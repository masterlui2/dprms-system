<?php

namespace Tests\Feature;

use App\Models\Proposal;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AssignOfficerTest extends TestCase
{
    use RefreshDatabase;

    private User $director;
    private User $staff;
    private User $focal;
    private User $applicant;
    private Proposal $proposal;

    protected function setUp(): void
    {
        parent::setUp();

        $directorRole = Role::create([
            'name' => 'Provincial Director',
            'code' => 'PROVINCIAL_DIRECTOR',
            'program_type' => 'BOTH',
            'description' => 'Provincial director',
        ]);

        $staffRole = Role::create([
            'name' => 'Project Staff',
            'code' => 'PROJECT_STAFF',
            'program_type' => 'BOTH',
            'description' => 'Staff reviewer',
        ]);

        $focalRole = Role::create([
            'name' => 'Focal Person',
            'code' => 'FOCAL',
            'program_type' => 'BOTH',
            'description' => 'Focal evaluator',
        ]);

        $this->director = User::factory()->create();
        $this->director->role()->attach($directorRole->id, ['assigned_at' => now()]);

        $this->staff = User::factory()->create();
        $this->staff->role()->attach($staffRole->id, ['assigned_at' => now()]);

        $this->focal = User::factory()->create();
        $this->focal->role()->attach($focalRole->id, ['assigned_at' => now()]);

        $this->applicant = User::factory()->create();

        $this->proposal = Proposal::create([
            'submitted_by' => $this->applicant->id,
            'program_type' => 'SETUP',
            'reference_number' => 'SETUP-ASSIGN-001',
            'title' => 'Sample Assign Proposal',
            'status' => 'SUBMITTED',
            'submitted_at' => now(),
        ]);
    }

    public function test_assign_staff_officer(): void
    {
        Sanctum::actingAs($this->director);

        $response = $this->patchJson("/api/v1/proposals/{$this->proposal->id}/assign-officer", [
            'assigned_staff_id' => $this->staff->id,
            'remarks' => 'Assigned to PSTO staff for initial intake.',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.assigned_staff_id', $this->staff->id);

        $this->proposal->refresh();
        $this->assertSame($this->staff->id, $this->proposal->assigned_staff_id);
        $this->assertSame($this->staff->id, $this->proposal->reviewed_by);

        $this->assertDatabaseHas('proposal_review_logs', [
            'proposal_id' => $this->proposal->id,
            'reviewed_by' => $this->director->id,
            'action' => 'ASSIGN_OFFICER',
            'assigned_evaluator_id' => $this->staff->id,
        ]);
    }

    public function test_assign_focal_officer(): void
    {
        Sanctum::actingAs($this->director);

        $response = $this->patchJson("/api/v1/proposals/{$this->proposal->id}/assign-officer", [
            'assigned_focal_id' => $this->focal->id,
            'remarks' => 'Assigned to Regional focal for technical review.',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.assigned_focal_id', $this->focal->id);

        $this->proposal->refresh();
        $this->assertSame($this->focal->id, $this->proposal->assigned_focal_id);
        $this->assertSame($this->focal->id, $this->proposal->focal_id);

        $this->assertDatabaseHas('proposal_review_logs', [
            'proposal_id' => $this->proposal->id,
            'reviewed_by' => $this->director->id,
            'action' => 'ASSIGN_OFFICER',
            'assigned_evaluator_id' => $this->focal->id,
        ]);
    }

    public function test_assign_both_staff_and_focal_officers(): void
    {
        Sanctum::actingAs($this->director);

        $response = $this->patchJson("/api/v1/proposals/{$this->proposal->id}/assign-officer", [
            'assigned_staff_id' => $this->staff->id,
            'assigned_focal_id' => $this->focal->id,
            'remarks' => 'Assigned staff and focal evaluator.',
        ]);

        $response->assertStatus(200);

        $this->proposal->refresh();
        $this->assertSame($this->staff->id, $this->proposal->assigned_staff_id);
        $this->assertSame($this->focal->id, $this->proposal->assigned_focal_id);
    }

    public function test_assign_officer_validation_requires_at_least_one_officer(): void
    {
        Sanctum::actingAs($this->director);

        $response = $this->patchJson("/api/v1/proposals/{$this->proposal->id}/assign-officer", [
            'remarks' => 'No officer provided',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['officer']);
    }

    public function test_unauthorized_proponent_cannot_assign_officer(): void
    {
        Sanctum::actingAs($this->applicant);

        $response = $this->patchJson("/api/v1/proposals/{$this->proposal->id}/assign-officer", [
            'assigned_staff_id' => $this->staff->id,
        ]);

        $response->assertStatus(403);
    }
}
