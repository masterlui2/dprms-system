<?php

namespace App\Services\ProposalModule;

use App\Models\Project;
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
        return DB::transaction(function () use ($proposalId, $remarks) {
            $existing = $this->proposalRepository->findById($proposalId);

            if (! $existing) {
                abort(404, 'Proposal not Found');
            }

            $previousStatus = $existing->status;
            $updated = $this->proposalRepository->disapprove($proposalId, Auth::id(), $remarks);

            if (! $updated) {
                abort(404, 'Proposal not Found');
            }

            $proposal = $this->proposalRepository->findById($proposalId);

            $this->recordAudit(
                proposalId: $proposalId,
                action: 'DISAPPROVE',
                previousStatus: $previousStatus,
                newStatus: 'DISAPPROVED',
                remarks: $remarks,
                assignedEvaluatorId: Auth::id(),
            );

            return $proposal;
        });
    }

    #[Override]
    public function approve(int $proposalId, ?string $remarks = null): Proposal
    {
        return DB::transaction(function () use ($proposalId, $remarks) {
            $existing = $this->proposalRepository->findById($proposalId);

            if (! $existing) {
                abort(404, 'Proposal not Found');
            }

            $previousStatus = $existing->status;
            $updated = $this->proposalRepository->approve($proposalId, Auth::id(), $remarks);

            if (! $updated) {
                abort(404, 'Proposal not Found');
            }

            if ($this->projectService->getByProposalId($proposalId)->isEmpty()) {
                $this->projectService->createFromProposal($existing);
            }

            $proposal = $this->proposalRepository->findById($proposalId);

            $this->recordAudit(
                proposalId: $proposalId,
                action: 'APPROVE',
                previousStatus: $previousStatus,
                newStatus: 'APPROVED',
                remarks: $remarks,
                assignedEvaluatorId: Auth::id(),
            );

            return $proposal;
        });
    }



    #[Override]
    public function reviewDecision(int $proposalId, array $data): Proposal
    {
        return DB::transaction(function () use ($proposalId, $data) {
            $existing = $this->proposalRepository->findById($proposalId);

            if (! $existing) {
                abort(404, 'Proposal not Found');
            }

            $decision = $data['decision'];
            $findings = $data['findings'] ?? null;
            $remarks = $data['remarks'] ?? $findings;
            $evaluatorId = $data['focal_id'] ?? $data['assigned_evaluator_id'] ?? null;
            $previousStatus = $existing->status;

            if ($decision === 'return_for_revision' || $decision === 'RETURNED') {
                $newStatus = 'RETURNED';
                $this->proposalRepository->returnForRevision($proposalId, $remarks);

                $this->recordAudit(
                    proposalId: $proposalId,
                    action: 'return_for_revision',
                    previousStatus: $previousStatus,
                    newStatus: $newStatus,
                    remarks: $remarks,
                    assignedEvaluatorId: null,
                    findings: $findings,
                );
            } elseif ($decision === 'endorse_to_focal' || $decision === 'ENDORSED_TO_FOCAL') {
                $newStatus = 'ENDORSED_TO_FOCAL';
                if ($evaluatorId) {
                    $this->proposalRepository->endorseToFocal($proposalId, $evaluatorId, $remarks);
                } else {
                    $this->proposalRepository->updateStatus($proposalId, $newStatus, $remarks);
                }

                $this->recordAudit(
                    proposalId: $proposalId,
                    action: 'endorse_to_focal',
                    previousStatus: $previousStatus,
                    newStatus: $newStatus,
                    remarks: $remarks,
                    assignedEvaluatorId: $evaluatorId,
                    findings: null,
                );
            } elseif ($decision === 'approve') {
                return $this->approve($proposalId, $remarks);
            } elseif ($decision === 'disapprove') {
                return $this->disapprove($proposalId, $remarks ?? 'Disapproved');
            } else {
                $newStatus = $data['status'] ?? $existing->status;
                $this->proposalRepository->updateStatus($proposalId, $newStatus, $remarks);

                $this->recordAudit(
                    proposalId: $proposalId,
                    action: $decision,
                    previousStatus: $previousStatus,
                    newStatus: $newStatus,
                    remarks: $remarks,
                    assignedEvaluatorId: $evaluatorId,
                    findings: $findings,
                );
            }

            return $this->proposalRepository->findById($proposalId);
        });
    }

    #[Override]
    public function assignOfficers(int $proposalId, array $data): Proposal
    {
        return DB::transaction(function () use ($proposalId, $data) {
            $existing = $this->proposalRepository->findById($proposalId);

            if (! $existing) {
                abort(404, 'Proposal not Found');
            }

            $staffId = $data['assigned_staff_id'] ?? $data['staff_id'] ?? null;
            $focalId = $data['assigned_focal_id'] ?? $data['focal_id'] ?? null;
            $remarks = $data['remarks'] ?? null;

            $updated = $this->proposalRepository->assignOfficers($proposalId, $staffId, $focalId, $remarks);

            if (! $updated) {
                abort(404, 'Proposal not Found');
            }

            $proposal = $this->proposalRepository->findById($proposalId);

            $this->recordAudit(
                proposalId: $proposalId,
                action: 'ASSIGN_OFFICER',
                previousStatus: $existing->status,
                newStatus: $proposal->status,
                remarks: $remarks ?? 'Assigned officer(s) to proposal',
                assignedEvaluatorId: $focalId ?? $staffId,
            );

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
            'focal',
            'assigned_staff',
            'assigned_focal',
        ]);
    }


    protected function applyLoggedDecision(int $proposalId, string $action, string $newStatus, ?string $remarks, ?int $assignedEvaluatorId = null, ?string $findings = null): Proposal
      {
          return DB::transaction(function () use ($proposalId, $action, $newStatus, $remarks, $assignedEvaluatorId, $findings) {
              $existing = $this->proposalRepository->findById($proposalId);
              if (! $existing) {
                  abort(404, "Not Found");
              }

              $previousStatus = $existing->status;
              $updated = $this->proposalRepository->updateStatus($proposalId, $newStatus, $remarks);
              if (! $updated) {
                  abort(404, "Not Found");
              }

              $updated_proposal = $this->proposalRepository->findById($proposalId);

              $this->recordAudit(
                  proposalId: $proposalId,
                  action: $action,
                  previousStatus: $previousStatus,
                  newStatus: $newStatus,
                  remarks: $remarks,
                  assignedEvaluatorId: $assignedEvaluatorId,
                  findings: $findings,
              );

              return $updated_proposal;
          });
      }

    protected function recordAudit(int $proposalId, string $action, ?string $previousStatus, ?string $newStatus, ?string $remarks, ?int $assignedEvaluatorId = null, ?string $findings = null): void
    {
        $this->proposalAuditRepository->create([
            "proposal_id" => $proposalId,
            "reviewed_by" => Auth::id(),
            "action" => $action,
            "previous_status" => $previousStatus,
            "new_status" => $newStatus,
            "remarks" => $remarks,
            "findings" => $findings,
            "assigned_evaluator_id" => $assignedEvaluatorId,
        ]);

        \App\Models\ProposalReviewLog::create([
            "proposal_id" => $proposalId,
            "reviewed_by" => Auth::id(),
            "action" => $action,
            "previous_status" => $previousStatus,
            "new_status" => $newStatus,
            "remarks" => $remarks,
            "findings" => $findings,
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

