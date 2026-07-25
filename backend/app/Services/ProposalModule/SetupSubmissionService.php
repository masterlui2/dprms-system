<?php

namespace App\Services\ProposalModule;

use App\Models\DocumentType;
use App\Services\Contracts\ProposalModule\DocumentsServiceInterface;
use App\Services\Contracts\ProposalModule\ProposalServiceInterface;
use App\Services\Contracts\ProposalModule\SetupProposalServiceInterface;
use App\Services\Contracts\ProposalModule\SetupSubmissionServiceInterface;
use Illuminate\Support\Facades\DB;
use Override;

class SetupSubmissionService implements SetupSubmissionServiceInterface{
    public function __construct(protected ProposalServiceInterface $proposalService, protected SetupProposalServiceInterface $setupProposalService, protected DocumentsServiceInterface $documentsService)
    {
    }

    #[Override]
    public function submit(array $data)
    {
        return DB::transaction(function () use ($data) {
            $proposal = $this->proposalService->submit([
                'program_type' => 'SETUP',
                'title' => $data['title'],
                'remarks' => $data['remarks'] ?? null,
            ]);

            $setupProposal = $this->setupProposalService->createSetupProposal(array_merge(
                $data,
                ['proposal_id' => $proposal->id]
            ));

            $documentType = DocumentType::where('set_number', 'PROPOSAL')
                ->where('applicable_program', 'SETUP')
                ->first();

            $document = $this->documentsService->uploadDocuments([
                'proposal_id' => $proposal->id,
                'document_type_id' => $documentType->id, // hardcoded for now
                'file' => $data['file'],
            ]);

            return [
                'proposal' => $proposal,
                'setup_proposal' => $setupProposal,
                'document' => $document,
            ];
        });
    }
}
