<?php

namespace App\Repositories\Contracts\ProposalModule;

use App\Models\Proposal;
use App\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface ProposalRepositoryInterface extends BaseRepositoryInterface{
    public function findByReferenceNumber(string $referenceNumber): ?Proposal;
    public function findBySubmitter(int $userId): Collection;
    public function findByStatus(string $status): Collection;
    public function updateStatus(int $id, string $status, ?string $remarks = null): bool;
    public function findIndex(array $with=[]):Collection;
    public function assignProjectStaff(int $userId, int $proposalId): bool;
}
