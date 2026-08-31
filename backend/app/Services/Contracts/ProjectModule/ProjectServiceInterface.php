<?php

namespace App\Services\Contracts\ProjectModule;

use App\Models\Proposal;
use Illuminate\Support\Collection;

interface ProjectServiceInterface{
    public function createFromProposal(Proposal $proposal);
    public function getByProposalId(int $proposalId);
    public function getIndex():Collection;
}
