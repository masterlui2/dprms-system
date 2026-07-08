<?php

namespace App\Repositories\ProposalModule;

use App\Models\DocumentRequirement;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProposalModule\DocumentRequirementRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Override;

class DocumentRequirementRepository extends BaseRepository implements DocumentRequirementRepositoryInterface{
    #[Override]
    public function __construct(DocumentRequirement $model)
    {
        parent::__construct($model);
    }

    #[Override]
    public function findByProgramType(string $programType): Collection
    {
        return $this->model->newQuery()->where("program_type",$programType)->get();
    }
}
