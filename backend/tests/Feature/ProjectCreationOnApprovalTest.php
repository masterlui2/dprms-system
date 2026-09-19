<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\Project;
use App\Models\Proposal;
use App\Models\ProposalChecklistReview;
use App\Models\ProposalChecklistSummary;
use App\Models\Role;
use App\Models\SetupProposal;
use App\Models\User;
use App\Services\Contracts\ProposalModule\DocumentChecklistServiceInterface;
use Database\Seeders\DocumentChecklistTemplateSeeder;
use Database\Seeders\DocumentTypeSeeder;
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

        $this->seed(DocumentChecklistTemplateSeeder::class);
        $this->seed(DocumentTypeSeeder::class);

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

        $checklist = app(DocumentChecklistServiceInterface::class)
            ->getProposalChecklist($this->proposal->id);
        collect($checklist['items'])->where('is_required', true)->each(function (array $item) {
            $document = empty($item['document_type_id']) ? null : Document::create([
                'proposal_id' => $this->proposal->id,
                'document_type_id' => $item['document_type_id'],
                'uploaded_by' => $this->director->id,
                'file_name' => $item['id'].'.pdf',
                'file_path' => 'tests/'.$item['id'].'.pdf',
                'status' => 'approved',
            ]);
            ProposalChecklistReview::create([
                'proposal_id' => $this->proposal->id,
                'template_item_id' => $item['template_id'],
                'document_id' => $document?->id,
                'is_present' => true,
                'status' => 'Complied',
                'reviewed_by' => $this->director->id,
                'reviewed_at' => now(),
            ]);
        });

        ProposalChecklistSummary::create([
            'proposal_id' => $this->proposal->id,
            'is_completed' => true,
            'completed_by' => $this->director->id,
            'completed_at' => now(),
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
        SetupProposal::create([
            'proposal_id' => $this->proposal->id,
            'business_name' => 'Test Enterprise',
            'business_type' => 'SOLE-PROPRIETORSHIP',
            'industry_sector' => 'Food Processing',
            'enterprise_size' => 'MICRO',
            'years_in_operation' => 3,
            'business_address' => 'Mati City',
            'region' => 'Region XI',
            'province' => 'Davao Oriental',
            'city_municipality' => 'Mati City',
            'form_snapshot' => [
                'contactPerson' => 'Maria Enterprise Owner',
            ],
        ]);

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
        $response->assertJsonPath('data.0.proposal.reference_number', 'SETUP-PROJECT-001');
        $response->assertJsonPath('data.0.proposal.title', 'SETUP Modernization Project');
        $response->assertJsonPath('data.0.proposal.setup_proposal.0.business_name', 'Test Enterprise');
        $response->assertJsonPath('data.0.proposal.setup_proposal.0.form_snapshot.contactPerson', 'Maria Enterprise Owner');
    }

    public function test_rpmo_can_view_projects_without_receiving_review_permissions(): void
    {
        Sanctum::actingAs($this->director);

        $this->putJson("/api/proposal/{$this->proposal->id}/approve");

        $rpmoRole = Role::create([
            'name' => 'Regional Project Management Office',
            'code' => 'RPMO',
            'program_type' => 'BOTH',
            'description' => 'Regional project viewer',
        ]);
        $rpmo = User::factory()->create();
        $rpmo->role()->attach($rpmoRole->id, ['assigned_at' => now()]);

        Sanctum::actingAs($rpmo);

        $this->getJson('/api/v1/projects')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->patchJson("/api/v1/proposals/{$this->proposal->id}/assign-officer", [])
            ->assertForbidden();
    }
}
