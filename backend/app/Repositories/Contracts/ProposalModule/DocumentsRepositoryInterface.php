<?php

namespace App\Repositories\Contracts\ProposalModule;

use App\Models\Document;
use App\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface DocumentsRepositoryInterface extends BaseRepositoryInterface{
    public function findByProposalId(int $proposalId): Collection;
    public function findByDocumentTypeId(int $documentTypeId): Collection;
    public function findForOwner(int $userId, array $filters): Collection;
    public function findOneForOwner(int $documentId, int $userId): ?Document;
}
