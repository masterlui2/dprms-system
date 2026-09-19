/**
 * System: DPRMS
 * Purpose: Render system administration page for the application pages.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { CheckCircle2, Database, Loader2, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { reportError } from '../../utils/error_reporting';

import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminPanel } from '../../components/admin/AdminPanel';
import g_objApi from '../../lib/axios';

export type AdministrationModule =
    | 'users'
    | 'roles'
    | 'programs'
    | 'municipalities'
    | 'budgets'
    | 'notifications'
    | 'backup'
    | 'settings';

interface AdminRole
{
    id: number;
    name: string;
    code: string;
    program_type: string;
    description: string | null;
    user_count: number;
}

interface AdminUser
{
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    program_type: string | null;
    last_login_at: string | null;
    role: AdminRole[];
}

interface AdminOverview
{
    users: AdminUser[];
    roles: AdminRole[];
    programs: Array<{ code: string; proposals: number; projects: number; active_projects: number; }>;
    municipalities: Array<{
        city_municipality: string;
        province: string | null;
        records_count: number;
    }>;
    budgets: Array<{
        program_type: string;
        status: string;
        records_count: number;
        total_amount: string;
    }>;
    notifications: Array<{ type: string; records_count: number; unread_count: number; }>;
    system: {
        database: string;
        latest_migration: string | null;
        users: number;
        audit_logs: number;
        backup_available: boolean;
    };
}

const MODULE_COPY: Record<AdministrationModule, { title: string; description: string; }> = {
    users: { title: 'User Management', description: 'Manage account access and role assignments.' },
    roles: {
        title: 'Role Management',
        description: 'Review configured roles, program scope, and assigned users.',
    },
    programs: { title: 'Program Management', description: 'View live SETUP and GIA workloads.' },
    municipalities: {
        title: 'Municipalities',
        description: 'View locations currently used by project records.',
    },
    budgets: {
        title: 'Budget Categories',
        description: 'Review live project budget groups by program and status.',
    },
    notifications: {
        title: 'Notification Management',
        description: 'Review notification volume and unread items by type.',
    },
    backup: { title: 'Backup', description: 'Check database readiness and backup availability.' },
    settings: {
        title: 'System Settings',
        description: 'Review the current system and database configuration status.',
    },
};

/** Date time. */
function _dateTime(strValue: string | null): string
{
    return strValue ? new Date(strValue).toLocaleString('en-PH') : 'Never';
}

/** Money. */
function _money(strValue: string): string
{
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(
        Number(strValue),
    );
}

/** Render system administration page and its available actions. */
export function SystemAdministrationPage({ strModule }: { strModule: AdministrationModule; })
{
    const objCopy = MODULE_COPY[strModule];
    const [objData, setObjData] = useState<AdminOverview | null>(null);
    const [blnLoading, setBlnLoading] = useState(true);
    const [strError, setStrError] = useState<string | null>(null);
    const [intSavingUserId, setIntSavingUserId] = useState<number | null>(null);

    const _load = useCallback(async () =>
    {
        setBlnLoading(true);
        setStrError(null);
        try
        {
            const objResponse = await g_objApi.get<{ data: AdminOverview; }>(
                '/system-administration/overview',
            );
            setObjData(objResponse.data.data);
        } catch (errRequestError)
        {
            reportError(errRequestError, 'SystemAdministrationPage: load failed.');

            reportError(errRequestError, 'Failed to load system administration data:');
            setStrError('The administration data could not be loaded.');
        } finally
        {
            setBlnLoading(false);
        }
    }, []);

    useEffect(() =>
    {
        void _load();
    }, [_load]);

    /** Set user status. */
    async function _setUserStatus(objUser: AdminUser)
    {
        setIntSavingUserId(objUser.id);
        setStrError(null);
        try
        {
            const objResponse = await g_objApi.patch<{ data: AdminUser; }>(
                `/system-administration/users/${objUser.id}/status`,
                { is_active: !objUser.is_active },
            );
            setObjData((objCurrent) =>
                objCurrent
                    ? {
                        ...objCurrent,
                        users: objCurrent.users.map((objItem) =>
                            objItem.id === objUser.id ? objResponse.data.data : objItem,
                        ),
                    }
                    : objCurrent,
            );
        } catch (errRequestError)
        {
            reportError(errRequestError, 'SystemAdministrationPage: set user status failed.');

            const txtMessage = (errRequestError as { response?: { data?: { message?: string; }; }; })
                .response?.data?.message;
            setStrError(txtMessage ?? 'The account status could not be updated.');
        } finally
        {
            setIntSavingUserId(null);
        }
    }

    /** Set user role. */
    async function _setUserRole(objUser: AdminUser, intRoleId: number)
    {
        setIntSavingUserId(objUser.id);
        setStrError(null);
        try
        {
            const objResponse = await g_objApi.put<{ data: AdminUser; }>(
                `/system-administration/users/${objUser.id}/role`,
                { role_id: intRoleId },
            );
            setObjData((objCurrent) =>
                objCurrent
                    ? {
                        ...objCurrent,
                        users: objCurrent.users.map((objItem) =>
                            objItem.id === objUser.id ? objResponse.data.data : objItem,
                        ),
                    }
                    : objCurrent,
            );
        } catch (errRequestError)
        {
            reportError(errRequestError, 'SystemAdministrationPage: set user role failed.');

            const txtMessage = (errRequestError as { response?: { data?: { message?: string; }; }; })
                .response?.data?.message;
            setStrError(txtMessage ?? 'The role could not be updated.');
        } finally
        {
            setIntSavingUserId(null);
        }
    }

    return (
        <div className="space-y-6">
            <AdminPageHeader
                objAction={
                    <button
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                        onClick={() => void _load()}
                        type="button"
                    >
                        <RefreshCw className="size-4" /> Refresh
                    </button>
                }
                txtDescription={objCopy.description}
                strEyebrow="System Administration"
                title={objCopy.title}
            />
            {strError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                    {strError}
                </div>
            ) : null}
            {blnLoading ? (
                <div className="grid min-h-56 place-items-center rounded-2xl border border-slate-200 bg-white">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                        <Loader2 className="size-5 animate-spin" /> Loading current data…
                    </span>
                </div>
            ) : objData ? (
                <AdminPanel title={objCopy.title}>
                    {strModule === 'users' ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-5 py-3">User</th>
                                        <th className="px-5 py-3">Role</th>
                                        <th className="px-5 py-3">Program</th>
                                        <th className="px-5 py-3">Last login</th>
                                        <th className="px-5 py-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {objData.users.map((objUser) => (
                                        <tr key={objUser.id}>
                                            <td className="px-5 py-4">
                                                <p className="font-bold text-slate-900">
                                                    {objUser.name}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {objUser.email}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <select
                                                    aria-label={`Role for ${objUser.name}`}
                                                    className="h-9 min-w-44 rounded-lg border border-slate-300 bg-white px-2 text-sm"
                                                    disabled={intSavingUserId === objUser.id}
                                                    onChange={(objEvent) =>
                                                        void _setUserRole(
                                                            objUser,
                                                            Number(objEvent.target.value),
                                                        )
                                                    }
                                                    value={objUser.role[0]?.id ?? ''}
                                                >
                                                    <option disabled value="">
                                                        No role
                                                    </option>
                                                    {objData.roles.map((objRole) => (
                                                        <option key={objRole.id} value={objRole.id}>
                                                            {objRole.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-5 py-4 text-slate-600">
                                                {objUser.program_type ??
                                                    objUser.role[0]?.program_type ??
                                                    '—'}
                                            </td>
                                            <td className="px-5 py-4 text-slate-500">
                                                {_dateTime(objUser.last_login_at)}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    className={`rounded-full px-3 py-1.5 text-xs font-black ${objUser.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                                                    disabled={intSavingUserId === objUser.id}
                                                    onClick={() => void _setUserStatus(objUser)}
                                                    type="button"
                                                >
                                                    {intSavingUserId === objUser.id
                                                        ? 'Saving…'
                                                        : objUser.is_active
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : strModule === 'roles' ? (
                        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
                            {objData.roles.map((objRole) => (
                                <div
                                    className="rounded-xl border border-slate-200 p-4"
                                    key={objRole.id}
                                >
                                    <div className="flex items-center justify-between">
                                        <ShieldCheck className="size-5 text-[#0f5cc0]" />
                                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                                            {objRole.user_count} users
                                        </span>
                                    </div>
                                    <p className="mt-3 font-black text-slate-900">{objRole.name}</p>
                                    <p className="mt-1 font-mono text-xs text-[#0f5cc0]">
                                        {objRole.code}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-500">
                                        Program: {objRole.program_type}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : strModule === 'programs' ? (
                        <div className="grid gap-4 p-5 md:grid-cols-2">
                            {objData.programs.map((objItem) => (
                                <div
                                    className="rounded-xl border border-blue-100 bg-blue-50/40 p-5"
                                    key={objItem.code}
                                >
                                    <p className="text-lg font-black text-[#073b82]">
                                        {objItem.code}
                                    </p>
                                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <p className="text-xl font-black">
                                                {objItem.proposals}
                                            </p>
                                            <p className="text-xs text-slate-500">Proposals</p>
                                        </div>
                                        <div>
                                            <p className="text-xl font-black">{objItem.projects}</p>
                                            <p className="text-xs text-slate-500">Projects</p>
                                        </div>
                                        <div>
                                            <p className="text-xl font-black">
                                                {objItem.active_projects}
                                            </p>
                                            <p className="text-xs text-slate-500">Active</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : strModule === 'municipalities' ? (
                        <SimpleTable
                            arrHeaders={['Municipality', 'Province', 'Records']}
                            arrRows={objData.municipalities.map((objItem) => [
                                objItem.city_municipality,
                                objItem.province ?? '—',
                                String(objItem.records_count),
                            ])}
                        />
                    ) : strModule === 'budgets' ? (
                        <SimpleTable
                            arrHeaders={['Program', 'Status', 'Records', 'Total']}
                            arrRows={objData.budgets.map((objItem) => [
                                objItem.program_type,
                                objItem.status,
                                String(objItem.records_count),
                                _money(objItem.total_amount),
                            ])}
                        />
                    ) : strModule === 'notifications' ? (
                        <SimpleTable
                            arrHeaders={['Type', 'Total', 'Unread']}
                            arrRows={objData.notifications.map((objItem) => [
                                objItem.type,
                                String(objItem.records_count),
                                String(objItem.unread_count),
                            ])}
                        />
                    ) : (
                        <div className="grid gap-4 p-5 md:grid-cols-2">
                            <InfoCard
                                icon={Database}
                                strLabel="Database"
                                value={objData.system.database.toUpperCase()}
                            />
                            <InfoCard
                                icon={Users}
                                strLabel="Users"
                                value={String(objData.system.users)}
                            />
                            <InfoCard
                                icon={ShieldCheck}
                                strLabel="Audit records"
                                value={String(objData.system.audit_logs)}
                            />
                            <InfoCard
                                icon={CheckCircle2}
                                strLabel="Latest migration"
                                value={objData.system.latest_migration ?? 'None'}
                            />
                            {strModule === 'backup' ? (
                                <p className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                    Automated database backup is not configured in this
                                    installation. No backup button is shown because it would give a
                                    false success result.
                                </p>
                            ) : null}
                        </div>
                    )}
                </AdminPanel>
            ) : null}
        </div>
    ); // end return
} /* end SystemAdministrationPage */

/** Render simple table and its available actions. */
function SimpleTable({ arrHeaders, arrRows }: { arrHeaders: string[]; arrRows: string[][]; })
{
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                    <tr>
                        {arrHeaders.map((strHeader) => (
                            <th
                                className="px-5 py-3 text-left text-xs uppercase tracking-wide text-slate-500"
                                key={strHeader}
                            >
                                {strHeader}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {arrRows.length ? (
                        arrRows.map((arrRow, intRowIndex) => (
                            <tr key={`${arrRow[0]}-${intRowIndex}`}>
                                {arrRow.map((strCell, intIndex) => (
                                    <td
                                        className={`px-5 py-4 ${intIndex === 0 ? 'font-bold text-slate-900' : 'text-slate-600'}`}
                                        key={`${strCell}-${intIndex}`}
                                    >
                                        {strCell}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                className="px-5 py-8 text-center text-slate-500"
                                colSpan={arrHeaders.length}
                            >
                                No records found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

/** Render info card and its available actions. */
function InfoCard({
    icon: Icon,
    strLabel,
    value: strValue,
}: {
    icon: typeof Database;
    strLabel: string;
    value: string;
})
{
    return (
        <div className="rounded-xl border border-slate-200 p-4">
            <Icon className="size-5 text-[#0f5cc0]" />
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                {strLabel}
            </p>
            <p className="mt-1 break-words font-black text-slate-900">{strValue}</p>
        </div>
    );
}
