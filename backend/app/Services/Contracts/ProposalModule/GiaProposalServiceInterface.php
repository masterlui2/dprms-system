<?php

namespace App\Services\Contracts\ProposalModule;

use App\Models\GiaCoAuthor;
use App\Models\GiaDocument;
use App\Models\GiaProposal;

interface GiaProposalServiceInterface{
    public function createGiaProposal(array $data): GiaProposal;
    public function uploadDocument(array $data): GiaDocument;
    public function addCoAuthor(array $data): GiaCoAuthor;
    public function verifyDocument(int $documentId, bool $verified, ?string $remarks=null): GiaDocument;
    public function getGiaProposalDetails(int $proposalId): ?GiaProposal;
}
