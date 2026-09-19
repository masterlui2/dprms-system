<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReviewDocumentRequest;
use App\Http\Requests\StoreDocumentRequest;
use App\Models\Document;
use App\Models\Proposal;
use App\Services\Contracts\ProposalModule\DocumentsServiceInterface;
use App\Support\ProgramAccess;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function __construct(protected DocumentsServiceInterface $documentsService) {}

    public function store(StoreDocumentRequest $request)
    {
        $data = $this->documentsService->uploadDocuments($request->validated());

        return response()->json([
            'message' => 'Upload Success',
            'data' => $data,
        ], 201);
    }

    public function index(int $proposalId)
    {
        $proposal = Proposal::query()->findOrFail($proposalId);
        $this->authorizeProposalRead($proposal);

        return response()->json([
            'data' => $this->documentsService->getDocumentsByProposalId($proposalId),
        ]);
    }

    public function destroy(Document $document)
    {
        $user = Auth::user();
        $document->loadMissing(['proposal', 'document_type']);
        abort_unless(
            $user && (
                ($document->uploaded_by === $user->id
                    && $document->proposal?->submitted_by === $user->id
                    && $document->document_type?->is_applicant_visible)
                || ($document->proposal
                    && ProgramAccess::canReviewProgram($user, $document->proposal->program_type))
            ),
            403
        );
        $this->documentsService->deleteDocuments($document->id);

        return response()->json(['message' => 'Document Deleted']);
    }

    public function show(Document $document)
    {
        abort_unless($document->uploaded_by === Auth::id(), 403);
        abort_unless(Storage::exists($document->file_path), 404);

        return Storage::download($document->file_path, $document->file_name);
    }

    public function indexForOwner(int $proposalId)
    {
        return response()->json([
            'data' => $this->documentsService->getForOwner($proposalId),
        ]);
    }

    public function showForOwner(int $documentId)
    {
        $data = $this->documentsService->getOneForOwner($documentId);
        abort_unless(Storage::exists($data->file_path), 404);

        return Storage::response(
            $data->file_path,
            $data->file_name,
            ['Content-Type' => $data->mime_type]
        );
    }

    public function showForStaff(int $documentId)
    {
        $data = $this->documentsService->getOneForStaff($documentId);
        $data->loadMissing('proposal');
        abort_unless($data->proposal, 404);
        $this->authorizeProposalRead($data->proposal);
        abort_unless(Storage::exists($data->file_path), 404);

        return Storage::response(
            $data->file_path,
            $data->file_name,
            ['Content-Type' => $data->mime_type]
        );
    }

    public function review(ReviewDocumentRequest $request, Document $document)
    {
        $document->loadMissing('proposal');
        $user = Auth::user();
        abort_unless(
            $user && $document->proposal
                && ProgramAccess::canReviewProgram($user, $document->proposal->program_type),
            403,
        );

        $data = $this->documentsService->updateDocuments($document->id, [
            'status' => $request->validated('status'),
            'remarks' => $request->validated('remarks'),
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Document Review Saved',
            'data' => $data->load('document_type'),
        ]);
    }

    public function showForm(int $proposalId)
    {
        $proposal = Proposal::query()->findOrFail($proposalId);
        $this->authorizeProposalRead($proposal);
        $data = $this->documentsService->getProjectForm($proposalId);
        abort_unless(Storage::exists($data->file_path), 404);

        return Storage::response(
            $data->file_path,
            $data->file_name,
            ['Content-Type' => $data->mime_type]
        );
    }

    private function authorizeProposalRead(Proposal $proposal): void
    {
        $user = Auth::user();
        abort_unless(
            $user && ($proposal->submitted_by === $user->id
                || ProgramAccess::canReadProgram($user, $proposal->program_type)),
            403,
        );
    }
}
