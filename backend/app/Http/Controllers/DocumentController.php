<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReviewDocumentRequest;
use App\Http\Requests\StoreDocumentRequest;
use App\Models\Document;
use App\Services\Contracts\ProposalModule\DocumentsServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function __construct(protected DocumentsServiceInterface $documentsService)
    {
    }

    public function store(StoreDocumentRequest $request){
        $data = $this->documentsService->uploadDocuments($request->validated());
        return response()->json([
            'message' => 'Upload Success',
            'data' => $data,
        ],201);
    }

    public function index(int $proposalId){
        return response()->json([
            'data' => $this->documentsService->getDocumentsByProposalId($proposalId),
        ]);
    }

    public function destroy(Document $document){
        abort_unless($document->uploaded_by === Auth::id(), 403);
        $this->documentsService->deleteDocuments($document->id);
        return response()->json(['message' => 'Document Deleted']);
    }

    public function show(Document $document){
        abort_unless($document->uploaded_by === Auth::id(),403);
        abort_unless(Storage::exists($document->file_path),404);

        return Storage::download($document->file_path, $document->file_name);
    }

    public function indexForOwner(int $proposalId){
        return response()->json([
            'data' => $this->documentsService->getForOwner($proposalId)
        ]);
    }

    public function showForOwner(int $documentId){
        $data = $this->documentsService->getOneForOwner($documentId);
        abort_unless(Storage::exists($data->file_path),404);
        return Storage::response(
            $data->file_path,
            $data->file_name,
            ['Content-Type' => $data->mime_type]
        );
    }

    public function showForStaff(int $documentId){
        $data = $this->documentsService->getOneForStaff($documentId);
        abort_unless(Storage::exists($data->file_path),404);
        return Storage::response(
            $data->file_path,
            $data->file_name,
            ['Content-Type' => $data->mime_type]
        );
    }

    public function review(ReviewDocumentRequest $request, Document $document){
        abort_unless($document->document_type()->where('is_applicant_visible', true)->exists(), 422);

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
}
