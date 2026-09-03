<?php

namespace App\Services\EquipmentModule;

use App\Models\EquipmentConditionLog;
use App\Models\EquipmentQrCode;
use App\Models\EquipmentRegistry;
use App\Models\QrScanLog;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EquipmentInspectionService
{
    private const PROFILE_RELATIONS = [
        'category',
        'qrCode',
        'proposal.user',
        'proposal.project',
        'proposal.setup_proposal',
        'proposal.gia_proposal',
    ];

    public function listForUser(User $user): Collection
    {
        $programs = $user->authorizedProgramTypes();
        abort_if($programs === [], 403, 'Your account does not have an assigned program.');

        return EquipmentRegistry::query()
            ->whereHas('proposal', fn ($query) => $query->whereIn('program_type', $programs))
            ->with(self::PROFILE_RELATIONS)
            ->latest()
            ->get()
            ->map(fn (EquipmentRegistry $equipment) => $this->profile($equipment));
    }

    public function resolveQr(User $user, array $data, ?string $ipAddress = null): array
    {
        $qrData = trim($data['qr_data']);
        $qrCode = EquipmentQrCode::query()
            ->where('is_active', true)
            ->where(function ($query) use ($qrData) {
                $query->where('qr_code_reference', $qrData)
                    ->orWhere('qr_code_data', $qrData);
            })
            ->with([
                'equipment.category',
                'equipment.qrCode',
                'equipment.proposal.user',
                'equipment.proposal.project',
                'equipment.proposal.setup_proposal',
                'equipment.proposal.gia_proposal',
            ])
            ->first();

        if (! $qrCode?->equipment) {
            throw ValidationException::withMessages([
                'qr_data' => ['This QR code is invalid or inactive.'],
            ]);
        }

        $this->authorizeProgram($user, $qrCode->equipment);

        QrScanLog::query()->create([
            'qr_code_id' => $qrCode->id,
            'scanned_by' => $user->id,
            'scan_purpose' => 'CONDITION_CHECK',
            'scan_result' => 'SUCCESS',
            'device_type' => $data['device_type'] ?? null,
            'browser' => $data['browser'] ?? null,
            'ip_address' => $ipAddress,
            'action_taken' => 'Opened on-site inspection form',
            'scanned_at' => now(),
        ]);

        return $this->profile($qrCode->equipment);
    }

    public function recordInspection(User $user, EquipmentRegistry $equipment, array $data): array
    {
        $this->authorizeProgram($user, $equipment);

        return DB::transaction(function () use ($user, $equipment, $data) {
            $lockedEquipment = EquipmentRegistry::query()
                ->lockForUpdate()
                ->findOrFail($equipment->id);

            $this->authorizeProgram($user, $lockedEquipment);

            $qrCode = EquipmentQrCode::query()
                ->where('equipment_id', $lockedEquipment->id)
                ->where('qr_code_reference', $data['qr_reference'])
                ->where('is_active', true)
                ->first();

            if (! $qrCode) {
                throw ValidationException::withMessages([
                    'qr_reference' => ['The scanned QR code is no longer active for this asset.'],
                ]);
            }

            $newCondition = strtoupper(str_replace('-', '_', $data['condition']));
            $checkedAt = now();

            EquipmentConditionLog::query()->create([
                'equipment_id' => $lockedEquipment->id,
                'uploaded_by' => $user->id,
                'qr_code_id' => $qrCode->id,
                'previous_condition' => $lockedEquipment->current_condition,
                'new_condition' => $newCondition,
                'update_reason' => 'QR_SCAN',
                'remarks' => $data['remarks'] ?? null,
                'scanned_at' => $checkedAt,
            ]);

            $lockedEquipment->update([
                'current_condition' => $newCondition,
                'last_checked_at' => $checkedAt,
            ]);

            $lockedEquipment->load(self::PROFILE_RELATIONS);

            return $this->profile($lockedEquipment);
        });
    }

    public function profile(EquipmentRegistry $equipment): array
    {
        $proposal = $equipment->proposal;
        $setup = $proposal?->setup_proposal?->first();
        $gia = $proposal?->gia_proposal?->first();
        $qrCode = $equipment->qrCode;

        $organization = $setup?->business_name
            ?? $gia?->organization_name
            ?? $proposal?->user?->name
            ?? 'Organization not recorded';

        $location = $setup?->business_address
            ?? $gia?->office_address
            ?? 'Location not recorded';

        return [
            'id' => $equipment->id,
            'asset_reference' => $qrCode?->qr_code_reference ?? sprintf('EQ-%05d', $equipment->id),
            'equipment_name' => $equipment->equipment_name,
            'serial_number' => $equipment->serial_number,
            'brand' => $equipment->brand,
            'model' => $equipment->model,
            'condition' => strtolower(str_replace('_', '-', $equipment->current_condition)),
            'status' => ucwords(str_replace('_', ' ', strtolower($equipment->status))),
            'last_checked_at' => $equipment->last_checked_at?->toIso8601String(),
            'notes' => $equipment->notes,
            'program_type' => $proposal?->project?->program_type ?? $proposal?->program_type ?? $equipment->program_type,
            'category' => $equipment->category?->category_name,
            'organization' => $organization,
            'location' => $location,
            'project' => [
                'id' => $proposal?->project?->id,
                'reference_number' => $proposal?->reference_number,
                'title' => $proposal?->title,
                'program_type' => $proposal?->program_type ?? $equipment->program_type,
            ],
            'qr_code' => $qrCode ? [
                'reference' => $qrCode->qr_code_reference,
                'data' => $qrCode->qr_code_data,
                'is_active' => $qrCode->is_active,
            ] : null,
        ];
    }

    private function authorizeProgram(User $user, EquipmentRegistry $equipment): void
    {
        $equipment->loadMissing('proposal.project');
        $projectProgram = $equipment->proposal?->project?->program_type
            ?? $equipment->proposal?->program_type
            ?? $equipment->program_type;

        abort_unless(
            $user->canAccessProgram($projectProgram),
            403,
            'You are not authorized to inspect assets under this program.',
        );
    }
}
