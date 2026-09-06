<?php

namespace App\Http\Controllers;

use App\Http\Requests\Project\BatchAssetCapitalRequest;
use App\Http\Requests\Project\BatchAssetRequest;
use App\Http\Requests\Project\BatchEmployeeRequest;
use App\Http\Requests\Project\BatchInterventionRequest;
use App\Http\Requests\Project\BatchLinkageRequest;
use App\Http\Requests\Project\BatchMarketRequest;
use App\Http\Requests\Project\BatchNarrativeRequest;
use App\Http\Requests\Project\BatchProducionMaterialRequest;
use App\Http\Requests\Project\BatchProductionCostRequest;
use App\Http\Requests\Project\BatchProductRequest;
use App\Http\Requests\Project\StoreAssetCapitalRequest;
use App\Http\Requests\Project\StoreAssetRequest;
use App\Http\Requests\Project\StoreEmployeeRequest;
use App\Http\Requests\Project\StoreInterventionRequest;
use App\Http\Requests\Project\StoreLinkageRequest;
use App\Http\Requests\Project\StoreMarketRequest;
use App\Http\Requests\Project\StoreNarrativeRequest;
use App\Http\Requests\Project\StoreProductCostRequest;
use App\Http\Requests\Project\StoreProductionMaterialRequest;
use App\Http\Requests\Project\StoreProductRequest;
use App\Http\Requests\Project\StoreQuarterlyMetricsRequest;
use App\Models\Product;
use App\Models\Project;
use App\Models\QuarterlyMetrics;
use App\Services\Contracts\ProjectModule\AssetCapitalServiceInterface;
use App\Services\Contracts\ProjectModule\InterventionServiceInterface;
use App\Services\Contracts\ProjectModule\LinkageServiceInterface;
use App\Services\Contracts\ProjectModule\NarrativeServiceInterface;
use App\Services\Contracts\ProjectModule\ProductionMaterialsServiceInterface;
use App\Services\Contracts\ProjectModule\AssetServiceInterface;
use App\Services\Contracts\ProjectModule\EmployeeServiceInterface;
use App\Services\Contracts\ProjectModule\MarketServiceInterface;
use App\Services\Contracts\ProjectModule\ProductionCostServiceInterface;
use App\Services\Contracts\ProjectModule\ProductServiceInterface;
use App\Services\Contracts\ProjectModule\QuarterlyMetricsServiceInterface;
use Illuminate\Http\Request;

class QuarterlyMetricController extends Controller
{
    public function __construct(
        protected QuarterlyMetricsServiceInterface $quarterlyMetricsService,
        protected ProductServiceInterface $productService,
        protected ProductionCostServiceInterface $productionCost,
        protected EmployeeServiceInterface $employeeService,
        protected AssetCapitalServiceInterface $assetCapitalService,
        protected AssetServiceInterface $assetService,
        protected InterventionServiceInterface $interventionService,
        protected LinkageServiceInterface $linkageService,
        protected MarketServiceInterface $marketService,
        protected NarrativeServiceInterface $narrativeService,
        protected ProductionMaterialsServiceInterface $productionMaterialsService,
        )
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

    public function storeAssetCapital(int $quarterId, StoreAssetCapitalRequest $request){
        $data = $this->assetCapitalService->submit($quarterId,$request->validated());
        return response()->json([
            'message' => 'Asset Capital Created',
            'data' => $data
        ],201);
    }

    public function storeAsset(int $quarterId, StoreAssetRequest $request){
        $data = $this->assetService->submit($quarterId, $request->validated());
        return response()->json([
            'message' => 'Asset Created',
            'data' => $data
        ],201);
    }

    public function storeIntervention(int $quarterId, StoreInterventionRequest $request){
        $data = $this->interventionService->submit($quarterId, $request->validated());
        return response()->json([
            'message' => 'Intervention Added',
            'data' => $data,
        ],201);
    }

    public function storeMarket(int $quarterId, StoreMarketRequest $request){
        $data = $this->marketService->submit($quarterId, $request->validated());
        return response()->json([
            'message' => 'Market Added',
            'data' => $data
        ],201);
    }

    public function storeLinkage(int $quarterId, StoreLinkageRequest $request){
        $data = $this->linkageService->submit($quarterId, $request->validated());
        return response()->json([
            'message' => 'Linkage Added',
            'data' => $data
        ],201);
    }

    public function storeNarrative(int $quarterId, StoreNarrativeRequest $request){
        $data = $this->narrativeService->submit($quarterId, $request->validated());
        return response()->json([
            'message' => 'Narrative Added',
            'data' => $data
        ],201);
    }

    public function storeProductionMaterial(int $quarterId, StoreProductionMaterialRequest $request){
        $data = $this->productionMaterialsService->submit($quarterId, $request->validated());
        return response()->json([
            'message' => 'Production Material Added',
            'data' => $data
        ],201);
    }

    public function batchProducts(int $quarterId, BatchProductRequest $request)
    {
        $data = $this->productService->batch(
            $quarterId,
            $request->validated('creates', []),
            $request->validated('updates', []),
            $request->validated('deletes', []),
        );

        return response()->json([
            'message' => 'Products synced',
            'data' => $data
        ], 200);
    }

    public function batchAssetCapital(int $quarterId, BatchAssetCapitalRequest $request)
    {
        $data = $this->assetCapitalService->batch(
            $quarterId,
            $request->validated('creates', []),
            $request->validated('updates', []),
            $request->validated('deletes', []),
        );

        return response()->json([
            'message' => 'Asset Capital synced',
            'data' => $data
        ], 200);
    }

    public function batchAsset(int $quarterId, BatchAssetRequest $request)
    {
        $data = $this->assetService->batch(
            $quarterId,
            $request->validated('creates', []),
            $request->validated('updates', []),
            $request->validated('deletes', []),
        );

        return response()->json([
            'message' => 'Asset synced',
            'data' => $data
        ], 200);
    }

    public function batchEmployee(int $quarterId, BatchEmployeeRequest $request)
    {
        $data = $this->employeeService->batch(
            $quarterId,
            $request->validated('creates', []),
            $request->validated('updates', []),
            $request->validated('deletes', []),
        );

        return response()->json([
            'message' => 'Employee synced',
            'data' => $data
        ], 200);
    }

    public function batchIntervention(int $quarterId, BatchInterventionRequest $request)
    {
        $data = $this->interventionService->batch(
            $quarterId,
            $request->validated('creates', []),
            $request->validated('updates', []),
            $request->validated('deletes', []),
        );

        return response()->json([
            'message' => 'Intervention synced',
            'data' => $data
        ], 200);
    }

    public function batchLinkage(int $quarterId, BatchLinkageRequest $request)
    {
        $data = $this->linkageService->batch(
            $quarterId,
            $request->validated('creates', []),
            $request->validated('updates', []),
            $request->validated('deletes', []),
        );

        return response()->json([
            'message' => 'Linkage synced',
            'data' => $data
        ], 200);
    }

    public function batchMarket(int $quarterId, BatchMarketRequest $request)
    {
        $data = $this->marketService->batch(
            $quarterId,
            $request->validated('creates', []),
            $request->validated('updates', []),
            $request->validated('deletes', []),
        );

        return response()->json([
            'message' => 'Market synced',
            'data' => $data
        ], 200);
    }

    public function batchNarrative(int $quarterId, BatchNarrativeRequest $request)
    {
        $data = $this->narrativeService->batch(
            $quarterId,
            $request->validated('creates', []),
            $request->validated('updates', []),
            $request->validated('deletes', []),
        );

        return response()->json([
            'message' => 'Narrative synced',
            'data' => $data
        ], 200);
    }

    public function batchProductionMaterial(int $quarterId, BatchProducionMaterialRequest $request)
    {
        $data = $this->productionMaterialsService->batch(
            $quarterId,
            $request->validated('creates', []),
            $request->validated('updates', []),
            $request->validated('deletes', []),
        );

        return response()->json([
            'message' => 'Production Material synced',
            'data' => $data
        ], 200);
    }
    public function batchProductionCost(int $quarterId, BatchProductionCostRequest $request)
    {
        $data = $this->productionCost->batch(
            $quarterId,
            $request->validated('creates', []),
            $request->validated('updates', []),
            $request->validated('deletes', []),
        );

        return response()->json([
            'message' => 'Production Cost synced',
            'data' => $data
        ], 200);
    }
}
