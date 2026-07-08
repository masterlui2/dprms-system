<?php

namespace App\Repositories\Contracts\ProposalModule;

use App\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface DocumentRequirementRepositoryInterface extends BaseRepositoryInterface
{
    public function findByProgramType(string $programType): Collection;
}
