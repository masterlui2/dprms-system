<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Proposal;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectCreationOnApprovalTest extends TestCase
{
    use RefreshDatabase;

    private User $director;
    private User $applicant;
    private Proposal $proposal;

    protected function setUp(): void
    {
        parent::setUp();

        $directorRole = Role::create([
            'name' => 'Provincial Director',
            'code' => 'PROVINCIAL_DIRECTOR',
            'program_type' => 'BOTH',
            'description' => 'Provincial Director',
        ]);

        $this->director = User::factory()->create();
        $this->director->role()->attach($directorRole->id, ['assigned_at' => now()]);

        $this->applicant = User::factory()->create();

        $this->proposal = Proposal::create([
            'submitted_by' => $this->applicant->id,
            'program_type' => 'SETUP',
            'reference_number' => 'SETUP-PROJECT-001',
            'title' => 'SETUP Modernization Project',
            'status' => 'ENDORSED_TO_DIRECTOR',
            'submitted_at' => now(),
        ]);
    }

    public function test_approving_proposal_creates_project(): void
    {
        Sanctum::actingAs($this->director);

        $response = $this->putJson("/api/proposal/{$this->proposal->id}/approve", [
            'remarks' => 'Approved for implementation.',
        ]);

        $response->assertStatus(200);

        $this->proposal->refresh();
        $this->assertSame('APPROVED', $this->proposal->status);
        $this->assertNotNull($this->proposal->approved_at);

        $this->assertDatabaseHas('projects', [
            'proposal_id' => $this->proposal->id,
            'created_by' => $this->applicant->id,
            'approved_by' => $this->director->id,
            'program_type' => 'SETUP',
            'status' => 'active',
            'notes' => 'Approved for implementation.',
        ]);

        $project = Project::where('proposal_id', $this->proposal->id)->first();
        $this->assertNotNull($project);
        $this->assertNotNull($project->approved_at);
    }

    public function test_get_v1_projects_endpoint_returns_active_projects(): void
    {
        Sanctum::actingAs($this->director);

        $this->putJson("/api/proposal/{$this->proposal->id}/approve", [
            'remarks' => 'Approved project.',
        ]);

        $response = $this->getJson('/api/v1/projects');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.proposal_id', $this->proposal->id);
        $response->assertJsonPath('data.0.status', 'active');
        $response->assertJsonPath('data.0.program_type', 'SETUP');
        $response->assertJsonPath('data.0.proposal.title', 'SETUP Modernization Project');
    }
}
