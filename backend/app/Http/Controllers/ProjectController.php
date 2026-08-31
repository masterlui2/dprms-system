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
    public function index()
    {
        $data = $this->projectService->getIndex();
        return response()->json([
            'message' => 'Display all Projects',
            'data' => $data,
        ],200);
    }
}
