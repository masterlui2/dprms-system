<?php

namespace App\Repositories\Contracts\ProposalModule;

use App\Models\SetupProposal;
use App\Repositories\Contracts\BaseRepositoryInterface;

interface SetupProposalRepositoryInterface extends BaseRepositoryInterface{
    public function findByProposalId(int $proposalId): ?SetupProposal;
}

