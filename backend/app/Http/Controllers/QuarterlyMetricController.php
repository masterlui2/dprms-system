<?php

namespace App\Http\Controllers;

use App\Http\Requests\Project\StoreEmployeeRequest;
use App\Http\Requests\Project\StoreProductCostRequest;
use App\Http\Requests\Project\StoreProductRequest;
use App\Http\Requests\Project\StoreQuarterlyMetricsRequest;
use App\Models\Product;
use App\Models\Project;
use App\Models\QuarterlyMetrics;
use App\Services\Contracts\ProjectModule\EmployeeServiceInterface;
use App\Services\Contracts\ProjectModule\ProductionCostServiceInterface;
use App\Services\Contracts\ProjectModule\ProductServiceInterface;
use App\Services\Contracts\ProjectModule\QuarterlyMetricsServiceInterface;
use Illuminate\Http\Request;

class QuarterlyMetricController extends Controller
{
    public function __construct(protected QuarterlyMetricsServiceInterface $quarterlyMetricsService, protected ProductServiceInterface $productService, protected ProductionCostServiceInterface $productionCost, protected EmployeeServiceInterface $employeeService)
    {
    }

    public function store(int $projectId, StoreQuarterlyMetricsRequest $request)
    {
        $project = Project::findOrFail($projectId);
        $data = $this->quarterlyMetricsService->submit($project->id, $request->validated());

        return response()->json([
            'message' => 'Metrics Created',
            'data' => $data,
        ], 201);
    }

    public function index(int $projectId, Request $request)
    {
        $data = $this->quarterlyMetricsService->getByProject(
            $projectId,
            $request->integer('quarter') ?: null,
            $request->integer('year') ?: null,
        );

        return response()->json([
            'message' => 'Metrics Displayed',
            'data' => $data,
        ], 200);
    }

    public function storeProduct(int $quarterId,StoreProductRequest $request){
        $data = $this->productService->submit($quarterId,$request->validated());
        return response()->json([
            'message' => 'Product created',
            'data' => $data
        ],201);
    }

    public function storeCost(int $quarterId,StoreProductCostRequest $request){
        $data = $this->productionCost->submit($quarterId,$request->validated());
        return response()->json([
            'message' => 'Production Cost Created',
            'data' => $data,
        ],201);
    }

    public function storeEmployee(int $quarterId,StoreEmployeeRequest $request){
        $data = $this->employeeService->submit($quarterId,$request->validated());
        return response()->json([
            'message' => 'Employee Created',
            'data' => $data
        ],201);
    }
}
