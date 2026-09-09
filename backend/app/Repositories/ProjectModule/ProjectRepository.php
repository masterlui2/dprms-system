<?php

namespace App\Repositories\ProjectModule;

use App\Models\Project;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProjectModule\ProjectRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Override;

class ProjectRepository extends BaseRepository implements ProjectRepositoryInterface{
    public function __construct(Project $model)
    {
        parent::__construct($model);
    }

    #[Override]
    public function createByProposal(array $data)
    {
        return $this->model->newQuery()->create($data);
    }

    #[Override]
    public function findByProposalId(int $proposalId): Collection
    {
        return $this->model->newQuery()->where("proposal_id",$proposalId)->get();
    }

    #[Override]
    public function allWhere(?string $status = null, array $relation = []): Collection
    {
        $query = $this->model->newQuery();
        if ($status) {
            if (in_array(strtoupper($status), ['SETUP', 'GIA'], true)) {
                $query->where('program_type', strtoupper($status));
            } else {
                $query->where('status', strtolower($status));
            }
        }
        return $query->with($relation)->get();
    }
}
