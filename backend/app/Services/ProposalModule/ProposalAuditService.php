<?php

namespace App\Services\ProposalModule;

use App\Repositories\Contracts\ProposalModule\ProposalAuditRepositoryInterface;
use App\Services\Contracts\ProposalModule\ProposalAuditServiceInterface;
use Illuminate\Support\Collection;
use Override;

class ProposalAuditService implements ProposalAuditServiceInterface{
    public function __construct(protected ProposalAuditRepositoryInterface $proposalAuditRepository)
    {
    }

    #[Override]
    public function getByProposalId(int $proposalId): Collection
    {
        return $this->proposalAuditRepository->findByProposalId($proposalId);
    }
}
