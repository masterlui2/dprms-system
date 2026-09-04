<?php

namespace App\Services\EquipmentModule;

use App\Models\EquipmentCategory;
use App\Models\EquipmentConditionLog;
use App\Models\EquipmentQrCode;
use App\Models\EquipmentRegistry;
use App\Models\Project;
use App\Models\QrScanLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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

    public function listForUser(User $user, array $filters = []): array
    {
        $programs = $user->authorizedProgramTypes();
        abort_if($programs === [], 403, 'Your account does not have an assigned program.');

        $program = $filters['program_type'] ?? null;
        if ($program) {
            abort_unless($user->canAccessProgram($program), 403, 'You are not authorized to access this program inventory.');
            $programs = [$program];
        }

        $baseQuery = EquipmentRegistry::query()
            ->whereHas('proposal', fn ($query) => $query->whereIn('program_type', $programs))
            ->whereIn('program_type', $programs);

        $statistics = [
            'total_equipment' => (clone $baseQuery)->count(),
            'currently_issued' => (clone $baseQuery)->where('status', 'ISSUED')->count(),
            'good_condition' => (clone $baseQuery)->where('current_condition', 'GOOD')->count(),
            'condition_alerts' => (clone $baseQuery)->where('current_condition', '!=', 'GOOD')->count(),
        ];

        $query = (clone $baseQuery)
            ->with(self::PROFILE_RELATIONS);

        if (! empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }
        if (! empty($filters['condition'])) {
            $query->where('current_condition', $filters['condition']);
        }
        if (! empty($filters['search'])) {
            $search = '%'.mb_strtolower(trim($filters['search'])).'%';
            $query->where(function (Builder $query) use ($search) {
                $query->whereRaw('LOWER(equipment_name) LIKE ?', [$search])
                    ->orWhereRaw('LOWER(serial_number) LIKE ?', [$search])
                    ->orWhereRaw('LOWER(property_number) LIKE ?', [$search])
                    ->orWhereRaw('LOWER(location) LIKE ?', [$search])
                    ->orWhereHas('proposal', fn (Builder $proposal) => $proposal
                        ->whereRaw('LOWER(reference_number) LIKE ?', [$search])
                        ->orWhereRaw('LOWER(title) LIKE ?', [$search]));
            });
        }

        $data = $query
            ->latest()
            ->get()
            ->map(fn (EquipmentRegistry $equipment) => $this->profile($equipment));

        return [
            'data' => $data,
            'statistics' => $statistics,
            'filters' => [
                'categories' => EquipmentCategory::query()
                    ->where('is_active', true)
                    ->orderBy('category_name')
                    ->get(['id', 'category_name', 'category_code']),
            ],
        ];
    }

    public function registrationOptions(User $user, ?string $program = null): array
    {
        $programs = $user->authorizedProgramTypes();
        abort_if($programs === [], 403, 'Your account does not have an assigned program.');

        if ($program) {
            abort_unless($user->canAccessProgram($program), 403, 'You are not authorized to access this program inventory.');
            $programs = [$program];
        }

        $projects = Project::query()
            ->whereIn('program_type', $programs)
            ->where('status', 'active')
            ->with(['proposal.user:id,name', 'proposal.setup_proposal', 'proposal.gia_proposal'])
            ->orderByDesc('approved_at')
            ->get()
            ->map(function (Project $project) {
                $proposal = $project->proposal;
                $setup = $proposal?->setup_proposal?->first();
                $gia = $proposal?->gia_proposal?->first();

                return [
                    'id' => $project->id,
                    'program_type' => $project->program_type,
                    'reference_number' => $proposal?->reference_number,
                    'title' => $proposal?->title,
                    'cooperator' => $setup?->business_name
                        ?? $gia?->organization_name
                        ?? $proposal?->user?->name
                        ?? 'Cooperator not recorded',
                    'location' => $setup?->business_address
                        ?? $gia?->office_address
                        ?? '',
                ];
            })
            ->values();

        return [
            'programs' => array_values($programs),
            'projects' => $projects,
            'categories' => EquipmentCategory::query()
                ->where('is_active', true)
                ->orderBy('category_name')
                ->get(['id', 'category_name', 'category_code']),
        ];
    }

    public function register(User $user, array $data): array
    {
        abort_unless($user->canAccessProgram($data['program_type']), 403, 'You are not authorized to register assets under this program.');

        $project = Project::query()->with('proposal')->findOrFail($data['project_id']);
        if ($project->status !== 'active' || $project->program_type !== $data['program_type']) {
            throw ValidationException::withMessages([
                'project_id' => ['Select an active project belonging to the chosen program.'],
            ]);
        }

        return DB::transaction(function () use ($user, $project, $data) {
            $equipment = EquipmentRegistry::query()->create([
                'proposal_id' => $project->proposal_id,
                'category_id' => $data['category_id'],
                'added_by' => $user->id,
                'program_type' => $data['program_type'],
                'equipment_name' => trim($data['equipment_name']),
                'brand' => trim($data['brand']),
                'model' => trim($data['model']),
                'serial_number' => trim($data['serial_number']),
                'property_number' => isset($data['property_number']) ? trim($data['property_number']) : null,
                'unit' => trim($data['unit']),
                'acquisition_cost' => $data['acquisition_cost'],
                'acquisition_date' => $data['acquisition_date'],
                'installed_at' => $data['installed_at'] ?? null,
                'supplier_name' => trim($data['supplier_name']),
                'location' => trim($data['location']),
                'specifications' => $data['specifications'] ?? null,
                'status' => 'AVAILABLE',
                'current_condition' => $data['current_condition'],
                'notes' => $data['notes'] ?? null,
            ]);

            $reference = sprintf('%s-EQ-%s-%05d', $project->program_type, now()->format('Y'), $equipment->id);
            if (! $equipment->property_number) {
                $equipment->update(['property_number' => $reference]);
            }

            EquipmentQrCode::query()->create([
                'equipment_id' => $equipment->id,
                'qr_code_reference' => $reference,
                'qr_code_data' => "DPRMS:EQUIPMENT:{$reference}",
                'qr_code_image_path' => "equipment-qr/{$reference}.svg",
                'version' => 1,
                'is_active' => true,
                'generated_at' => now(),
                'generated_by' => $user->id,
            ]);

            $equipment->load(self::PROFILE_RELATIONS);

            return $this->profile($equipment, true);
        });
    }

    public function getForUser(User $user, EquipmentRegistry $equipment): array
    {
        $this->authorizeProgram($user, $equipment);
        $equipment->load(self::PROFILE_RELATIONS);

        return $this->profile($equipment, true);
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

        return $this->profile($qrCode->equipment, true);
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
            $checkedAt = empty($data['inspection_date'])
                ? now()
                : Carbon::parse($data['inspection_date'])->startOfDay();
            $photoPaths = collect($data['photos'] ?? [])
                ->map(fn ($photo) => $photo->store("equipment-inspections/{$lockedEquipment->id}", 'public'))
                ->values()
                ->all();

            EquipmentConditionLog::query()->create([
                'equipment_id' => $lockedEquipment->id,
                'uploaded_by' => $user->id,
                'qr_code_id' => $qrCode->id,
                'previous_condition' => $lockedEquipment->current_condition,
                'new_condition' => $newCondition,
                'update_reason' => 'QR_SCAN',
                'remarks' => $data['remarks'] ?? null,
                'recommendations' => $data['recommendations'] ?? null,
                'photos_path' => $photoPaths ?: null,
                'scanned_at' => $checkedAt,
            ]);

            $lockedEquipment->update([
                'current_condition' => $newCondition,
                'last_checked_at' => $checkedAt,
            ]);

            $lockedEquipment->load(self::PROFILE_RELATIONS);

            return $this->profile($lockedEquipment, true);
        });
    }

    public function profile(EquipmentRegistry $equipment, bool $includeHistory = false): array
    {
        $proposal = $equipment->proposal;
        $setup = $proposal?->setup_proposal?->first();
        $gia = $proposal?->gia_proposal?->first();
        $qrCode = $equipment->qrCode;

        if ($includeHistory) {
            $equipment->load([
                'conditionLogs' => fn ($query) => $query
                    ->with('inspector:id,name')
                    ->orderByDesc('scanned_at')
                    ->orderByDesc('id'),
            ]);
        }

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
            'property_number' => $equipment->property_number,
            'unit' => $equipment->unit,
            'brand' => $equipment->brand,
            'model' => $equipment->model,
            'acquisition_cost' => (float) $equipment->acquisition_cost,
            'acquisition_date' => $equipment->acquisition_date?->toDateString(),
            'installed_at' => $equipment->installed_at?->toDateString(),
            'supplier_name' => $equipment->supplier_name,
            'specifications' => $equipment->specifications,
            'condition' => strtolower(str_replace('_', '-', $equipment->current_condition)),
            'status' => ucwords(str_replace('_', ' ', strtolower($equipment->status))),
            'last_checked_at' => $equipment->last_checked_at?->toIso8601String(),
            'notes' => $equipment->notes,
            'program_type' => $proposal?->project?->program_type ?? $proposal?->program_type ?? $equipment->program_type,
            'category' => $equipment->category?->category_name,
            'organization' => $organization,
            'location' => $equipment->location ?: $location,
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
            'inspection_history' => $includeHistory
                ? $equipment->conditionLogs->map(fn (EquipmentConditionLog $log) => [
                    'id' => $log->id,
                    'previous_condition' => strtolower(str_replace('_', '-', $log->previous_condition)),
                    'condition' => strtolower(str_replace('_', '-', $log->new_condition)),
                    'observations' => $log->remarks,
                    'recommendations' => $log->recommendations,
                    'inspected_at' => $log->scanned_at?->toIso8601String(),
                    'inspector' => $log->inspector?->name ?? 'DOST field staff',
                    'photos' => collect($log->photos_path ?? [])
                        ->map(fn (string $path) => Storage::disk('public')->url($path))
                        ->values()
                        ->all(),
                ])->values()->all()
                : [],
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
