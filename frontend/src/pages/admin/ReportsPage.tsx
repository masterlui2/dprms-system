import {
  BarChart3,
  ChevronDown,
  Download,
  FileBarChart,
  FileSpreadsheet,
  History,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { AdminPanel } from "../../components/admin/AdminPanel";
import { DataTable, type DataColumn } from "../../components/admin/DataTable";
import { StatusPill } from "../../components/admin/StatusPill";
import {
  generatedReports,
  predictions,
  reportCatalog,
  type PredictionRecord,
} from "../../data/admin";

const reportStats = reportCatalog.map((report, index) => {
  const generatedCount =
    index === 0 ? 8 : index === 1 ? 5 : index === 2 ? 3 : 2;

  return {
    ...report,
    generatedCount,
    share: Math.round((generatedCount / 18) * 100),
  };
});

const analyticsCards = [
  {
    label: "Total Reports",
    value: "21.2k",
    detail: "Generated records",
    trend: "+12.7%",
    trendTone: "text-emerald-600",
    icon: FileBarChart,
    iconTone: "bg-blue-50 text-[#0f53b7]",
  },
  {
    label: "Templates Used",
    value: "1.6k",
    detail: "Report requests",
    trend: "+112.7%",
    trendTone: "text-emerald-600",
    icon: FileSpreadsheet,
    iconTone: "bg-violet-50 text-violet-600",
  },
  {
    label: "Pending Review",
    value: "826",
    detail: "Needs validation",
    trend: "-24.2%",
    trendTone: "text-red-500",
    icon: History,
    iconTone: "bg-amber-50 text-amber-600",
  },
  {
    label: "Compliance Rate",
    value: "18.2%",
    detail: "Engagement rate",
    trend: "+112.7%",
    trendTone: "text-emerald-600",
    icon: BarChart3,
    iconTone: "bg-emerald-50 text-emerald-600",
  },
];

const predictionColumns: DataColumn<PredictionRecord>[] = [
  {
    id: "enterprise",
    header: "Enterprise",
    sortValue: (prediction) => prediction.enterprise,
    render: (prediction) => (
      <div>
        <p className="font-bold text-slate-900">{prediction.enterprise}</p>
        <p className="mt-1 text-xs text-slate-500">{prediction.projectId}</p>
      </div>
    ),
  },
  {
    id: "growth",
    header: "Growth",
    sortValue: (prediction) => prediction.growth,
    render: (prediction) => (
      <StatusPill
        tone={
          prediction.growth === "Expanding"
            ? "success"
            : prediction.growth === "Declining"
              ? "danger"
              : "neutral"
        }
      >
        {prediction.growth}
      </StatusPill>
    ),
  },
  {
    id: "sustainability",
    header: "Sustainability",
    sortValue: (prediction) => prediction.sustainability,
    render: (prediction) => (
      <span className="font-semibold text-slate-700">
        {prediction.sustainability}
      </span>
    ),
  },
  {
    id: "risk",
    header: "Risk Score",
    sortValue: (prediction) => prediction.riskScore,
    render: (prediction) => (
      <div className="flex items-center gap-2">
        <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
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
    ),
  },
  {
    id: "recommendation",
    header: "Recommendation",
    sortValue: (prediction) => prediction.recommendation,
    render: (prediction) => (
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
    ),
  },
];

export function ReportsPage() {
  return (
    <div className="space-y-7">
      <section className="rounded-2xl border border-[#d8e1ee] bg-[#f5f8fc] p-5 shadow-[0_14px_36px_-32px_rgba(15,23,42,0.75)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-black text-slate-800">
            Analytics Overview
          </h2>
          <button
            className="inline-flex h-9 w-fit items-center gap-2 rounded-lg bg-white px-3 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:text-[#073b82]"
            type="button"
          >
            Last 30 days
            <ChevronDown className="size-3.5" />
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {analyticsCards.map((card) => (
            <article
              className="rounded-lg bg-white px-5 py-5 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.65)]"
              key={card.label}
            >
              <div className="flex justify-center">
                <span
                  className={`grid size-9 place-items-center rounded-full ${card.iconTone}`}
                >
                  <card.icon className="size-4" />
                </span>
              </div>
              <p className="mt-4 text-center text-3xl font-black tracking-tight text-slate-800">
                {card.value}
              </p>
              <p className="mt-1 text-center text-xs font-semibold text-slate-500">
                {card.label}
              </p>
              <p
                className={`mt-3 flex items-center justify-center gap-1 text-xs font-black ${card.trendTone}`}
              >
                {card.trend.startsWith("+") ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {card.trend}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <article className="rounded-lg bg-white p-5 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.65)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-slate-800">
                Report Completion
              </h3>
              <button
                aria-label="More report completion options"
                className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                type="button"
              >
                ...
              </button>
            </div>
            <div className="mt-6 flex justify-center">
              <div
                className="grid size-52 place-items-center rounded-full"
                style={{
                  background:
                    "conic-gradient(#ff3838 0deg 277deg, #e5e7eb 277deg 360deg)",
                }}
              >
                <div className="grid size-36 place-items-center rounded-full bg-white">
                  <div className="text-center">
                    <p className="text-4xl font-black text-slate-800">29.2k</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      77% of 36,000 target
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-lg bg-white p-5 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.65)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-800">
                  Report Category Growth
                </h3>
                <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span className="size-2 rounded-sm bg-[#168cf2]" />
                  12.8k new reports
                </p>
              </div>
              <button
                aria-label="More category growth options"
                className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                type="button"
              >
                ...
              </button>
            </div>
            <div className="relative mt-5">
              <div className="absolute inset-x-0 top-[34%] border-t border-dashed border-slate-300" />
              <span className="absolute right-0 top-[30%] bg-white pl-2 text-[10px] font-black uppercase text-slate-400">
                Goal
              </span>
              <div className="absolute left-[46%] top-0 z-10 max-w-48 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold leading-5 text-white shadow-xl">
                With 22.8% growth rate we are steadily growing our following.
              </div>
              <div className="flex h-52 items-end gap-3 border-b border-slate-200 px-1 pt-14">
                {[52, 34, 72, 48, 36, 58, 51, 82, 56, 49, 50, 35].map(
                  (height, index) => (
                    <div
                      className="flex flex-1 items-end"
                      key={`${height}-${index}`}
                    >
                      <span
                        className={
                          index === 2 || index === 7
                            ? "w-full rounded-t-md bg-[#168cf2]"
                            : "w-full rounded-t-md bg-slate-300"
                        }
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  ),
                )}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {reportStats.map((report) => (
                <div
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                  key={report.id}
                >
                  <span className="text-xs font-bold text-slate-600">
                    {report.category}
                  </span>
                  <span className="text-xs font-black text-[#073b82]">
                    {report.generatedCount} reports
                  </span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <AdminPanel className="rounded-[28px]" title="Prediction assessments">
        <DataTable
          columns={predictionColumns}
          data={predictions}
          emptyTitle="No assessments available"
          getRowKey={(prediction) => prediction.projectId}
          initialRowsPerPage={5}
          searchPlaceholder="Search enterprise, project, growth, or recommendation..."
          searchText={(prediction) =>
            `${prediction.enterprise} ${prediction.projectId} ${prediction.growth} ${prediction.sustainability} ${prediction.recommendation}`
          }
          variant="clean"
        />
      </AdminPanel>

      <AdminPanel title="Recent reports">
        <div className="divide-y divide-slate-100">
          {generatedReports.map((report) => (
            <article
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
              key={report.id}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                <FileBarChart className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900">{report.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {report.id} - Generated {report.generated} by {report.owner}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill tone="info">{report.format}</StatusPill>
                <button
                  aria-label={`Download ${report.title}`}
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#0f53b7] transition hover:border-blue-300 hover:bg-blue-50"
                  type="button"
                >
                  <Download className="size-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </AdminPanel>
    </div>
  );
}
