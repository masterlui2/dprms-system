<?php

namespace App\Services\ProposalModule;

use App\Models\Document;
use App\Models\Proposal;
use App\Repositories\Contracts\ProposalModule\DocumentsRepositoryInterface;
use App\Services\Contracts\ProposalModule\DocumentsServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Override;
use Throwable;

class DocumentsService implements DocumentsServiceInterface
{
    public function __construct(protected DocumentsRepositoryInterface $documentsRepository) {}

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
        $newPath = $file->store('document');
        $existing = $this->documentsRepository->findByProposalAndDocumentType(
            (int) $data['proposal_id'],
            (int) $data['document_type_id'],
        );
        $attributes = [
            'proposal_id' => $data['proposal_id'],
            'document_type_id' => $data['document_type_id'],
            'uploaded_by' => Auth::id(),
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $newPath,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'status' => 'pending',
            'reviewed_by' => null,
            'remarks' => null,
            'reviewed_at' => null,
        ];

        try {
            if (! $existing) {
                return $this->documentsRepository->create($attributes);
            }

            $oldPath = $existing->file_path;
            $existing->update($attributes);

            if ($oldPath !== $newPath) {
                Storage::delete($oldPath);
            }

            return $existing->fresh();
        } catch (Throwable $error) {
            Storage::delete($newPath);
            throw $error;
        }
    }

    #[Override]
    public function updateDocuments(int $id, array $data): Document
    {
        $record = $this->documentsRepository->findById($id);

        if (! $record) {
            abort(404, 'Document Not Found');
        }
        $record->update($data);

        return $record->fresh();
    }

    #[Override]
    public function deleteDocuments(int $id): bool
    {
        return $this->documentsRepository->delete($id);
    }

    #[Override]
    public function getForOwner(int $proposalId): Collection
    {
        return $this->documentsRepository->findForOwner(
            Auth::id(),
            array_filter(['proposal_id' => $proposalId ?? null])
        );
    }

    #[Override]
    public function getOneForOwner(int $documentId): Document
    {
        return $this->documentsRepository->findOneForOwner(
            $documentId,
            Auth::id()
        );
    }

    #[Override]
    public function getOneForStaff(int $documentId): Document
    {
        return $this->documentsRepository->findById($documentId);
    }

    #[Override]
    public function getProjectForm(int $proposalId): Document
    {
        $proposal = Proposal::query()->findOrfail($proposalId);

        $documentTypeId = match (strtoupper($proposal->program_type)) {
            'SETUP' => 1,
            'GIA' => 2,
            default => abort(422, "Unsupported program type: {$proposal->program_type}"),
        };

        $document = $this->documentsRepository->findByProposalAndDocumentType($proposalId, $documentTypeId);
        if (! $document) {
            abort(404, 'Project proposal document not found');
        }

        return $document;
    }
}
