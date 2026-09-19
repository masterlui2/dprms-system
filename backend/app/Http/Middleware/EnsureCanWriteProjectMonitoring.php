<?php

namespace App\Http\Middleware;

use App\Models\Project;
use App\Models\QuarterlyMetrics;
use App\Support\ProgramAccess;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCanWriteProjectMonitoring
{
    public function handle(Request $request, Closure $next): Response
    {
        $project = $request->route('projectId')
            ? Project::query()->findOrFail((int) $request->route('projectId'))
            : QuarterlyMetrics::query()
                ->with('project')
                ->findOrFail((int) $request->route('quarterId'))
                ->project;

        $user = $request->user();
        abort_unless($user && $project && ProgramAccess::canWriteMonitoring($user, $project->program_type), 403);

        return $next($request);
    }
}
