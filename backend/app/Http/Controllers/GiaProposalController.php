<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGiaCoAuthorRequest;
use App\Http\Requests\StoreGiaDocumentRequest;
use App\Http\Requests\StoreGiaProposalRequest;
use App\Http\Requests\VerifyGiaDocumentRequest;
use App\Models\GiaDocument;
use App\Services\Contracts\ProposalModule\GiaProposalServiceInterface;
use Illuminate\Http\Request;

class GiaProposalController extends Controller
{
    public function __construct(protected GiaProposalServiceInterface $giaProposalService)
    {}

    public function createGiaProposal(StoreGiaProposalRequest $request){
        $gia = $this->giaProposalService->createGiaProposal($request->validated());
        return response()->json([
            'message' => 'Proposal Created Successful',
            'data' => $gia,
        ],201);
    }

    public function uploadDocument(StoreGiaDocumentRequest $request){
        $gia = $this->giaProposalService->uploadDocument($request->validated());
        return response()->json([
            'message' => 'Document Created Successful',
            'data' => $gia,
        ],201);
    }

    public function addCoAuthor(StoreGiaCoAuthorRequest $request){
        $gia = $this->giaProposalService->addCoAuthor($request->validated());
        return response()->json([
            'message' => 'CoAuthor Created Successful',
            'data' => $gia,
        ],201);
    }

    public function verifyDocument(VerifyGiaDocumentRequest $request, GiaDocument $document){
        $gia = $this->giaProposalService->verifyDocument($document->id(),$request->validated()['verified'],$request->validated()['remarks']);
        return response()->json([
            'data' => $gia,
        ],200);
    }
}
