<?php

namespace App\Support;

use App\Models\User;

final class ProgramAccess
{
    private const GLOBAL_READ_ROLES = [
        'PROVINCIAL_DIRECTOR',
        'PSTO_DIRECTOR',
        'RPMO',
        'SYSTEM_ADMIN',
        'ADMIN',
        'SUPER_ADMIN',
    ];

    private const PROGRAM_REVIEW_ROLES = [
        'PROJECT_STAFF',
        'PSTO_STAFF',
        'FOCAL',
        'SSCP_FOCAL',
        'SETUP_FOCAL',
        'SECTORAL_COUNCIL_STAFF',
        'TECHNICAL_PANEL_REVIEWER',
        'RTEC_BOARD_MEMBER',
    ];

    private const PROGRAM_READ_ROLES = [
        ...self::PROGRAM_REVIEW_ROLES,
        'RPMO_STAFF',
        'PSTO_DIRECTOR',
        'REGIONAL_DIRECTOR',
        'EXECOM_MEMBER',
        'FINANCE_OFFICER',
    ];

    private const MONITORING_WRITE_ROLES = [
        'PROJECT_STAFF',
        'PSTO_STAFF',
        'FOCAL',
        'SSCP_FOCAL',
        'SETUP_FOCAL',
    ];

    public static function canReadProgram(User $user, string $programType): bool
    {
        return $user->hasRole(self::GLOBAL_READ_ROLES)
            || ($user->hasRole(self::PROGRAM_READ_ROLES) && $user->canAccessProgram($programType));
    }

    public static function canReviewProgram(User $user, string $programType): bool
    {
        return ($user->hasRole(self::PROGRAM_REVIEW_ROLES) && $user->canAccessProgram($programType))
            || $user->hasRole(['SYSTEM_ADMIN', 'ADMIN', 'SUPER_ADMIN']);
    }

    public static function canWriteMonitoring(User $user, string $programType): bool
    {
        return $user->hasRole(self::MONITORING_WRITE_ROLES)
            && $user->canAccessProgram($programType);
    }
}
