<?php

namespace App\Services\Contracts\ProposalModule;

use App\Models\Proposal;
use Illuminate\Database\Eloquent\Collection;

interface ProposalServiceInterface{
    public function submit(array $data): Proposal;
    public function advanceStage(int $proposalId, string $newStatus, ?string $remarks = null): Proposal;
    public function approve(int $proposalId, ?string $remarks=null): Proposal;
    public function disapprove(int $proposalId, string $remarks): Proposal;
    public function getByReferenceNumber(string $referenceNumber): ?Proposal;
    public function getSubmitterProposals(int $userId): Collection;
    public function getIndex(): Collection;
    public function assignProjectStaff(int $proposalId): Proposal;
    public function reviewDecision(int $proposalId, array $data): Proposal;
    public function update(int $proposalId, array $data): Proposal;
    public function delete(int $proposalId, ?string $remarks = null): bool;
}

