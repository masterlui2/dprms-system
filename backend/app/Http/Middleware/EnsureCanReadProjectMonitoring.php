<?php

namespace App\Http\Middleware;

use App\Models\Project;
use App\Support\ProgramAccess;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCanReadProjectMonitoring
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $project = Project::query()->findOrFail((int) $request->route('projectId'));

        abort_unless($user && ProgramAccess::canReadProgram($user, $project->program_type), 403);

        return $next($request);
    }
}
