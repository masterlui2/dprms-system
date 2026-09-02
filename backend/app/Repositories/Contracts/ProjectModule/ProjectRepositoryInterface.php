<?php

namespace App\Repositories\Contracts\ProjectModule;

use App\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface ProjectRepositoryInterface extends BaseRepositoryInterface{
    public function createByProposal(array $data);
    public function findByProposalId(int $proposalId): Collection;
}
