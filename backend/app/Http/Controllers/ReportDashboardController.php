<?php

namespace App\Http\Controllers;

use App\Models\EquipmentRegistry;
use App\Models\GiaProgressReport;
use App\Models\Project;
use App\Models\ProjectMonitoringRecord;
use App\Models\Proposal;
use App\Models\QuarterlyMetrics;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $year = (int) $request->validate([
            'year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'program' => ['nullable', 'in:SETUP,GIA'],
        ])['year'] ?? (int) now()->year;
        $requestedProgram = $request->query('program');

        $proposalIds = $this->visibleProposals($user, $requestedProgram)->select('proposals.id');
        $projectIds = Project::query()->whereIn('proposal_id', clone $proposalIds)->select('projects.id');
        $monitoringIds = ProjectMonitoringRecord::query()
            ->whereIn('proposal_id', clone $proposalIds)
            ->select('project_monitoring_records.id');

        $quarterly = QuarterlyMetrics::query()
            ->whereIn('project_id', clone $projectIds)
            ->where('year', $year);
        $giaReports = GiaProgressReport::query()
            ->whereIn('monitoring_record_id', clone $monitoringIds)
            ->where('reporting_year', $year);

        $quarterlyTotal = (clone $quarterly)->count();
        $giaTotal = (clone $giaReports)->count();
        $submittedReports = (clone $quarterly)->whereNotNull('submitted_at')->count()
            + (clone $giaReports)->whereNotNull('submitted_at')->count();
        $totalReports = $quarterlyTotal + $giaTotal;

        $projects = Project::query()
            ->whereIn('proposal_id', clone $proposalIds)
            ->with(['proposal:id,reference_number,title,program_type'])
            ->withCount([
                'quarterlyMetrics as quarterly_reports_count' => fn (Builder $query) => $query->where('year', $year),
            ])
            ->latest('updated_at')
            ->limit(100)
            ->get()
            ->map(function (Project $project) use ($year) {
                $giaReportsCount = GiaProgressReport::query()
                    ->where('reporting_year', $year)
                    ->whereHas('monitoringRecord', fn (Builder $query) => $query->where('proposal_id', $project->proposal_id))
                    ->count();

                return [
                    'id' => $project->id,
                    'reference_number' => $project->proposal?->reference_number,
                    'title' => $project->proposal?->title,
                    'program' => $project->program_type,
                    'status' => $project->status,
                    'reports_count' => (int) $project->quarterly_reports_count + $giaReportsCount,
                    'updated_at' => $project->updated_at?->toIso8601String(),
                ];
            });

        return response()->json([
            'data' => [
                'year' => $year,
                'programs' => $this->allowedPrograms($user),
                'summary' => [
                    'proposals' => $this->visibleProposals($user, $requestedProgram)->count(),
                    'projects' => Project::query()->whereIn('proposal_id', clone $proposalIds)->count(),
                    'equipment' => EquipmentRegistry::query()->whereIn('proposal_id', clone $proposalIds)->count(),
                    'reports' => $totalReports,
                    'submitted_reports' => $submittedReports,
                    'draft_reports' => max(0, $totalReports - $submittedReports),
                    'submission_rate' => $totalReports > 0 ? (int) round(($submittedReports / $totalReports) * 100) : 0,
                ],
                'projects' => $projects,
                'generated_at' => now()->toIso8601String(),
            ],
        ]);
    }

    private function visibleProposals(User $user, ?string $program): Builder
    {
        $query = Proposal::query();
        $isProponent = $user->hasRole(['PROPONENT', 'MSME_PROPONENT', 'GIA_PROJECT_LEADER']);

        if ($isProponent) {
            $query->where('submitted_by', $user->id);
        } elseif (! $user->hasRole(['PROVINCIAL_DIRECTOR', 'PSTO_DIRECTOR', 'RPMO', 'SYSTEM_ADMIN', 'ADMIN', 'SUPER_ADMIN'])) {
            $query->whereIn('program_type', $user->authorizedProgramTypes());
        }

        if ($program) {
            abort_unless(in_array($program, $this->allowedPrograms($user), true), 403);
            $query->where('program_type', $program);
        }

        return $query;
    }

    /** @return list<string> */
    private function allowedPrograms(User $user): array
    {
        if ($user->hasRole(['PROVINCIAL_DIRECTOR', 'PSTO_DIRECTOR', 'RPMO', 'SYSTEM_ADMIN', 'ADMIN', 'SUPER_ADMIN'])) {
            return ['SETUP', 'GIA'];
        }

        return $user->authorizedProgramTypes();
    }
}
