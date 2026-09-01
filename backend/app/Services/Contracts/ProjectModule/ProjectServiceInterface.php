<?php

namespace App\Services\Contracts\ProjectModule;

use App\Models\Proposal;

interface ProjectServiceInterface{
    public function createFromProposal(Proposal $proposal, ?string $notes = null);
    public function getByProposalId(int $proposalId);
}
