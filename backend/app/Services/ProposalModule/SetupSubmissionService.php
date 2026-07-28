<?php

namespace App\Services\ProposalModule;

use App\Models\DocumentType;
use App\Services\Contracts\ProposalModule\DocumentsServiceInterface;
use App\Services\Contracts\ProposalModule\ProposalServiceInterface;
use App\Services\Contracts\ProposalModule\SetupProposalServiceInterface;
use App\Services\Contracts\ProposalModule\SetupSubmissionServiceInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Override;
use Throwable;

class SetupSubmissionService implements SetupSubmissionServiceInterface{
    public function __construct(protected ProposalServiceInterface $proposalService, protected SetupProposalServiceInterface $setupProposalService, protected DocumentsServiceInterface $documentsService, protected SetupProposalPdfService $pdfService)
    {
    }

    #[Override]
    public function submit(array $data)
    {
        return DB::transaction(function () use ($data) {
            // File writes below (via DocumentsService::uploadDocuments, which
            // calls $file->store(...)) aren't covered by this DB transaction —
            // Storage isn't transactional. If anything throws partway through,
            // DB::transaction() rolls back the DB rows automatically, but we
            // have to manually delete any files already written in this
            // request ourselves, or they become orphans on disk.
            $storedPaths = [];

            try {
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

                if (! $documentType) {
                    throw new \RuntimeException('SETUP proposal DocumentType (set_number=PROPOSAL) is not seeded.');
                }

                $proposalPdfFile = $this->buildProposalPdfUploadedFile($data);

                // Auto-generated proposal PDF snapshot — same as before.
                $proposalPdfDocument = $this->documentsService->uploadDocuments([
                    'proposal_id' => $proposal->id,
                    'document_type_id' => $documentType->id, // hardcoded for now
                    'file' => $proposalPdfFile,
                ]);
                $storedPaths[] = $proposalPdfDocument->file_path;

                $documents = [$proposalPdfDocument];

                // Proponent-submitted supporting documents, now required
                // alongside the proposal itself (validated in
                // SubmitSetupProposalRequest — every is_required DocumentType
                // for this business_type/enterprise_size must be present).
                foreach ($data['documents'] ?? [] as $documentInput) {
                    $uploadedDocument = $this->documentsService->uploadDocuments([
                        'proposal_id' => $proposal->id,
                        'document_type_id' => $documentInput['document_type_id'],
                        'file' => $documentInput['file'],
                    ]);
                    $storedPaths[] = $uploadedDocument->file_path;
                    $documents[] = $uploadedDocument;
                }

                return [
                    'proposal' => $proposal,
                    'setup_proposal' => $setupProposal,
                    'documents' => $documents,
                ];
            } catch (Throwable $e) {
                foreach ($storedPaths as $path) {
                    Storage::delete($path);
                }
                throw $e;
            }
        });
    }

    protected function buildProposalPdfUploadedFile(array $data): UploadedFile
    {
        $pdfBinary = $this->pdfService->generate($data['form_snapshot']);

        $tempPath = tempnam(sys_get_temp_dir(), 'setup_proposal_');
        file_put_contents($tempPath, $pdfBinary);

        $fileName = 'setup-proposal-' . now()->format('Ymd-His') . '.pdf';

        // `true` here puts UploadedFile in "test mode" so it accepts a file
        // that wasn't created via a real HTTP upload (is_uploaded_file check
        // is skipped). This is the standard way to fabricate an UploadedFile
        // from generated content in Laravel.
        return new UploadedFile($tempPath, $fileName, 'application/pdf', null, true);
    }
}
