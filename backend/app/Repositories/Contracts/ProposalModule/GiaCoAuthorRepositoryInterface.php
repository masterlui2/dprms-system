<?php

namespace App\Repositories\Contracts\ProposalModule;

use App\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface GiaCoAuthorRepositoryInterface extends BaseRepositoryInterface
{
    public function findByGiaProposalId(int $giaProposalId): Collection;
}
