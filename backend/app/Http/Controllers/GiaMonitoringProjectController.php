<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexGiaMonitoringProjectsRequest;
use App\Services\ProjectModule\GiaMonitoringProjectService;
use Illuminate\Http\JsonResponse;

class GiaMonitoringProjectController extends Controller
{
    public function __construct(
        private readonly GiaMonitoringProjectService $service,
    ) {
    }

    public function index(IndexGiaMonitoringProjectsRequest $request): JsonResponse
    {
        return response()->json([
            'message' => 'Active GIA monitoring projects retrieved successfully',
            ...$this->service->getProjects($request->user(), $request->validated()),
        ]);
    }
}
