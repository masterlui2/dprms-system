<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexSetupMonitoringProjectsRequest;
use App\Services\ProjectModule\SetupMonitoringProjectService;
use Illuminate\Http\JsonResponse;

class SetupMonitoringProjectController extends Controller
{
    public function __construct(
        private readonly SetupMonitoringProjectService $service,
    ) {
    }

    public function index(IndexSetupMonitoringProjectsRequest $request): JsonResponse
    {
        return response()->json([
            'message' => 'Active SETUP monitoring projects retrieved successfully',
            ...$this->service->getProjects($request->validated()),
        ]);
    }
}
