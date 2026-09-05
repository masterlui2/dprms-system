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
}
