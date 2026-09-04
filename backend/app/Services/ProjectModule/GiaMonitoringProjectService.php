<?php

namespace App\Services\ProjectModule;

use App\Models\GiaDeliverableTracking;
use App\Models\Project;
use App\Models\ProjectBudget;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class GiaMonitoringProjectService
{
    public function getProjects(User $user, array $filters): array
    {
        $baseQuery = $this->activeGiaProjectsQuery();
        $milestoneQuery = GiaDeliverableTracking::query()
            ->whereHas('monitoringRecord.proposal.project', fn (Builder $query) =>
                $query->where('projects.program_type', 'GIA')->where('projects.status', 'active')
            );

        $statistics = [
            'active_grants' => (clone $baseQuery)->count(),
            'monitored_projects' => (clone $baseQuery)
                ->whereHas('proposal.monitoringRecords', fn (Builder $query) =>
                    $query->whereNotNull('last_monitored_at')
                )
                ->count(),
            'total_grant_amount' => (float) ProjectBudget::query()
                ->where('program_type', 'GIA')
                ->where('status', 'ACTIVE')
                ->whereHas('proposal.project', fn (Builder $query) =>
                    $query->where('projects.program_type', 'GIA')->where('projects.status', 'active')
                )
                ->sum('total_amount'),
            'average_milestone_progress' => round((float) ((clone $milestoneQuery)->avg('completion_percentage') ?? 0), 1),
            'pending_milestones' => (clone $milestoneQuery)
                ->whereIn('status', ['PENDING', 'IN_PROGRESS', 'DELAYED'])
                ->count(),
            'delayed_milestones' => (clone $milestoneQuery)
                ->where('status', 'DELAYED')
                ->count(),
        ];

        $projectsQuery = (clone $baseQuery)->with([
            'proposal.user:id,name,email',
            'proposal.assigned_staff:id,name,email',
            'proposal.assigned_focal:id,name,email',
            'proposal.gia_proposal',
            'proposal.projectBudget',
            'proposal.monitoringRecords.monitor:id,name,email',
            'proposal.monitoringRecords.giaProgressReports',
            'proposal.monitoringRecords.giaDeliverables',
        ]);

        $this->applySearch($projectsQuery, $filters['search'] ?? null);
        $this->applyAgency($projectsQuery, $filters['agency'] ?? null);
        $this->applyStatus($projectsQuery, $filters['status'] ?? null);

        $paginator = $projectsQuery
            ->orderByDesc('approved_at')
            ->paginate(6, ['*'], 'page', (int) ($filters['page'] ?? 1));
        $projects = $paginator->getCollection()
            ->map(fn (Project $project) => $this->formatProject($project, $filters))
            ->values();

        return [
            'access' => [
                'can_edit' => $user->hasRole('FOCAL') && $user->program_type === 'GIA',
                'read_only' => $user->hasRole('PROVINCIAL_DIRECTOR'),
            ],
            'statistics' => $statistics,
            'filters' => [
                'agencies' => $this->availableAgencies(),
                'statuses' => ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SUSPENDED', 'TERMINATED'],
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

    private function activeGiaProjectsQuery(): Builder
    {
        return Project::query()
            ->where('projects.program_type', 'GIA')
            ->where('projects.status', 'active');
    }

    private function applySearch(Builder $query, ?string $search): void
    {
        $search = trim((string) $search);
        if ($search === '') {
            return;
        }

        $like = '%'.mb_strtolower($search).'%';
        $query->whereHas('proposal', function (Builder $proposalQuery) use ($like) {
            $proposalQuery
                ->whereRaw('LOWER(reference_number) LIKE ?', [$like])
                ->orWhereRaw('LOWER(title) LIKE ?', [$like])
                ->orWhereHas('user', fn (Builder $userQuery) =>
                    $userQuery->whereRaw('LOWER(name) LIKE ?', [$like])
                )
                ->orWhereHas('gia_proposal', function (Builder $giaQuery) use ($like) {
                    $giaQuery
                        ->whereRaw('LOWER(organization_name) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(office_address) LIKE ?', [$like]);
                });
        });
    }

    private function applyAgency(Builder $query, ?string $agency): void
    {
        $agency = trim((string) $agency);
        if ($agency === '') {
            return;
        }

        $query->whereHas('proposal.gia_proposal', fn (Builder $giaQuery) =>
            $giaQuery->whereRaw('LOWER(organization_name) = ?', [mb_strtolower($agency)])
        );
    }

    private function applyStatus(Builder $query, ?string $status): void
    {
        if (! $status) {
            return;
        }

        if ($status === 'NOT_STARTED') {
            $query->where(function (Builder $statusQuery) {
                $statusQuery
                    ->whereDoesntHave('proposal.monitoringRecords')
                    ->orWhereHas('proposal.monitoringRecords', fn (Builder $monitoringQuery) =>
                        $monitoringQuery->where('implementation_status', 'NOT_STARTED')
                    );
            });

            return;
        }

        $query->whereHas('proposal.monitoringRecords', fn (Builder $monitoringQuery) =>
            $monitoringQuery->where('implementation_status', $status)
        );
    }

    private function availableAgencies(): Collection
    {
        return $this->activeGiaProjectsQuery()
            ->join('proposals', 'projects.proposal_id', '=', 'proposals.id')
            ->join('gia_proposals', 'gia_proposals.proposal_id', '=', 'proposals.id')
            ->whereNotNull('gia_proposals.organization_name')
            ->where('gia_proposals.organization_name', '<>', '')
            ->distinct()
            ->orderBy('gia_proposals.organization_name')
            ->pluck('gia_proposals.organization_name');
    }

    private function formatProject(Project $project, array $filters): array
    {
        $proposal = $project->proposal;
        $gia = $proposal?->gia_proposal->first();
        $monitoringRecords = $proposal?->monitoringRecords ?? collect();
        $latestMonitoring = $monitoringRecords
            ->sortByDesc(fn ($record) => sprintf(
                '%020d-%020d',
                $record->last_monitored_at?->getTimestamp() ?? 0,
                $record->id,
            ))
            ->first();
        $reports = $monitoringRecords->flatMap->giaProgressReports;
        $deliverables = $monitoringRecords->flatMap->giaDeliverables
            ->sortBy('deliverable_number')
            ->values();
        $latestReport = $reports
            ->sortByDesc(fn ($report) => sprintf('%04d-%020d', $report->reporting_year, $report->id))
            ->first();
        $budget = $proposal?->projectBudget;
        $snapshot = $gia?->form_snapshot ?? [];
        $progress = round((float) ($deliverables->avg('completion_percentage') ?? 0), 1);
        $manager = $latestMonitoring?->monitor?->name
            ?? $proposal?->assigned_focal?->name
            ?? $proposal?->assigned_staff?->name
            ?? $this->snapshotString($snapshot, 'projectLeader')
            ?? $proposal?->user?->name
            ?? 'Unassigned';

        return [
            'id' => $project->id,
            'proposal_id' => $project->proposal_id,
            'reference_number' => $proposal?->reference_number,
            'title' => $proposal?->title,
            'implementing_agency' => $gia?->organization_name ?? $proposal?->user?->name ?? 'Implementing agency not recorded',
            'project_leader' => $manager,
            'office_address' => $gia?->office_address,
            'status' => $project->status,
            'approved_at' => $project->approved_at?->toIso8601String(),
            'start_date' => $project->start_date?->toDateString(),
            'expected_end_date' => $project->expected_end_date?->toDateString(),
            'grant_amount' => (float) ($budget?->total_amount ?? 0),
            'currency' => $budget?->currency ?? 'PHP',
            'monitoring_status' => $latestMonitoring?->implementation_status ?? 'NOT_STARTED',
            'last_monitored_at' => $latestMonitoring?->last_monitored_at?->toIso8601String(),
            'milestone_progress' => $progress,
            'milestones' => $deliverables->map(fn ($deliverable) => [
                'id' => $deliverable->id,
                'number' => $deliverable->deliverable_number,
                'title' => $deliverable->deliverable_title,
                'description' => $deliverable->deliverable_desription,
                'status' => $deliverable->status,
                'completion_percentage' => (float) $deliverable->completion_percentage,
                'expected_completion' => $deliverable->expected_completion?->toDateString(),
                'actual_completion' => $deliverable->actual_completion?->toDateString(),
            ])->all(),
            'latest_report' => $latestReport ? [
                'id' => $latestReport->id,
                'status' => $latestReport->status,
                'reporting_period' => $latestReport->reporting_period,
                'year' => $latestReport->reporting_year,
                'submitted_at' => $latestReport->submitted_at?->toIso8601String(),
                'due_date' => $latestReport->due_date?->toDateString(),
            ] : null,
            'semestral_context' => [
                'year' => (int) ($filters['year'] ?? now()->year),
                'semester' => (int) ($filters['semester'] ?? (now()->month <= 6 ? 1 : 2)),
            ],
        ];
    }

    private function snapshotString(array $snapshot, string $key): ?string
    {
        $value = $snapshot[$key] ?? null;
        return is_string($value) && trim($value) !== '' ? trim($value) : null;
    }
}
