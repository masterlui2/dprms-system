<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDocumentRequest;
use App\Services\Contracts\ProposalModule\DocumentsServiceInterface;
use Illuminate\Http\Request;

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
}
