<?php

namespace App\Repositories\ProposalModule;

use App\Models\ProposalTemplate;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProposalModule\ProposalTemplateRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Override;

class ProposalTemplateRequirementRepository extends BaseRepository implements ProposalTemplateRepositoryInterface{
    #[Override]
    public function __construct(ProposalTemplate $model)
    {
        parent::__construct($model);
    }

    #[Override]
    public function findByProgramType(string $programType): Collection
    {
        return $this->model->newQuery()->where("program_type",$programType)->get();
    }

    #[Override]
    public function findByUploader(int $userId): Collection
    {
        return $this->model->newQuery()->where("uploaded_by",$userId)->get();
    }
}
