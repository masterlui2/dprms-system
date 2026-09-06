<?php

namespace App\Http\Controllers;

use App\Http\Requests\BatchSaveChecklistRequest;
use App\Http\Requests\CompleteChecklistReviewRequest;
use App\Http\Requests\ReviewChecklistItemRequest;
use App\Services\Contracts\ProposalModule\DocumentChecklistServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DocumentChecklistController extends Controller
{
    public function __construct(
        protected DocumentChecklistServiceInterface $checklistService
    ) {}

    public function getTemplates(Request $request): JsonResponse
    {
        $program = $request->query('program', 'SETUP');
        $templates = $this->checklistService->getChecklistTemplates($program);

        return response()->json([
            'status' => 'success',
            'data' => $templates,
        ]);
    }

    public function show(int $proposalId): JsonResponse
    {
        $data = $this->checklistService->getProposalChecklist($proposalId);

        return response()->json([
            'status' => 'success',
            'data' => $data,
        ]);
    }

    public function batchSave(BatchSaveChecklistRequest $request, int $proposalId): JsonResponse
    {
        $userId = Auth::id() ?? 1;
        $data = $this->checklistService->batchSaveReviews($proposalId, $request->validated(), $userId);

        return response()->json([
            'status' => 'success',
            'message' => 'Checklist reviews updated successfully',
            'data' => $data,
        ]);
    }

    public function reviewItem(ReviewChecklistItemRequest $request, int $proposalId, int $itemId): JsonResponse
    {
        $userId = Auth::id() ?? 1;
        $review = $this->checklistService->updateItemReview($proposalId, $itemId, $request->validated(), $userId);

        return response()->json([
            'status' => 'success',
            'message' => 'Item review saved',
            'data' => $review,
        ]);
    }

    public function complete(CompleteChecklistReviewRequest $request, int $proposalId): JsonResponse
    {
        $userId = Auth::id() ?? 1;
        $summary = $this->checklistService->completeReview($proposalId, $request->validated('final_remarks'), $userId);

        return response()->json([
            'status' => 'success',
            'message' => 'Checklist review completed',
            'data' => $summary,
        ]);
    }

    public function history(int $proposalId): JsonResponse
    {
        $history = $this->checklistService->getChecklistHistory($proposalId);

        return response()->json([
            'status' => 'success',
            'data' => $history,
        ]);
    }
}
