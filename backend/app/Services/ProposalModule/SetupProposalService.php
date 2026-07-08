<?php

namespace App\Services\ProposalModule;

use App\Models\SetupEquipmentQuotation;
use App\Models\SetupFinancialDocuments;
use App\Models\SetupProposal;
use App\Repositories\Contracts\ProposalModule\SetupEquipmentQuotationRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\SetupFinancialDocumentRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\SetupProposalRepositoryInterface;
use App\Services\Contracts\ProposalModule\SetupProposalServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Override;

class SetupProposalService implements SetupProposalServiceInterface{
    public function __construct(
        protected SetupProposalRepositoryInterface $setupProposalRepository,
        protected SetupFinancialDocumentRepositoryInterface $setupFinancialDocument,
        protected SetupEquipmentQuotationRepositoryInterface $setupEquipmentQuotation,
    ){}

    #[Override]
    public function createSetupProposal(array $data): SetupProposal
    {
        return $this->setupProposalRepository->create($data);
    }

    #[Override]
    public function uploadFinancialDocument(array $data): SetupFinancialDocuments
    {
        return $this->setupFinancialDocument->create($data);
    }

    #[Override]
    public function addEquipmentQuotation(array $data): SetupEquipmentQuotation
    {
        return $this->setupEquipmentQuotation->create($data);
    }

    #[Override]
    public function verifyFinancialDocuments(int $documentId, bool $verified, ?string $remarks = null): SetupFinancialDocuments
    {
        $document = $this->setupFinancialDocument->findById($documentId);
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

    #[Override]
    public function getEquipmentQuotations(int $setupProposalId): Collection
    {
        return $this->setupEquipmentQuotation->findBySetupProposalId($setupProposalId);
    }

    #[Override]
    public function getSetupProposalDetails(int $proposalId): ?SetupProposal
    {
        return $this->setupProposalRepository->findByProposalId($proposalId);
    }

    #[Override]
    public function getFinancialDocuments(int $setupProposalId): Collection
    {
        return $this->setupFinancialDocument->findBySetupProposalId($setupProposalId);
    }
}
