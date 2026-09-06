<?php

namespace App\Repositories\Contracts\ProposalModule;

use App\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use App\Models\ProposalChecklistReview;
use App\Models\ProposalChecklistSummary;
use App\Models\ProposalChecklistHistory;

interface DocumentChecklistRepositoryInterface extends BaseRepositoryInterface
{
    public function getTemplatesByProgram(string $programType): Collection;

    public function getReviewsByProposalId(int $proposalId): Collection;

    public function findReview(int $proposalId, int $templateItemId): ?ProposalChecklistReview;

    public function updateOrCreateReview(int $proposalId, int $templateItemId, array $data): ProposalChecklistReview;

    public function getSummary(int $proposalId): ?ProposalChecklistSummary;

    public function updateOrCreateSummary(int $proposalId, array $data): ProposalChecklistSummary;

    public function getHistories(int $proposalId): Collection;

    public function createHistory(array $data): ProposalChecklistHistory;
}
