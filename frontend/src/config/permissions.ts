/**
 * System: DPRMS
 * Purpose: Permissions definitions for DPRMS.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
/**
 * Central DPRMS role and module permission registry.
 * Keep role checks out of pages and components; add a module here instead.
 */
export const ROLES = {
    SYSTEM_ADMIN: 'system_admin',
    PROJECT_STAFF: 'project_staff',
    FOCAL: 'focal',
    PROVINCIAL_DIRECTOR: 'provincial_director',
    RPMO: 'rpmo',
    PROPONENT: 'proponent',
    FINANCE_OFFICER: 'finance_officer',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: UserRole[] = Object.values(ROLES);

export const ROLE_LABEL: Record<UserRole, string> = {
    [ROLES.SYSTEM_ADMIN]: 'System Administrator',
    [ROLES.PROJECT_STAFF]: 'Project Staff / Encoder',
    [ROLES.FOCAL]: 'Focal / Evaluator',
    [ROLES.PROVINCIAL_DIRECTOR]: 'Provincial Director / Approver',
    [ROLES.RPMO]: 'RPMO / Regional Viewer',
    [ROLES.PROPONENT]: 'Proponent / Beneficiary',
    [ROLES.FINANCE_OFFICER]: 'Finance & Accounting Officer',
};

export const g_objModulePermissions = {
    dashboard: ALL_ROLES,
    applications: [ROLES.PROJECT_STAFF, ROLES.FOCAL, ROLES.PROVINCIAL_DIRECTOR, ROLES.RPMO],
    newApplication: [ROLES.PROPONENT],
    myApplications: [ROLES.PROPONENT],
    uploadRequirements: [ROLES.PROPONENT],
    submittedDocuments: [ROLES.PROPONENT],
    projectOverview: [ROLES.PROPONENT],
    milestones: [ROLES.PROPONENT],
    repaymentLedger: [ROLES.PROPONENT],
    equipmentAssigned: [ROLES.PROPONENT],
    quarterlyReports: [ROLES.PROPONENT, ROLES.FOCAL],
    documents: [ROLES.PROPONENT],
    profile: ALL_ROLES,
    equipmentTracking: [ROLES.PROJECT_STAFF, ROLES.FOCAL],
    repaymentMonitoring: [ROLES.FOCAL, ROLES.PROVINCIAL_DIRECTOR, ROLES.FINANCE_OFFICER],
    reports: [
        ROLES.PROJECT_STAFF,
        ROLES.FOCAL,
        ROLES.PROVINCIAL_DIRECTOR,
        ROLES.RPMO,
        ROLES.FINANCE_OFFICER,
    ],
    applicationReview: [ROLES.FOCAL],
    documentChecklist: [
        ROLES.SYSTEM_ADMIN,
        ROLES.PROJECT_STAFF,
        ROLES.FOCAL,
        ROLES.PROVINCIAL_DIRECTOR,
        ROLES.RPMO,
    ],
    fileSettings: [
        ROLES.SYSTEM_ADMIN,
        ROLES.PROJECT_STAFF,
        ROLES.FOCAL,
        ROLES.PROVINCIAL_DIRECTOR,
        ROLES.RPMO,
    ],
    projectMonitoring: [ROLES.PROJECT_STAFF, ROLES.FOCAL, ROLES.PROVINCIAL_DIRECTOR, ROLES.RPMO],
    executiveApproval: [ROLES.PROVINCIAL_DIRECTOR],
    projects: [ROLES.PROVINCIAL_DIRECTOR, ROLES.RPMO],
    regionalMonitoring: [ROLES.RPMO],
    aiAnalytics: [ROLES.RPMO],
    userManagement: [ROLES.SYSTEM_ADMIN],
    roleManagement: [ROLES.SYSTEM_ADMIN],
    programManagement: [ROLES.SYSTEM_ADMIN],
    municipalityManagement: [ROLES.SYSTEM_ADMIN],
    budgetCategories: [ROLES.SYSTEM_ADMIN],
    notificationManagement: [ROLES.SYSTEM_ADMIN],
    auditLogs: [ROLES.SYSTEM_ADMIN],
    backup: [ROLES.SYSTEM_ADMIN],
    systemSettings: [ROLES.SYSTEM_ADMIN],
} as const satisfies Record<string, readonly UserRole[]>;

export type ModuleId = keyof typeof g_objModulePermissions;

/** Can access module. */
export function canAccessModule(
    strRole: UserRole,
    strModule: ModuleId,
    strProgram?: 'SETUP' | 'GIA',
    strBackendRole?: string,
)
{
    if (strModule === 'repaymentMonitoring' && strProgram !== 'SETUP')
    {
        return false;
    }

    const arrReviewOnlyRoles = [
        'SECTORAL_COUNCIL_STAFF',
        'TECHNICAL_PANEL_REVIEWER',
        'RTEC_BOARD_MEMBER',
    ];
    if (
        arrReviewOnlyRoles.includes(strBackendRole?.toUpperCase() ?? '') &&
        ['equipmentTracking', 'projectMonitoring', 'repaymentMonitoring'].includes(strModule)
    )
    {
        return false;
    }

    return (g_objModulePermissions[strModule] as readonly UserRole[]).includes(strRole);
}

/** Converts the API's role codes (including the older proposal-role codes) to UI roles. */
export function normalizeUserRole(strRole?: string): UserRole
{
    switch (strRole?.trim().toUpperCase())
    {
        case 'SYSTEM_ADMIN':
        case 'ADMIN':
        case 'ADMINISTRATOR':
            return ROLES.SYSTEM_ADMIN;
        case 'PROJECT_STAFF':
        case 'PSTO_STAFF':
        case 'CEST_PROJECT_STAFF':
        case 'SSCP_PROJECT_STAFF':
        case 'SSCP PROJECT STAFF':
            return ROLES.PROJECT_STAFF;
        case 'FOCAL':
        case 'FOCAL_REVIEWER':
        case 'SETUP_FOCAL':
        case 'CEST_FOCAL':
        case 'SSCP_FOCAL':
        case 'TECHNICAL_PANEL_REVIEWER':
        case 'SECTORAL_COUNCIL_STAFF':
        case 'RTEC_BOARD_MEMBER':
            return ROLES.FOCAL;
        case 'PROVINCIAL_DIRECTOR':
        case 'PSTO_DIRECTOR':
        case 'REGIONAL_DIRECTOR':
        case 'EXECOM_MEMBER':
            return ROLES.PROVINCIAL_DIRECTOR;
        case 'RPMO':
        case 'RPMO_STAFF':
            return ROLES.RPMO;
        case 'FINANCE_OFFICER':
            return ROLES.FINANCE_OFFICER;
        case 'PROPONENT':
        case 'MSME_PROPONENT':
        case 'GIA_PROJECT_LEADER':
            return ROLES.PROPONENT;
        default:
            return ROLES.PROPONENT;
    }
} /* end normalizeUserRole */
