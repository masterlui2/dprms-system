<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexGiaMonitoringProjectsRequest;
use App\Http\Requests\SaveGiaMonitoringReportRequest;
use App\Http\Requests\ShowGiaMonitoringReportRequest;
use App\Models\Project;
use App\Services\ProjectModule\GiaMonitoringProjectService;
use Illuminate\Http\JsonResponse;

class GiaMonitoringProjectController extends Controller
{
    public function __construct(
        private readonly GiaMonitoringProjectService $service,
    ) {}

    public function index(IndexGiaMonitoringProjectsRequest $request): JsonResponse
    {
        return response()->json([
            'message' => 'Active GIA monitoring projects retrieved successfully',
            ...$this->service->getProjects($request->user(), $request->validated()),
        ]);
    }

    public function showReport(ShowGiaMonitoringReportRequest $request, Project $project): JsonResponse
    {
        $report = $this->service->getReport(
            $project,
            (int) $request->validated('year'),
            (int) $request->validated('semester'),
        );

        return response()->json([
            'data' => $report ? [
                'id' => $report->id,
                'status' => $report->status,
                'reporting_period' => $report->reporting_period,
                'year' => $report->reporting_year,
                'form_data' => $report->form_data,
                'updated_at' => $report->updated_at?->toIso8601String(),
            ] : null,
        ]);
    }

    public function saveReport(SaveGiaMonitoringReportRequest $request, Project $project): JsonResponse
    {
        $report = $this->service->saveReport($project, $request->user(), $request->validated());

        return response()->json([
            'message' => 'GIA monitoring report saved successfully',
            'data' => [
                'id' => $report->id,
                'status' => $report->status,
                'reporting_period' => $report->reporting_period,
                'year' => $report->reporting_year,
                'form_data' => $report->form_data,
                'updated_at' => $report->updated_at?->toIso8601String(),
            ],
        ]);
    }
}
