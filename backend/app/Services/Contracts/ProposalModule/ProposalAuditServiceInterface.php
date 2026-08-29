<?php

namespace App\Services\Contracts\ProposalModule;

use Illuminate\Support\Collection;

interface ProposalAuditServiceInterface{
    public function getByProposalId(int $proposalId): Collection;
}
