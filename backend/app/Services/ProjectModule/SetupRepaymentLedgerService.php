<?php

namespace App\Services\ProjectModule;

use App\Models\Project;
use App\Models\ProjectLedger;
use App\Models\RepaymentTransaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class SetupRepaymentLedgerService
{
    public function getProjectsForProponent(User $user): array
    {
        abort_unless(
            $user->hasRole(['PROPONENT', 'MSME_PROPONENT'])
                && $user->canAccessProgram('SETUP'),
            403,
        );

        return Project::query()
            ->where('program_type', 'SETUP')
            ->where('status', 'active')
            ->whereHas('proposal', fn ($query) => $query->where('submitted_by', $user->id))
            ->with([
                'proposal:id,submitted_by,reference_number,title',
                'proposal.setup_proposal',
            ])
            ->orderByDesc('approved_at')
            ->get()
            ->map(function (Project $project) {
                $setup = $project->proposal?->setup_proposal?->first();

                return [
                    'id' => $project->id,
                    'reference_number' => $project->proposal?->reference_number,
                    'title' => $project->proposal?->title,
                    'cooperator' => $setup?->business_name ?? 'SETUP Cooperator',
                ];
            })
            ->values()
            ->all();
    }

    public function getLedger(User $user, Project $project): array
    {
        $this->authorizeView($user, $project);

        $project->loadMissing([
            'proposal.projectBudget',
            'proposal.setup_proposal',
            'proposal.user',
        ]);

        $ledgers = ProjectLedger::query()
            ->where('project_id', $project->id)
            ->where('program_type', 'SETUP')
            ->where('ledger_type', 'repayment')
            ->with([
                'repaymentTransactions' => fn ($query) => $query
                    ->with(['recorder:id,name', 'verifier:id,name'])
                    ->orderByDesc('id'),
            ])
            ->orderBy('due_date')
            ->orderBy('id')
            ->get();

        $amountPaid = (float) $ledgers
            ->flatMap->repaymentTransactions
            ->where('status', 'verified')
            ->sum('amount_paid');
        $scheduledAmount = (float) $ledgers->sum('amount');
        $budgetAmount = (float) ($project->proposal?->projectBudget?->total_amount ?? 0);
        $totalProjectCost = $budgetAmount > 0 ? $budgetAmount : $scheduledAmount;
        $installments = $ledgers->map(fn (ProjectLedger $ledger) => $this->formatInstallment($ledger));
        $isDirector = $user->hasRole(['PROVINCIAL_DIRECTOR', 'PSTO_DIRECTOR']);
        $isSetupFocal = $this->isSetupFocal($user);
        $isOwner = $this->isSetupProponentOwner($user, $project);

        $setup = $project->proposal?->setup_proposal?->first();

        return [
            'project' => [
                'id' => $project->id,
                'reference_number' => $project->proposal?->reference_number,
                'title' => $project->proposal?->title,
                'cooperator' => $setup?->business_name
                    ?? $project->proposal?->user?->name
                    ?? 'Cooperator not recorded',
                'contact_number' => data_get($setup?->form_snapshot, 'contactNumber'),
                'full_release' => data_get($setup?->form_snapshot, 'fullRelease')
                    ?? data_get($setup?->form_snapshot, 'fullReleaseDate'),
                'location' => $setup?->business_address ?? 'Location not recorded',
                'status' => $project->status,
            ],
            'summary' => [
                'total_project_cost' => round($totalProjectCost, 2),
                'amount_paid' => round($amountPaid, 2),
                'outstanding_balance' => round(max(0, $totalProjectCost - $amountPaid), 2),
                'overdue_installments' => $installments->where('status', 'overdue')->count(),
            ],
            'installments' => $installments->values(),
            'permissions' => [
                'can_record_payment' => $isOwner,
                'can_verify_payment' => $isSetupFocal,
                'read_only' => $isDirector,
            ],
        ];
    }

    public function submitPayment(
        User $user,
        Project $project,
        ProjectLedger $ledger,
        array $data,
    ): array {
        $this->authorizeSubmission($user, $project);
        $this->ensureLedgerBelongsToProject($project, $ledger);

        $proofPath = null;

        try {
            DB::transaction(function () use ($user, $project, $ledger, $data, &$proofPath) {
                $lockedLedger = ProjectLedger::query()->lockForUpdate()->findOrFail($ledger->id);
                $hasPendingPayment = RepaymentTransaction::query()
                    ->where('project_ledger_id', $lockedLedger->id)
                    ->where('status', 'pending')
                    ->exists();

                if ($hasPendingPayment) {
                    throw ValidationException::withMessages([
                        'amount_paid' => ['Review the pending payment before submitting another one.'],
                    ]);
                }

                $verifiedPaid = (float) RepaymentTransaction::query()
                    ->where('project_ledger_id', $lockedLedger->id)
                    ->where('status', 'verified')
                    ->sum('amount_paid');
                $remaining = max(0, (float) $lockedLedger->amount - $verifiedPaid);
                $paymentAmount = (float) $data['amount_paid'];

                if ($remaining <= 0) {
                    throw ValidationException::withMessages([
                        'amount_paid' => ['This installment is already fully paid.'],
                    ]);
                }

                if ($paymentAmount > $remaining) {
                    throw ValidationException::withMessages([
                        'amount_paid' => [sprintf('The payment cannot exceed the remaining installment balance of %.2f.', $remaining)],
                    ]);
                }

                $proof = $data['payment_proof'];
                $proofPath = $proof->store("repayment-proofs/{$project->id}", 'local');
                if (! $proofPath) {
                    throw ValidationException::withMessages([
                        'payment_proof' => ['The payment proof could not be stored.'],
                    ]);
                }

                RepaymentTransaction::query()->create([
                    'project_ledger_id' => $lockedLedger->id,
                    'uploaded_by' => $user->id,
                    'verified_by' => null,
                    'amount_paid' => $paymentAmount,
                    'payment_due' => $lockedLedger->due_date,
                    'bank_branch' => $data['bank_branch'],
                    'check_number' => $data['check_number'],
                    'check_date' => $data['check_date'],
                    'payment_date' => $data['payment_date'],
                    'proof_path' => $proofPath,
                    'proof_original_name' => mb_substr($proof->getClientOriginalName(), 0, 255),
                    'proof_mime_type' => $proof->getMimeType(),
                    'or_number' => $data['or_number'],
                    'status' => 'pending',
                ]);
            });
        } catch (Throwable $exception) {
            if ($proofPath) {
                Storage::disk('local')->delete($proofPath);
            }

            throw $exception;
        }

        return $this->getLedger($user, $project);
    }

    public function verifyPayment(
        User $user,
        Project $project,
        ProjectLedger $ledger,
        RepaymentTransaction $transaction,
        array $data,
    ): array {
        $this->authorizeVerification($user, $project);
        $this->ensureLedgerBelongsToProject($project, $ledger);
        $this->ensureTransactionBelongsToLedger($ledger, $transaction);

        DB::transaction(function () use ($user, $ledger, $transaction, $data) {
            $lockedLedger = ProjectLedger::query()->lockForUpdate()->findOrFail($ledger->id);
            $lockedTransaction = RepaymentTransaction::query()
                ->lockForUpdate()
                ->findOrFail($transaction->id);

            if ($lockedTransaction->status !== 'pending') {
                throw ValidationException::withMessages([
                    'decision' => ['This payment has already been reviewed.'],
                ]);
            }

            if ($data['decision'] === 'verified') {
                $verifiedPaid = (float) RepaymentTransaction::query()
                    ->where('project_ledger_id', $lockedLedger->id)
                    ->where('status', 'verified')
                    ->sum('amount_paid');
                $newPaidTotal = $verifiedPaid + (float) $lockedTransaction->amount_paid;

                if ($newPaidTotal > (float) $lockedLedger->amount) {
                    throw ValidationException::withMessages([
                        'decision' => ['This payment exceeds the remaining installment balance.'],
                    ]);
                }
            }

            $lockedTransaction->update([
                'verified_by' => $user->id,
                'status' => $data['decision'],
                'verified_at' => now(),
                'remarks' => $data['remarks'] ?? null,
            ]);

            $verifiedPaid = (float) RepaymentTransaction::query()
                ->where('project_ledger_id', $lockedLedger->id)
                ->where('status', 'verified')
                ->sum('amount_paid');

            $lockedLedger->update([
                'status' => $this->installmentStatus($lockedLedger, $verifiedPaid),
            ]);
        });

        return $this->getLedger($user, $project);
    }

    public function getPaymentProof(
        User $user,
        Project $project,
        ProjectLedger $ledger,
        RepaymentTransaction $transaction,
    ): StreamedResponse {
        $this->authorizeView($user, $project);
        $this->ensureLedgerBelongsToProject($project, $ledger);
        $this->ensureTransactionBelongsToLedger($ledger, $transaction);

        abort_unless(
            $transaction->proof_path
                && Storage::disk('local')->exists($transaction->proof_path),
            404,
            'Payment proof was not found.',
        );

        return Storage::disk('local')->response(
            $transaction->proof_path,
            $transaction->proof_original_name ?? 'payment-proof',
            ['Content-Type' => $transaction->proof_mime_type ?? 'application/octet-stream'],
            'inline',
        );
    }

    private function formatInstallment(ProjectLedger $ledger): array
    {
        $verifiedTransactions = $ledger->repaymentTransactions->where('status', 'verified');
        $amountPaid = (float) $verifiedTransactions->sum('amount_paid');
        $amountDue = (float) ($ledger->amount ?? 0);
        $remaining = max(0, $amountDue - $amountPaid);
        $status = $this->installmentStatus($ledger, $amountPaid);

        return [
            'id' => $ledger->id,
            'period' => $ledger->period_label,
            'due_date' => $ledger->due_date->toDateString(),
            'amount' => round($amountDue, 2),
            'amount_paid' => round($amountPaid, 2),
            'remaining_amount' => round($remaining, 2),
            'status' => $status,
            'transactions' => $ledger->repaymentTransactions->map(fn (RepaymentTransaction $transaction) => [
                'id' => $transaction->id,
                'amount_paid' => (float) $transaction->amount_paid,
                'or_number' => $transaction->or_number,
                'bank_branch' => $transaction->bank_branch,
                'check_number' => $transaction->check_number,
                'check_date' => $transaction->check_date?->toDateString(),
                'payment_date' => ($transaction->payment_date ?? $transaction->check_date)?->toDateString(),
                'status' => $transaction->status,
                'recorded_by' => $transaction->recorder?->name ?? 'Unknown submitter',
                'reviewed_by' => $transaction->verifier?->name,
                'reviewed_at' => $transaction->verified_at?->toIso8601String(),
                'submitted_at' => $transaction->created_at?->toIso8601String(),
                'remarks' => $transaction->remarks,
                'has_proof' => (bool) $transaction->proof_path,
                'proof_name' => $transaction->proof_original_name,
                'proof_mime_type' => $transaction->proof_mime_type,
            ])->values(),
        ];
    }

    private function installmentStatus(ProjectLedger $ledger, float $verifiedPaid): string
    {
        if ($verifiedPaid >= (float) $ledger->amount) {
            return 'paid';
        }

        return $ledger->due_date->isBefore(today()) ? 'overdue' : 'pending';
    }

    private function authorizeView(User $user, Project $project): void
    {
        abort_unless($project->program_type === 'SETUP' && $project->status === 'active', 404);

        $isDirector = $user->hasRole(['PROVINCIAL_DIRECTOR', 'PSTO_DIRECTOR']);
        $isSetupFocal = $this->isSetupFocal($user);
        $isOwner = $this->isSetupProponentOwner($user, $project);

        abort_unless($isDirector || $isSetupFocal || $isOwner, 403);
    }

    private function authorizeSubmission(User $user, Project $project): void
    {
        $this->authorizeView($user, $project);

        abort_unless($this->isSetupProponentOwner($user, $project), 403);
    }

    private function authorizeVerification(User $user, Project $project): void
    {
        $this->authorizeView($user, $project);

        abort_unless($this->isSetupFocal($user), 403);
    }

    private function ensureLedgerBelongsToProject(Project $project, ProjectLedger $ledger): void
    {
        abort_unless(
            $ledger->project_id === $project->id
                && $ledger->program_type === 'SETUP'
                && $ledger->ledger_type === 'repayment',
            404,
        );
    }

    private function ensureTransactionBelongsToLedger(
        ProjectLedger $ledger,
        RepaymentTransaction $transaction,
    ): void {
        abort_unless($transaction->project_ledger_id === $ledger->id, 404);
    }

    private function isSetupFocal(User $user): bool
    {
        return $user->hasRole(['FOCAL', 'SSCP_FOCAL', 'SETUP_FOCAL'])
            && $user->canAccessProgram('SETUP');
    }

    private function isSetupProponentOwner(User $user, Project $project): bool
    {
        if (! $user->hasRole(['PROPONENT', 'MSME_PROPONENT'])
            || ! $user->canAccessProgram('SETUP')) {
            return false;
        }

        $project->loadMissing('proposal:id,submitted_by');

        return $project->proposal?->submitted_by === $user->id;
    }
}
