<?php

namespace App\Repositories\Contracts\ProposalModule;

use App\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface SetupEquipmentQuotationRepositoryInterface extends BaseRepositoryInterface{
    public function findBySetupProposalId(int $setupProposalId): Collection;
}
