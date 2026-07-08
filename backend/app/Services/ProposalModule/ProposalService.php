<?php

namespace App\Services\ProposalModule;

use App\Models\Proposal;
use App\Repositories\Contracts\ProposalModule\ProposalRepositoryInterface;
use App\Services\Contracts\ProposalModule\ProposalServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Override;

class ProposalService implements ProposalServiceInterface{

    public function __construct(protected ProposalRepositoryInterface $proposalRepository){}

    #[Override]
    public function submit(array $data): Proposal
    {
        return $this->proposalRepository->create($data);
    }

    #[Override]
    public function advanceStage(int $proposalId, string $newStatus, string $newStage): Proposal
    {
        $updated = $this->proposalRepository->updateStatus($proposalId,$newStatus,$newStage);

        if(! $updated){
            abort(404,'Proposal not Found');
        }

        return $this->proposalRepository->findById($proposalId);
    }

    #[Override]
    public function disapprove(int $proposalId, ?string $remarks): Proposal
    {
        return $this->advanceStage($proposalId,'DISAPPROVED','DISAPPROVED');
    }

    #[Override]
    public function approve(int $proposalId, ?string $remarks = null): Proposal
    {
        return $this->advanceStage($proposalId,'APPROVED','APPROVED');
    }

    #[Override]
    public function getByReferenceNumber(string $referenceNumber): ?Proposal
    {
        return $this->proposalRepository->findByReferenceNumber($referenceNumber);
    }

    #[Override]
    public function getSubmitterProposals(int $userId): Collection
    {
        return $this->proposalRepository->findBySubmitter($userId);
    }
}
