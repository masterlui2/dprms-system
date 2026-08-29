<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdvanceStageRequest;
use App\Http\Requests\AssignOfficerRequest;
use App\Http\Requests\ProposalApproveRequest;
use App\Http\Requests\ProposalDisapproveRequest;
use App\Http\Requests\ProposalReviewDecisionRequest;
use App\Http\Requests\ReturnProposalForRevisionRequest;
use App\Http\Requests\StoreProposalRequest;
use App\Http\Requests\UpdateProposalStatusRequest;
use App\Models\Proposal;
use App\Services\Contracts\ProposalModule\ProposalServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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

    public function reviewDecision(ProposalReviewDecisionRequest $request, int $proposalId)
    {
        $proposal = $this->proposalService->reviewDecision($proposalId, $request->validated());

        return response()->json([
            'message' => 'Review decision processed successfully',
            'data' => $proposal,
        ], 200);
    }

    public function assignOfficer(AssignOfficerRequest $request, int $proposalId)
    {
        $proposal = $this->proposalService->assignOfficers($proposalId, $request->validated());

        return response()->json([
            'message' => 'Officer assigned successfully',
            'data' => $proposal,
        ], 200);
    }



    public function advanceStage(AdvanceStageRequest $request, int $id){
        $updated = $this->proposalService->advanceStage(
            $id,
            $request->validated('status'),
            $request->validated('remarks'),
        );

        return response()->json([
            'message' => 'Proposal Status Updated',
            'data' => $updated
        ],200);
    }

    public function approve(int $id, ProposalApproveRequest $request){
        $this->proposalService->approve($id,$request->validated()['remarks'] ?? null);
        return response()->json([
            'message' => 'Proposal was Approved',
        ],200);
    }

    public function disapprove(int $id, ProposalDisapproveRequest $request){
        $this->proposalService->disapprove($id,$request->validated()['remarks']);
        return response()->json([
            'message' => 'Proposal was Disapproved',
        ],200);
    }

    public function getByReferenceNumber(string $referenceNumber){
        $proposal = $this->proposalService->getByReferenceNumber($referenceNumber);
        abort_unless($proposal, 404, 'Proposal not found.');

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

    public function index(){
        return response()->json([
            'data' => $this->proposalService->getIndex()
        ],200);
    }

    public function resubmit(Proposal $proposal){
        abort_unless($proposal->submitted_by === Auth::id(), 403);
        abort_unless($proposal->status === 'RETURNED', 422, 'Only returned proposals can be resubmitted.');

        $hasFlaggedDocuments = $proposal->documents()
            ->where('status', 'returned_for_revision')
            ->whereHas('document_type', fn ($query) => $query->where('is_applicant_visible', true))
            ->exists();

        abort_if($hasFlaggedDocuments, 422, 'Replace every document marked for revision before resubmitting.');

        $updated = $this->proposalService->advanceStage(
            $proposal->id,
            'UNDER_VALIDATION',
        );

        return response()->json([
            'message' => 'Revised proposal returned to the review queue.',
            'data' => $updated,
        ]);
    }

    public function returnForRevision(
        ReturnProposalForRevisionRequest $request,
        Proposal $proposal,
    ) {
        $hasFlaggedDocuments = $proposal->documents()
            ->where('status', 'returned_for_revision')
            ->whereHas('document_type', fn ($query) => $query->where('is_applicant_visible', true))
            ->exists();

        abort_unless(
            $hasFlaggedDocuments,
            422,
            'Flag at least one applicant document and add its revision instructions before returning the proposal.',
        );

        $updated = $this->proposalService->advanceStage(
            $proposal->id,
            'RETURNED',
            $request->validated('remarks'),
        );

        return response()->json([
            'message' => 'Proposal returned to the applicant for revision.',
            'data' => $updated,
        ]);
    }

    public function assignProjectStaff(int $proposalId){
        return response()->json([
            'message' => 'Project Staff assigned',
            'data' => $this->proposalService->assignProjectStaff($proposalId),
        ],201);
    }

    public function update(int $proposalId, UpdateProposalStatusRequest $request){
        $updated = $this->proposalService->advanceStage(
            $proposalId,
            $request->validated('status'),
            $request->validated('remarks'),
        );

        return response()->json([
            'message' => 'Proposal Status Updated',
            'data' => $updated,
        ], 200);
    }
}
