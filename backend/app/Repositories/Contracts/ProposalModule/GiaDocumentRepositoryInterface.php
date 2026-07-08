<?php

namespace App\Repositories\Contracts\ProposalModule;

use App\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface GiaDocumentRepositoryInterface extends BaseRepositoryInterface{
    public function findByGiaProposalId(int $giaProposalId): Collection;
    public function findUnverified(): Collection;
}
