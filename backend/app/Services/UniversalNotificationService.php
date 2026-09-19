<?php

namespace App\Services;

use App\Models\EquipmentRegistry;
use App\Models\Notification;
use App\Models\ProjectLedger;
use App\Models\Proposal;
use App\Models\RepaymentTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class UniversalNotificationService
{
    private const ADMIN_ROLES = [
        'SYSTEM_ADMIN', 'ADMIN', 'SUPER_ADMIN',
        'PROJECT_STAFF', 'PSTO_STAFF',
        'FOCAL', 'SSCP_FOCAL', 'SETUP_FOCAL',
        'SECTORAL_COUNCIL_STAFF', 'TECHNICAL_PANEL_REVIEWER', 'RTEC_BOARD_MEMBER',
        'PROVINCIAL_DIRECTOR', 'PSTO_DIRECTOR', 'REGIONAL_DIRECTOR', 'EXECOM_MEMBER',
        'RPMO', 'RPMO_STAFF', 'FINANCE_OFFICER',
    ];

    public function proposalSubmitted(Proposal $proposal, User $actor): void
    {
        $reference = $proposal->reference_number;
        $program = $proposal->program_type;

        $this->notifyMany($this->adminUsers($program), [
            'type' => 'PROPOSAL_SUBMITTED',
            'category' => 'PROPOSAL',
            'program' => $program,
            'title' => 'New proposal submitted',
            'message' => "{$actor->name} submitted {$proposal->title} ({$reference}).",
            'action_url' => "/dashboard/approvals?proposalId={$proposal->id}",
            'related' => $proposal,
        ], $actor);

        $this->notify($actor, [
            'type' => 'PROPOSAL_SUBMITTED_CONFIRMATION',
            'category' => 'PROPOSAL',
            'program' => $program,
            'title' => 'Proposal submitted',
            'message' => "Proposal {$reference} was submitted and is now under review.",
            'action_url' => '/'.strtolower($program).'/dashboard',
            'related' => $proposal,
        ]);
    }

    public function proposalStatusChanged(
        Proposal $proposal,
        User $actor,
        string $status,
        ?string $remarks = null,
    ): void {
        $label = $this->statusLabel($status);
        $message = "{$actor->name} changed {$proposal->reference_number} to {$label}.";
        if ($remarks) {
            $message .= ' Remarks: '.$remarks;
        }

        $payload = [
            'type' => 'PROPOSAL_STATUS_CHANGED',
            'category' => 'PROPOSAL',
            'program' => $proposal->program_type,
            'title' => "Proposal {$label}",
            'message' => $message,
            'related' => $proposal,
        ];

        $this->notifyMany($this->adminUsers($proposal->program_type, $actor->id), [
            ...$payload,
            'action_url' => "/dashboard/approvals?proposalId={$proposal->id}",
        ], $actor);

        if ($proposal->submitted_by !== $actor->id && $proposal->user) {
            $this->notify($proposal->user, [
                ...$payload,
                'action_url' => '/'.strtolower($proposal->program_type).'/dashboard',
            ], $actor);
        }
    }

    public function proposalAssigned(Proposal $proposal, User $actor, array $recipientIds): void
    {
        $recipients = User::query()->whereIn('id', array_filter($recipientIds))->where('is_active', true)->get();
        $this->notifyMany($recipients, [
            'type' => 'CHECKLIST_ASSIGNED',
            'category' => 'CHECKLIST',
            'program' => $proposal->program_type,
            'title' => 'Checklist assigned',
            'message' => "{$actor->name} assigned checklist review for {$proposal->reference_number} to you.",
            'action_url' => "/dashboard/document-checklist?proposalId={$proposal->id}&program={$proposal->program_type}",
            'related' => $proposal,
        ], $actor);
    }

    public function checklistNeedsRevision(
        Proposal $proposal,
        User $actor,
        string $documentName,
        ?string $remarks,
    ): void {
        if (! $proposal->user) {
            return;
        }

        $message = "Please submit the revised {$documentName} directly to the DOST PSTO office.";
        if ($remarks) {
            $message .= ' Remarks: '.$remarks;
        }

        $this->notify($proposal->user, [
            'type' => 'CHECKLIST_NEEDS_REVISION',
            'category' => 'CHECKLIST',
            'program' => $proposal->program_type,
            'title' => 'Document needs revision',
            'message' => $message,
            'action_url' => '/'.strtolower($proposal->program_type).'/dashboard',
            'related' => $proposal,
        ], $actor);
    }

    public function paymentReviewed(
        Proposal $proposal,
        RepaymentTransaction $transaction,
        User $actor,
        string $decision,
        ?string $remarks,
    ): void {
        if (! $proposal->user) {
            return;
        }

        $amount = number_format((float) $transaction->amount_paid, 2);
        $verified = $decision === 'verified';
        $message = $verified
            ? "Payment of ₱{$amount} was verified by {$actor->name} for {$proposal->title}."
            : "Payment of ₱{$amount} was returned by {$actor->name} for {$proposal->title}.";
        if ($remarks) {
            $message .= ' Remarks: '.$remarks;
        }

        $this->notify($proposal->user, [
            'type' => $verified ? 'PAYMENT_VERIFIED' : 'PAYMENT_REJECTED',
            'category' => 'FINANCE',
            'program' => 'SETUP',
            'title' => $verified ? 'Payment verified' : 'Payment needs attention',
            'message' => $message,
            'action_url' => '/setup/dashboard/finance',
            'related' => $transaction,
        ], $actor);
    }

    public function equipmentInspected(EquipmentRegistry $equipment, User $actor): void
    {
        if (! $actor->hasRole(['RPMO', 'RPMO_STAFF'])) {
            return;
        }

        $equipment->loadMissing(['proposal.project', 'proposal.user', 'qrCode']);
        $proposal = $equipment->proposal;
        if (! $proposal) {
            return;
        }

        $program = $proposal->program_type;
        $reference = $equipment->qrCode?->qr_code_reference ?? "Asset {$equipment->id}";
        $condition = ucwords(str_replace('_', ' ', strtolower($equipment->current_condition)));
        $location = $equipment->location ?: 'project site';
        $actionUrl = "/dashboard/equipment-tracking?equipment={$equipment->id}";

        $staff = $this->programUsers([
            'PROJECT_STAFF', 'PSTO_STAFF', 'FOCAL', 'SSCP_FOCAL', 'SETUP_FOCAL',
        ], $program, $actor->id);
        $this->notifyMany($staff, [
            'type' => 'EQUIPMENT_SCANNED',
            'category' => 'EQUIPMENT',
            'program' => $program,
            'title' => 'Equipment inspected',
            'message' => "{$actor->name} scanned {$reference} at {$location}. Condition: {$condition}.",
            'action_url' => $actionUrl,
            'related' => $equipment,
        ], $actor);

        if (in_array($equipment->current_condition, ['POOR', 'NON_FUNCTIONAL'], true)) {
            $this->notifyMany($this->programUsers([
                'FOCAL', 'SSCP_FOCAL', 'SETUP_FOCAL',
            ], $program, $actor->id), [
                'type' => 'EQUIPMENT_PRIORITY_ALERT',
                'category' => 'EQUIPMENT',
                'program' => $program,
                'title' => 'Equipment needs attention',
                'message' => "{$reference} was marked {$condition}. Review the inspection and maintenance action.",
                'action_url' => $actionUrl,
                'related' => $equipment,
            ], $actor);
        }
    }

    public function syncRepaymentReminders(User $user): void
    {
        $today = now('Asia/Manila')->startOfDay();
        $ledgers = ProjectLedger::query()
            ->where('program_type', 'SETUP')
            ->where('ledger_type', 'repayment')
            ->whereDate('due_date', '<=', $today->copy()->addDays(7)->toDateString())
            ->whereHas('project.proposal', fn ($query) => $query->where('submitted_by', $user->id))
            ->with(['project.proposal', 'repaymentTransactions'])
            ->get();

        foreach ($ledgers as $ledger) {
            $paid = (float) $ledger->repaymentTransactions->where('status', 'verified')->sum('amount_paid');
            if ($paid >= (float) $ledger->amount) {
                continue;
            }

            $overdue = $ledger->due_date->copy()->startOfDay()->lt($today);
            $type = $overdue ? 'REPAYMENT_OVERDUE' : 'REPAYMENT_DUE';
            $proposal = $ledger->project?->proposal;
            Notification::query()->firstOrCreate([
                'user_id' => $user->id,
                'type' => $type,
                'related_type' => ProjectLedger::class,
                'related_id' => $ledger->id,
            ], [
                'category' => 'FINANCE',
                'program' => 'SETUP',
                'title' => $overdue ? 'Repayment overdue' : 'Repayment due soon',
                'message' => sprintf(
                    '%s installment of ₱%s %s %s.',
                    $proposal?->title ?? 'Project',
                    number_format(max(0, (float) $ledger->amount - $paid), 2),
                    $overdue ? 'was due on' : 'is due on',
                    $ledger->due_date->format('M j, Y'),
                ),
                'action_url' => '/setup/dashboard/finance',
                'is_read' => false,
            ]);
        }
    }

    public function notify(User $recipient, array $data, ?User $actor = null): Notification
    {
        $actor?->loadMissing('role');
        /** @var Model|null $related */
        $related = $data['related'] ?? null;

        return Notification::query()->create([
            'user_id' => $recipient->id,
            'actor_id' => $actor?->id,
            'actor_name' => $actor?->name,
            'actor_role' => $actor?->role?->first()?->name,
            'type' => $data['type'],
            'category' => $data['category'] ?? 'SYSTEM',
            'program' => $data['program'] ?? null,
            'title' => $data['title'],
            'message' => $data['message'],
            'action_url' => $data['action_url'] ?? null,
            'is_read' => false,
            'related_type' => $related ? $related::class : null,
            'related_id' => $related?->getKey(),
        ]);
    }

    public function notifyMany(iterable $recipients, array $data, ?User $actor = null): void
    {
        collect($recipients)
            ->filter(fn ($recipient) => $recipient instanceof User)
            ->unique('id')
            ->each(fn (User $recipient) => $this->notify($recipient, $data, $actor));
    }

    private function adminUsers(string $program, ?int $excludeUserId = null): Collection
    {
        return $this->programUsers(self::ADMIN_ROLES, $program, $excludeUserId);
    }

    private function programUsers(array $roles, string $program, ?int $excludeUserId = null): Collection
    {
        return User::query()
            ->where('is_active', true)
            ->when($excludeUserId, fn ($query) => $query->whereKeyNot($excludeUserId))
            ->whereHas('role', fn ($query) => $query->whereIn('code', $roles))
            ->with('role:id,name,code,program_type')
            ->get()
            ->filter(fn (User $candidate) => $candidate->role->contains(
                fn ($role) => in_array($role->code, ['SYSTEM_ADMIN', 'ADMIN', 'SUPER_ADMIN'], true),
            ) || $candidate->canAccessProgram($program))
            ->values();
    }

    private function statusLabel(string $status): string
    {
        return ucwords(strtolower(str_replace('_', ' ', $status)));
    }
}
