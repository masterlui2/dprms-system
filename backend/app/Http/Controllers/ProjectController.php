<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\ProjectModule\ProjectService;
use App\Support\ProgramAccess;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function __construct(protected ProjectService $projectService) {}

    public function index(Request $request)
    {
        $status = $request->query('status');
        if ($status && ! in_array(strtoupper($status), ['SETUP', 'GIA'], true)) {
            return response()->json(['message' => 'Invalid status'], 422);
        }
        $user = $request->user();
        $data = $this->projectService->getIndex($status)
            ->filter(fn (Project $project) => $user && ProgramAccess::canReadProgram($user, $project->program_type))
            ->values();

        return response()->json([
            'message' => 'Display all Projects',
            'data' => $data,
        ], 200);
    }
}
