<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSiteVisitRequest;
use App\Models\Project;
use App\Models\ProjectMonitoringRecord;
use App\Models\SiteVisit;
use App\Models\User;
use App\Services\ProjectModule\MonitoringDeadlineService;
use App\Services\UniversalNotificationService;
use App\Support\ProgramAccess;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class SiteVisitController extends Controller
{
    public function __construct(
        private readonly MonitoringDeadlineService $deadlines,
        private readonly UniversalNotificationService $notifications,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'month' => ['nullable', 'date_format:Y-m'],
        ]);
        $month = Carbon::createFromFormat('Y-m', $validated['month'] ?? now('Asia/Manila')->format('Y-m'), 'Asia/Manila');
        $user = $request->user();

        $visits = SiteVisit::query()
            ->whereBetween('scheduled_date', [$month->copy()->startOfMonth(), $month->copy()->endOfMonth()])
            ->whereHas('project', fn (Builder $query) => $query->whereIn('program_type', $this->allowedPrograms($user)))
            ->with(['project.proposal:id,submitted_by,reference_number,title,program_type', 'assignees:id,name,email'])
            ->orderBy('scheduled_date')
            ->orderBy('start_time')
            ->get()
            ->map(fn (SiteVisit $visit) => $this->formatVisit($visit));

        return response()->json([
            'data' => [
                'visits' => $visits,
                'deadlines' => $this->deadlines->calendarEvents($user, (int) $month->year)->values(),
                'access' => [
                    'can_schedule' => collect($this->allowedPrograms($user))
                        ->contains(fn (string $program) => ProgramAccess::canWriteMonitoring($user, $program)),
                ],
            ],
        ]);
    }

    public function options(Request $request): JsonResponse
    {
        $user = $request->user();
        $programs = $this->allowedPrograms($user);
        $projects = Project::query()
            ->where('status', 'active')
            ->whereIn('program_type', $programs)
            ->whereHas('proposal', fn (Builder $query) => $query->where('status', 'APPROVED'))
            ->with(['proposal.setup_proposal', 'proposal.gia_proposal'])
            ->orderByDesc('approved_at')
            ->get()
            ->map(function (Project $project) {
                $proposal = $project->proposal;
                $setup = $proposal?->setup_proposal->first();
                $gia = $proposal?->gia_proposal->first();

                return [
                    'id' => $project->id,
                    'program' => $project->program_type,
                    'reference_number' => $proposal?->reference_number,
                    'title' => $proposal?->title,
                    'location' => $setup?->business_address ?? $gia?->office_address ?? '',
                ];
            });

        $personnel = User::query()
            ->where('is_active', true)
            ->whereHas('role', fn (Builder $query) => $query->whereIn('code', [
                'PROJECT_STAFF',
                'PSTO_STAFF',
                'FOCAL',
                'SSCP_FOCAL',
                'SETUP_FOCAL',
                'RPMO',
                'RPMO_STAFF',
            ]))
            ->with('role:id,name,code')
            ->orderBy('name')
            ->get()
            ->filter(fn (User $candidate) => collect($programs)->contains(fn (string $program) => $candidate->canAccessProgram($program)))
            ->map(fn (User $candidate) => [
                'id' => $candidate->id,
                'name' => $candidate->name,
                'role' => $candidate->role->first()?->name ?? 'Officer',
                'programs' => $candidate->authorizedProgramTypes(),
            ])
            ->values();

        return response()->json([
            'data' => [
                'projects' => $projects,
                'personnel' => $personnel,
            ],
        ]);
    }

    public function store(StoreSiteVisitRequest $request): JsonResponse
    {
        $data = $request->validated();
        $project = Project::query()->with('proposal.user')->findOrFail($data['project_id']);
        $assignees = User::query()
            ->whereIn('id', $data['assigned_user_ids'])
            ->where('is_active', true)
            ->get();

        if ($assignees->count() !== count($data['assigned_user_ids']) || $assignees->contains(
            fn (User $user) => ! $user->hasRole(['PROJECT_STAFF', 'PSTO_STAFF', 'FOCAL', 'SSCP_FOCAL', 'SETUP_FOCAL', 'RPMO', 'RPMO_STAFF'])
                || ! $user->canAccessProgram($project->program_type),
        )) {
            throw ValidationException::withMessages([
                'assigned_user_ids' => 'Choose active personnel assigned to this program.',
            ]);
        }

        $visit = DB::transaction(function () use ($data, $project, $assignees, $request) {
            $monitoring = ProjectMonitoringRecord::query()->firstOrCreate(
                ['proposal_id' => $project->proposal_id, 'program_type' => $project->program_type],
                [
                    'assigned_monitor' => $assignees->first()->id,
                    'implementation_status' => 'NOT_STARTED',
                    'start_date' => $project->start_date,
                    'expected_end_date' => $project->expected_end_date,
                    'overall_compliance' => 0,
                ],
            );

            $visit = SiteVisit::query()->create([
                'project_id' => $project->id,
                'monitoring_record_id' => $monitoring->id,
                'scheduled_by' => $request->user()->id,
                'assigned_personnel' => $assignees->first()->id,
                'visit_type' => $this->legacyVisitType($data['purpose']),
                'purpose' => $data['purpose'],
                'scheduled_date' => $data['scheduled_date'],
                'start_time' => $data['start_time'],
                'end_time' => $data['end_time'],
                'facility_location' => $data['facility_location'],
                'proponent_instructions' => $data['proponent_instructions'] ?? null,
                'visibility' => 'BROADCAST',
                'status' => 'SCHEDULED',
                'notification_sent' => true,
                'notification_sent_at' => now(),
            ]);
            $visit->assignees()->sync($assignees->pluck('id'));

            foreach ($assignees as $assignee) {
                $this->notify($assignee, $visit, false, $request->user());
            }
            if ($project->proposal?->user) {
                $this->notify($project->proposal->user, $visit, true, $request->user());
            }

            return $visit;
        });

        $visit->load(['project.proposal:id,submitted_by,reference_number,title,program_type', 'assignees:id,name,email']);

        return response()->json([
            'message' => 'Site visit scheduled.',
            'data' => $this->formatVisit($visit),
        ], 201);
    }

    public function mine(Request $request): JsonResponse
    {
        $visits = SiteVisit::query()
            ->where('visibility', 'BROADCAST')
            ->where('status', '<>', 'CANCELLED')
            ->whereDate('scheduled_date', '>=', now('Asia/Manila')->toDateString())
            ->whereHas('project.proposal', fn (Builder $query) => $query->where('submitted_by', $request->user()->id))
            ->with(['project.proposal:id,submitted_by,reference_number,title,program_type', 'assignees:id,name,email'])
            ->orderBy('scheduled_date')
            ->orderBy('start_time')
            ->get()
            ->map(fn (SiteVisit $visit) => $this->formatVisit($visit));

        return response()->json(['data' => $visits]);
    }

    public function calendarFile(Request $request, SiteVisit $siteVisit): Response
    {
        $siteVisit->load('project.proposal');
        $user = $request->user();
        $isOwner = $siteVisit->visibility === 'BROADCAST'
            && $siteVisit->project?->proposal?->submitted_by === $user->id;
        abort_unless($isOwner || ProgramAccess::canReadProgram($user, $siteVisit->project?->program_type ?? ''), 403);

        $date = $siteVisit->scheduled_date->format('Ymd');
        $start = str_replace(':', '', substr((string) $siteVisit->start_time, 0, 5)).'00';
        $end = str_replace(':', '', substr((string) $siteVisit->end_time, 0, 5)).'00';
        $title = $this->escapeIcs('DOST Site Visit - '.($siteVisit->project?->proposal?->title ?? 'Project'));
        $description = $this->escapeIcs($siteVisit->proponent_instructions ?? $this->purposeLabel($siteVisit->purpose));
        $location = $this->escapeIcs($siteVisit->facility_location ?? '');
        $content = implode("\r\n", [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//DPRMS//Site Visit//EN',
            'CALSCALE:GREGORIAN',
            'BEGIN:VEVENT',
            'UID:site-visit-'.$siteVisit->id.'@dprms',
            'DTSTAMP:'.now('UTC')->format('Ymd\THis\Z'),
            "DTSTART;TZID=Asia/Manila:{$date}T{$start}",
            "DTEND;TZID=Asia/Manila:{$date}T{$end}",
            "SUMMARY:{$title}",
            "LOCATION:{$location}",
            "DESCRIPTION:{$description}",
            'END:VEVENT',
            'END:VCALENDAR',
            '',
        ]);

        return response($content, 200, [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="site-visit-'.$siteVisit->id.'.ics"',
        ]);
    }

    private function notify(User $recipient, SiteVisit $visit, bool $proponent, User $actor): void
    {
        $project = $visit->project?->proposal?->title ?? 'Project';
        $date = $visit->scheduled_date->format('M j, Y');
        $time = Carbon::parse((string) $visit->start_time)->format('g:i A');
        $this->notifications->notify($recipient, [
            'type' => 'SITE_VISIT_SCHEDULED',
            'category' => 'SITE_VISIT',
            'program' => $visit->project->program_type,
            'title' => $proponent ? 'Site visit scheduled' : 'Field assignment',
            'message' => "DOST PSTO Site Visit scheduled on {$date} at {$time} for {$project}.",
            'action_url' => $proponent
                ? '/'.strtolower($visit->project->program_type).'/dashboard?tab=monitoring'
                : '/dashboard/project-monitoring?view=calendar&date='.$visit->scheduled_date->toDateString().'&visit='.$visit->id,
            'related' => $visit,
        ], $actor);
    }

    private function formatVisit(SiteVisit $visit): array
    {
        return [
            'id' => $visit->id,
            'project_id' => $visit->project_id,
            'program' => $visit->project?->program_type,
            'reference_number' => $visit->project?->proposal?->reference_number,
            'project_title' => $visit->project?->proposal?->title ?? 'Project',
            'date' => $visit->scheduled_date?->toDateString(),
            'start_time' => substr((string) $visit->start_time, 0, 5),
            'end_time' => substr((string) $visit->end_time, 0, 5),
            'purpose' => $visit->purpose,
            'purpose_label' => $this->purposeLabel($visit->purpose),
            'location' => $visit->facility_location,
            'instructions' => $visit->proponent_instructions,
            'visibility' => $visit->visibility,
            'status' => $visit->status,
            'personnel' => $visit->assignees->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
            ])->values(),
        ];
    }

    private function allowedPrograms(User $user): array
    {
        return collect(['SETUP', 'GIA'])
            ->filter(fn (string $program) => ProgramAccess::canReadProgram($user, $program))
            ->values()
            ->all();
    }

    private function legacyVisitType(string $purpose): string
    {
        return match ($purpose) {
            'QUARTERLY_MONITORING' => 'ROUTINE',
            'ENERGY_AUDIT' => 'COMPLIANCE',
            default => 'SPECIAL',
        };
    }

    private function purposeLabel(?string $purpose): string
    {
        return match ($purpose) {
            'PRE_IMPLEMENTATION' => 'Pre-Implementation',
            'EQUIPMENT_ARRIVAL' => 'Equipment Arrival',
            'QUARTERLY_MONITORING' => 'Quarterly Monitoring',
            'ENERGY_AUDIT' => 'Energy Audit',
            default => 'Site Visit',
        };
    }

    private function escapeIcs(string $value): string
    {
        return str_replace(['\\', ';', ',', "\r\n", "\n"], ['\\\\', '\\;', '\\,', '\\n', '\\n'], $value);
    }
}
