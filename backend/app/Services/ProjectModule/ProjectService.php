<?php

namespace App\Services\ProjectModule;

use App\Models\Project;
use App\Models\Proposal;
use App\Repositories\Contracts\ProjectModule\ProjectRepositoryInterface;
use App\Services\Contracts\ProjectModule\ProjectServiceInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Override;

class ProjectService implements ProjectServiceInterface{
    public function __construct(protected ProjectRepositoryInterface $projectRepository)
    {
    }

    #[Override]
    public function createFromProposal(Proposal $proposal):Project
    {
        return $this->projectRepository->createByProposal([
            'proposal_id' => $proposal->id,
            'created_by' => $proposal->submitted_by,
            'approved_by' => Auth::id(),
            'program_type' => $proposal->program_type,
            'status' => 'active',
            'approved_at' => now(),
        ]);
    }

    #[Override]
    public function getByProposalId(int $proposalId)
    {
        return $this->projectRepository->findByProposalId($proposalId);
    }

    #[Override]
    public function getIndex(): Collection
    {
        return $this->projectRepository->all(['proposal','proposal.setup_proposal','user','approved_by']);
    }
}
