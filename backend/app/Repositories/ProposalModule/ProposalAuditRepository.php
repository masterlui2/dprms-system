<?php

namespace App\Repositories\ProposalModule;

use App\Models\ProposalAudit;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProposalModule\ProposalAuditRepositoryInterface;
use Illuminate\Support\Collection;
use Override;

class ProposalAuditRepository extends BaseRepository implements ProposalAuditRepositoryInterface{
    public function __construct(ProposalAudit $model)
    {
        parent::__construct($model);
    }

    #[Override]
    public function findByProposalId(int $proposalId): Collection
    {
        return $this->model->newQuery()->where("proposal_id", $proposalId)->with(["reviewer","assigned_evaluator"])->get();
    }
}
