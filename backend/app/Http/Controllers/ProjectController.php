<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\Contracts\ProjectModule\ProjectServiceInterface;
use App\Services\ProjectModule\ProjectService;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function __construct(protected ProjectService $projectService)
    {
    }
    public function index(Request $request)
    {
        $status = $request->query('status');
        if (!in_array($status, ['SETUP', 'GIA'], true)) {
            return response()->json(['message' => 'Invalid or missing status'], 422);
        }
        $data = $this->projectService->getIndex($status);
        return response()->json([
            'message' => 'Display all Projects',
            'data' => $data,
        ],200);
    }
}
