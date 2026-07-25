<?php

namespace App\Services\ProposalModule;

use App\Models\Document;
use App\Repositories\Contracts\ProposalModule\DocumentsRepositoryInterface;
use App\Services\Contracts\ProposalModule\DocumentsServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Override;

class DocumentsService implements DocumentsServiceInterface{
    public function __construct(protected DocumentsRepositoryInterface $documentsRepository)
    {
    }

    #[Override]
    public function getDocumentsByDocumentTypeId(int $documentTypeId): Collection
    {
        return $this->documentsRepository->findByDocumentTypeId($documentTypeId);
    }

    #[Override]
    public function getDocumentsByProposalId(int $proposalId): Collection
    {
        return $this->documentsRepository->findByProposalId($proposalId);
    }

    #[Override]
    public function uploadDocuments(array $data): Document
    {
        $file = $data['file'];

        return $this->documentsRepository->create([
            'proposal_id' => $data['proposal_id'],
            'document_type_id' => $data['document_type_id'],
            'uploaded_by' => Auth::id(),
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $file->store('document'),
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'status' => 'pending'
        ]);
    }

    #[Override]
    public function updateDocuments(int $id, array $data): Document
    {
        $record = $this->documentsRepository->findById($id);

        if(! $record){
            abort(404,"Document Not Found");
        }
        $record->update($data);

        return $record->fresh();
    }

    #[Override]
    public function deleteDocuments(int $id): bool
    {
        return $this->documentsRepository->delete($id);
    }
}
