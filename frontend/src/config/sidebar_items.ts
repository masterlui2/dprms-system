/**
 * System: DPRMS
 * Purpose: Sidebar items definitions for DPRMS.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { LucideIcon } from 'lucide-react';
import
{
    Activity,
    BarChart3,
    Bell,
    Building2,
    ClipboardCheck,
    DatabaseBackup,
    FilePenLine,
    FolderKanban,
    LayoutDashboard,
    MapPinned,
    PackageCheck,
    ReceiptText,
    ScrollText,
    Settings,
    ShieldCheck,
    Users,
    Wallet,
} from 'lucide-react';

import type { ApplicationProgram } from '../types/application';
import
{
    canAccessModule,
    g_objModulePermissions,
    type ModuleId,
    type UserRole,
} from './permissions';

export type SidebarSubItem = {
    id: ModuleId;
    label: string;
    route: string;
    icon?: LucideIcon;
};

/** One menu record per internal DPRMS module. Shared roles use the same record. */
export type SidebarItem = {
    id: ModuleId;
    label: string;
    icon: LucideIcon;
    route: string;
    allowedRoles: readonly UserRole[];
    subItems?: SidebarSubItem[];
};

/** Item. */
/** Item. */
const _item = (
    strId: ModuleId,
    strLabel: string,
    icon: LucideIcon,
    strRoute: string,
    arrSubItems?: SidebarSubItem[],
): SidebarItem => ({
    id: strId,
    label: strLabel,
    icon,
    route: strRoute,
    allowedRoles: g_objModulePermissions[strId],
    subItems: arrSubItems,
});

export const SIDEBAR_ITEMS: SidebarItem[] = [
    _item('dashboard', 'Dashboard', LayoutDashboard, '/dashboard'),

    _item('applications', 'Applications', FilePenLine, '/dashboard/applications'),
    _item(
        'documentChecklist',
        'Document Checklist',
        ClipboardCheck,
        '/dashboard/document-checklist',
        [
            {
                id: 'documentChecklist',
                label: 'SETUP Checklist',
                route: '/dashboard/document-checklist?program=SETUP',
            },
            {
                id: 'documentChecklist',
                label: 'GIA Checklist',
                route: '/dashboard/document-checklist?program=GIA',
            },
        ],
    ),
    _item('equipmentTracking', 'Equipment & QR', PackageCheck, '/dashboard/equipment-tracking'),
    _item(
        'repaymentMonitoring',
        'Repayment Ledger',
        ReceiptText,
        '/dashboard/repayment-monitoring',
    ),

    _item('projectMonitoring', 'Project Monitoring', Activity, '/dashboard/project-monitoring', [
        {
            id: 'projectMonitoring',
            label: 'Overview',
            route: '/dashboard/project-monitoring?view=overview',
        },
        {
            id: 'projectMonitoring',
            label: 'Monitored Projects',
            route: '/dashboard/project-monitoring?view=projects',
        },
    ]),
    _item('projects', 'Projects', FolderKanban, '/dashboard/projects'),
    _item('regionalMonitoring', 'Regional Monitoring', Activity, '/dashboard/regional-monitoring'),
    _item('reports', 'Reports', BarChart3, '/dashboard/reports'),

    _item('userManagement', 'User Management', Users, '/dashboard/users'),
    _item('roleManagement', 'Role Management', ShieldCheck, '/dashboard/roles'),
    _item('programManagement', 'Program Management', Building2, '/dashboard/programs'),
    _item(
        'municipalityManagement',
        'Municipality Management',
        MapPinned,
        '/dashboard/municipalities',
    ),
    _item('budgetCategories', 'Budget Categories', Wallet, '/dashboard/budget-categories'),
    _item(
        'notificationManagement',
        'Notification Management',
        Bell,
        '/dashboard/notification-management',
    ),
    _item('auditLogs', 'Audit Logs', ScrollText, '/dashboard/audit-logs'),
    _item('backup', 'Backup', DatabaseBackup, '/dashboard/backup'),
    _item('systemSettings', 'System Settings', Settings, '/dashboard/system-settings'),
];

const SIDEBAR_ORDER_BY_ROLE: Record<UserRole, ModuleId[]> = {
    system_admin: [
        'dashboard',
        'documentChecklist',
        'userManagement',
        'roleManagement',
        'programManagement',
        'municipalityManagement',
        'budgetCategories',
        'notificationManagement',
        'auditLogs',
        'backup',
        'systemSettings',
    ],
    project_staff: [
        'dashboard',
        'applications',
        'documentChecklist',
        'equipmentTracking',
        'projectMonitoring',
        'reports',
    ],
    focal: [
        'dashboard',
        'applications',
        'documentChecklist',
        'projectMonitoring',
        'repaymentMonitoring',
        'reports',
    ],
    provincial_director: [
        'dashboard',
        'applications',
        'documentChecklist',
        'repaymentMonitoring',
        'projectMonitoring',
        'projects',
        'reports',
    ],
    rpmo: [
        'dashboard',
        'applications',
        'documentChecklist',
        'projectMonitoring',
        'regionalMonitoring',
        'reports',
    ],
    proponent: [],
    finance_officer: ['dashboard', 'repaymentMonitoring', 'reports'],
};

/** Get sidebar items. */
export function getSidebarItems(
    strRole: UserRole,
    strUserProgram?: ApplicationProgram,
    strBackendRole?: string,
)
{
    const arrOrder = SIDEBAR_ORDER_BY_ROLE[strRole];
    return SIDEBAR_ITEMS.filter(
        (objSidebarItem) =>
            arrOrder.includes(objSidebarItem.id) &&
            canAccessModule(strRole, objSidebarItem.id, strUserProgram, strBackendRole),
    )
        .map(
            (objSidebarItem) =>
            {
                if (objSidebarItem.id === 'documentChecklist')
                {
                    if ((strRole === 'focal' || strRole === 'project_staff') && strUserProgram)
                    {
                        return {
                            ...objSidebarItem,
                            label: 'Document Checklist',
                            route: `/dashboard/document-checklist?program=${strUserProgram}`,
                            subItems: undefined,
                        };
                    }
                    return {
                        ...objSidebarItem,
                        label: 'Document Checklist',
                        subItems: [
                            {
                                id: 'documentChecklist' as ModuleId,
                                label: 'SETUP Program',
                                route: '/dashboard/document-checklist?program=SETUP',
                            },
                            {
                                id: 'documentChecklist' as ModuleId,
                                label: 'GIA Program',
                                route: '/dashboard/document-checklist?program=GIA',
                            },
                        ],
                    };
                } /* end if */
                return objSidebarItem;
            } /* end getSidebarItems */,
        )
        .sort((objLeft, objRight) => arrOrder.indexOf(objLeft.id) - arrOrder.indexOf(objRight.id));
} /* end getSidebarItems */
