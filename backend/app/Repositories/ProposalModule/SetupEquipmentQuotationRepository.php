<?php

namespace App\Repositories\ProposalModule;

use App\Models\SetupEquipmentQuotation;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProposalModule\SetupEquipmentQuotationRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Override;

class SetupEquipmentQuotationRepository extends BaseRepository implements SetupEquipmentQuotationRepositoryInterface{
    #[Override]
    public function __construct(SetupEquipmentQuotation $model)
    {
        parent::__construct($model);
    }

    #[Override]
    public function findBySetupProposalId(int $setupProposalId): Collection
    {
        return $this->model->newQuery()->where("setup_proposal_id",$setupProposalId)->get();
    }
}
