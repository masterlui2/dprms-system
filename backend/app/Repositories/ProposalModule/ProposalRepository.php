<?php

namespace App\Repositories\ProposalModule;

use App\Models\Proposal;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProposalModule\ProposalRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Override;

class ProposalRepository extends BaseRepository implements ProposalRepositoryInterface{
    public function __construct(Proposal $model)
    {
        parent::__construct($model);
    }

    #[Override]
    public function findByReferenceNumber(string $referenceNumber): ?Proposal
    {
        return $this->model->newQuery()->where("reference_number",$referenceNumber)->first();
    }

    #[Override]
    public function findBySubmitter(int $userId): Collection
    {
        return $this->model->newQuery()->where("submitted_by",$userId)->get();
    }

    #[Override]
    public function findByStatus(string $status): Collection
    {
        return $this->model->newQuery()->where("status",$status)->get();
    }

    #[Override]
    public function updateStatus(int $id, string $status, string $currentStage): bool
    {
        $user = $this->model->newQuery()->find($id);

        if(! $user){
            return false;
        }

        $user->status = $status;
        $user->current_stage = $currentStage;
        return $user->save();
    }
}
