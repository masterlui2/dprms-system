<?php

namespace App\Http\Controllers;

use App\Http\Requests\Project\BatchAccomplishmentRequest;
use App\Http\Requests\Project\BatchActionRequest;
use App\Http\Requests\Project\BatchOutputRequest;
use App\Http\Requests\Project\StoreExecutiveSummaryRequest;
use App\Models\Project;
use App\Services\Contracts\ProjectModule\AccomplishmentServiceInterface;
use App\Services\Contracts\ProjectModule\ActionServiceInterface;
use App\Services\Contracts\ProjectModule\ExecutiveSummaryServiceInterface;
use App\Services\Contracts\ProjectModule\OutputServiceInterface;
use Illuminate\Http\Request;

class ExecutiveSummaryController extends Controller
{
    public function __construct(
        protected ExecutiveSummaryServiceInterface $executiveSummaryService,
        protected AccomplishmentServiceInterface $accomplishmentService,
        protected OutputServiceInterface $outputService,
        protected ActionServiceInterface $actionService
    ) {
    }

    public function index(int $projectId, Request $request)
    {
        $data = $this->executiveSummaryService->getByProject(
            $projectId,
            $request->integer('semester') ?: null,
            $request->integer('year') ?: null,
        );

        return response()->json([
            'message' => 'Metrics Displayed',
            'data' => $data,
        ], 200);
    }

    public function store(int $projectId, StoreExecutiveSummaryRequest $request)
    {
        $project = Project::findOrFail($projectId);
        $data = $this->executiveSummaryService->submit($project->id, $request->validated());

        return response()->json([
            'message' => 'Metrics Created',
            'data' => $data,
        ], 201);
    }

    public function batchAccomplishment(int $summaryId, BatchAccomplishmentRequest $request)
    {
        $validated = $request->validated();

        $data = $this->accomplishmentService->batch(
            $summaryId,
            $validated['creates'] ?? [],
            $validated['updates'] ?? [],
            $validated['deletes'] ?? [],
        );

        return response()->json([
            'message' => 'Accomplishments Updated',
            'data' => $data,
        ], 200);
    }

    public function batchOutput(int $summaryId, BatchOutputRequest $request)
    {
        $validated = $request->validated();

        $data = $this->outputService->batch(
            $summaryId,
            $validated['creates'] ?? [],
            $validated['updates'] ?? [],
            $validated['deletes'] ?? [],
        );

        return response()->json([
            'message' => 'Outputs Updated',
            'data' => $data,
        ], 200);
    }

    public function batchAction(int $summaryId, BatchActionRequest $request)
    {
        $validated = $request->validated();

        $data = $this->actionService->batch(
            $summaryId,
            $validated['creates'] ?? [],
            $validated['updates'] ?? [],
            $validated['deletes'] ?? [],
        );

        return response()->json([
            'message' => 'Actions Updated',
            'data' => $data,
        ], 200);
    }
}
