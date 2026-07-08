<?php

namespace App\Repositories\ProposalModule;

use App\Models\SetupFinancialDocuments;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProposalModule\SetupFinancialDocumentRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Override;

class SetupFinancialDocumentRepository extends BaseRepository implements SetupFinancialDocumentRepositoryInterface{
    #[Override]
    public function __construct(SetupFinancialDocuments $model)
    {
        parent::__construct($model);
    }

    #[Override]
    public function findBySetupProposalId(int $setupProposalId): Collection
    {
        return $this->model->newQuery()->where("setup_proposal_id",$setupProposalId)->get();
    }

    #[Override]
    public function findUnverified(): Collection
    {
        return $this->model->newQuery()->where("is_verified",false)->get();
    }
}
