<?php

namespace Tests\Feature;

use App\Models\DocumentChecklistTemplate;
use App\Models\Proposal;
use App\Models\Role;
use App\Models\SetupProposal;
use App\Models\User;
use App\Models\UserRole;
use Database\Seeders\DocumentChecklistTemplateSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentChecklistTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $this->seed(DocumentChecklistTemplateSeeder::class);
    }

    public function test_can_fetch_checklist_templates(): void
    {
        $user = User::factory()->create();
        $role = Role::where('code', 'FOCAL')->first();
        UserRole::create(['user_id' => $user->id, 'role_id' => $role->id]);

        $response = $this->actingAs($user)->getJson('/api/document-checklist/templates?program=SETUP');

        $response->assertStatus(200);
        $response->assertJsonStructure(['status', 'data']);
        $this->assertNotEmpty($response->json('data'));
    }

    public function test_can_fetch_proposal_checklist(): void
    {
        $user = User::factory()->create();
        $role = Role::where('code', 'PROJECT_STAFF')->first();
        UserRole::create(['user_id' => $user->id, 'role_id' => $role->id]);

        $proposal = Proposal::create([
            'submitted_by' => $user->id,
            'title' => 'Test SETUP Project',
            'program_type' => 'SETUP',
            'status' => 'Submitted',
            'reference_number' => 'PROP-2026-TEST',
        ]);

        SetupProposal::create([
            'proposal_id' => $proposal->id,
            'business_name' => 'Test Agri Enterprise',
            'business_type' => 'Sole Proprietorship',
            'industry_sector' => 'Agriculture',
            'enterprise_size' => 'Micro',
            'years_in_operation' => 3,
            'business_address' => 'Mati City',
            'region' => 'Region XI',
            'province' => 'Davao Oriental',
            'city_municipality' => 'Mati City',
            'space_ownership' => 'Rented',
        ]);

        $response = $this->actingAs($user)->getJson("/api/proposals/{$proposal->id}/checklist");

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'success');
        $response->assertJsonPath('data.proposal_id', $proposal->id);
        $response->assertJsonPath('data.program', 'SETUP');
        $this->assertIsArray($response->json('data.items'));
    }

    public function test_can_batch_save_checklist_reviews(): void
    {
        $user = User::factory()->create();
        $role = Role::where('code', 'FOCAL')->first();
        UserRole::create(['user_id' => $user->id, 'role_id' => $role->id]);

        $proposal = Proposal::create([
            'submitted_by' => $user->id,
            'title' => 'Test Batch Save Project',
            'program_type' => 'SETUP',
            'status' => 'Submitted',
            'reference_number' => 'PROP-2026-BATCH',
        ]);

        $template = DocumentChecklistTemplate::where('program_type', 'SETUP')->first();

        $response = $this->actingAs($user)->putJson("/api/proposals/{$proposal->id}/checklist/batch", [
            'overall_remarks' => 'Review completed for SET 1',
            'items' => [
                [
                    'id' => $template->item_code,
                    'template_id' => $template->id,
                    'is_present' => true,
                    'status' => 'Complied',
                    'remarks' => 'Verified by Focal',
                ],
            ],
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'success');
        $this->assertDatabaseHas('proposal_checklist_reviews', [
            'proposal_id' => $proposal->id,
            'template_item_id' => $template->id,
            'status' => 'Complied',
        ]);
        $this->assertDatabaseHas('proposal_checklist_summaries', [
            'proposal_id' => $proposal->id,
            'overall_remarks' => 'Review completed for SET 1',
        ]);
    }

    public function test_can_complete_checklist_review_and_view_history(): void
    {
        $user = User::factory()->create();
        $role = Role::where('code', 'FOCAL')->first();
        UserRole::create(['user_id' => $user->id, 'role_id' => $role->id]);

        $proposal = Proposal::create([
            'submitted_by' => $user->id,
            'title' => 'Test Completion Project',
            'program_type' => 'SETUP',
            'status' => 'Submitted',
            'reference_number' => 'PROP-2026-COMPL',
        ]);

        $completeRes = $this->actingAs($user)->postJson("/api/proposals/{$proposal->id}/checklist/complete", [
            'final_remarks' => 'All mandatory documents verified.',
        ]);

        $completeRes->assertStatus(200);
        $completeRes->assertJsonPath('status', 'success');
        $completeRes->assertJsonPath('data.is_completed', true);

        $historyRes = $this->actingAs($user)->getJson("/api/proposals/{$proposal->id}/checklist/history");
        $historyRes->assertStatus(200);
        $historyRes->assertJsonPath('status', 'success');
        $this->assertNotEmpty($historyRes->json('data'));
    }

    public function test_setup_sole_proprietorship_vs_corporation_conditions(): void
    {
        $user = User::factory()->create();
        $role = Role::where('code', 'FOCAL')->first();
        UserRole::create(['user_id' => $user->id, 'role_id' => $role->id]);

        $soleProp = Proposal::create([
            'submitted_by' => $user->id,
            'title' => 'Sole Proprietor Project',
            'program_type' => 'SETUP',
            'status' => 'Submitted',
            'reference_number' => 'PROP-2026-SOLE',
        ]);
        SetupProposal::create([
            'proposal_id' => $soleProp->id,
            'business_name' => 'Sole Store',
            'business_type' => 'Sole Proprietorship',
            'industry_sector' => 'Manufacturing',
            'enterprise_size' => 'Micro',
            'years_in_operation' => 2,
            'business_address' => 'Mati',
            'region' => 'Region XI',
            'province' => 'Davao Oriental',
            'city_municipality' => 'Mati',
            'space_ownership' => 'Owned',
        ]);

        $corpProp = Proposal::create([
            'submitted_by' => $user->id,
            'title' => 'Corporation Project',
            'program_type' => 'SETUP',
            'status' => 'Submitted',
            'reference_number' => 'PROP-2026-CORP',
        ]);
        SetupProposal::create([
            'proposal_id' => $corpProp->id,
            'business_name' => 'Corp Inc',
            'business_type' => 'Corporation',
            'industry_sector' => 'IT',
            'enterprise_size' => 'Small',
            'years_in_operation' => 5,
            'business_address' => 'Davao',
            'region' => 'Region XI',
            'province' => 'Davao Oriental',
            'city_municipality' => 'Lupon',
            'form_snapshot' => ['space_ownership' => 'Rented'],
        ]);

        $soleRes = $this->actingAs($user)->getJson("/api/proposals/{$soleProp->id}/checklist");
        $soleItems = collect($soleRes->json('data.items'))->keyBy('id');
        $this->assertTrue($soleItems['setup-s1-dti-registration']['is_applicable']);
        $this->assertFalse($soleItems['setup-s1-corp-board-res']['is_applicable']);
        $this->assertFalse($soleItems['setup-s1-lease-contract']['is_applicable']);

        $corpRes = $this->actingAs($user)->getJson("/api/proposals/{$corpProp->id}/checklist");
        $corpItems = collect($corpRes->json('data.items'))->keyBy('id');
        $this->assertFalse($corpItems['setup-s1-dti-registration']['is_applicable']);
        $this->assertTrue($corpItems['setup-s1-corp-board-res']['is_applicable']);
        $this->assertTrue($corpItems['setup-s1-lease-contract']['is_applicable']);
    }

    public function test_gia_multi_stage_and_organization_conditions(): void
    {
        $user = User::factory()->create();
        $role = Role::where('code', 'FOCAL')->first();
        UserRole::create(['user_id' => $user->id, 'role_id' => $role->id]);

        $giaHei = Proposal::create([
            'submitted_by' => $user->id,
            'title' => 'HEI Research Project',
            'program_type' => 'GIA',
            'status' => 'Submitted',
            'reference_number' => 'GIA-2026-HEI',
        ]);
        \App\Models\GiaProposal::create([
            'proposal_id' => $giaHei->id,
            'proponent_category' => 'Higher Education Institution',
            'organization_name' => 'Davao Oriental State University',
            'office_address' => 'Mati City',
            'position' => 'President',
            'contact_number' => '09123456789',
            'research_type' => 'Research and Development',
            'research_category' => 'Agriculture and Fisheries',
        ]);

        $giaNgo = Proposal::create([
            'submitted_by' => $user->id,
            'title' => 'NGO Community Project',
            'program_type' => 'GIA',
            'status' => 'Submitted',
            'reference_number' => 'GIA-2026-NGO',
        ]);
        \App\Models\GiaProposal::create([
            'proposal_id' => $giaNgo->id,
            'proponent_category' => 'Private Sector',
            'organization_name' => 'Davao NGO Foundation',
            'office_address' => 'Davao City',
            'position' => 'Director',
            'contact_number' => '09987654321',
            'research_type' => 'Community-Based Science and Technology Project',
            'research_category' => 'Community Development',
        ]);

        $heiRes = $this->actingAs($user)->getJson("/api/proposals/{$giaHei->id}/checklist");
        $heiItems = collect($heiRes->json('data.items'))->keyBy('id');
        $this->assertTrue($heiItems['gia-s1-ched-accreditation']['is_applicable']);
        $this->assertTrue($heiItems['gia-s3-far-6']['is_applicable']);
        $this->assertFalse($heiItems['gia-s1-sec-cda-dole']['is_applicable']);

        $ngoRes = $this->actingAs($user)->getJson("/api/proposals/{$giaNgo->id}/checklist");
        $ngoItems = collect($ngoRes->json('data.items'))->keyBy('id');
        $this->assertFalse($ngoItems['gia-s1-ched-accreditation']['is_applicable']);
        $this->assertTrue($ngoItems['gia-s1-sec-cda-dole']['is_applicable']);
        $this->assertTrue($ngoItems['gia-s3-dost-form-12']['is_applicable']);
    }

    public function test_individual_item_review_endpoint(): void
    {
        $user = User::factory()->create();
        $role = Role::where('code', 'FOCAL')->first();
        UserRole::create(['user_id' => $user->id, 'role_id' => $role->id]);

        $proposal = Proposal::create([
            'submitted_by' => $user->id,
            'title' => 'Item Review Project',
            'program_type' => 'SETUP',
            'status' => 'Submitted',
            'reference_number' => 'PROP-2026-ITEM',
        ]);

        $template = DocumentChecklistTemplate::where('program_type', 'SETUP')->first();

        $response = $this->actingAs($user)->putJson("/api/proposals/{$proposal->id}/checklist/items/{$template->id}", [
            'is_present' => true,
            'status' => 'Complied',
            'remarks' => 'Approved after field validation',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'success');
        $this->assertDatabaseHas('proposal_checklist_reviews', [
            'proposal_id' => $proposal->id,
            'template_item_id' => $template->id,
            'status' => 'Complied',
            'remarks' => 'Approved after field validation',
        ]);
    }

    public function test_rbac_permissions_for_all_roles(): void
    {
        $author = User::factory()->create();
        $proposal = Proposal::create([
            'submitted_by' => $author->id,
            'title' => 'RBAC Test Proposal',
            'program_type' => 'SETUP',
            'status' => 'Submitted',
            'reference_number' => 'PROP-2026-RBAC',
        ]);

        $template = DocumentChecklistTemplate::where('program_type', 'SETUP')->first();

        // 1. Proponent - Forbidden
        $proponent = User::factory()->create();
        $propRole = Role::where('code', 'PROPONENT')->first();
        UserRole::create(['user_id' => $proponent->id, 'role_id' => $propRole->id]);

        $this->actingAs($proponent)->getJson("/api/proposals/{$proposal->id}/checklist")->assertForbidden();
        $this->actingAs($proponent)->putJson("/api/proposals/{$proposal->id}/checklist/batch", [])->assertForbidden();

        // 2. RPMO - Read-only
        $rpmo = User::factory()->create();
        $rpmoRole = Role::where('code', 'RPMO')->first();
        UserRole::create(['user_id' => $rpmo->id, 'role_id' => $rpmoRole->id]);

        $this->actingAs($rpmo)->getJson("/api/proposals/{$proposal->id}/checklist")->assertOk();
        $this->actingAs($rpmo)->putJson("/api/proposals/{$proposal->id}/checklist/batch", [])->assertForbidden();
        $this->actingAs($rpmo)->postJson("/api/proposals/{$proposal->id}/checklist/complete", [])->assertForbidden();

        // 3. Provincial Director - Read-only
        $director = User::factory()->create();
        $dirRole = Role::where('code', 'PROVINCIAL_DIRECTOR')->first();
        UserRole::create(['user_id' => $director->id, 'role_id' => $dirRole->id]);

        $this->actingAs($director)->getJson("/api/proposals/{$proposal->id}/checklist")->assertOk();
        $this->actingAs($director)->putJson("/api/proposals/{$proposal->id}/checklist/batch", [])->assertForbidden();

        // 4. Project Staff - Can View & Batch Save, cannot Complete
        $staff = User::factory()->create();
        $staffRole = Role::where('code', 'PROJECT_STAFF')->first();
        UserRole::create(['user_id' => $staff->id, 'role_id' => $staffRole->id]);

        $this->actingAs($staff)->getJson("/api/proposals/{$proposal->id}/checklist")->assertOk();
        $this->actingAs($staff)->putJson("/api/proposals/{$proposal->id}/checklist/batch", [
            'overall_remarks' => 'Staff draft remarks',
        ])->assertOk();
        $this->actingAs($staff)->putJson("/api/proposals/{$proposal->id}/checklist/items/{$template->id}", [
            'is_present' => true,
            'status' => 'Under Review',
            'remarks' => 'Staff pre-evaluated document',
        ])->assertOk();
        $this->actingAs($staff)->postJson("/api/proposals/{$proposal->id}/checklist/complete", [])->assertForbidden();

        // 5. Focal - Full Review Access
        $focal = User::factory()->create();
        $focalRole = Role::where('code', 'FOCAL')->first();
        UserRole::create(['user_id' => $focal->id, 'role_id' => $focalRole->id]);

        $this->actingAs($focal)->getJson("/api/proposals/{$proposal->id}/checklist")->assertOk();
        $this->actingAs($focal)->putJson("/api/proposals/{$proposal->id}/checklist/items/{$template->id}", [
            'is_present' => true,
            'status' => 'Complied',
        ])->assertOk();
        $this->actingAs($focal)->postJson("/api/proposals/{$proposal->id}/checklist/complete", [
            'final_remarks' => 'Focal completed signoff',
        ])->assertOk();

        // 6. Admin - Full Access
        $admin = User::factory()->create();
        $adminRole = Role::where('code', 'SYSTEM_ADMIN')->first();
        UserRole::create(['user_id' => $admin->id, 'role_id' => $adminRole->id]);

        $this->actingAs($admin)->getJson("/api/proposals/{$proposal->id}/checklist")->assertOk();
    }

    public function test_equipment_outlay_condition(): void
    {
        $user = User::factory()->create();
        $role = Role::where('code', 'FOCAL')->first();
        UserRole::create(['user_id' => $user->id, 'role_id' => $role->id]);

        $giaNoEquip = Proposal::create([
            'submitted_by' => $user->id,
            'title' => 'Training Project No Equipment',
            'program_type' => 'GIA',
            'status' => 'Submitted',
            'reference_number' => 'GIA-2026-NOEQUIP',
        ]);
        \App\Models\GiaProposal::create([
            'proposal_id' => $giaNoEquip->id,
            'proponent_category' => 'Higher Education Institution',
            'organization_name' => 'DOSCST',
            'office_address' => 'Mati',
            'position' => 'Dean',
            'contact_number' => '09123456789',
            'research_type' => 'Capability Building and Training',
            'research_category' => 'Education',
            'form_snapshot' => ['has_equipment' => false],
        ]);

        $res = $this->actingAs($user)->getJson("/api/proposals/{$giaNoEquip->id}/checklist");
        $items = collect($res->json('data.items'))->keyBy('id');
        $this->assertFalse($items['gia-s3-dost-form-9']['is_applicable']);
        $this->assertFalse($items['gia-s5-purchase-docs']['is_applicable']);
    }

    public function test_approved_proposal_automatically_passes_prerequisite_documents(): void
    {
        $user = User::factory()->create();
        $director = User::factory()->create();
        $dirRole = Role::where('code', 'PROVINCIAL_DIRECTOR')->first();
        UserRole::create(['user_id' => $director->id, 'role_id' => $dirRole->id]);

        $proposal = Proposal::create([
            'submitted_by' => $user->id,
            'title' => 'Approved Agro-Industrial Enterprise',
            'program_type' => 'SETUP',
            'status' => 'APPROVED',
            'approved_at' => now(),
            'reference_number' => 'SETUP-2026-APPRV',
        ]);

        \App\Models\SetupProposal::create([
            'proposal_id' => $proposal->id,
            'business_name' => 'Approved Agro-Industrial Enterprise',
            'business_type' => 'Sole Proprietorship',
            'industry_sector' => 'Agriculture',
            'enterprise_size' => 'Micro',
            'years_in_operation' => 3,
            'business_address' => 'Mati City',
            'region' => 'Region XI',
            'province' => 'Davao Oriental',
            'city_municipality' => 'Mati City',
            'space_ownership' => 'Owned',
        ]);

        $docType = \App\Models\DocumentType::create([
            'name' => 'DTI Registration',
            'applicable_program' => 'SETUP',
            'set_number' => 'SET1',
            'is_required' => true,
        ]);

        \App\Models\Document::create([
            'proposal_id' => $proposal->id,
            'document_type_id' => $docType->id,
            'uploaded_by' => $user->id,
            'file_name' => 'dti_registration.pdf',
            'file_path' => 'documents/dti.pdf',
            'file_size' => 1024,
            'mime_type' => 'application/pdf',
            'status' => 'approved',
            'reviewed_at' => now(),
        ]);

        $res = $this->actingAs($director)->getJson("/api/proposals/{$proposal->id}/checklist");
        $res->assertOk();

        $items = collect($res->json('data.items'))->keyBy('id');
        $this->assertTrue($items['setup-s1-dti-registration']['is_present']);
        $this->assertEquals('Complied', $items['setup-s1-dti-registration']['status']);
        $this->assertFalse($items['setup-s2-biodata']['is_present']);
        $this->assertEquals('Missing', $items['setup-s2-biodata']['status']);
    }

    public function test_document_reupload_preserves_previous_version_in_archive(): void
    {
        \Illuminate\Support\Facades\Storage::fake('local');

        $user = User::factory()->create();
        $staff = User::factory()->create();
        $staffRole = Role::where('code', 'PROJECT_STAFF')->first();
        UserRole::create(['user_id' => $staff->id, 'role_id' => $staffRole->id]);

        $proposal = Proposal::create([
            'submitted_by' => $user->id,
            'title' => 'Document Versioning Enterprise Test',
            'program_type' => 'SETUP',
            'status' => 'Submitted',
            'reference_number' => 'SETUP-2026-VERS',
        ]);

        \App\Models\SetupProposal::create([
            'proposal_id' => $proposal->id,
            'business_name' => 'Tech Foods Corp',
            'business_type' => 'Sole Proprietorship',
            'industry_sector' => 'Food Processing',
            'enterprise_size' => 'Micro',
            'years_in_operation' => 2,
            'business_address' => 'Mati City',
            'region' => 'Region XI',
            'province' => 'Davao Oriental',
            'city_municipality' => 'Mati City',
            'space_ownership' => 'Owned',
        ]);

        $docType = \App\Models\DocumentType::create([
            'name' => 'DTI Registration',
            'applicable_program' => 'SETUP',
            'set_number' => 'SET1',
            'is_required' => true,
        ]);

        $fileV1 = \Illuminate\Http\UploadedFile::fake()->create('dti_permit_v1.pdf', 500, 'application/pdf');
        $documentsService = app(\App\Services\Contracts\ProposalModule\DocumentsServiceInterface::class);

        $docV1 = $this->actingAs($user)->withoutMiddleware()->postJson('/api/documents', [
            'proposal_id' => $proposal->id,
            'document_type_id' => $docType->id,
            'file' => $fileV1,
        ]);
        $docV1->assertStatus(201);

        // Mark V1 as returned for revision with remarks
        $createdDoc = \App\Models\Document::where('proposal_id', $proposal->id)->first();
        $createdDoc->update([
            'status' => 'returned_for_revision',
            'remarks' => 'Expired certification. Please upload latest 2026 DTI permit.',
            'reviewed_by' => $staff->id,
            'reviewed_at' => now(),
        ]);

        // Re-upload V2
        $fileV2 = \Illuminate\Http\UploadedFile::fake()->create('dti_permit_v2_renewed.pdf', 600, 'application/pdf');
        $docV2 = $this->actingAs($user)->withoutMiddleware()->postJson('/api/documents', [
            'proposal_id' => $proposal->id,
            'document_type_id' => $docType->id,
            'file' => $fileV2,
        ]);
        $docV2->assertStatus(201);

        // Verify V1 was archived
        $this->assertDatabaseHas('archived_documents', [
            'proposal_id' => $proposal->id,
            'document_type_id' => $docType->id,
            'file_name' => 'dti_permit_v1.pdf',
            'status' => 'returned_for_revision',
            'remarks' => 'Expired certification. Please upload latest 2026 DTI permit.',
        ]);

        // Verify current document is V2
        $this->assertDatabaseHas('documents', [
            'proposal_id' => $proposal->id,
            'document_type_id' => $docType->id,
            'file_name' => 'dti_permit_v2_renewed.pdf',
        ]);

        // Verify checklist API returns archived versions
        $res = $this->actingAs($staff)->getJson("/api/proposals/{$proposal->id}/checklist");
        $res->assertOk();

        $items = collect($res->json('data.items'))->keyBy('id');
        $dtiItem = $items['setup-s1-dti-registration'];
        $this->assertNotEmpty($dtiItem['uploaded_doc']);
        $this->assertEquals('dti_permit_v2_renewed.pdf', $dtiItem['uploaded_doc']['file_name']);
        $this->assertCount(1, $dtiItem['uploaded_doc']['archived_versions']);
        $this->assertEquals('dti_permit_v1.pdf', $dtiItem['uploaded_doc']['archived_versions'][0]['file_name']);
        $this->assertEquals('Expired certification. Please upload latest 2026 DTI permit.', $dtiItem['uploaded_doc']['archived_versions'][0]['remarks']);
    }

    public function test_approved_documents_pass_for_both_setup_and_gia(): void
    {
        $user = User::factory()->create();
        $staff = User::factory()->create();
        $staffRole = Role::where('code', 'PROJECT_STAFF')->first();
        UserRole::create(['user_id' => $staff->id, 'role_id' => $staffRole->id]);

        // SETUP Proposal
        $setupProposal = Proposal::create([
            'submitted_by' => $user->id,
            'title' => 'SETUP Food Innovation Hub',
            'program_type' => 'SETUP',
            'status' => 'APPROVED',
            'approved_at' => now(),
            'reference_number' => 'SETUP-2026-AUTO',
        ]);
        SetupProposal::create([
            'proposal_id' => $setupProposal->id,
            'business_name' => 'SETUP Food Innovation Hub',
            'business_type' => 'Sole Proprietorship',
            'industry_sector' => 'Food Processing',
            'enterprise_size' => 'Micro',
            'years_in_operation' => 3,
            'business_address' => 'Mati City',
            'region' => 'Region XI',
            'province' => 'Davao Oriental',
            'city_municipality' => 'Mati City',
            'space_ownership' => 'Owned',
        ]);

        $dtiType = \App\Models\DocumentType::create([
            'name' => 'DTI Registration',
            'applicable_program' => 'SETUP',
            'set_number' => 'SET1',
            'is_required' => true,
        ]);
        \App\Models\Document::create([
            'proposal_id' => $setupProposal->id,
            'document_type_id' => $dtiType->id,
            'uploaded_by' => $user->id,
            'file_name' => 'dti_approved.pdf',
            'file_path' => 'documents/dti_approved.pdf',
            'file_size' => 1024,
            'mime_type' => 'application/pdf',
            'status' => 'approved',
            'reviewed_at' => now(),
        ]);

        $setupRes = $this->actingAs($staff)->getJson("/api/proposals/{$setupProposal->id}/checklist");
        $setupRes->assertOk();
        $setupItems = collect($setupRes->json('data.items'))->keyBy('id');
        $this->assertTrue($setupItems['setup-s1-dti-registration']['is_present']);
        $this->assertEquals('Complied', $setupItems['setup-s1-dti-registration']['status']);

        // GIA Proposal
        $giaProposal = Proposal::create([
            'submitted_by' => $user->id,
            'title' => 'GIA Smart Coastal Community',
            'program_type' => 'GIA',
            'status' => 'APPROVED',
            'approved_at' => now(),
            'reference_number' => 'GIA-2026-AUTO',
        ]);
        \App\Models\GiaProposal::create([
            'proposal_id' => $giaProposal->id,
            'proponent_category' => 'Higher Education Institution',
            'organization_name' => 'State University',
            'office_address' => 'Mati City',
            'position' => 'President',
            'contact_number' => '09123456789',
            'research_type' => 'Community Innovation',
            'research_category' => 'Agriculture and Fisheries',
        ]);

        $loiType = \App\Models\DocumentType::create([
            'name' => 'Letter of Intent',
            'applicable_program' => 'GIA',
            'set_number' => 'GIA1',
            'is_required' => true,
        ]);
        \App\Models\Document::create([
            'proposal_id' => $giaProposal->id,
            'document_type_id' => $loiType->id,
            'uploaded_by' => $user->id,
            'file_name' => 'loi_signed.pdf',
            'file_path' => 'documents/loi_signed.pdf',
            'file_size' => 1024,
            'mime_type' => 'application/pdf',
            'status' => 'approved',
            'reviewed_at' => now(),
        ]);

        $giaRes = $this->actingAs($staff)->getJson("/api/proposals/{$giaProposal->id}/checklist");
        $giaRes->assertOk();
        $giaItems = collect($giaRes->json('data.items'))->keyBy('id');
        $this->assertTrue($giaItems['gia-s1-loi']['is_present']);
        $this->assertEquals('Complied', $giaItems['gia-s1-loi']['status']);
    }

    public function test_exhaustive_rbac_matrix_across_all_roles_and_programs(): void
    {
        $user = User::factory()->create();

        // 1. Proposals
        $setupProp = Proposal::create([
            'submitted_by' => $user->id,
            'title' => 'SETUP RBAC Proposal',
            'program_type' => 'SETUP',
            'status' => 'Submitted',
            'reference_number' => 'SETUP-RBAC-01',
        ]);
        SetupProposal::create([
            'proposal_id' => $setupProp->id,
            'business_name' => 'SETUP RBAC Firm',
            'business_type' => 'Sole Proprietorship',
            'industry_sector' => 'Agriculture',
            'enterprise_size' => 'Micro',
            'years_in_operation' => 2,
            'business_address' => 'Mati',
            'region' => 'Region XI',
            'province' => 'Davao Oriental',
            'city_municipality' => 'Mati',
            'space_ownership' => 'Owned',
        ]);

        $giaProp = Proposal::create([
            'submitted_by' => $user->id,
            'title' => 'GIA RBAC Proposal',
            'program_type' => 'GIA',
            'status' => 'Submitted',
            'reference_number' => 'GIA-RBAC-01',
        ]);
        \App\Models\GiaProposal::create([
            'proposal_id' => $giaProp->id,
            'proponent_category' => 'Higher Education Institution',
            'organization_name' => 'Davao State College',
            'office_address' => 'Mati',
            'position' => 'Dean',
            'contact_number' => '09123456789',
            'research_type' => 'R&D',
            'research_category' => 'Technology',
        ]);

        $setupTemplate = DocumentChecklistTemplate::where('program_type', 'SETUP')->first();
        $giaTemplate = DocumentChecklistTemplate::where('program_type', 'GIA')->first();

        // 2. Roles Setup
        $staffUser = User::factory()->create();
        UserRole::create(['user_id' => $staffUser->id, 'role_id' => Role::where('code', 'PROJECT_STAFF')->first()->id]);

        $focalUser = User::factory()->create();
        UserRole::create(['user_id' => $focalUser->id, 'role_id' => Role::where('code', 'FOCAL')->first()->id]);

        $directorUser = User::factory()->create();
        UserRole::create(['user_id' => $directorUser->id, 'role_id' => Role::where('code', 'PROVINCIAL_DIRECTOR')->first()->id]);

        $rpmoUser = User::factory()->create();
        UserRole::create(['user_id' => $rpmoUser->id, 'role_id' => Role::where('code', 'RPMO')->first()->id]);

        // PROJECT_STAFF: Can view and review items, CANNOT complete review
        $this->actingAs($staffUser)->getJson("/api/proposals/{$setupProp->id}/checklist")->assertOk();
        $this->actingAs($staffUser)->getJson("/api/proposals/{$giaProp->id}/checklist")->assertOk();
        $this->actingAs($staffUser)->putJson("/api/proposals/{$setupProp->id}/checklist/items/{$setupTemplate->id}", [
            'is_present' => true,
            'status' => 'Complied',
        ])->assertOk();
        $this->actingAs($staffUser)->postJson("/api/proposals/{$setupProp->id}/checklist/complete", [
            'final_remarks' => 'Staff attempting completion',
        ])->assertForbidden();

        // FOCAL: Can view, review, and complete review
        $this->actingAs($focalUser)->getJson("/api/proposals/{$setupProp->id}/checklist")->assertOk();
        $this->actingAs($focalUser)->getJson("/api/proposals/{$giaProp->id}/checklist")->assertOk();
        $this->actingAs($focalUser)->putJson("/api/proposals/{$giaProp->id}/checklist/items/{$giaTemplate->id}", [
            'is_present' => true,
            'status' => 'Complied',
        ])->assertOk();
        $this->actingAs($focalUser)->postJson("/api/proposals/{$giaProp->id}/checklist/complete", [
            'final_remarks' => 'Focal approved and signed off',
        ])->assertOk();

        // PROVINCIAL DIRECTOR: Read-only on checklist review mutations, can view both programs
        $this->actingAs($directorUser)->getJson("/api/proposals/{$setupProp->id}/checklist")->assertOk();
        $this->actingAs($directorUser)->getJson("/api/proposals/{$giaProp->id}/checklist")->assertOk();
        $this->actingAs($directorUser)->putJson("/api/proposals/{$setupProp->id}/checklist/items/{$setupTemplate->id}", [
            'is_present' => true,
            'status' => 'Complied',
        ])->assertForbidden();
        $this->actingAs($directorUser)->putJson("/api/proposals/{$setupProp->id}/checklist/batch", [])->assertForbidden();
        $this->actingAs($directorUser)->postJson("/api/proposals/{$setupProp->id}/checklist/complete", [])->assertForbidden();

        // RPMO: Read-only across both programs
        $this->actingAs($rpmoUser)->getJson("/api/proposals/{$setupProp->id}/checklist")->assertOk();
        $this->actingAs($rpmoUser)->getJson("/api/proposals/{$giaProp->id}/checklist")->assertOk();
        $this->actingAs($rpmoUser)->putJson("/api/proposals/{$setupProp->id}/checklist/items/{$setupTemplate->id}", [
            'is_present' => true,
            'status' => 'Complied',
        ])->assertForbidden();
        $this->actingAs($rpmoUser)->postJson("/api/proposals/{$setupProp->id}/checklist/complete", [])->assertForbidden();
    }

    public function test_document_matching_uses_canonical_names_and_enforces_program_isolation(): void
    {
        $user = User::factory()->create();
        UserRole::create(['user_id' => $user->id, 'role_id' => Role::where('code', 'FOCAL')->first()->id]);

        $setupProposal = Proposal::create([
            'submitted_by' => $user->id,
            'title' => 'SETUP Project with GIA docs',
            'program_type' => 'SETUP',
            'status' => 'Submitted',
            'reference_number' => 'PROP-2026-SETUP-ISO',
        ]);
        SetupProposal::create([
            'proposal_id' => $setupProposal->id,
            'business_name' => 'Isolation Agri Enterprise',
            'business_type' => 'Sole Proprietorship',
            'industry_sector' => 'Agriculture',
            'enterprise_size' => 'Micro',
            'years_in_operation' => 3,
            'business_address' => 'Mati City',
            'region' => 'Region XI',
            'province' => 'Davao Oriental',
            'city_municipality' => 'Mati City',
            'space_ownership' => 'Owned',
        ]);

        // Create a custom-ID DocumentType for Mayor's permit to verify ID-independent resolution
        $customDocType = \App\Models\DocumentType::create([
            'name' => "Recent Mayor's Permit",
            'group' => 'Business Documents',
            'set_number' => 'SET1',
            'applicable_program' => 'BOTH',
            'is_required' => true,
            'is_applicant_visible' => true,
        ]);

        // Upload a Mayor's permit matching the custom DocumentType
        \App\Models\Document::create([
            'proposal_id' => $setupProposal->id,
            'document_type_id' => $customDocType->id,
            'file_name' => 'mayors_permit_2026.pdf',
            'file_path' => 'proposals/docs/mayors_permit_2026.pdf',
            'file_size' => 10240,
            'mime_type' => 'application/pdf',
            'status' => 'approved',
            'uploaded_by' => $user->id,
        ]);

        // Create a strictly GIA document type and upload it to the SETUP proposal
        $giaDocType = \App\Models\DocumentType::create([
            'name' => 'CHED Accreditation',
            'group' => 'GIA Specific',
            'set_number' => 'GIA1',
            'applicable_program' => 'GIA',
            'is_required' => true,
            'is_applicant_visible' => true,
        ]);
        \App\Models\Document::create([
            'proposal_id' => $setupProposal->id,
            'document_type_id' => $giaDocType->id,
            'file_name' => 'ched_accreditation.pdf',
            'file_path' => 'proposals/docs/ched_accreditation.pdf',
            'file_size' => 10240,
            'mime_type' => 'application/pdf',
            'status' => 'approved',
            'uploaded_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->getJson("/api/proposals/{$setupProposal->id}/checklist");
        $response->assertOk();

        $items = collect($response->json('data.items'));

        // 1. Mayor's permit slot dynamically resolved and matched with the custom DocType ID
        $mayorsSlot = $items->firstWhere('id', 'setup-s1-mayors-permit');
        $this->assertNotNull($mayorsSlot);
        $this->assertEquals($customDocType->id, $mayorsSlot['document_type_id']);
        $this->assertNotNull($mayorsSlot['uploaded_doc']);
        $this->assertEquals('mayors_permit_2026.pdf', $mayorsSlot['uploaded_doc']['file_name']);

        // 2. GIA document is isolated and does not attach to any unrelated SETUP slot
        foreach ($items as $item) {
            if ($item['uploaded_doc']) {
                $this->assertNotEquals('ched_accreditation.pdf', $item['uploaded_doc']['file_name']);
            }
        }
    }

    public function test_audit_log_accurately_records_authenticated_user(): void
    {
        $submitter = User::factory()->create(); // ID 1
        $focalUser = User::factory()->create(); // ID 2
        $this->assertNotEquals($submitter->id, $focalUser->id);
        UserRole::create(['user_id' => $focalUser->id, 'role_id' => Role::where('code', 'FOCAL')->first()->id]);

        $proposal = Proposal::create([
            'submitted_by' => $submitter->id,
            'title' => 'Audit Log User ID Test',
            'program_type' => 'SETUP',
            'status' => 'Submitted',
            'reference_number' => 'PROP-2026-AUDIT',
        ]);
        SetupProposal::create([
            'proposal_id' => $proposal->id,
            'business_name' => 'Audit Enterprise',
            'business_type' => 'Sole Proprietorship',
            'industry_sector' => 'Manufacturing',
            'enterprise_size' => 'Micro',
            'years_in_operation' => 2,
            'business_address' => 'Tagum City',
            'region' => 'Region XI',
            'province' => 'Davao del Norte',
            'city_municipality' => 'Tagum City',
            'space_ownership' => 'Owned',
        ]);

        $template = DocumentChecklistTemplate::where('item_code', 'setup-s1-mayors-permit')->first();

        // 1. Review single item
        $this->actingAs($focalUser)->putJson("/api/proposals/{$proposal->id}/checklist/items/{$template->id}", [
            'is_present' => true,
            'status' => 'Complied',
            'remarks' => 'Verified by Focal',
        ])->assertOk();

        $this->assertDatabaseHas('proposal_checklist_reviews', [
            'proposal_id' => $proposal->id,
            'template_item_id' => $template->id,
            'reviewed_by' => $focalUser->id,
        ]);
        $this->assertDatabaseHas('proposal_checklist_histories', [
            'proposal_id' => $proposal->id,
            'user_id' => $focalUser->id,
            'action' => 'REVIEW_APPROVED',
        ]);

        // 2. Complete review
        $this->actingAs($focalUser)->postJson("/api/proposals/{$proposal->id}/checklist/complete", [
            'final_remarks' => 'All verified by Focal',
        ])->assertOk();

        $this->assertDatabaseHas('proposal_checklist_summaries', [
            'proposal_id' => $proposal->id,
            'is_completed' => true,
            'completed_by' => $focalUser->id,
        ]);
        $this->assertDatabaseHas('proposal_checklist_histories', [
            'proposal_id' => $proposal->id,
            'user_id' => $focalUser->id,
            'action' => 'COMPLETE_REVIEW',
        ]);
    }

    public function test_can_create_update_and_delete_checklist_template(): void
    {
        $admin = User::factory()->create();
        $role = Role::where('code', 'SYSTEM_ADMIN')->first();
        UserRole::create(['user_id' => $admin->id, 'role_id' => $role->id]);

        $createRes = $this->actingAs($admin)->postJson('/api/document-checklist/templates', [
            'program_type' => 'GIA',
            'phase_code' => '01',
            'phase_title' => 'Stage 01: Proposal Submission',
            'item_code' => 'gia-s1-custom-test-item',
            'document_name' => 'Custom Environmental Compliance Certificate',
            'group_name' => 'Environmental Clearances',
            'is_mandatory' => true,
            'sort_order' => 120,
        ]);

        $createRes->assertStatus(201);
        $createRes->assertJsonPath('status', 'success');
        $templateId = $createRes->json('data.id');

        $this->assertDatabaseHas('document_checklist_templates', [
            'id' => $templateId,
            'item_code' => 'gia-s1-custom-test-item',
            'is_active' => true,
        ]);

        $updateRes = $this->actingAs($admin)->putJson("/api/document-checklist/templates/{$templateId}", [
            'document_name' => 'Updated Environmental Compliance Certificate (ECC 2026)',
            'group_name' => 'Updated Clearances',
        ]);

        $updateRes->assertStatus(200);
        $this->assertDatabaseHas('document_checklist_templates', [
            'id' => $templateId,
            'document_name' => 'Updated Environmental Compliance Certificate (ECC 2026)',
        ]);

        $deleteRes = $this->actingAs($admin)->deleteJson("/api/document-checklist/templates/{$templateId}");
        $deleteRes->assertStatus(200);

        $this->assertDatabaseHas('document_checklist_templates', [
            'id' => $templateId,
            'is_active' => false,
        ]);

        $inactiveRes = $this->actingAs($admin)->getJson('/api/document-checklist/templates?program=GIA&include_inactive=true');
        $inactiveRes->assertStatus(200);
        $ids = collect($inactiveRes->json('data'))->pluck('id')->toArray();
        $this->assertContains($templateId, $ids);

        $restoreRes = $this->actingAs($admin)->patchJson("/api/document-checklist/templates/{$templateId}/restore");
        $restoreRes->assertStatus(200);
        $this->assertDatabaseHas('document_checklist_templates', [
            'id' => $templateId,
            'is_active' => true,
        ]);
    }
}
