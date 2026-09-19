<?php

namespace App\Services\ProjectModule;

use App\Models\GiaProgressReport;
use App\Models\Notification;
use App\Models\Project;
use App\Models\QuarterlyMetrics;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class MonitoringDeadlineService
{
    public function calendarEvents(User $user, int $year): Collection
    {
        return $this->visibleProjects($user)
            ->get()
            ->flatMap(fn (Project $project) => $project->program_type === 'SETUP'
                ? $this->setupDeadlines($project, $year)
                : $this->giaDeadlines($project, $year));
    }

    public function syncOverdueNotifications(User $user): void
    {
        if (! $user->hasRole(['FOCAL', 'SSCP_FOCAL', 'SETUP_FOCAL'])) {
            return;
        }

        $today = now('Asia/Manila')->startOfDay();
        $this->calendarEvents($user, (int) $today->year)
            ->filter(function (array $event) use ($today) {
                if ($event['status'] === 'OVERDUE') {
                    return true;
                }

                $date = Carbon::parse($event['date'], 'Asia/Manila')->startOfDay();

                return $event['status'] === 'DUE'
                    && $date->betweenIncluded($today, $today->copy()->addDays(14));
            })
            ->each(function (array $event) use ($user) {
                $overdue = $event['status'] === 'OVERDUE';
                $notification = Notification::query()->firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'type' => $overdue ? 'MONITORING_DEADLINE_OVERDUE' : 'MONITORING_DEADLINE_DUE',
                        'related_type' => Project::class,
                        'related_id' => $event['project_id'],
                        'message' => $event['label'].($overdue ? ' is overdue.' : ' is due soon.'),
                    ],
                    [
                        'category' => 'MONITORING',
                        'program' => $event['program'],
                        'title' => $overdue ? 'Monitoring report overdue' : 'Monitoring report due soon',
                        'action_url' => '/dashboard/project-monitoring?view=calendar&date='.$event['date'],
                        'is_read' => false,
                    ],
                );
                $notification->fill([
                    'category' => 'MONITORING',
                    'program' => $event['program'],
                    'title' => $overdue ? 'Monitoring report overdue' : 'Monitoring report due soon',
                    'action_url' => '/dashboard/project-monitoring?view=calendar&date='.$event['date'],
                ]);
                if ($notification->isDirty()) {
                    $notification->save();
                }
            });
    }

    private function visibleProjects(User $user): Builder
    {
        $query = Project::query()
            ->where('status', 'active')
            ->whereHas('proposal', fn (Builder $proposal) => $proposal->where('status', 'APPROVED'))
            ->with('proposal:id,reference_number,title,program_type');

        if (! $user->hasRole(['PROVINCIAL_DIRECTOR', 'RPMO', 'SYSTEM_ADMIN'])) {
            $query->whereIn('program_type', $user->authorizedProgramTypes());
        }

        return $query;
    }

    private function setupDeadlines(Project $project, int $year): Collection
    {
        return collect(range(1, 4))->map(function (int $quarter) use ($project, $year) {
            $date = Carbon::create($year, $quarter * 3, 1, 0, 0, 0, 'Asia/Manila')->endOfMonth();
            $submitted = QuarterlyMetrics::query()
                ->where('project_id', $project->id)
                ->where('year', $year)
                ->where('quarter', $quarter)
                ->whereNotNull('submitted_at')
                ->exists();

            return $this->deadline($project, $date, "Q{$quarter} {$year}", $submitted);
        });
    }

    private function giaDeadlines(Project $project, int $year): Collection
    {
        return collect([1 => '06-30', 2 => '12-31'])->map(function (string $monthDay, int $semester) use ($project, $year) {
            $date = Carbon::parse("{$year}-{$monthDay}", 'Asia/Manila');
            $submitted = GiaProgressReport::query()
                ->where('reporting_year', $year)
                ->whereNotNull('submitted_at')
                ->whereHas('monitoringRecord', fn (Builder $record) => $record->where('proposal_id', $project->proposal_id))
                ->where('reporting_period', 'like', $semester === 1 ? '1st Semester%' : '2nd Semester%')
                ->exists();

            return $this->deadline($project, $date, ($semester === 1 ? '1st' : '2nd')." Semester {$year}", $submitted);
        })->values();
    }

    private function deadline(Project $project, Carbon $date, string $period, bool $submitted): array
    {
        $status = $submitted ? 'SUBMITTED' : ($date->copy()->endOfDay()->isPast() ? 'OVERDUE' : 'DUE');

        return [
            'id' => "deadline-{$project->id}-{$period}",
            'type' => 'DEADLINE',
            'project_id' => $project->id,
            'program' => $project->program_type,
            'project_title' => $project->proposal?->title ?? 'Project',
            'label' => $period.' report',
            'date' => $date->toDateString(),
            'status' => $status,
        ];
    }
}
