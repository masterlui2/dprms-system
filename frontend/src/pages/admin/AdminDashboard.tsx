import { useState } from "react";
import {
  AlertTriangle,
  Brain,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminPanel } from "../../components/admin/AdminPanel";
import { MetricCard } from "../../components/admin/MetricCard";
import { SiteVisitCalendarModal } from "../../components/admin/site-visits/SiteVisitCalendarModal";
import { StatusPill } from "../../components/admin/StatusPill";
import {
  featureImportance,
  predictions,
  proposalRecords,
} from "../../data/admin";
import { cn } from "../../utils/cn";

const reminders = [
  {
    title: "Quarterly compliance report due",
    project: "GreenHarvest",
    when: "In 3 days",
    tone: "bg-red-500",
  },
  {
    title: "Site visit scheduled",
    project: "Highland Coffee",
    when: "Jul 5",
    tone: "bg-[#0f53b7]",
  },
  {
    title: "Equipment turnover activity",
    project: "Bright Foods",
    when: "Jul 12",
    tone: "bg-amber-500",
  },
];

export function AdminDashboard() {
  const [siteVisitCalendarOpen, setSiteVisitCalendarOpen] = useState(false);
  const [snapshotPage, setSnapshotPage] = useState(1);
  const snapshotRowsPerPage = 4;
  const snapshotPageCount = Math.max(
    1,
    Math.ceil(predictions.length / snapshotRowsPerPage),
  );
  const safeSnapshotPage = Math.min(snapshotPage, snapshotPageCount);
  const visiblePredictions = predictions.slice(
    (safeSnapshotPage - 1) * snapshotRowsPerPage,
    safeSnapshotPage * snapshotRowsPerPage,
  );
  const firstSnapshotRow = predictions.length
    ? (safeSnapshotPage - 1) * snapshotRowsPerPage + 1
    : 0;
  const lastSnapshotRow = Math.min(
    safeSnapshotPage * snapshotRowsPerPage,
    predictions.length,
  );
  const expanding = predictions.filter(
    (prediction) => prediction.growth === "Expanding",
  ).length;
  const sustainable = predictions.filter(
    (prediction) => prediction.sustainability === "Sustainable",
  ).length;
  const atRisk = predictions.filter(
    (prediction) => prediction.recommendation === "At risk",
  ).length;
  const renewalRecommended = predictions.filter(
    (prediction) => prediction.recommendation === "Renewal recommended",
  ).length;
  const averageRisk = Math.round(
    predictions.reduce((total, prediction) => total + prediction.riskScore, 0) /
      predictions.length,
  );
  const giaProposalCount = proposalRecords.filter(
    (proposal) => proposal.program === "GIA",
  ).length;
  const setupProposalCount = proposalRecords.filter(
    (proposal) => proposal.program === "SETUP",
  ).length;
  const totalProposalCount = proposalRecords.length;
  const giaProposalShare = Math.round(
    (giaProposalCount / Math.max(totalProposalCount, 1)) * 100,
  );
  const setupProposalShare = 100 - giaProposalShare;
  const analyticsOverviewPanel = (
    <AdminPanel
      description="Quick view of prediction movement and proposal distribution"
      title="Analytics overview"
    >
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="grid grid-cols-3 gap-3">
          {[
            ["Avg. risk", String(averageRisk), "Risk score"],
            ["Renewals", String(renewalRecommended), "Recommended"],
            ["At risk", String(atRisk), "Needs action"],
          ].map(([label, value, helper]) => (
            <div
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
              key={label}
            >
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                {label}
              </p>
              <p className="mt-1 text-xl font-black text-[#073b82]">
                {value}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">
                {helper}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-slate-900">
                GIA and SETUP proposals
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Current proposal distribution by program.
              </p>
            </div>
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#0f53b7]">
              <TrendingUp className="size-4" />
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
            <div className="flex justify-center">
              <div
                aria-label={`${giaProposalShare}% GIA proposals and ${setupProposalShare}% SETUP proposals`}
                className="grid size-36 place-items-center rounded-full"
                role="img"
                style={{
                  background: `conic-gradient(#0f53b7 0deg ${
                    giaProposalShare * 3.6
                  }deg, #f59e0b ${giaProposalShare * 3.6}deg 360deg)`,
                }}
              >
                <div className="grid size-24 place-items-center rounded-full bg-white">
                  <div className="text-center">
                    <p className="text-2xl font-black text-slate-900">
                      {totalProposalCount}
                    </p>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Proposals
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {[
                {
                  count: giaProposalCount,
                  label: "GIA",
                  share: giaProposalShare,
                  tone: "bg-[#0f53b7]",
                },
                {
                  count: setupProposalCount,
                  label: "SETUP",
                  share: setupProposalShare,
                  tone: "bg-amber-500",
                },
              ].map((item) => (
                <div
                  className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  key={item.label}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2.5 rounded-full", item.tone)} />
                      <span className="text-sm font-black text-slate-800">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-sm font-black text-[#073b82]">
                      {item.count}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white">
                      <div
                        className={cn("h-full rounded-full", item.tone)}
                        style={{ width: `${item.share}%` }}
                      />
                    </div>
                    <span className="w-9 text-right text-xs font-black text-slate-500">
                      {item.share}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminPanel>
  );

  return (
    <div className="space-y-7">
      <AdminPageHeader
        description=""
        eyebrow="Prediction Analysis"
        title="Prediction analysis stats"
      />

      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <MetricCard
          detail="Current prediction batch"
          icon={Brain}
          label="MSMEs Assessed"
          value={String(predictions.length)}
        />
        <MetricCard
          detail="Enterprises showing upward momentum"
          icon={TrendingUp}
          label="Expanding"
          tone="sky"
          value={String(expanding)}
        />
        <MetricCard
          detail="Low sustainability risk"
          icon={ShieldCheck}
          label="Sustainable"
          tone="green"
          value={String(sustainable)}
        />
        <MetricCard
          detail="Needs immediate intervention"
          icon={AlertTriangle}
          label="At Risk"
          tone="red"
          value={String(atRisk)}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="space-y-5">
          {analyticsOverviewPanel}

          <AdminPanel title="Prediction snapshot">
            <div className="divide-y divide-slate-100">
              {visiblePredictions.map((prediction) => (
                <article
                  className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center"
                  key={prediction.projectId}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900">
                      {prediction.enterprise}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {prediction.projectId}
                    </p>
                  </div>
                  <div className="flex min-w-[180px] items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={
                          prediction.riskScore >= 70
                            ? "h-full bg-red-500"
                            : prediction.riskScore >= 45
                              ? "h-full bg-amber-500"
                              : "h-full bg-emerald-500"
                        }
                        style={{ width: `${prediction.riskScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-slate-700">
                      {prediction.riskScore}
                    </span>
                  </div>
                  <StatusPill
                    tone={
                      prediction.recommendation === "Renewal recommended"
                        ? "success"
                        : prediction.recommendation === "At risk"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {prediction.recommendation}
                  </StatusPill>
                </article>
              ))}
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-slate-500">
                Showing {firstSnapshotRow}-{lastSnapshotRow} of{" "}
                {predictions.length}
              </p>
              <nav
                aria-label="Prediction snapshot pagination"
                className="flex items-center gap-1"
              >
                <button
                  aria-label="Previous prediction snapshot page"
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={safeSnapshotPage === 1}
                  onClick={() =>
                    setSnapshotPage((current) => Math.max(1, current - 1))
                  }
                  type="button"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="min-w-20 text-center text-xs font-bold text-slate-600">
                  Page {safeSnapshotPage} of {snapshotPageCount}
                </span>
                <button
                  aria-label="Next prediction snapshot page"
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={safeSnapshotPage === snapshotPageCount}
                  onClick={() =>
                    setSnapshotPage((current) =>
                      Math.min(snapshotPageCount, current + 1),
                    )
                  }
                  type="button"
                >
                  <ChevronRight className="size-4" />
                </button>
              </nav>
            </div>
          </AdminPanel>
        </div>

        <div className="space-y-5">
          <AdminPanel
            action={
              <button
                aria-label="Open site visit calendar"
                className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 text-[#0f53b7] transition hover:border-blue-300 hover:bg-blue-50"
                onClick={() => setSiteVisitCalendarOpen(true)}
                title="Open site visit calendar"
                type="button"
              >
                <CalendarDays className="size-5" />
              </button>
            }
            title="Upcoming reminders"
          >
            <ul className="divide-y divide-slate-100">
              {reminders.map((reminder) => (
                <li
                  className="flex items-start gap-4 px-5 py-5"
                  key={reminder.title}
                >
                  <span
                    className={cn(
                      "mt-2 size-2.5 shrink-0 rounded-full",
                      reminder.tone,
                    )}
                  />
                  <div>
                    <p className="text-base font-black text-slate-900">
                      {reminder.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {reminder.project} - {reminder.when}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </AdminPanel>

          <AdminPanel
            description="Most influential drivers in the current scoring model"
            title="Key model signals"
          >
            <div className="space-y-5 p-5">
              {featureImportance.map((feature) => (
                <div key={feature.label}>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-700">
                      {feature.label}
                    </span>
                    <span className="font-black text-[#073b82]">
                      {feature.value}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#0f53b7]"
                      style={{ width: `${feature.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </AdminPanel>
        </div>
      </div>

      {siteVisitCalendarOpen ? (
        <SiteVisitCalendarModal
          onClose={() => setSiteVisitCalendarOpen(false)}
        />
      ) : null}
    </div>
  );
}
