<?php

namespace App\Services\Contracts\ProposalModule;

use App\Models\SetupEquipmentQuotation;
use App\Models\SetupFinancialDocuments;
use App\Models\SetupProposal;
use Illuminate\Database\Eloquent\Collection;

interface SetupProposalServiceInterface{
    public function createSetupProposal(array $data): SetupProposal;
    public function uploadFinancialDocument(array $data): SetupFinancialDocuments;
    public function addEquipmentQuotation(array $data): SetupEquipmentQuotation;
    public function verifyFinancialDocuments(int $documentId, bool $verified, ?string $remarks=null): SetupFinancialDocuments;
    public function getSetupProposalDetails(int $proposalId): ?SetupProposal;
    public function getFinancialDocuments(int $setupProposalId): Collection;
    public function getEquipmentQuotations(int $setupProposalId): Collection;
}
