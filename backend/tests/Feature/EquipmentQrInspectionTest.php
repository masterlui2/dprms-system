<?php

namespace Tests\Feature;

use App\Models\EquipmentCategory;
use App\Models\EquipmentConditionLog;
use App\Models\EquipmentQrCode;
use App\Models\EquipmentRegistry;
use App\Models\Project;
use App\Models\Proposal;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EquipmentQrInspectionTest extends TestCase
{
    use RefreshDatabase;

    private User $setupStaff;

    private User $giaStaff;

    private EquipmentCategory $category;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::query()->create([
            'name' => 'Project Staff',
            'code' => 'PROJECT_STAFF',
            'program_type' => 'BOTH',
            'description' => 'Field inspection staff',
        ]);

        $this->setupStaff = User::factory()->create(['program_type' => 'SETUP']);
        $this->setupStaff->role()->attach($role->id, ['assigned_at' => now()]);

        $this->giaStaff = User::factory()->create(['program_type' => 'GIA']);
        $this->giaStaff->role()->attach($role->id, ['assigned_at' => now()]);

        $this->category = EquipmentCategory::query()->create([
            'category_name' => 'Production Equipment',
            'category_code' => 'PRODUCTION',
            'is_active' => true,
        ]);
    }

    public function test_equipment_list_is_scoped_to_the_staff_program(): void
    {
        $setupEquipment = $this->createEquipment('SETUP', 'SETUP-QR-001');
        $this->createEquipment('GIA', 'GIA-QR-001');
        Sanctum::actingAs($this->setupStaff);

        $response = $this->getJson('/api/v1/equipment');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.id', $setupEquipment->id);
        $response->assertJsonPath('data.0.program_type', 'SETUP');
    }

    public function test_authorized_staff_can_resolve_an_active_asset_qr_code(): void
    {
        $equipment = $this->createEquipment('SETUP', 'SETUP-QR-002');
        Sanctum::actingAs($this->setupStaff);

        $response = $this->postJson('/api/v1/equipment/qr/resolve', [
            'qr_data' => 'DPRMS:EQUIPMENT:SETUP-QR-002',
            'device_type' => 'mobile',
            'browser' => 'Test Browser',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.id', $equipment->id);
        $response->assertJsonPath('data.equipment_name', 'Vacuum Packaging Machine');
        $response->assertJsonPath('data.serial_number', 'SN-SETUP-QR-002');
        $response->assertJsonPath('data.project.program_type', 'SETUP');

        $this->assertDatabaseHas('qr_scan_logs', [
            'qr_code_id' => $equipment->qrCode->id,
            'scanned_by' => $this->setupStaff->id,
            'scan_purpose' => 'CONDITION_CHECK',
            'scan_result' => 'SUCCESS',
        ]);
    }

    public function test_inspection_updates_condition_and_last_checked_timestamp(): void
    {
        $equipment = $this->createEquipment('SETUP', 'SETUP-QR-003');
        Sanctum::actingAs($this->setupStaff);

        $response = $this->postJson("/api/v1/equipment/{$equipment->id}/inspections", [
            'condition' => 'non-functional',
            'remarks' => 'Motor does not start during the site inspection.',
            'qr_reference' => 'SETUP-QR-003',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.condition', 'non-functional');

        $equipment->refresh();
        $this->assertSame('NON_FUNCTIONAL', $equipment->current_condition);
        $this->assertNotNull($equipment->last_checked_at);

        $this->assertDatabaseHas('equipment_condition_logs', [
            'equipment_id' => $equipment->id,
            'uploaded_by' => $this->setupStaff->id,
            'previous_condition' => 'GOOD',
            'new_condition' => 'NON_FUNCTIONAL',
            'update_reason' => 'QR_SCAN',
            'remarks' => 'Motor does not start during the site inspection.',
        ]);
    }

    public function test_staff_cannot_access_assets_from_another_program(): void
    {
        $giaEquipment = $this->createEquipment('GIA', 'GIA-QR-004');
        $giaEquipment->update(['program_type' => 'SETUP']);
        Sanctum::actingAs($this->setupStaff);

        $this->postJson('/api/v1/equipment/qr/resolve', [
            'qr_data' => 'DPRMS:EQUIPMENT:GIA-QR-004',
        ])->assertForbidden();

        $this->postJson("/api/v1/equipment/{$giaEquipment->id}/inspections", [
            'condition' => 'fair',
            'remarks' => 'Unauthorized cross-program attempt.',
            'qr_reference' => 'GIA-QR-004',
        ])->assertForbidden();

        $this->assertDatabaseMissing('equipment_condition_logs', [
            'equipment_id' => $giaEquipment->id,
        ]);
    }

    public function test_inactive_qr_code_cannot_open_an_inspection(): void
    {
        $equipment = $this->createEquipment('SETUP', 'SETUP-QR-005');
        $equipment->qrCode()->update(['is_active' => false]);
        Sanctum::actingAs($this->setupStaff);

        $this->postJson('/api/v1/equipment/qr/resolve', [
            'qr_data' => 'DPRMS:EQUIPMENT:SETUP-QR-005',
        ])->assertUnprocessable()->assertJsonValidationErrors('qr_data');
    }

    public function test_staff_can_register_equipment_for_an_active_project_in_their_program(): void
    {
        $owner = User::factory()->create(['program_type' => 'SETUP']);
        $proposal = Proposal::query()->create([
            'submitted_by' => $owner->id,
            'program_type' => 'SETUP',
            'reference_number' => 'SETUP-REGISTRATION-001',
            'title' => 'SETUP Registration Project',
            'status' => 'APPROVED',
            'submitted_at' => now(),
            'approved_at' => now(),
        ]);
        $project = Project::query()->create([
            'proposal_id' => $proposal->id,
            'created_by' => $owner->id,
            'approved_by' => $owner->id,
            'program_type' => 'SETUP',
            'status' => 'active',
            'approved_at' => now(),
        ]);
        Sanctum::actingAs($this->setupStaff);

        $response = $this->postJson('/api/v1/equipment', [
            'program_type' => 'SETUP',
            'project_id' => $project->id,
            'category_id' => $this->category->id,
            'equipment_name' => 'Freeze Dryer',
            'brand' => 'DOST LabWorks',
            'model' => 'FD-100',
            'serial_number' => 'FD-SERIAL-001',
            'unit' => 'unit',
            'acquisition_cost' => 875000,
            'acquisition_date' => now()->subMonth()->toDateString(),
            'installed_at' => now()->subWeeks(2)->toDateString(),
            'supplier_name' => 'Science Equipment Supply',
            'location' => 'Production Facility, Butuan City',
            'current_condition' => 'GOOD',
            'specifications' => 'Industrial stainless steel freeze dryer.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.program_type', 'SETUP')
            ->assertJsonPath('data.equipment_name', 'Freeze Dryer')
            ->assertJsonPath('data.project.id', $project->id)
            ->assertJsonPath('data.qr_code.is_active', true);

        $equipmentId = $response->json('data.id');
        $this->assertDatabaseHas('equipment_registries', [
            'id' => $equipmentId,
            'serial_number' => 'FD-SERIAL-001',
            'program_type' => 'SETUP',
        ]);
        $this->assertDatabaseHas('equipment_qr_codes', [
            'equipment_id' => $equipmentId,
            'is_active' => true,
        ]);
    }

    public function test_inventory_filters_and_statistics_are_program_specific(): void
    {
        $good = $this->createEquipment('SETUP', 'SETUP-FILTER-001');
        $poor = $this->createEquipment('SETUP', 'SETUP-FILTER-002');
        $poor->update(['current_condition' => 'POOR', 'equipment_name' => 'Cacao Grinder']);
        $this->createEquipment('GIA', 'GIA-FILTER-001');
        Sanctum::actingAs($this->setupStaff);

        $this->getJson('/api/v1/equipment?program_type=SETUP&condition=POOR&search=grinder')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $poor->id)
            ->assertJsonPath('statistics.total_equipment', 2)
            ->assertJsonPath('statistics.good_condition', 1)
            ->assertJsonPath('statistics.condition_alerts', 1);
    }

    public function test_registration_options_only_include_active_projects_in_the_staff_program(): void
    {
        $setupEquipment = $this->createEquipment('SETUP', 'SETUP-OPTIONS-001');
        $this->createEquipment('GIA', 'GIA-OPTIONS-001');
        Sanctum::actingAs($this->setupStaff);

        $this->getJson('/api/v1/equipment/options')
            ->assertOk()
            ->assertJsonPath('data.programs.0', 'SETUP')
            ->assertJsonCount(1, 'data.projects')
            ->assertJsonPath('data.projects.0.id', $setupEquipment->proposal->project->id)
            ->assertJsonPath('data.projects.0.program_type', 'SETUP')
            ->assertJsonCount(1, 'data.categories');
    }

    public function test_inspection_stores_photos_recommendations_and_returns_condition_history(): void
    {
        Storage::fake('public');
        $equipment = $this->createEquipment('SETUP', 'SETUP-REPORT-001');
        Sanctum::actingAs($this->setupStaff);

        $response = $this->post("/api/v1/equipment/{$equipment->id}/inspections", [
            'condition' => 'poor',
            'remarks' => 'Drive belt is worn and the guard is loose.',
            'recommendations' => 'Replace the belt and secure the guard before operation.',
            'inspection_date' => now()->toDateString(),
            'qr_reference' => 'SETUP-REPORT-001',
            'photos' => [UploadedFile::fake()->image('equipment.jpg', 1200, 800)],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.inspection_history.0.condition', 'poor')
            ->assertJsonPath('data.inspection_history.0.observations', 'Drive belt is worn and the guard is loose.')
            ->assertJsonPath('data.inspection_history.0.recommendations', 'Replace the belt and secure the guard before operation.')
            ->assertJsonCount(1, 'data.inspection_history.0.photos');

        $path = EquipmentConditionLog::query()->where('equipment_id', $equipment->id)->firstOrFail()->photos_path[0];
        Storage::disk('public')->assertExists($path);

        $this->getJson("/api/v1/equipment/{$equipment->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.inspection_history');
    }

    private function createEquipment(string $program, string $qrReference): EquipmentRegistry
    {
        $owner = User::factory()->create(['program_type' => $program]);
        $proposal = Proposal::query()->create([
            'submitted_by' => $owner->id,
            'program_type' => $program,
            'reference_number' => "{$program}-PROJECT-{$qrReference}",
            'title' => "{$program} Equipment Project",
            'status' => 'APPROVED',
            'submitted_at' => now(),
            'approved_at' => now(),
        ]);

        Project::query()->create([
            'proposal_id' => $proposal->id,
            'created_by' => $owner->id,
            'approved_by' => $owner->id,
            'program_type' => $program,
            'status' => 'active',
            'approved_at' => now(),
        ]);

        $equipment = EquipmentRegistry::query()->create([
            'proposal_id' => $proposal->id,
            'category_id' => $this->category->id,
            'added_by' => $program === 'SETUP' ? $this->setupStaff->id : $this->giaStaff->id,
            'program_type' => $program,
            'equipment_name' => 'Vacuum Packaging Machine',
            'serial_number' => "SN-{$qrReference}",
            'acquisition_cost' => 450000,
            'acquisition_date' => now()->toDateString(),
            'status' => 'ISSUED',
            'current_condition' => 'GOOD',
        ]);

        EquipmentQrCode::query()->create([
            'equipment_id' => $equipment->id,
            'qr_code_reference' => $qrReference,
            'qr_code_data' => "DPRMS:EQUIPMENT:{$qrReference}",
            'qr_code_image_path' => "equipment-qr/{$qrReference}.svg",
            'version' => 1,
            'is_active' => true,
            'generated_at' => now(),
            'generated_by' => $program === 'SETUP' ? $this->setupStaff->id : $this->giaStaff->id,
        ]);

        return $equipment->load('qrCode');
    }
}
