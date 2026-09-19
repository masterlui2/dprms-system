<?php

namespace App\Enums;

enum ProposalStatus: string
{
    case DRAFT = 'DRAFT';
    case SUBMITTED = 'SUBMITTED';
    case UNDER_VALIDATION = 'UNDER_VALIDATION';
    case ENDORSED_TO_FOCAL = 'ENDORSED_TO_FOCAL';
    case ENDORSED_TO_RPMO = 'ENDORSED_TO_RPMO';
    case UNDER_SCREENING = 'UNDER_SCREENING';
    case ENDORSED_TO_RTEC = 'ENDORSED_TO_RTEC';
    case UNDER_EVALUATION = 'UNDER_EVALUATION';
    case ENDORSED_TO_DIRECTOR = 'ENDORSED_TO_DIRECTOR';
    case APPROVED = 'APPROVED';
    case DISAPPROVED = 'DISAPPROVED';
    case RETURNED = 'RETURNED';

    /** @return list<string> */
    public static function reviewTransitions(): array
    {
        return array_map(
            static fn (self $status) => $status->value,
            array_filter(self::cases(), static fn (self $status) => ! in_array($status, [self::APPROVED, self::DISAPPROVED], true)),
        );
    }
}
