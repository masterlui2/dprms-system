import { Bell, FileClock, FilePlus2, FolderKanban } from "lucide-react";
import { Link } from "react-router-dom";

import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminPanel } from "../../components/admin/AdminPanel";
import { MetricCard } from "../../components/admin/MetricCard";
import { StatusPill } from "../../components/admin/StatusPill";

const myProposals = [
  {
    id: "PR-2026-041",
    title: "Cacao Processing Line Modernization",
    status: "For screening",
    updated: "Updated today",
  },
  {
    id: "PR-2026-029",
    title: "Shared Packaging Facility Upgrade",
    status: "Needs revision",
    updated: "Updated Jul 5, 2026",
  },
  {
    id: "PR-2026-017",
    title: "Food Safety Laboratory Tools",
    status: "Approved",
    updated: "Updated Jun 26, 2026",
  },
];

const notices = [
  "Upload the revised financial statements for PR-2026-029 before July 12.",
  "Your latest accomplishment report is due in 4 days.",
  "The regional review team added comments to your packaging facility proposal.",
];

export function ProponentDashboard() {
  return (
    <div className="space-y-7">
      <AdminPageHeader
        description="Track your proposal pipeline, submission requirements, and reporting deadlines from one workspace."
        eyebrow="Project Proponent"
        title="Proponent overview"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail="In active review cycles"
          icon={FolderKanban}
          label="Open Proposals"
          value="3"
        />
        <MetricCard
          detail="Awaiting submission updates"
          icon={FileClock}
          label="Action Items"
          tone="orange"
          value="2"
        />
        <MetricCard
          detail="Latest DOST account notices"
          icon={Bell}
          label="Unread Notifications"
          tone="sky"
          value="3"
        />
        <MetricCard
          detail="Already endorsed this year"
          icon={FilePlus2}
          label="Approved Proposals"
          tone="green"
          value="1"
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
        <AdminPanel title="My proposals">
          <div className="divide-y divide-slate-100">
            {myProposals.map((proposal) => (
              <article
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
                key={proposal.id}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">{proposal.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {proposal.id} - {proposal.updated}
                  </p>
                </div>
                <StatusPill
                  tone={
                    proposal.status === "Approved"
                      ? "success"
                      : proposal.status === "Needs revision"
                        ? "warning"
                        : "info"
                  }
                >
                  {proposal.status}
                </StatusPill>
              </article>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Quick actions">
          <div className="space-y-3 p-5">
            <Link
              className="flex items-center justify-between rounded-2xl border border-[#d8e1ee] bg-[#f8fbff] px-4 py-4 font-bold text-[#073b82] transition hover:border-blue-300 hover:bg-blue-50"
              to="/proposal"
            >
              <span>Open proposal form</span>
              <FilePlus2 className="size-4" />
            </Link>
            <Link
              className="flex items-center justify-between rounded-2xl border border-[#d8e1ee] bg-[#f8fbff] px-4 py-4 font-bold text-[#073b82] transition hover:border-blue-300 hover:bg-blue-50"
              to="/dashboard/reports"
            >
              <span>View reports and insights</span>
              <FolderKanban className="size-4" />
            </Link>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-bold">Current notices</p>
              <ul className="mt-2 space-y-2 text-xs leading-5">
                {notices.map((notice) => (
                  <li key={notice}>{notice}</li>
                ))}
              </ul>
            </div>
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
