<?php

namespace App\Http\Controllers;

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
    }
}
