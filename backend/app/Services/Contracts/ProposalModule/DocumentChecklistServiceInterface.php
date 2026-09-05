<?php

namespace App\Services\Contracts\ProposalModule;

use App\Models\ProposalChecklistHistory;
use App\Models\ProposalChecklistReview;
use App\Models\ProposalChecklistSummary;
use Illuminate\Database\Eloquent\Collection;

interface DocumentChecklistServiceInterface
{
    public function getChecklistTemplates(string $programType): Collection;

    public function getProposalChecklist(int $proposalId): array;

    public function updateItemReview(int $proposalId, int $templateItemId, array $data, int $userId): ProposalChecklistReview;

    public function batchSaveReviews(int $proposalId, array $payload, int $userId): array;

    public function completeReview(int $proposalId, ?string $finalRemarks, int $userId): ProposalChecklistSummary;

    public function getChecklistHistory(int $proposalId): Collection;

    public function logActivity(int $proposalId, int $userId, string $action, ?string $itemName, ?string $fileName, ?string $details = null, ?array $metadata = null): ProposalChecklistHistory;
}
