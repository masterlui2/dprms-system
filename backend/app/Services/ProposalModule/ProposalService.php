<?php

namespace App\Services\ProposalModule;

use App\Models\Proposal;
use App\Repositories\Contracts\ProjectModule\ProjectRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\ProposalAuditRepositoryInterface;
use App\Repositories\Contracts\ProposalModule\ProposalRepositoryInterface;
use App\Services\Contracts\ProjectModule\ProjectServiceInterface;
use App\Services\Contracts\ProposalModule\ProposalServiceInterface;
use App\Services\Contracts\ProposalModule\ReferenceNumberGeneratorServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Override;

class ProposalService implements ProposalServiceInterface{

    public function __construct(protected ProposalRepositoryInterface $proposalRepository,protected ReferenceNumberGeneratorServiceInterface $referenceNumberGeneratorService,protected ProposalAuditRepositoryInterface $proposalAuditRepository, protected ProjectServiceInterface $projectService){}

    #[Override]
    public function submit(array $data): Proposal
    {
        return DB::transaction(function () use ($data) {
            $proposal = $this->proposalRepository->create([
                'submitted_by' => Auth::id(),
                'program_type' => $data['program_type'],
                'reference_number' => $this->referenceNumberGeneratorService->generate($data['program_type']),
                'title' => $data['title'],
                'status' => 'SUBMITTED',
                'submitted_at' => now(),
                'remarks' => $data['remarks'] ?? null,
            ]);

            $this->recordAudit(
                proposalId: $proposal->id,
                action: 'SUBMIT',
                previousStatus: null,
                newStatus: 'SUBMITTED',
                remarks: $data['remarks'] ?? null,
            );

            return $proposal;
        });
    }

    #[Override]
    public function update(int $proposalId, array $data): Proposal
    {
        return DB::transaction(function () use ($proposalId, $data) {
            $existing = $this->proposalRepository->findById($proposalId);

            if (! $existing) {
                abort(404, 'Proposal not Found');
            }

            $updated = $this->proposalRepository->update($proposalId, $data);

            if (! $updated) {
                abort(404, 'Proposal not Found');
            }

            $proposal = $this->proposalRepository->findById($proposalId);

            $this->recordAudit(
                proposalId: $proposalId,
                action: 'UPDATE',
                previousStatus: $existing->status,
                newStatus: $proposal->status,
                remarks: $data['remarks'] ?? null,
            );

            return $proposal;
        });
    }

    #[Override]
    public function delete(int $proposalId, ?string $remarks = null): bool
    {
        return DB::transaction(function () use ($proposalId, $remarks) {
            $existing = $this->proposalRepository->findById($proposalId);

            if (! $existing) {
                abort(404, 'Proposal not Found');
            }

            $deleted = $this->proposalRepository->delete($proposalId);

            if ($deleted) {
                $this->recordAudit(
                    proposalId: $proposalId,
                    action: 'DELETE',
                    previousStatus: $existing->status,
                    newStatus: null,
                    remarks: $remarks,
                );
            }

            return $deleted;
        });
    }

    #[Override]
    public function advanceStage(int $proposalId, string $newStatus, ?string $remarks = null, ?string $action = null): Proposal
    {
        $existing = $this->proposalRepository->findById($proposalId);
        if (! $existing) {
            abort(404, 'Proposal not Found');
        }

        $updated = $this->proposalRepository->updateStatus($proposalId, $newStatus, $remarks);
        if (! $updated) {
            abort(404, 'Proposal not Found');
        }

        $proposal = $this->proposalRepository->findById($proposalId);

        $this->recordAudit(
            proposalId: $proposalId,
            action: $action ?? 'ADVANCE_STAGE',
            previousStatus: $existing->status,
            newStatus: $newStatus,
            remarks: $remarks,
        );

        return $proposal;
    }

    #[Override]
    public function disapprove(int $proposalId, string $remarks): Proposal
    {
        return $this->applyLoggedDecision($proposalId, 'DISAPPROVE', 'DISAPPROVED', $remarks);
    }

    #[Override]
    public function approve(int $proposalId, ?string $remarks = null): Proposal
    {
        return DB::transaction(function () use($proposalId,$remarks) {
            $existing = $this->proposalRepository->findById($proposalId);
            if(! $existing){
                abort(404,"Not Found");
            }

            $proposal = $this->advanceStage($proposalId,'APPROVED',$remarks,'APPROVE');
            if($this->projectService->getByProposalId($proposalId)->isEmpty()){
                $this->projectService->createFromProposal($proposal);
            }

            return $proposal;
        });

    }

    #[Override]
    public function getByReferenceNumber(string $referenceNumber): ?Proposal
    {
        return $this->proposalRepository->findByReferenceNumber($referenceNumber);
    }

    #[Override]
    public function getSubmitterProposals(int $userId): Collection
    {
        return $this->proposalRepository->findBySubmitter($userId);
    }

    #[Override]
    public function getIndex(): Collection
    {
        return $this->proposalRepository->findIndex([
            'user',
            'setup_proposal',
            'gia_proposal',
            'reviewed',
            'focal'
        ]);
    }

    protected function applyLoggedDecision(int $proposalId, string $action, string $newStatus, ?string $remarks, ?int $assignedEvaluatorId = null): Proposal{
        return DB::transaction(function () use ($proposalId, $action, $newStatus, $remarks, $assignedEvaluatorId) {
            $existing = $this->proposalRepository->findById($proposalId);
            if(! $existing){
                abort(404, "Not Found");
            }
            $updated_proposal = $this->advanceStage($proposalId, $newStatus, $remarks, $action);

            return $updated_proposal;
        });
    }

    protected function recordAudit(int $proposalId, string $action, ?string $previousStatus, ?string $newStatus, ?string $remarks, ?int $assignedEvaluatorId = null): void
    {
        $this->proposalAuditRepository->create([
            "proposal_id" => $proposalId,
            "reviewed_by" => Auth::id(),
            "action" => $action,
            "previous_status" => $previousStatus,
            "new_status" => $newStatus,
            "remarks" => $remarks,
            "assigned_evaluator_id" => $assignedEvaluatorId,
        ]);
    }

    #[Override]
    public function assignProjectStaff(int $proposalId): Proposal
    {
        return DB::transaction(function () use ($proposalId) {
            $existing = $this->proposalRepository->findById($proposalId);

            if (! $existing) {
                abort(404, "Not Found");
            }

            $updated = $this->proposalRepository->assignProjectStaff(Auth::id(), $proposalId);

            if (! $updated) {
                abort(404, "Not Found");
            }

            $proposal = $this->proposalRepository->findById($proposalId);

            $this->recordAudit(
                proposalId: $proposalId,
                action: 'ASSIGN_PROJECT_STAFF',
                previousStatus: $existing->status,
                newStatus: $proposal->status,
                remarks: null,
                assignedEvaluatorId: Auth::id(),
            );

            return $proposal;
        });
    }
}
