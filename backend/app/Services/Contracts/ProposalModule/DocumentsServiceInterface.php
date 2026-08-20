<?php

namespace App\Services\Contracts\ProposalModule;

use App\Models\Document;
use Illuminate\Database\Eloquent\Collection;

interface DocumentsServiceInterface{
    public function getDocumentsByProposalId(int $proposalId): Collection;
    public function getDocumentsByDocumentTypeId(int $documentTypeId): Collection;
    public function uploadDocuments(array $data): Document;
    public function updateDocuments(int $id, array $data): Document;
    public function deleteDocuments(int $id): bool;
    public function getForOwner(int $proposalId): Collection;
    public function getOneForOwner(int $documentId): Document;
}
