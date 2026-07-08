<?php

namespace App\Repositories\ProposalModule;

use App\Models\GiaDocument;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProposalModule\GiaDocumentRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Override;

class GiaDocumentRepository extends BaseRepository implements GiaDocumentRepositoryInterface{
    #[Override]
    public function __construct(GiaDocument $model)
    {
        parent::__construct($model);
    }

    #[Override]
    public function findByGiaProposalId(int $giaProposalId): Collection
    {
        return $this->model->newQuery()->where("gia_proposal_id",$giaProposalId)->get();
    }

    #[Override]
    public function findUnverified(): Collection
    {
        return $this->model->newQuery()->where("is_verified",false)->get();
    }
}
