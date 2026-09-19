import { BarChart3, Download, FileCheck2, FolderKanban, Loader2, PackageSearch, Printer } from "lucide-react";
import { useEffect, useMemo, useState, type ComponentType } from "react";

import { DataTable, type DataColumn } from "../../components/admin/DataTable";
import api from "../../lib/axios";
import { getMockUser } from "../../lib/mockAuth";
import { downloadBlob, getAuthorizedDownloadPrograms } from "../../services/downloadManager";
import type { ApplicationProgram } from "../../types/application";

interface ReportProject {
  id: number;
  reference_number: string | null;
  title: string | null;
  program: ApplicationProgram;
  status: string;
  reports_count: number;
  updated_at: string | null;
}

interface ReportDashboard {
  year: number;
  programs: ApplicationProgram[];
  summary: {
    proposals: number;
    projects: number;
    equipment: number;
    reports: number;
    submitted_reports: number;
    draft_reports: number;
    submission_rate: number;
  };
  projects: ReportProject[];
  generated_at: string;
}

interface SummaryCardProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  detail: string;
}

function SummaryCard({ icon: Icon, label, value, detail }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#0f5cc0]">
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-PH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ReportsPage() {
  const user = getMockUser();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [program, setProgram] = useState<"ALL" | ApplicationProgram>("ALL");
  const [dashboard, setDashboard] = useState<ReportDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .get<{ data: ReportDashboard }>("/reports/dashboard", {
        params: { year, ...(program === "ALL" ? {} : { program }) },
      })
      .then((response) => {
        if (!cancelled) setDashboard(response.data.data);
      })
      .catch((requestError) => {
        console.error("Failed to load report dashboard:", requestError);
        if (!cancelled) setError("The report data could not be loaded. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [program, year]);

  useEffect(() => {
    if (dashboard && program !== "ALL" && !dashboard.programs.includes(program)) setProgram("ALL");
  }, [dashboard, program]);

  const columns = useMemo<DataColumn<ReportProject>[]>(
    () => [
      {
        id: "reference",
        header: "Reference",
        sortValue: (row) => row.reference_number ?? "",
        render: (row) => (
          <span className="font-mono text-xs font-bold text-[#0b4f9c]">
            {row.reference_number ?? `PROJECT-${row.id}`}
          </span>
        ),
      },
      {
        id: "project",
        header: "Project",
        sortValue: (row) => row.title ?? "",
        render: (row) => <span className="font-semibold text-slate-800">{row.title ?? "Untitled project"}</span>,
      },
      {
        id: "program",
        header: "Program",
        sortValue: (row) => row.program,
        render: (row) => <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#0f5cc0]">{row.program}</span>,
      },
      {
        id: "reports",
        header: "Reports",
        sortValue: (row) => row.reports_count,
        render: (row) => <span className="font-bold text-slate-700">{row.reports_count}</span>,
      },
      {
        id: "status",
        header: "Status",
        sortValue: (row) => row.status,
        render: (row) => <span className="capitalize text-slate-600">{row.status.replaceAll("_", " ").toLowerCase()}</span>,
      },
      {
        id: "updated",
        header: "Updated",
        sortValue: (row) => row.updated_at ?? "",
        render: (row) => <span className="text-slate-500">{formatDate(row.updated_at)}</span>,
      },
    ],
    [],
  );

  async function exportCsv() {
    if (!dashboard || !user) return;

    const rows = [
      ["Reference", "Project", "Program", "Status", "Reports", "Updated"],
      ...dashboard.projects.map((projectRow) => [
        projectRow.reference_number ?? `PROJECT-${projectRow.id}`,
        projectRow.title ?? "Untitled project",
        projectRow.program,
        projectRow.status,
        String(projectRow.reports_count),
        projectRow.updated_at ?? "",
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    const programs = getAuthorizedDownloadPrograms(user);
    const destinationProgram = program === "ALL" ? programs[0] : program;

    try {
      const result = await downloadBlob({
        blob: new Blob([csv], { type: "text/csv;charset=utf-8" }),
        fileName: `DPRMS_Report_${program}_${year}.csv`,
        program: destinationProgram,
        user,
      });
      setDownloadNotice(`Saved to ${result.destination}`);
    } catch (downloadError) {
      if (!(downloadError instanceof DOMException && downloadError.name === "AbortError")) setDownloadNotice("The report could not be downloaded.");
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">Reports</h1>
            <p className="mt-1 text-sm text-slate-500">Live project and reporting data for your authorized records.</p>
          </div>
          <div className="print-hidden flex flex-wrap gap-2">
            <select aria-label="Program" className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700" onChange={(event) => setProgram(event.target.value as "ALL" | ApplicationProgram)} value={program}>
              <option value="ALL">All programs</option>
              {(dashboard?.programs ?? []).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select aria-label="Reporting year" className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700" onChange={(event) => setYear(Number(event.target.value))} value={year}>
              {[currentYear, currentYear - 1, currentYear - 2, currentYear - 3].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50" onClick={() => window.print()} type="button"><Printer className="size-4" /> Print</button>
            <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0f5cc0] px-3 text-sm font-bold text-white hover:bg-[#0b4f9c] disabled:opacity-50" disabled={!dashboard} onClick={exportCsv} type="button"><Download className="size-4" /> Export CSV</button>
          </div>
        </div>
        {downloadNotice ? <p className="mt-3 text-sm font-semibold text-[#0f5cc0]">{downloadNotice}</p> : null}
      </section>

      {loading ? (
        <div className="grid min-h-64 place-items-center rounded-2xl border border-slate-200 bg-white"><div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Loader2 className="size-5 animate-spin" /> Loading live report data…</div></div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>
      ) : dashboard ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard icon={FolderKanban} label="Projects" value={dashboard.summary.projects} detail={`${dashboard.summary.proposals} proposal records`} />
            <SummaryCard icon={FileCheck2} label="Reports" value={dashboard.summary.reports} detail={`${dashboard.summary.submitted_reports} submitted · ${dashboard.summary.draft_reports} drafts`} />
            <SummaryCard icon={PackageSearch} label="Equipment" value={dashboard.summary.equipment} detail="Registered assets in scope" />
            <SummaryCard icon={BarChart3} label="Submission rate" value={`${dashboard.summary.submission_rate}%`} detail={`For reporting year ${dashboard.year}`} />
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4"><h2 className="font-black text-slate-900">Project report activity</h2><p className="mt-1 text-sm text-slate-500">Only projects you are allowed to view are included.</p></div>
            <DataTable
              columns={columns}
              data={dashboard.projects}
              emptyDescription="No project reports were found for this selection."
              emptyTitle="No report activity"
              getRowKey={(row) => String(row.id)}
              searchPlaceholder="Search projects…"
              searchText={(row) => `${row.reference_number ?? ""} ${row.title ?? ""} ${row.program} ${row.status}`}
            />
          </section>
        </>
      ) : null}
    </div>
  );
}
