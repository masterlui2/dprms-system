<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEquipmentQuotationRequest;
use App\Http\Requests\StoreFinancialDocumentRequest;
use App\Http\Requests\StoreSetupProposalRequest;
use App\Http\Requests\VerifyFinancialDocumentRequest;
use App\Models\SetupFinancialDocuments;
use App\Repositories\Contracts\ProposalModule\SetupFinancialDocumentRepositoryInterface;
use App\Services\Contracts\ProposalModule\SetupProposalServiceInterface;
use Illuminate\Http\Request;

class SetupProposalController extends Controller
{
    public function __construct(protected SetupProposalServiceInterface $setupProposalService){}

    public function createSetupProposal(StoreSetupProposalRequest $request){
        $setup = $this->setupProposalService->createSetupProposal($request->validated());
        return response()->json([
            'message'  => 'Setup Proposal Created Successfully',
            'data' => $setup,
        ],201);
    }

    public function uploadFinancialDocument(StoreFinancialDocumentRequest $request){
        $setup = $this->setupProposalService->uploadFinancialDocument($request->validated());
        return response()->json([
            'message' => 'Setup Financial Documents Created Successfully',
            'data' => $setup
        ],200);
    }

    public function addEquipmentQuotation(StoreEquipmentQuotationRequest $request){
        $setup = $this->setupProposalService->addEquipmentQuotation($request->validated());
        return response()->json([
            'message' => 'Setup Equipment Quotation Created Successfully',
            'data' => $setup
        ],200);
    }

    public function verifyFinancialDocuments(VerifyFinancialDocumentRequest $request, SetupFinancialDocuments $setupFinancial){
        $updated = $this->setupProposalService->verifyFinancialDocuments($setupFinancial->id(),$request->validated()['verified'],$request->validated()['remarks']);
        return response()->json([
            'message' => 'Financial Documents Updated',
            'data' => $updated
        ],200);
    }

    public function getSetupProposalDetails(int $proposalId){
        $proposal = $this->setupProposalService->getSetupProposalDetails($proposalId);
        return response()->json([
            'data' => $proposal
        ],200);
    }

    public function getFinancialDocuments(int $setupProposalId){
        $setupProposal = $this->setupProposalService->getFinancialDocuments($setupProposalId);
        return response()->json([
            'data' => $setupProposal
        ],200);
    }

    public function getEquipmentQuotations(int $setupProposalId){
        $setupProposal = $this->setupProposalService->getEquipmentQuotations($setupProposalId);
        return response()->json([
            'data' => $setupProposal
        ],200);
    }
}
