<?php

namespace App\Repositories\Contracts\ProposalModule;

use App\Models\GiaProposal;
use App\Repositories\Contracts\BaseRepositoryInterface;

interface GiaProposalRepositoryInterface extends BaseRepositoryInterface{
    public function findByProposalId (int $proposalId): ?GiaProposal;
}
