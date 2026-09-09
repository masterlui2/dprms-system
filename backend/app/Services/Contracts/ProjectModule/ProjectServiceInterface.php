<?php

namespace App\Services\Contracts\ProjectModule;

use App\Models\Proposal;
use Illuminate\Support\Collection;

interface ProjectServiceInterface{
    public function createFromProposal(Proposal $proposal, ?string $notes = null);
    public function getByProposalId(int $proposalId);
    public function getIndex(string $status):Collection;
}
