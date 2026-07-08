<?php

namespace App\Services\ProposalModule;

use App\Models\GiaCoAuthor;
use App\Models\GiaDocument;
use App\Models\GiaProposal;
use App\Repositories\Contracts\ProposalModule\GiaCoAuthorRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\GiaDocumentRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\GiaProposalRepositoryInterface;
use App\Services\Contracts\ProposalModule\GiaProposalServiceInterface;
use Illuminate\Support\Facades\Auth;
use Override;

class GiaProposalService implements GiaProposalServiceInterface{
    public function __construct(
        protected GiaProposalRepositoryInterface $giaProposalRepositoy,
        protected GiaDocumentRepositoryInterface $giaDocumentRepository,
        protected GiaCoAuthorRepositoryInterface $giaCoAuthorRepository
    ){}

    #[Override]
    public function createGiaProposal(array $data): GiaProposal
    {
        return $this->giaProposalRepositoy->create($data);
    }

    #[Override]
    public function uploadDocument(array $data): GiaDocument
    {
        return $this->giaDocumentRepository->create($data);
    }

    #[Override]
    public function getGiaProposalDetails(int $proposalId): ?GiaProposal
    {
        return $this->giaProposalRepositoy->findById($proposalId);
    }

    #[Override]
    public function addCoAuthor(array $data): GiaCoAuthor
    {
        return $this->giaCoAuthorRepository->create($data);
    }

    #[Override]
    public function verifyDocument(int $documentId, bool $verified, ?string $remarks = null): GiaDocument
    {
        $document = $this->giaDocumentRepository->findById($documentId);
        if(! $document){
            abort(404,'Document not Found');
        }

        $document->update([
            'is_verified' => $verified,
            'verified_by' => Auth::id(),
            'verified_at' => now(),
            'verification_remarks' => $remarks
        ]);

        return $document->fresh();
    }
}
