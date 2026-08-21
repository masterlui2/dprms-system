<?php

namespace App\Repositories\ProposalModule;

use App\Models\Document as ModelsDocument;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProposalModule\DocumentsRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Override;

class DocumentsRepository extends BaseRepository implements DocumentsRepositoryInterface{
    public function __construct(ModelsDocument $model)
    {
        parent::__construct($model);
    }

    #[Override]
    public function findByDocumentTypeId(int $documentTypeId): Collection
    {
        return $this->model->newQuery()->where("document_type_id",$documentTypeId)->get();
    }

    #[Override]
    public function findByProposalId(int $proposalId): Collection
    {
        return $this->model->newQuery()->where("proposal_id",$proposalId)->get();
    }

    #[Override]
    public function findForOwner(int $userId , array $filters = []): Collection
    {
        return $this->model->newQuery()->where('uploaded_by', $userId)->where($filters)->get();
    }

    #[Override]
    public function findOneForOwner(int $documentId, int $userId): ?ModelsDocument
    {
        return $this->model->newQuery()->where('uploaded_by', $userId)->where('id',$documentId)->first();
    }
}
