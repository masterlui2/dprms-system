<?php

namespace App\Repositories\Contracts\ProposalModule;

use App\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Support\Collection;

interface ProposalAuditRepositoryInterface extends BaseRepositoryInterface{
    public function findByProposalId(int $proposalId): Collection;
}
