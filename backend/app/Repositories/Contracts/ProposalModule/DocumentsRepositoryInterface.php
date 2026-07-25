<?php

namespace App\Repositories\Contracts\ProposalModule;

use App\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface DocumentsRepositoryInterface extends BaseRepositoryInterface{
    public function findByProposalId(int $proposalId): Collection;
    public function findByDocumentTypeId(int $documentTypeId): Collection;
}
