<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdvanceStageRequest;
use App\Http\Requests\ProposalApproveRequest;
use App\Http\Requests\ProposalDisapproveRequest;
use App\Http\Requests\StoreProposalRequest;
use App\Models\Proposal;
use App\Services\Contracts\ProposalModule\ProposalServiceInterface;
use Illuminate\Http\Request;

class ProposalController extends Controller
{
    public function __construct(protected ProposalServiceInterface $proposalService){}

    public function submit(StoreProposalRequest $request){
        $proposal = $this->proposalService->submit($request->validated());
        return response()->json([
            'message' => 'Proposal Created Successfully',
            'data' => $proposal
        ],201);
    }

    public function advanceStage(AdvanceStageRequest $request, Proposal $proposal){
        $updated = $this->proposalService->advanceStage($proposal->id(),$request->validated()['status'],$request->validated()['stage']);

        return response()->json([
            'message' => 'Proposal Status Updated',
            'data' => $updated
        ],200);
    }

    public function approve(Proposal $proposal, ProposalApproveRequest $request){
        $this->proposalService->approve($proposal->id(),$request->validated());
        return response()->json([
            'message' => 'Proposal was Approved',
        ],200);
    }

    public function disapprove(Proposal $proposal, ProposalDisapproveRequest $request){
        $this->proposalService->approve($proposal->id(),$request->validated());
        return response()->json([
            'message' => 'Proposal was Disapproved',
        ],200);
    }

    public function getByReferenceNumber(string $referenceNumber){
        $proposal = $this->proposalService->getByReferenceNumber($referenceNumber);
        return response()->json([
            'data' => $proposal
        ],200);
    }

    public function getSubmitterProposals(int $userId){
        $proposal = $this->proposalService->getSubmitterProposals($userId);
        return response()->json([
            'data' => $proposal
        ],200);
    }
}
