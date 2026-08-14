<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProposalModule\GiaProposalSubmissionRequest;
use App\Services\Contracts\ProposalModule\GiaSubmissionServiceInterface;
use Illuminate\Http\Request;

class GiaProposalSubmissionController extends Controller
{
    public function __construct(protected GiaSubmissionServiceInterface $giaProposalService)
    {
    }

    public function store(GiaProposalSubmissionRequest $request){
        $result = $this->giaProposalService->submit($request->validated());
        return response()->json([
            'message' => 'Gia Proposal Submitted Successfully',
            'data' => $result
        ],201);
    }
}
