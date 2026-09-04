<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexEquipmentRequest;
use App\Http\Requests\ResolveEquipmentQrRequest;
use App\Http\Requests\StoreEquipmentInspectionRequest;
use App\Http\Requests\StoreEquipmentRequest;
use App\Models\EquipmentRegistry;
use App\Services\EquipmentModule\EquipmentInspectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EquipmentInspectionController extends Controller
{
    public function __construct(private readonly EquipmentInspectionService $equipmentInspectionService) {}

    public function index(IndexEquipmentRequest $request): JsonResponse
    {
        $result = $this->equipmentInspectionService->listForUser($request->user(), $request->validated());

        return response()->json([
            'data' => $result['data'],
            'statistics' => $result['statistics'],
            'filters' => $result['filters'],
        ]);
    }

    public function options(IndexEquipmentRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->equipmentInspectionService->registrationOptions(
                $request->user(),
                $request->validated('program_type'),
            ),
        ]);
    }

    public function store(StoreEquipmentRequest $request): JsonResponse
    {
        return response()->json([
            'message' => 'Equipment registered and QR code generated successfully.',
            'data' => $this->equipmentInspectionService->register($request->user(), $request->validated()),
        ], 201);
    }

    public function show(Request $request, EquipmentRegistry $equipment): JsonResponse
    {
        return response()->json([
            'data' => $this->equipmentInspectionService->getForUser($request->user(), $equipment),
        ]);
    }

    public function resolveQr(ResolveEquipmentQrRequest $request): JsonResponse
    {
        return response()->json([
            'message' => 'Asset QR code verified.',
            'data' => $this->equipmentInspectionService->resolveQr(
                $request->user(),
                $request->validated(),
                $request->ip(),
            ),
        ]);
    }

    public function storeInspection(
        StoreEquipmentInspectionRequest $request,
        EquipmentRegistry $equipment,
    ): JsonResponse {
        return response()->json([
            'message' => 'Inspection recorded successfully.',
            'data' => $this->equipmentInspectionService->recordInspection(
                $request->user(),
                $equipment,
                $request->validated(),
            ),
        ]);
    }
}
