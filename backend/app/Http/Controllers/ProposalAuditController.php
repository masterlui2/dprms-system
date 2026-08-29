<?php

namespace App\Http\Controllers;

use App\Services\Contracts\ProposalModule\ProposalAuditServiceInterface;
use Illuminate\Http\Request;

class ProposalAuditController extends Controller
{
    public function __construct(protected ProposalAuditServiceInterface $proposalAuditService)
    {

    }

    public function index(int $proposalId){
        return response()->json([
            "message" => "Proposal Audit Sent",
            "data" => $this->proposalAuditService->getByProposalId($proposalId)
        ],200);
    }
}
