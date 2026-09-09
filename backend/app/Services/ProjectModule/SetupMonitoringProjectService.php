<?php

namespace App\Services\ProjectModule;

use App\Models\Project;
use App\Models\RepaymentTransaction;
use App\Models\SetupProgressReport;
use App\Services\Contracts\ProposalModule\DocumentChecklistServiceInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class SetupMonitoringProjectService
{
    private const PENDING_REPORT_STATUSES = ['DRAFT', 'RETURNED'];

    public function __construct(
        private readonly DocumentChecklistServiceInterface $checklistService,
    ) {}

    public function getProjects(array $filters): array
    {
        $baseQuery = $this->activeSetupProjectsQuery();

        $statistics = [
            'active_projects' => (clone $baseQuery)->count(),
            'monitored_count' => (clone $baseQuery)
                ->whereHas('proposal.monitoringRecords', fn (Builder $query) => $query->whereNotNull('last_monitored_at')
                )
                ->count(),
            'pending_reports' => SetupProgressReport::query()
                ->whereIn('status', self::PENDING_REPORT_STATUSES)
                ->whereHas('monitoringRecord.proposal.project', fn (Builder $query) => $query->where('program_type', 'SETUP')->where('status', 'active')
                )
                ->count(),
        ];

        $projectsQuery = (clone $baseQuery)
            ->with([
                'proposal.user:id,name,email',
                'proposal.assigned_staff:id,name,email',
                'proposal.assigned_focal:id,name,email',
                'proposal.setup_proposal',
                'proposal.projectBudget:id,proposal_id,total_amount,currency',
                'proposal.monitoringRecords.monitor:id,name,email',
                'proposal.monitoringRecords.setupProgressReports',
            ]);

        $this->applySearch($projectsQuery, $filters['search'] ?? null);
        $this->applyDistrict($projectsQuery, $filters['district'] ?? null);

        $perPage = isset($filters['per_page']) ? max(1, min(100, (int) $filters['per_page'])) : 6;
        $paginator = $projectsQuery
            ->orderByDesc('approved_at')
            ->paginate($perPage, ['*'], 'page', (int) ($filters['page'] ?? 1));
        $projects = $paginator->getCollection()
            ->map(fn (Project $project) => $this->formatProject($project, $filters))
            ->values();

        return [
            'statistics' => $statistics,
            'filters' => [
                'districts' => $this->availableDistricts(),
            ],
            'data' => $projects,
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ];
    }

    private function activeSetupProjectsQuery(): Builder
    {
        return Project::query()
            ->where('projects.program_type', 'SETUP')
            ->where('projects.status', 'active');
    }

    private function applySearch(Builder $query, ?string $search): void
    {
        $search = trim((string) $search);
        if ($search === '') {
            return;
        }

        $like = '%'.mb_strtolower($search).'%';

        $query->where(function (Builder $projectQuery) use ($like) {
            $projectQuery->whereHas('proposal', function (Builder $proposalQuery) use ($like) {
                $proposalQuery
                    ->whereRaw('LOWER(reference_number) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(title) LIKE ?', [$like])
                    ->orWhereHas('user', fn (Builder $userQuery) => $userQuery->whereRaw('LOWER(name) LIKE ?', [$like])
                    )
                    ->orWhereHas('setup_proposal', function (Builder $setupQuery) use ($like) {
                        $setupQuery
                            ->whereRaw('LOWER(business_name) LIKE ?', [$like])
                            ->orWhereRaw('LOWER(business_address) LIKE ?', [$like])
                            ->orWhereRaw('LOWER(city_municipality) LIKE ?', [$like])
                            ->orWhereRaw('LOWER(province) LIKE ?', [$like]);
                    });
            });
        });
    }

    private function applyDistrict(Builder $query, ?string $district): void
    {
        $district = trim((string) $district);
        if ($district === '') {
            return;
        }

        $query->whereHas('proposal.setup_proposal', fn (Builder $setupQuery) => $setupQuery->whereRaw('LOWER(city_municipality) = ?', [mb_strtolower($district)])
        );
    }

    private function availableDistricts(): Collection
    {
        return $this->activeSetupProjectsQuery()
            ->join('proposals', 'projects.proposal_id', '=', 'proposals.id')
            ->join('setup_proposals', 'setup_proposals.proposal_id', '=', 'proposals.id')
            ->whereNotNull('setup_proposals.city_municipality')
            ->where('setup_proposals.city_municipality', '<>', '')
            ->distinct()
            ->orderBy('setup_proposals.city_municipality')
            ->pluck('setup_proposals.city_municipality');
    }

    private function formatProject(Project $project, array $filters): array
    {
        $proposal = $project->proposal;
        $setup = $proposal?->setup_proposal->first();
        $budget = $proposal?->projectBudget;
        $monitoringRecords = $proposal?->monitoringRecords ?? collect();
        $latestMonitoring = $monitoringRecords
            ->sortByDesc(fn ($record) => $record->last_monitored_at?->getTimestamp() ?? 0)
            ->first();
        $reports = $monitoringRecords->flatMap->setupProgressReports;
        $latestReport = $reports
            ->sortByDesc(fn ($report) => sprintf(
                '%04d-%02d-%020d',
                $report->reporting_year,
                $report->reporting_quarter ?? 0,
                $report->id,
            ))
            ->first();

        $manager = $latestMonitoring?->monitor?->name
            ?? $proposal?->assigned_focal?->name
            ?? $proposal?->assigned_staff?->name
            ?? $proposal?->user?->name
            ?? 'Unassigned';

        $checklistStats = [
            'complied' => 0,
            'total' => 0,
            'percentage' => 0,
        ];

        if ($project->proposal_id) {
            try {
                $checklist = $this->checklistService->getProposalChecklist($project->proposal_id);
                $checklistStats = [
                    'complied' => (int) ($checklist['complied_count'] ?? 0),
                    'total' => (int) ($checklist['total_required'] ?? 0),
                    'percentage' => (int) ($checklist['compliance_percentage'] ?? 0),
                ];
            } catch (\Throwable) {
            }
        }

        $amountRefunded = (float) RepaymentTransaction::query()
            ->whereHas('projectLedger', fn (Builder $query) => $query
                ->where('project_id', $project->id)
                ->where('program_type', 'SETUP')
                ->where('ledger_type', 'repayment')
            )
            ->where('status', 'verified')
            ->sum('amount_paid');

        $contactNumber = data_get($setup?->form_snapshot, 'contactNumber')
            ?? data_get($setup?->form_snapshot, 'contact_number')
            ?? data_get($setup?->form_snapshot, 'phone');

        $proponentName = data_get($setup?->form_snapshot, 'contactPerson')
            ?? data_get($setup?->form_snapshot, 'proponentName')
            ?? $proposal?->user?->name
            ?? 'Proponent';

        $industrySector = $setup?->industry_sector
            ?? data_get($setup?->form_snapshot, 'industrySector')
            ?? 'Food Processing';

        $businessStructure = $setup?->business_type
            ?? data_get($setup?->form_snapshot, 'businessType')
            ?? 'Sole Proprietorship';

        $enterpriseSize = $setup?->enterprise_size
            ?? data_get($setup?->form_snapshot, 'enterpriseSize')
            ?? 'Micro';

        $businessAddress = $setup?->business_address
            ?? data_get($setup?->form_snapshot, 'businessAddress');

        $equipmentRecords = [];
        if ($project->proposal_id) {
            $equipmentList = \App\Models\EquipmentRegistry::query()
                ->where('proposal_id', $project->proposal_id)
                ->with('qrCode')
                ->get();

            if ($equipmentList->isNotEmpty()) {
                $equipmentRecords = $equipmentList->map(function ($item) {
                    $yearAcquired = $item->acquisition_date ? (int) $item->acquisition_date->format('Y') : (int) today()->year;
                    $usefulLife = 5;
                    $cost = (float) ($item->acquisition_cost ?? 0);
                    $elapsedYears = max(0, 2026 - $yearAcquired);
                    $depreciation = $usefulLife > 0 ? round($cost / $usefulLife, 2) : 0;
                    $bookValue = max(0, round($cost - ($elapsedYears * $depreciation), 2));

                    return [
                        'id' => (string) $item->id,
                        'equipment_name' => $item->equipment_name,
                        'brand' => $item->brand,
                        'model' => $item->model,
                        'serial_number' => $item->serial_number,
                        'property_number' => $item->property_number,
                        'qr_reference' => $item->qrCode?->qr_code_reference,
                        'year_acquired' => $yearAcquired,
                        'useful_life_years' => $usefulLife,
                        'cost' => $cost,
                        'book_value' => $bookValue,
                        'condition' => match ($item->current_condition) {
                            'GOOD' => 'Operational',
                            'FAIR' => 'Fair',
                            'POOR' => 'Needs Repair',
                            'NON_FUNCTIONAL' => 'Non-Functional',
                            default => 'Operational',
                        },
                    ];
                })->values()->all();
            } else {
                $quotations = \App\Models\SetupEquipmentQuotation::query()
                    ->whereHas('setup_proposal', fn ($q) => $q->where('proposal_id', $project->proposal_id))
                    ->get();

                if ($quotations->isNotEmpty()) {
                    $equipmentRecords = $quotations->map(function ($q) {
                        $yearAcquired = $q->quotation_date ? (int) $q->quotation_date->format('Y') : (int) today()->year;
                        $usefulLife = 5;
                        $cost = (float) ($q->total_price ?? $q->unit_price ?? 0);
                        $elapsedYears = max(0, 2026 - $yearAcquired);
                        $depreciation = $usefulLife > 0 ? round($cost / $usefulLife, 2) : 0;
                        $bookValue = max(0, round($cost - ($elapsedYears * $depreciation), 2));

                        return [
                            'id' => (string) $q->id,
                            'equipment_name' => $q->equipment_description,
                            'year_acquired' => $yearAcquired,
                            'useful_life_years' => $usefulLife,
                            'cost' => $cost,
                            'book_value' => $bookValue,
                            'condition' => 'Operational',
                        ];
                    })->values()->all();
                }
            }
        }

        $focalOfficer = $proposal?->assigned_focal?->name;

        return [
            'id' => $project->id,
            'proposal_id' => $project->proposal_id,
            'reference_number' => $proposal?->reference_number,
            'title' => $proposal?->title,
            'enterprise_name' => $setup?->business_name ?? $proposal?->user?->name ?? 'Approved enterprise',
            'proponent_name' => $proponentName,
            'contact_number' => $contactNumber,
            'industry_sector' => $industrySector,
            'business_structure' => $businessStructure,
            'enterprise_size' => $enterpriseSize,
            'setup_funding' => (float) ($budget?->total_amount ?? 0),
            'amount_refunded' => round($amountRefunded, 2),
            'full_release' => $budget?->full_release_date?->toDateString()
                ?? data_get($setup?->form_snapshot, 'fullRelease')
                ?? data_get($setup?->form_snapshot, 'fullReleaseDate'),
            'manager' => $manager,
            'focal_officer' => $focalOfficer,
            'business_address' => $businessAddress,
            'district' => $setup?->city_municipality,
            'province' => $setup?->province,
            'status' => $project->status,
            'approved_at' => $project->approved_at?->toIso8601String(),
            'start_date' => $project->start_date?->toDateString(),
            'expected_end_date' => $project->expected_end_date?->toDateString(),
            'monitoring_status' => $latestMonitoring?->implementation_status ?? 'NOT_STARTED',
            'overall_compliance' => (float) ($latestMonitoring?->overall_compliance ?? 0),
            'last_monitored_at' => $latestMonitoring?->last_monitored_at?->toIso8601String(),
            'monitored' => $monitoringRecords->contains(fn ($record) => $record->last_monitored_at !== null),
            'pending_reports' => $reports->whereIn('status', self::PENDING_REPORT_STATUSES)->count(),
            'checklist_stats' => $checklistStats,
            'equipment_records' => $equipmentRecords,
            'latest_report' => $latestReport ? [
                'id' => $latestReport->id,
                'status' => $latestReport->status,
                'reporting_period' => $latestReport->reporting_period,
                'year' => $latestReport->reporting_year,
                'quarter' => $latestReport->reporting_quarter,
                'due_date' => $latestReport->due_date?->toDateString(),
            ] : null,
            'quarterly_context' => [
                'year' => (int) ($filters['year'] ?? now()->year),
                'quarter' => (int) ($filters['quarter'] ?? (int) ceil(now()->month / 3)),
            ],
        ];
    }
}
