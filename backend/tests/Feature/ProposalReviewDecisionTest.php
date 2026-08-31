<?php

namespace Tests\Feature;

use App\Models\Proposal;
use App\Models\ProposalReviewLog;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProposalReviewDecisionTest extends TestCase
{
    use RefreshDatabase;

    private User $reviewer;
    private User $focal;
    private User $applicant;
    private Proposal $proposal;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create([
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

        $this->reviewer = User::factory()->create();
        $this->reviewer->role()->attach($role->id, ['assigned_at' => now()]);

        $this->focal = User::factory()->create();
        $this->focal->role()->attach($focalRole->id, ['assigned_at' => now()]);

        $this->applicant = User::factory()->create();

        $this->proposal = Proposal::create([
            'submitted_by' => $this->applicant->id,
            'program_type' => 'SETUP',
            'reference_number' => 'SETUP-TEST-001',
            'title' => 'Test Project',
            'status' => 'SUBMITTED',
            'submitted_at' => now(),
        ]);
    }

    public function test_return_for_revision_decision(): void
    {
        Sanctum::actingAs($this->reviewer);

        $response = $this->postJson("/api/v1/proposals/{$this->proposal->id}/reviews/decision", [
            'decision' => 'return_for_revision',
            'findings' => 'Document #2 lacks signatory and official seal.',
            'remarks' => 'Please revise and re-upload within 5 days.',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'RETURNED');

        $this->proposal->refresh();
        $this->assertSame('RETURNED', $this->proposal->status);

        $this->assertDatabaseHas('proposal_review_logs', [
            'proposal_id' => $this->proposal->id,
            'reviewed_by' => $this->reviewer->id,
            'action' => 'return_for_revision',
            'previous_status' => 'SUBMITTED',
            'new_status' => 'RETURNED',
            'findings' => 'Document #2 lacks signatory and official seal.',
            'remarks' => 'Please revise and re-upload within 5 days.',
        ]);

        $this->assertDatabaseHas('proposal_audits', [
            'proposal_id' => $this->proposal->id,
            'reviewed_by' => $this->reviewer->id,
            'action' => 'return_for_revision',
            'previous_status' => 'SUBMITTED',
            'new_status' => 'RETURNED',
            'findings' => 'Document #2 lacks signatory and official seal.',
        ]);
    }

    public function test_endorse_to_focal_decision(): void
    {
        Sanctum::actingAs($this->reviewer);

        $response = $this->postJson("/api/v1/proposals/{$this->proposal->id}/reviews/decision", [
            'decision' => 'endorse_to_focal',
            'focal_id' => $this->focal->id,
            'remarks' => 'Initial screening completed. Endorsed for technical evaluation.',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'ENDORSED_TO_FOCAL');

        $this->proposal->refresh();
        $this->assertSame('ENDORSED_TO_FOCAL', $this->proposal->status);
        $this->assertSame($this->focal->id, $this->proposal->focal_id);

        $this->assertDatabaseHas('proposal_review_logs', [
            'proposal_id' => $this->proposal->id,
            'reviewed_by' => $this->reviewer->id,
            'action' => 'endorse_to_focal',
            'previous_status' => 'SUBMITTED',
            'new_status' => 'ENDORSED_TO_FOCAL',
            'assigned_evaluator_id' => $this->focal->id,
            'remarks' => 'Initial screening completed. Endorsed for technical evaluation.',
        ]);
    }

    public function test_review_logs_endpoint(): void
    {
        Sanctum::actingAs($this->reviewer);

        $this->postJson("/api/v1/proposals/{$this->proposal->id}/reviews/decision", [
            'decision' => 'endorse_to_focal',
            'focal_id' => $this->focal->id,
            'remarks' => 'Passed initial review.',
        ]);

        $response = $this->getJson("/api/v1/proposals/{$this->proposal->id}/reviews");
        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.action', 'endorse_to_focal');
        $response->assertJsonPath('data.0.previous_status', 'SUBMITTED');
        $response->assertJsonPath('data.0.new_status', 'ENDORSED_TO_FOCAL');
    }

    public function test_unauthorized_user_cannot_make_decision(): void
    {
        Sanctum::actingAs($this->applicant);

        $response = $this->postJson("/api/v1/proposals/{$this->proposal->id}/reviews/decision", [
            'decision' => 'return_for_revision',
            'findings' => 'Some findings',
        ]);

        $response->assertStatus(403);
    }

    public function test_findings_required_when_returning_for_revision(): void
    {
        Sanctum::actingAs($this->reviewer);

        $response = $this->postJson("/api/v1/proposals/{$this->proposal->id}/reviews/decision", [
            'decision' => 'return_for_revision',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['findings']);
    }

    public function test_director_approve_records_timestamp_and_reviewer_id(): void
    {
        $directorRole = Role::create([
            'name' => 'Provincial Director',
            'code' => 'PROVINCIAL_DIRECTOR',
            'program_type' => 'BOTH',
            'description' => 'Provincial Director',
        ]);

        $director = User::factory()->create();
        $director->role()->attach($directorRole->id, ['assigned_at' => now()]);

        Sanctum::actingAs($director);

        $response = $this->putJson("/api/proposal/{$this->proposal->id}/approve", [
            'remarks' => 'Approved by Provincial Director.',
        ]);

        $response->assertStatus(200);

        $this->proposal->refresh();
        $this->assertSame('APPROVED', $this->proposal->status);
        $this->assertNotNull($this->proposal->approved_at);
        $this->assertSame($director->id, $this->proposal->reviewed_by);

        $this->assertDatabaseHas('proposal_review_logs', [
            'proposal_id' => $this->proposal->id,
            'reviewed_by' => $director->id,
            'action' => 'APPROVE',
            'new_status' => 'APPROVED',
        ]);
    }

    public function test_director_disapprove_records_timestamp_and_reviewer_id(): void
    {
        $directorRole = Role::firstOrCreate(['code' => 'PROVINCIAL_DIRECTOR'], [
            'name' => 'Provincial Director',
            'program_type' => 'BOTH',
            'description' => 'Provincial Director',
        ]);

        $director = User::factory()->create();
        $director->role()->attach($directorRole->id, ['assigned_at' => now()]);

        Sanctum::actingAs($director);

        $response = $this->putJson("/api/proposal/{$this->proposal->id}/disapprove", [
            'remarks' => 'Does not meet program criteria.',
        ]);

        $response->assertStatus(200);

        $this->proposal->refresh();
        $this->assertSame('DISAPPROVED', $this->proposal->status);
        $this->assertNotNull($this->proposal->disapproved_at);
        $this->assertSame($director->id, $this->proposal->reviewed_by);

        $this->assertDatabaseHas('proposal_review_logs', [
            'proposal_id' => $this->proposal->id,
            'reviewed_by' => $director->id,
            'action' => 'DISAPPROVE',
            'new_status' => 'DISAPPROVED',
        ]);
    }
}


