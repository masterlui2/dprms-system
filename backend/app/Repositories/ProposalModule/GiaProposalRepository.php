<?php

namespace App\Repositories\ProposalModule;

use App\Models\GiaProposal;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProposalModule\GiaProposalRepositoryInterface;
use Illuminate\Database\Eloquent\Model;
use Override;

class GiaProposalRepository extends BaseRepository implements GiaProposalRepositoryInterface{
    #[Override]
    public function __construct(GiaProposal $model)
    {
        parent::__construct($model);
    }

    #[Override]
    public function findByProposalId(int $proposalId): ?GiaProposal
    {
        return $this->model->newQuery()->where("proposal_id",$proposalId)->first();
    }
}
