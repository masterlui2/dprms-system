<?php

namespace App\Services\ProjectModule;

use App\Models\Project;
use App\Models\Proposal;
use App\Repositories\Contracts\ProjectModule\ProjectRepositoryInterface;
use App\Services\Contracts\ProjectModule\ProjectServiceInterface;
use Illuminate\Support\Facades\Auth;
use Override;

class ProjectService implements ProjectServiceInterface{
    public function __construct(protected ProjectRepositoryInterface $projectRepository)
    {
    }

    #[Override]
    public function createFromProposal(Proposal $proposal, ?string $notes = null):Project
    {
        return $this->projectRepository->createByProposal([
            'proposal_id' => $proposal->id,
            'created_by' => $proposal->submitted_by,
            'approved_by' => Auth::id(),
            'program_type' => $proposal->program_type,
            'status' => 'active',
            'notes' => $notes,
            'approved_at' => now(),
        ]);
    }

    #[Override]
    public function getByProposalId(int $proposalId)
    {
        return $this->projectRepository->findByProposalId($proposalId);
    }
}
