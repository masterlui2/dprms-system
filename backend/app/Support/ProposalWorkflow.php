<?php

namespace App\Support;

use App\Enums\ProposalStatus;
use App\Models\Proposal;
use App\Models\User;

final class ProposalWorkflow
{
    /** @var array<string, list<string>> */
    private const TRANSITIONS = [
        'DRAFT' => ['SUBMITTED'],
        'SUBMITTED' => ['UNDER_VALIDATION', 'ENDORSED_TO_FOCAL', 'RETURNED'],
        'UNDER_VALIDATION' => ['ENDORSED_TO_FOCAL', 'ENDORSED_TO_RPMO', 'UNDER_SCREENING', 'ENDORSED_TO_RTEC', 'UNDER_EVALUATION', 'ENDORSED_TO_DIRECTOR', 'RETURNED'],
        'ENDORSED_TO_FOCAL' => ['UNDER_EVALUATION', 'ENDORSED_TO_DIRECTOR', 'RETURNED'],
        'ENDORSED_TO_RPMO' => ['UNDER_SCREENING', 'RETURNED'],
        'UNDER_SCREENING' => ['ENDORSED_TO_RTEC', 'UNDER_EVALUATION', 'RETURNED'],
        'ENDORSED_TO_RTEC' => ['UNDER_EVALUATION', 'RETURNED'],
        'UNDER_EVALUATION' => ['ENDORSED_TO_DIRECTOR', 'RETURNED'],
        'ENDORSED_TO_DIRECTOR' => ['UNDER_VALIDATION', 'RETURNED'],
        'RETURNED' => ['UNDER_VALIDATION'],
    ];

    public static function assertCanAdvance(User $user, Proposal $proposal, string $newStatus): void
    {
        abort_if(
            in_array($newStatus, [ProposalStatus::APPROVED->value, ProposalStatus::DISAPPROVED->value], true),
            422,
            'Final approval decisions must use the Provincial Director approval endpoint.',
        );

        abort_unless(
            in_array($newStatus, self::TRANSITIONS[$proposal->status] ?? [], true),
            422,
            "The proposal cannot move from {$proposal->status} to {$newStatus}.",
        );

        if ($proposal->submitted_by === $user->id) {
            abort_unless(
                $proposal->status === ProposalStatus::RETURNED->value
                    && $newStatus === ProposalStatus::UNDER_VALIDATION->value,
                403,
            );

            return;
        }

        abort_unless(ProgramAccess::canReviewProgram($user, $proposal->program_type), 403);

        if ($newStatus === ProposalStatus::ENDORSED_TO_DIRECTOR->value) {
            abort_unless($user->hasRole([
                'FOCAL',
                'SSCP_FOCAL',
                'SETUP_FOCAL',
                'SECTORAL_COUNCIL_STAFF',
                'TECHNICAL_PANEL_REVIEWER',
                'RTEC_BOARD_MEMBER',
            ]), 403);
        }
    }
}
