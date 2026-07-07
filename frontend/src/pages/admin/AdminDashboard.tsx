import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  CalendarDays,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminPanel } from "../../components/admin/AdminPanel";
import { MetricCard } from "../../components/admin/MetricCard";
import { SiteVisitCalendarModal } from "../../components/admin/site-visits/SiteVisitCalendarModal";
import { StatusPill } from "../../components/admin/StatusPill";
import { featureImportance, predictions } from "../../data/admin";
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
  const chartBars = predictions.map((prediction) => ({
    label: prediction.enterprise.replace("DOrSU Research Center", "DOrSU"),
    value: prediction.riskScore,
  }));
  const analyticsOverviewPanel = (
    <AdminPanel
      description="Quick view of prediction movement and risk spread"
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
                Risk distribution
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Lower bars mean stronger renewal readiness.
              </p>
            </div>
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#0f53b7]">
              <BarChart3 className="size-4" />
            </span>
          </div>

          <div className="mt-3 flex h-24 items-end gap-2">
            {chartBars.map((bar) => (
              <div
                className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
                key={bar.label}
              >
                <div className="flex h-16 w-full items-end rounded-t-lg bg-slate-100 px-1">
                  <div
                    className={cn(
                      "w-full rounded-t-md",
                      bar.value >= 70
                        ? "bg-red-500"
                        : bar.value >= 45
                          ? "bg-amber-500"
                          : "bg-[#0f53b7]",
                    )}
                    style={{ height: `${bar.value}%` }}
                  />
                </div>
                <p className="w-full truncate text-center text-[10px] font-bold text-slate-500">
                  {bar.label}
                </p>
              </div>
            ))}
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
              {predictions.map((prediction) => (
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
