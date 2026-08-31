<?php

namespace App\Repositories\Contracts\ProjectModule;

use Illuminate\Database\Eloquent\Collection;

interface ProjectRepositoryInterface{
    public function createByProposal(array $data);
    public function findByProposalId(int $proposalId): Collection;
}
