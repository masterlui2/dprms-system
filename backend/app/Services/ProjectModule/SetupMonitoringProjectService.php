<?php

namespace App\Services\ProjectModule;

use App\Models\Project;
use App\Models\SetupProgressReport;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class SetupMonitoringProjectService
{
    private const PENDING_REPORT_STATUSES = ['DRAFT', 'RETURNED'];

    public function getProjects(array $filters): array
    {
        $baseQuery = $this->activeSetupProjectsQuery();

        $statistics = [
            'active_projects' => (clone $baseQuery)->count(),
            'monitored_count' => (clone $baseQuery)
                ->whereHas('proposal.monitoringRecords', fn (Builder $query) =>
                    $query->whereNotNull('last_monitored_at')
                )
                ->count(),
            'pending_reports' => SetupProgressReport::query()
                ->whereIn('status', self::PENDING_REPORT_STATUSES)
                ->whereHas('monitoringRecord.proposal.project', fn (Builder $query) =>
                    $query->where('program_type', 'SETUP')->where('status', 'active')
                )
                ->count(),
        ];

        $projectsQuery = (clone $baseQuery)
            ->with([
                'proposal.user:id,name,email',
                'proposal.assigned_staff:id,name,email',
                'proposal.assigned_focal:id,name,email',
                'proposal.setup_proposal',
                'proposal.monitoringRecords.monitor:id,name,email',
                'proposal.monitoringRecords.setupProgressReports',
            ]);

        $this->applySearch($projectsQuery, $filters['search'] ?? null);
        $this->applyDistrict($projectsQuery, $filters['district'] ?? null);

        $paginator = $projectsQuery
            ->orderByDesc('approved_at')
            ->paginate(6, ['*'], 'page', (int) ($filters['page'] ?? 1));
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
                    ->orWhereHas('user', fn (Builder $userQuery) =>
                        $userQuery->whereRaw('LOWER(name) LIKE ?', [$like])
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

        $query->whereHas('proposal.setup_proposal', fn (Builder $setupQuery) =>
            $setupQuery->whereRaw('LOWER(city_municipality) = ?', [mb_strtolower($district)])
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

        return [
            'id' => $project->id,
            'proposal_id' => $project->proposal_id,
            'reference_number' => $proposal?->reference_number,
            'title' => $proposal?->title,
            'enterprise_name' => $setup?->business_name ?? $proposal?->user?->name ?? 'Approved enterprise',
            'manager' => $manager,
            'business_address' => $setup?->business_address,
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
