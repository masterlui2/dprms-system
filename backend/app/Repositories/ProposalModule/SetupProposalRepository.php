<?php

namespace App\Repositories\ProposalModule;

use App\Models\SetupProposal;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProposalModule\SetupProposalRepositoryInterface;
use Illuminate\Database\Eloquent\Model;
use Override;

class SetupProposalRepository extends BaseRepository implements SetupProposalRepositoryInterface{
    #[Override]
    public function __construct(SetupProposal $model)
    {
        parent::__construct($model);
    }

    #[Override]
    public function findByProposalId(int $proposalId): ?SetupProposal
    {
        return $this->model->newQuery()->where("proposal_id",$proposalId)->first();
    }
}
