import {
  BarChart3,
  Check,
  Download,
  Filter,
  FileBarChart,
  FileSpreadsheet,
  History,
  Printer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState, type ComponentType } from "react";

import { AdminPanel } from "../../components/admin/AdminPanel";
import { DataTable, type DataColumn } from "../../components/admin/DataTable";
import { StatusPill } from "../../components/admin/StatusPill";
import {
  generatedReports,
  predictions,
  reportCatalog,
  type PredictionRecord,
} from "../../data/admin";

type AnalyticsScope = "all" | "equipment" | "finance" | "gia";

const reportStats = reportCatalog.map((report, index) => {
  const generatedCount =
    index === 0 ? 8 : index === 1 ? 5 : index === 2 ? 3 : 2;

  return {
    ...report,
    generatedCount,
    share: Math.round((generatedCount / 18) * 100),
  };
});

interface AnalyticsCard {
  detail: string;
  icon: ComponentType<{ className?: string }>;
  iconTone: string;
  label: string;
  trend: string;
  trendTone: string;
  value: string;
}

interface AnalyticsSummary {
  cards: AnalyticsCard[];
  completionLabel: string;
  completionRate: number;
  completionTarget: string;
  completionValue: string;
  growthMessage: string;
  newReports: string;
  stats: Array<{
    count: string;
    label: string;
  }>;
}

const analyticsScopes: Array<{ label: string; value: AnalyticsScope }> = [
  { label: "All analytics", value: "all" },
  { label: "Equipment", value: "equipment" },
  { label: "Finance", value: "finance" },
  { label: "GIA Projects", value: "gia" },
];

const dateRanges = ["Last 7 days", "Last 30 days", "This quarter", "This year"];

const defaultCards: AnalyticsCard[] = [
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

const analyticsSummaries: Record<AnalyticsScope, AnalyticsSummary> = {
  all: {
    cards: defaultCards,
    completionLabel: "Report Completion",
    completionRate: 77,
    completionTarget: "77% of 36,000 target",
    completionValue: "29.2k",
    growthMessage: "With 22.8% growth rate we are steadily growing our reports.",
    newReports: "12.8k new reports",
    stats: reportStats.map((report) => ({
      count: `${report.generatedCount} reports`,
      label: report.category,
    })),
  },
  equipment: {
    cards: [
      {
        label: "Total Equipment",
        value: "2.4k",
        detail: "Tracked assets",
        trend: "+8.4%",
        trendTone: "text-emerald-600",
        icon: FileBarChart,
        iconTone: "bg-blue-50 text-[#0f53b7]",
      },
      {
        label: "Issued Assets",
        value: "1.1k",
        detail: "Currently deployed",
        trend: "+15.2%",
        trendTone: "text-emerald-600",
        icon: FileSpreadsheet,
        iconTone: "bg-violet-50 text-violet-600",
      },
      {
        label: "Needs Inspection",
        value: "142",
        detail: "For follow-up",
        trend: "-6.8%",
        trendTone: "text-red-500",
        icon: History,
        iconTone: "bg-amber-50 text-amber-600",
      },
      {
        label: "Scan Compliance",
        value: "91.6%",
        detail: "QR scan coverage",
        trend: "+9.1%",
        trendTone: "text-emerald-600",
        icon: BarChart3,
        iconTone: "bg-emerald-50 text-emerald-600",
      },
    ],
    completionLabel: "Equipment Accountability",
    completionRate: 84,
    completionTarget: "84% of assigned assets verified",
    completionValue: "2.0k",
    growthMessage: "Equipment scans are improving as more assets are validated.",
    newReports: "2.4k asset records",
    stats: [
      { label: "Issued", count: "1.1k assets" },
      { label: "In storage", count: "740 assets" },
      { label: "Returned", count: "412 assets" },
      { label: "For repair", count: "142 assets" },
    ],
  },
  finance: {
    cards: [
      {
        label: "Total Allocation",
        value: "₱42.8M",
        detail: "Approved budget",
        trend: "+10.5%",
        trendTone: "text-emerald-600",
        icon: FileBarChart,
        iconTone: "bg-blue-50 text-[#0f53b7]",
      },
      {
        label: "Utilized Funds",
        value: "₱31.4M",
        detail: "Released and spent",
        trend: "+18.7%",
        trendTone: "text-emerald-600",
        icon: FileSpreadsheet,
        iconTone: "bg-violet-50 text-violet-600",
      },
      {
        label: "For Validation",
        value: "₱4.2M",
        detail: "Pending documents",
        trend: "-11.2%",
        trendTone: "text-red-500",
        icon: History,
        iconTone: "bg-amber-50 text-amber-600",
      },
      {
        label: "Utilization Rate",
        value: "73.4%",
        detail: "Portfolio burn rate",
        trend: "+7.9%",
        trendTone: "text-emerald-600",
        icon: BarChart3,
        iconTone: "bg-emerald-50 text-emerald-600",
      },
    ],
    completionLabel: "Finance Utilization",
    completionRate: 73,
    completionTarget: "73% of allocated budget utilized",
    completionValue: "₱31.4M",
    growthMessage: "Validated releases are increasing while pending items decline.",
    newReports: "₱4.2M pending validation",
    stats: [
      { label: "Released", count: "₱31.4M" },
      { label: "Obligated", count: "₱7.2M" },
      { label: "For validation", count: "₱4.2M" },
      { label: "Remaining", count: "₱11.4M" },
    ],
  },
  gia: {
    cards: [
      {
        label: "GIA Projects",
        value: "18",
        detail: "Total monitored",
        trend: "+5.6%",
        trendTone: "text-emerald-600",
        icon: FileBarChart,
        iconTone: "bg-blue-50 text-[#0f53b7]",
      },
      {
        label: "Active Grants",
        value: "12",
        detail: "Under implementation",
        trend: "+9.4%",
        trendTone: "text-emerald-600",
        icon: FileSpreadsheet,
        iconTone: "bg-violet-50 text-violet-600",
      },
      {
        label: "Pending Review",
        value: "4",
        detail: "Needs action",
        trend: "-18.0%",
        trendTone: "text-red-500",
        icon: History,
        iconTone: "bg-amber-50 text-amber-600",
      },
      {
        label: "Compliance Rate",
        value: "88.5%",
        detail: "Report compliance",
        trend: "+12.1%",
        trendTone: "text-emerald-600",
        icon: BarChart3,
        iconTone: "bg-emerald-50 text-emerald-600",
      },
    ],
    completionLabel: "GIA Project Compliance",
    completionRate: 89,
    completionTarget: "89% of GIA requirements complete",
    completionValue: "16/18",
    growthMessage: "GIA projects are moving steadily through required reporting.",
    newReports: "16 compliant projects",
    stats: [
      { label: "Research", count: "6 projects" },
      { label: "Community", count: "5 projects" },
      { label: "Training", count: "4 projects" },
      { label: "S&T Intervention", count: "3 projects" },
    ],
  },
};

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
  const [analyticsScope, setAnalyticsScope] = useState<AnalyticsScope>("all");
  const [dateRange, setDateRange] = useState("Last 30 days");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const analytics = analyticsSummaries[analyticsScope];
  const activeFilterCount =
    (analyticsScope === "all" ? 0 : 1) + (dateRange === "Last 30 days" ? 0 : 1);
  const selectedScopeLabel =
    analyticsScopes.find((scope) => scope.value === analyticsScope)?.label ??
    "All analytics";

  function printAnalytics() {
    setFiltersOpen(false);
    window.requestAnimationFrame(() => window.print());
  }

  return (
    <div className="space-y-7">
      <section className="printable-analytics rounded-2xl border border-[#d8e1ee] bg-[#f5f8fc] p-5 shadow-[0_14px_36px_-32px_rgba(15,23,42,0.75)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-800">
              Analytics Overview
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {selectedScopeLabel} - {dateRange}
            </p>
            <p className="print-only mt-1 text-xs font-semibold text-slate-500">
              Printed analytics report
            </p>
          </div>

          <div className="print-hidden flex items-center gap-2">
            <button
              aria-label="Print selected analytics"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-3 text-xs font-bold text-[#073b82] shadow-sm ring-1 ring-slate-200 transition hover:bg-blue-50"
              onClick={printAnalytics}
              type="button"
            >
              <Printer className="size-4" />
              <span>Print</span>
            </button>

            <div className="relative">
            <button
              aria-expanded={filtersOpen}
              aria-label="Filter analytics"
              className="relative inline-flex h-10 items-center gap-2 rounded-lg bg-white px-3 text-xs font-bold text-[#073b82] shadow-sm ring-1 ring-slate-200 transition hover:bg-blue-50"
              onClick={() => setFiltersOpen((open) => !open)}
              type="button"
            >
              <Filter className="size-4" />
              <span>Filters</span>
              {activeFilterCount > 0 ? (
                <span className="grid size-5 place-items-center rounded-full bg-[#f4c542] text-[11px] font-black text-[#073b82]">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>

            {filtersOpen ? (
              <div className="absolute right-0 top-12 z-30 w-[320px] overflow-hidden rounded-xl border border-[#d8e1ee] bg-white shadow-xl shadow-slate-900/10">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-black text-[#073b82]">
                    Filter analytics
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Choose the report area and period to view.
                  </p>
                </div>

                <div className="p-3">
                  <p className="px-1 pb-2 text-xs font-black uppercase tracking-wide text-slate-400">
                    Analytics area
                  </p>
                  <div className="grid gap-1">
                    {analyticsScopes.map((scope) => (
                      <button
                        className={`flex h-9 items-center justify-between rounded-lg px-3 text-left text-sm font-bold transition ${
                          analyticsScope === scope.value
                            ? "bg-blue-50 text-[#073b82]"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                        key={scope.value}
                        onClick={() => setAnalyticsScope(scope.value)}
                        type="button"
                      >
                        <span>{scope.label}</span>
                        {analyticsScope === scope.value ? (
                          <Check className="size-4" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 p-3">
                  <p className="px-1 pb-2 text-xs font-black uppercase tracking-wide text-slate-400">
                    Date range
                  </p>
                  <div className="grid gap-1">
                    {dateRanges.map((range) => (
                      <button
                        className={`flex h-9 items-center justify-between rounded-lg px-3 text-left text-sm font-bold transition ${
                          dateRange === range
                            ? "bg-blue-50 text-[#073b82]"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                        key={range}
                        onClick={() => setDateRange(range)}
                        type="button"
                      >
                        <span>{range}</span>
                        {dateRange === range ? (
                          <Check className="size-4" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>

                {activeFilterCount > 0 ? (
                  <div className="border-t border-slate-100 bg-slate-50 px-3 py-3">
                    <button
                      className="h-9 w-full rounded-lg text-sm font-black text-[#073b82] transition hover:bg-white"
                      onClick={() => {
                        setAnalyticsScope("all");
                        setDateRange("Last 30 days");
                      }}
                      type="button"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {analytics.cards.map((card) => (
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
                {analytics.completionLabel}
              </h3>
              <button
                aria-label="More report completion options"
                className="print-hidden grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                type="button"
              >
                ...
              </button>
            </div>
            <div className="mt-6 flex justify-center">
              <div
                className="grid size-52 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(#ff3838 0deg ${analytics.completionRate * 3.6}deg, #e5e7eb ${analytics.completionRate * 3.6}deg 360deg)`,
                }}
              >
                <div className="grid size-36 place-items-center rounded-full bg-white">
                  <div className="text-center">
                    <p className="text-4xl font-black text-slate-800">
                      {analytics.completionValue}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      {analytics.completionTarget}
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
                  {analytics.newReports}
                </p>
              </div>
              <button
                aria-label="More category growth options"
                className="print-hidden grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
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
                {analytics.growthMessage}
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
              {analytics.stats.map((item) => (
                <div
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                  key={item.label}
                >
                  <span className="text-xs font-bold text-slate-600">
                    {item.label}
                  </span>
                  <span className="text-xs font-black text-[#073b82]">
                    {item.count}
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
