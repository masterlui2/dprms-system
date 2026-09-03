<?php

namespace App\Http\Controllers;

use App\Http\Requests\ResolveEquipmentQrRequest;
use App\Http\Requests\StoreEquipmentInspectionRequest;
use App\Models\EquipmentRegistry;
use App\Services\EquipmentModule\EquipmentInspectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EquipmentInspectionController extends Controller
{
    public function __construct(private readonly EquipmentInspectionService $equipmentInspectionService) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->equipmentInspectionService->listForUser($request->user()),
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
