<?php

namespace App\Services\ProposalModule;

use App\Models\Proposal;
use App\Repositories\Contracts\ProposalModule\ProposalRepositoryInterface;
use App\Services\Contracts\ProposalModule\ProposalServiceInterface;
use App\Services\Contracts\ProposalModule\ReferenceNumberGeneratorServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Override;

class ProposalService implements ProposalServiceInterface{

    public function __construct(protected ProposalRepositoryInterface $proposalRepository,protected ReferenceNumberGeneratorServiceInterface $referenceNumberGeneratorService){}

    #[Override]
    public function submit(array $data): Proposal
    {
        return $this->proposalRepository->create([
            'submitted_by' => Auth::id(),
            'program_type' => $data['program_type'],
            'reference_number' => $this->referenceNumberGeneratorService->generate($data['program_type']),
            'title' => $data['title'],
            'status' => 'SUBMITTED',
            'submitted_at' => now(),
            'remarks' => $data['remarks'] ?? null,
        ]);
    }

    #[Override]
    public function advanceStage(int $proposalId, string $newStatus, ?string $remarks = null): Proposal
    {
        $updated = $this->proposalRepository->updateStatus($proposalId,$newStatus,$remarks);

        if(! $updated){
            abort(404,'Proposal not Found');
        }

        return $this->proposalRepository->findById($proposalId);
    }

    #[Override]
    public function disapprove(int $proposalId, ?string $remarks): Proposal
    {
        return $this->advanceStage($proposalId,'DISAPPROVED',$remarks);
    }

    #[Override]
    public function approve(int $proposalId, ?string $remarks = null): Proposal
    {
        return $this->advanceStage($proposalId,'APPROVED',$remarks);
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

    #[Override]
    public function getIndex(): Collection
    {
        return $this->proposalRepository->findIndex([
            'user',
            'setup_proposal',
            'gia_proposal'
        ]);
    }
}
