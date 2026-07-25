<?php

namespace App\Repositories\ProposalModule;

use App\Models\Document as ModelsDocument;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProposalModule\DocumentsRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Override;

class DocumentsRepository extends BaseRepository implements DocumentsRepositoryInterface{
    #[Override]
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
}
