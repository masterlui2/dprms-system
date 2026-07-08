<?php

namespace App\Repositories\ProposalModule;

use App\Models\GiaCoAuthor;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProposalModule\GiaCoAuthorRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Override;

class GiaCoAuthorRepository extends BaseRepository implements GiaCoAuthorRepositoryInterface{
    #[Override]
    public function __construct(GiaCoAuthor $model)
    {
        parent::__construct($model);
    }

    #[Override]
    public function findByGiaProposalId(int $giaProposalId): Collection
    {
        return $this->model->newQuery()->where("gia_proposal_id",$giaProposalId)->get();
    }
}
