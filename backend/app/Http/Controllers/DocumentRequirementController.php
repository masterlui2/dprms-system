<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDocumentRequirementRequest;
use App\Http\Requests\UpdateDocumentRequirementRequest;
use App\Models\DocumentRequirement;
use App\Services\Contracts\ProposalModule\DocumentRequirementServiceInterface;
use Illuminate\Http\Request;

class DocumentRequirementController extends Controller
{
    public function __construct(protected DocumentRequirementServiceInterface $documentRequirementService){}

    public function getRequirementsByProgram(string $programType){
        $requirement = $this->documentRequirementService->getRequirementsByProgram($programType);
        return response()->json([
            'data' => $requirement
        ],200);
    }

    public function createRequirement(StoreDocumentRequirementRequest $request){
        $requirement = $this->documentRequirementService->createRequirement($request->validated());
        return response()->json([
            'message' => 'Document created successfully',
            'data' => $requirement
        ],201);
    }

    public function updateRequirement(UpdateDocumentRequirementRequest $request,DocumentRequirement $document){
        $updated = $this->documentRequirementService->updateRequirement($document->id, $request->validated());
        return response()->json([
            'message' => 'Document updated successfully',
            'data' => $updated,
        ],200);
    }

    public function deleteRequirement(Request $request){
        $this->documentRequirementService->deleteRequirement($request->id());
        return response()->json([
            'message' => 'Document deleted'
        ],200);
    }
}
