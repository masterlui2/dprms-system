<?php

namespace App\Repositories\ProposalModule;

use App\Models\DocumentChecklistTemplate;
use App\Models\ProposalChecklistHistory;
use App\Models\ProposalChecklistReview;
use App\Models\ProposalChecklistSummary;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProposalModule\DocumentChecklistRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Override;

class DocumentChecklistRepository extends BaseRepository implements DocumentChecklistRepositoryInterface
{
    public function __construct(DocumentChecklistTemplate $template)
    {
        parent::__construct($template);
    }

    #[Override]
    public function getTemplatesByProgram(string $programType): Collection
    {
        return DocumentChecklistTemplate::query()
            ->where('program_type', $programType)
            ->where('is_active', true)
            ->orderBy('sort_order', 'asc')
            ->get();
    }

    #[Override]
    public function getReviewsByProposalId(int $proposalId): Collection
    {
        return ProposalChecklistReview::query()
            ->with(['document', 'reviewer', 'templateItem'])
            ->where('proposal_id', $proposalId)
            ->get();
    }

    #[Override]
    public function findReview(int $proposalId, int $templateItemId): ?ProposalChecklistReview
    {
        return ProposalChecklistReview::query()
            ->with(['document', 'reviewer', 'templateItem'])
            ->where('proposal_id', $proposalId)
            ->where('template_item_id', $templateItemId)
            ->first();
    }

    #[Override]
    public function updateOrCreateReview(int $proposalId, int $templateItemId, array $data): ProposalChecklistReview
    {
        return ProposalChecklistReview::query()->updateOrCreate(
            [
                'proposal_id' => $proposalId,
                'template_item_id' => $templateItemId,
            ],
            $data
        );
    }

    #[Override]
    public function getSummary(int $proposalId): ?ProposalChecklistSummary
    {
        return ProposalChecklistSummary::query()
            ->with('completedByUser')
            ->where('proposal_id', $proposalId)
            ->first();
    }

    #[Override]
    public function updateOrCreateSummary(int $proposalId, array $data): ProposalChecklistSummary
    {
        return ProposalChecklistSummary::query()->updateOrCreate(
            ['proposal_id' => $proposalId],
            $data
        );
    }

    #[Override]
    public function getHistories(int $proposalId): Collection
    {
        return ProposalChecklistHistory::query()
            ->with('user')
            ->where('proposal_id', $proposalId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    #[Override]
    public function createHistory(array $data): ProposalChecklistHistory
    {
        return ProposalChecklistHistory::query()->create($data);
    }
}
