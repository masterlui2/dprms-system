<?php

namespace App\Repositories\Contracts\ProposalModule;

use App\Models\SetupFinancialDocuments;
use App\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface SetupFinancialDocumentRepositoryInterface extends BaseRepositoryInterface{
    public function findBySetupProposalId(int $setupProposalId): Collection;
    public function findUnverified(): Collection;
}
