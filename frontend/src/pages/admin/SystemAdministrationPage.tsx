import { CheckCircle2, Database, Loader2, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminPanel } from "../../components/admin/AdminPanel";
import api from "../../lib/axios";

export type AdministrationModule =
  | "users"
  | "roles"
  | "programs"
  | "municipalities"
  | "budgets"
  | "notifications"
  | "backup"
  | "settings";

interface AdminRole {
  id: number;
  name: string;
  code: string;
  program_type: string;
  description: string | null;
  user_count: number;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  program_type: string | null;
  last_login_at: string | null;
  role: AdminRole[];
}

interface AdminOverview {
  users: AdminUser[];
  roles: AdminRole[];
  programs: Array<{ code: string; proposals: number; projects: number; active_projects: number }>;
  municipalities: Array<{ city_municipality: string; province: string | null; records_count: number }>;
  budgets: Array<{ program_type: string; status: string; records_count: number; total_amount: string }>;
  notifications: Array<{ type: string; records_count: number; unread_count: number }>;
  system: { database: string; latest_migration: string | null; users: number; audit_logs: number; backup_available: boolean };
}

const moduleCopy: Record<AdministrationModule, { title: string; description: string }> = {
  users: { title: "User Management", description: "Manage account access and role assignments." },
  roles: { title: "Role Management", description: "Review configured roles, program scope, and assigned users." },
  programs: { title: "Program Management", description: "View live SETUP and GIA workloads." },
  municipalities: { title: "Municipalities", description: "View locations currently used by project records." },
  budgets: { title: "Budget Categories", description: "Review live project budget groups by program and status." },
  notifications: { title: "Notification Management", description: "Review notification volume and unread items by type." },
  backup: { title: "Backup", description: "Check database readiness and backup availability." },
  settings: { title: "System Settings", description: "Review the current system and database configuration status." },
};

function dateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString("en-PH") : "Never";
}

function money(value: string): string {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(value));
}

export function SystemAdministrationPage({ module }: { module: AdministrationModule }) {
  const copy = moduleCopy[module];
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ data: AdminOverview }>("/system-administration/overview");
      setData(response.data.data);
    } catch (requestError) {
      console.error("Failed to load system administration data:", requestError);
      setError("The administration data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function setUserStatus(user: AdminUser) {
    setSavingUserId(user.id);
    setError(null);
    try {
      const response = await api.patch<{ data: AdminUser }>(`/system-administration/users/${user.id}/status`, { is_active: !user.is_active });
      setData((current) => current ? { ...current, users: current.users.map((item) => item.id === user.id ? response.data.data : item) } : current);
    } catch (requestError) {
      const message = (requestError as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(message ?? "The account status could not be updated.");
    } finally {
      setSavingUserId(null);
    }
  }

  async function setUserRole(user: AdminUser, roleId: number) {
    setSavingUserId(user.id);
    setError(null);
    try {
      const response = await api.put<{ data: AdminUser }>(`/system-administration/users/${user.id}/role`, { role_id: roleId });
      setData((current) => current ? { ...current, users: current.users.map((item) => item.id === user.id ? response.data.data : item) } : current);
    } catch (requestError) {
      const message = (requestError as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(message ?? "The role could not be updated.");
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        action={<button className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50" onClick={() => void load()} type="button"><RefreshCw className="size-4" /> Refresh</button>}
        description={copy.description}
        eyebrow="System Administration"
        title={copy.title}
      />
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      {loading ? (
        <div className="grid min-h-56 place-items-center rounded-2xl border border-slate-200 bg-white"><span className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Loader2 className="size-5 animate-spin" /> Loading current data…</span></div>
      ) : data ? (
        <AdminPanel title={copy.title}>
          {module === "users" ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Program</th><th className="px-5 py-3">Last login</th><th className="px-5 py-3 text-right">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-5 py-4"><p className="font-bold text-slate-900">{user.name}</p><p className="text-xs text-slate-500">{user.email}</p></td>
                      <td className="px-5 py-4"><select aria-label={`Role for ${user.name}`} className="h-9 min-w-44 rounded-lg border border-slate-300 bg-white px-2 text-sm" disabled={savingUserId === user.id} onChange={(event) => void setUserRole(user, Number(event.target.value))} value={user.role[0]?.id ?? ""}><option disabled value="">No role</option>{data.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></td>
                      <td className="px-5 py-4 text-slate-600">{user.program_type ?? user.role[0]?.program_type ?? "—"}</td>
                      <td className="px-5 py-4 text-slate-500">{dateTime(user.last_login_at)}</td>
                      <td className="px-5 py-4 text-right"><button className={`rounded-full px-3 py-1.5 text-xs font-black ${user.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`} disabled={savingUserId === user.id} onClick={() => void setUserStatus(user)} type="button">{savingUserId === user.id ? "Saving…" : user.is_active ? "Active" : "Inactive"}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : module === "roles" ? (
            <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">{data.roles.map((role) => <div className="rounded-xl border border-slate-200 p-4" key={role.id}><div className="flex items-center justify-between"><ShieldCheck className="size-5 text-[#0f5cc0]" /><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{role.user_count} users</span></div><p className="mt-3 font-black text-slate-900">{role.name}</p><p className="mt-1 font-mono text-xs text-[#0f5cc0]">{role.code}</p><p className="mt-2 text-xs text-slate-500">Program: {role.program_type}</p></div>)}</div>
          ) : module === "programs" ? (
            <div className="grid gap-4 p-5 md:grid-cols-2">{data.programs.map((item) => <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-5" key={item.code}><p className="text-lg font-black text-[#073b82]">{item.code}</p><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div><p className="text-xl font-black">{item.proposals}</p><p className="text-xs text-slate-500">Proposals</p></div><div><p className="text-xl font-black">{item.projects}</p><p className="text-xs text-slate-500">Projects</p></div><div><p className="text-xl font-black">{item.active_projects}</p><p className="text-xs text-slate-500">Active</p></div></div></div>)}</div>
          ) : module === "municipalities" ? (
            <SimpleTable headers={["Municipality", "Province", "Records"]} rows={data.municipalities.map((item) => [item.city_municipality, item.province ?? "—", String(item.records_count)])} />
          ) : module === "budgets" ? (
            <SimpleTable headers={["Program", "Status", "Records", "Total"]} rows={data.budgets.map((item) => [item.program_type, item.status, String(item.records_count), money(item.total_amount)])} />
          ) : module === "notifications" ? (
            <SimpleTable headers={["Type", "Total", "Unread"]} rows={data.notifications.map((item) => [item.type, String(item.records_count), String(item.unread_count)])} />
          ) : (
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <InfoCard icon={Database} label="Database" value={data.system.database.toUpperCase()} />
              <InfoCard icon={Users} label="Users" value={String(data.system.users)} />
              <InfoCard icon={ShieldCheck} label="Audit records" value={String(data.system.audit_logs)} />
              <InfoCard icon={CheckCircle2} label="Latest migration" value={data.system.latest_migration ?? "None"} />
              {module === "backup" ? <p className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Automated database backup is not configured in this installation. No backup button is shown because it would give a false success result.</p> : null}
            </div>
          )}
        </AdminPanel>
      ) : null}
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 text-sm"><thead className="bg-slate-50"><tr>{headers.map((header) => <th className="px-5 py-3 text-left text-xs uppercase tracking-wide text-slate-500" key={header}>{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.length ? rows.map((row, rowIndex) => <tr key={`${row[0]}-${rowIndex}`}>{row.map((cell, index) => <td className={`px-5 py-4 ${index === 0 ? "font-bold text-slate-900" : "text-slate-600"}`} key={`${cell}-${index}`}>{cell}</td>)}</tr>) : <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={headers.length}>No records found.</td></tr>}</tbody></table></div>;
}

function InfoCard({ icon: Icon, label, value }: { icon: typeof Database; label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 p-4"><Icon className="size-5 text-[#0f5cc0]" /><p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 break-words font-black text-slate-900">{value}</p></div>;
}
