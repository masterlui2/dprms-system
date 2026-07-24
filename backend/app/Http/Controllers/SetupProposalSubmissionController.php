<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProposalModule\SubmitSetupProposalRequest;
use App\Services\Contracts\ProposalModule\DocumentsServiceInterface;
use App\Services\Contracts\ProposalModule\ProposalServiceInterface;
use App\Services\Contracts\ProposalModule\SetupProposalServiceInterface;
use App\Services\Contracts\ProposalModule\SetupSubmissionServiceInterface;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class SetupProposalSubmissionController extends Controller
{
    public function __construct(
        protected SetupSubmissionServiceInterface $submissionService
    ) {}

   public function store(SubmitSetupProposalRequest $request)
    {
        $data = $request->validated();
        $data['file'] = $request->file('file');

        $result = $this->submissionService->submit($data);

        return response()->json([
            'message' => 'Setup Proposal Submitted Successfully',
            'data' => $result,
        ], 201);
    }
}
