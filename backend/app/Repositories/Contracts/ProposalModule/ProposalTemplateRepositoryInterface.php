<?php

namespace App\Repositories\Contracts\ProposalModule;

use App\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface ProposalTemplateRepositoryInterface extends BaseRepositoryInterface
{
    public function findByUploader(int $userId): Collection;
    public function findByProgramType(string $programType): Collection;
}
