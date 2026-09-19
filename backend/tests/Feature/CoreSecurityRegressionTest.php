<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\DocumentType;
use App\Models\Project;
use App\Models\Proposal;
use App\Models\QuarterlyMetrics;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CoreSecurityRegressionTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_cannot_approve_or_write_unknown_proposal_statuses(): void
    {
        $staff = $this->userWithRole('PROJECT_STAFF', 'SETUP');
        $proposal = $this->proposal('SETUP', 'UNDER_VALIDATION');
        Sanctum::actingAs($staff);

        $this->putJson("/api/proposal/advance-stage/{$proposal->id}", ['status' => 'APPROVED'])
            ->assertUnprocessable();

        $this->patchJson("/api/proposal/{$proposal->id}/update", ['status' => 'QA_INVALID'])
            ->assertUnprocessable();

        $proposal->refresh();
        $this->assertSame('UNDER_VALIDATION', $proposal->status);
        $this->assertDatabaseMissing('projects', ['proposal_id' => $proposal->id]);
    }

    public function test_director_cannot_approve_a_proposal_before_endorsement(): void
    {
        $director = $this->userWithRole('PROVINCIAL_DIRECTOR', 'BOTH');
        $proposal = $this->proposal('SETUP', 'UNDER_VALIDATION');
        Sanctum::actingAs($director);

        $this->putJson("/api/proposal/{$proposal->id}/approve")
            ->assertUnprocessable();

        $this->assertSame('UNDER_VALIDATION', $proposal->fresh()->status);
        $this->assertDatabaseMissing('projects', ['proposal_id' => $proposal->id]);
    }

    public function test_staff_cannot_change_a_proposal_from_another_program(): void
    {
        $giaStaff = $this->userWithRole('PROJECT_STAFF', 'GIA');
        $setupProposal = $this->proposal('SETUP', 'SUBMITTED');
        Sanctum::actingAs($giaStaff);

        $this->patchJson("/api/proposal/{$setupProposal->id}/update", [
            'status' => 'UNDER_VALIDATION',
        ])->assertForbidden();

        $this->assertSame('SUBMITTED', $setupProposal->fresh()->status);
    }

    public function test_proponents_cannot_read_another_users_proposals(): void
    {
        $owner = User::factory()->create(['program_type' => 'SETUP']);
        $otherProponent = User::factory()->create(['program_type' => 'GIA']);
        $proposal = $this->proposal('SETUP', 'SUBMITTED', $owner);
        Sanctum::actingAs($otherProponent);

        $this->getJson("/api/proposal/reference-number/{$proposal->reference_number}")
            ->assertForbidden();
        $this->getJson("/api/proposal/submitter/{$owner->id}")
            ->assertForbidden();
    }

    public function test_monitoring_writes_are_program_scoped_and_read_only_roles_cannot_write(): void
    {
        $setupProposal = $this->proposal('SETUP', 'APPROVED');
        $project = Project::create([
            'proposal_id' => $setupProposal->id,
            'created_by' => $setupProposal->submitted_by,
            'approved_by' => $setupProposal->submitted_by,
            'program_type' => 'SETUP',
            'status' => 'active',
            'approved_at' => now(),
        ]);

        $giaFocal = $this->userWithRole('FOCAL', 'GIA');
        Sanctum::actingAs($giaFocal);
        $this->postJson("/api/projects/{$project->id}/quarterly-metrics", [
            'quarter' => 1,
            'year' => 2026,
        ])->assertForbidden();

        $rpmo = $this->userWithRole('RPMO', 'BOTH');
        Sanctum::actingAs($rpmo);
        $this->getJson("/api/projects/{$project->id}/quarterly-metrics")
            ->assertOk();
        $this->postJson("/api/projects/{$project->id}/quarterly-metrics", [
            'quarter' => 1,
            'year' => 2026,
        ])->assertForbidden();

        $metric = QuarterlyMetrics::create([
            'project_id' => $project->id,
            'submitted_by' => $setupProposal->submitted_by,
            'quarter' => 1,
            'year' => 2026,
        ]);
        $director = $this->userWithRole('PROVINCIAL_DIRECTOR', 'BOTH');
        Sanctum::actingAs($director);
        $this->postJson("/api/quarterly-metrics/{$metric->id}/product", [
            'product_name' => 'Unauthorized product',
            'specifications' => 'Should not be created',
            'unit' => 'unit',
            'price' => 1,
            'quantity' => 1,
        ])->assertForbidden();
    }

    public function test_quarterly_metrics_filters_return_only_the_requested_period(): void
    {
        $staff = $this->userWithRole('PROJECT_STAFF', 'SETUP');
        $proposal = $this->proposal('SETUP', 'APPROVED');
        $project = Project::create([
            'proposal_id' => $proposal->id,
            'created_by' => $proposal->submitted_by,
            'approved_by' => $proposal->submitted_by,
            'program_type' => 'SETUP',
            'status' => 'active',
            'approved_at' => now(),
        ]);
        QuarterlyMetrics::create([
            'project_id' => $project->id,
            'submitted_by' => $staff->id,
            'quarter' => 1,
            'year' => 2026,
        ]);
        $expected = QuarterlyMetrics::create([
            'project_id' => $project->id,
            'submitted_by' => $staff->id,
            'quarter' => 2,
            'year' => 2026,
        ]);
        Sanctum::actingAs($staff);

        $this->getJson("/api/projects/{$project->id}/quarterly-metrics?quarter=2&year=2026")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $expected->id);
    }

    public function test_documents_cannot_cross_program_boundaries_or_be_deleted_by_read_only_roles(): void
    {
        Storage::fake('local');
        $setupProposal = $this->proposal('SETUP', 'SUBMITTED');
        $giaType = DocumentType::create([
            'name' => 'GIA Internal Requirement',
            'group' => 'Internal',
            'set_number' => 'GIA1',
            'applicable_program' => 'GIA',
            'is_required' => true,
            'is_applicant_visible' => false,
        ]);
        $giaFocal = $this->userWithRole('FOCAL', 'GIA');
        Sanctum::actingAs($giaFocal);

        $this->postJson('/api/documents', [
            'proposal_id' => $setupProposal->id,
            'document_type_id' => $giaType->id,
            'file' => UploadedFile::fake()->create('internal.pdf', 10, 'application/pdf'),
        ])->assertForbidden();

        $this->getJson("/api/documents/{$setupProposal->id}/proposal-documents")
            ->assertForbidden();

        $setupType = DocumentType::create([
            'name' => 'SETUP Requirement',
            'group' => 'Applicant',
            'set_number' => 'SET1',
            'applicable_program' => 'SETUP',
            'is_required' => true,
            'is_applicant_visible' => true,
        ]);
        $document = Document::create([
            'proposal_id' => $setupProposal->id,
            'document_type_id' => $setupType->id,
            'uploaded_by' => $setupProposal->submitted_by,
            'file_name' => 'requirement.pdf',
            'file_path' => 'document/requirement.pdf',
            'file_size' => 100,
            'mime_type' => 'application/pdf',
            'status' => 'pending',
        ]);

        $rpmo = $this->userWithRole('RPMO', 'BOTH');
        Sanctum::actingAs($rpmo);
        $this->postJson('/api/documents', [
            'proposal_id' => $setupProposal->id,
            'document_type_id' => $setupType->id,
            'file' => UploadedFile::fake()->create('rpmo.pdf', 10, 'application/pdf'),
        ])->assertForbidden();
        $this->deleteJson("/api/documents/{$document->id}")->assertForbidden();
        $this->assertDatabaseHas('documents', ['id' => $document->id]);
    }

    private function userWithRole(string $code, string $program): User
    {
        $role = Role::firstOrCreate(
            ['code' => $code, 'program_type' => $program],
            ['name' => $code, 'description' => $code],
        );
        $user = User::factory()->create(['program_type' => $program]);
        $user->role()->attach($role->id, ['assigned_at' => now()]);

        return $user;
    }

    private function proposal(string $program, string $status, ?User $owner = null): Proposal
    {
        $owner ??= User::factory()->create(['program_type' => $program]);

        return Proposal::create([
            'submitted_by' => $owner->id,
            'program_type' => $program,
            'reference_number' => sprintf('%s-SEC-%s', $program, fake()->unique()->numerify('####')),
            'title' => "{$program} Security Test",
            'status' => $status,
            'submitted_at' => now(),
        ]);
    }
}
