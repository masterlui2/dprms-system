import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminPanel } from "../../components/admin/AdminPanel";
import { DataTable, type DataColumn } from "../../components/admin/DataTable";
import { MetricCard } from "../../components/admin/MetricCard";
import { ModalShell } from "../../components/admin/ModalShell";
import { projectRecords, type ProjectRecord } from "../../data/admin";
import { cn } from "../../utils/cn";

interface ReportRecord {
  id: string;
  period: string;
  project: string;
  status: "Approved" | "Under review" | "Pending";
  submitted: string;
}

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

const visits = [
  {
    id: "VIS-024",
    project: "Highland Coffee",
    site: "Manay, Davao Oriental",
    date: "Jul 5, 2026",
    lead: "Ana Reyes",
    status: "Scheduled",
  },
  {
    id: "VIS-025",
    project: "Bright Foods",
    site: "Mati City",
    date: "Jul 8, 2026",
    lead: "Maria Santos",
    status: "Scheduled",
  },
  {
    id: "VIS-026",
    project: "DOrSU Research Center",
    site: "Baganga",
    date: "Jul 12, 2026",
    lead: "Kevin Lim",
    status: "Scheduled",
  },
  {
    id: "VIS-027",
    project: "Cateel Bamboo Association",
    site: "Cateel",
    date: "Jul 18, 2026",
    lead: "Kevin Lim",
    status: "Planned",
  },
];

const reportRecords: ReportRecord[] = [
  {
    id: "REP-101",
    project: "Bright Foods",
    period: "Q2 2026",
    submitted: "Jun 22",
    status: "Approved",
  },
  {
    id: "REP-102",
    project: "GreenHarvest",
    period: "Q2 2026",
    submitted: "Jun 18",
    status: "Under review",
  },
  {
    id: "REP-103",
    project: "Highland Coffee",
    period: "Q2 2026",
    submitted: "Not submitted",
    status: "Pending",
  },
  {
    id: "REP-104",
    project: "DOrSU Research Center",
    period: "Q1 2026",
    submitted: "Mar 30",
    status: "Approved",
  },
  {
    id: "REP-105",
    project: "CarpenTech",
    period: "Final",
    submitted: "May 28",
    status: "Approved",
  },
];

function projectStatus(project: ProjectRecord): string {
  if (project.status === "At risk") return "At Risk";
  if (project.status === "Completed") return "Completed";
  return "On Track";
}

function projectStatusClass(project: ProjectRecord): string {
  if (project.status === "At risk") return "text-red-600";
  if (project.status === "Completed") return "text-emerald-700";
  return "text-[#0f53b7]";
}

const reportColumns: DataColumn<ReportRecord>[] = [
  {
    id: "project",
    header: "Project",
    sortValue: (report) => report.project,
    render: (report) => (
      <span className="font-bold text-slate-900">{report.project}</span>
    ),
  },
  {
    id: "period",
    header: "Period",
    sortValue: (report) => report.period,
    render: (report) => report.period,
  },
  {
    id: "submitted",
    header: "Submitted",
    sortValue: (report) => report.submitted,
    render: (report) => (
      <span className="text-slate-600">{report.submitted}</span>
    ),
  },
  {
    id: "status",
    header: "Status",
    sortValue: (report) => report.status,
    render: (report) => (
      <span
        className={cn(
          "font-bold",
          report.status === "Approved"
            ? "text-emerald-700"
            : report.status === "Pending"
              ? "text-amber-700"
              : "text-[#0f53b7]",
        )}
      >
        {report.status}
      </span>
    ),
  },
];

function AccomplishmentReportsModal({
  onClose,
  project,
}: {
  onClose: () => void;
  project: ProjectRecord;
}) {
  return (
    <ModalShell
      description={`${project.id} - ${project.title} / ${project.enterprise}`}
      footer={
        <div className="flex justify-end">
          <button
            className="h-10 rounded-lg px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      }
      onClose={onClose}
      title="Accomplishment reports"
      width="xl"
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <DataTable
          columns={reportColumns}
          data={reportRecords}
          getRowKey={(report) => report.id}
          initialRowsPerPage={5}
          searchPlaceholder="Search project or reporting period..."
          searchText={(report) =>
            `${report.project} ${report.period} ${report.submitted} ${report.status}`
          }
          variant="clean"
        />
      </div>
    </ModalShell>
  );
}

function SiteVisitCalendarModal({ onClose }: { onClose: () => void }) {
  const monthDays = [
    null,
    null,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31,
    null,
    null,
  ];
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const visitByDay = new Map(
    visits.map((visit) => [Number(visit.date.match(/Jul (\d+)/)?.[1]), visit]),
  );

  return (
    <ModalShell
      description="Upcoming field validation activities"
      footer={
        <div className="flex justify-end">
          <button
            className="h-10 rounded-lg px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      }
      onClose={onClose}
      title="Site visit calendar"
      width="xl"
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#f8fbff]">
        <div className="grid min-h-[620px] lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 bg-white p-5 lg:border-b-0 lg:border-r">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Calendar
            </p>
            <div className="mt-3 flex items-center justify-between">
              <button
                aria-label="Previous month"
                className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-50"
                type="button"
              >
                <ChevronLeft className="size-4" />
              </button>
              <p className="text-sm font-black text-slate-900">July 2026</p>
              <button
                aria-label="Next month"
                className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-50"
                type="button"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <span
                  className="py-1 font-bold text-slate-400"
                  key={`${day}-${index}`}
                >
                  {day}
                </span>
              ))}
              {monthDays.map((day, index) => (
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-md font-semibold",
                    day
                      ? "text-slate-600 hover:bg-blue-50"
                      : "text-transparent",
                    day === 5 && "bg-[#0f53b7] text-white hover:bg-[#0f53b7]",
                    visitByDay.has(day ?? 0) &&
                      day !== 5 &&
                      "bg-blue-50 text-[#0f53b7]",
                  )}
                  key={`${day ?? "blank"}-${index}`}
                >
                  {day ?? 0}
                </span>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Status
                </p>
                <div className="mt-3 space-y-2">
                  {[
                    ["Scheduled", "bg-[#0f53b7]"],
                    ["Planned", "bg-amber-500"],
                    ["Completed", "bg-emerald-500"],
                  ].map(([label, tone]) => (
                    <label
                      className="flex items-center gap-2 text-xs font-bold text-slate-600"
                      key={label}
                    >
                      <input
                        checked
                        className="size-4 rounded accent-[#0f53b7]"
                        readOnly
                        type="checkbox"
                      />
                      <span className={cn("size-2 rounded-full", tone)} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Leads
                </p>
                <div className="mt-3 space-y-2">
                  {["Ana Reyes", "Maria Santos", "Kevin Lim"].map((lead) => (
                    <label
                      className="flex items-center gap-2 text-xs font-bold text-slate-600"
                      key={lead}
                    >
                      <input
                        checked
                        className="size-4 rounded accent-[#0f53b7]"
                        readOnly
                        type="checkbox"
                      />
                      {lead}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className="min-w-0 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Month view
                </p>
                <h3 className="mt-1 text-2xl font-black text-slate-900">
                  Site visits
                </h3>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {weekDays.map((day) => (
                  <div
                    className="px-3 py-3 text-center text-xs font-black text-slate-500"
                    key={day}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {monthDays.map((day, index) => {
                  const visit = visitByDay.get(day ?? 0);

                  return (
                    <div
                      className={cn(
                        "min-h-28 border-b border-r border-slate-100 p-2",
                        index % 7 === 6 && "border-r-0",
                        index >= 28 && "border-b-0",
                        !day && "bg-slate-50/60",
                      )}
                      key={`${day ?? "empty"}-${index}`}
                    >
                      <span
                        className={cn(
                          "grid size-6 place-items-center rounded-full text-xs font-black",
                          day === 5
                            ? "bg-[#0f53b7] text-white"
                            : "text-slate-500",
                        )}
                      >
                        {day ?? ""}
                      </span>
                      {visit ? (
                        <div
                          className={cn(
                            "mt-2 rounded-md border px-2 py-1.5 text-xs",
                            visit.status === "Scheduled"
                              ? "border-blue-100 bg-blue-50 text-[#073b82]"
                              : "border-amber-100 bg-amber-50 text-amber-800",
                          )}
                        >
                          <p className="truncate font-black">{visit.project}</p>
                          <p className="mt-1 truncate text-[11px] font-semibold opacity-80">
                            {visit.site}
                          </p>
                          <p className="mt-1 truncate text-[11px] opacity-80">
                            Lead: {visit.lead}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {visits.map((visit) => (
                <article
                  className="rounded-xl border border-slate-200 bg-white p-3"
                  key={visit.id}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-[#0f53b7]" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">
                        {visit.project}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {visit.date}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {visit.site}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </ModalShell>
  );
}

export function MonitoringPage() {
  const [searchParams] = useSearchParams();
  const selectedProgram = searchParams.get("program");
  const programProjects =
    selectedProgram === "GIA" || selectedProgram === "SETUP"
      ? projectRecords.filter((project) => project.program === selectedProgram)
      : projectRecords;
  const programLabel =
    selectedProgram === "GIA"
      ? "GIA Program"
      : selectedProgram === "SETUP"
        ? "SETUP Program"
        : "Project Monitoring";
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(
    null,
  );
  const [siteVisitCalendarOpen, setSiteVisitCalendarOpen] = useState(false);
  const activeCount = programProjects.filter(
    (project) => project.status === "Active",
  ).length;
  const onTrackCount = programProjects.filter(
    (project) => project.status === "Active",
  ).length;
  const atRiskCount = programProjects.filter(
    (project) => project.status === "At risk",
  ).length;

  const projectColumns: DataColumn<ProjectRecord>[] = [
    {
      id: "project",
      header: "Project",
      sortValue: (project) => project.title,
      render: (project) => (
        <div>
          <p className="font-bold text-slate-900">
            {project.title} - {project.enterprise}
          </p>
          <p className="mt-1 text-xs text-slate-500">Lead: {project.manager}</p>
        </div>
      ),
    },
    {
      id: "progress",
      header: "Progress",
      sortValue: (project) => project.progress,
      render: (project) => (
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className={
                  project.status === "At risk"
                    ? "h-full bg-red-500"
                    : "h-full bg-[#0f53b7]"
                }
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <span className="w-9 text-right text-xs font-black text-slate-600">
              {project.progress}%
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "milestone",
      header: "Next Milestone",
      render: (project) => (
        <div>
          <p className="font-semibold text-slate-700">
            {project.status === "Completed"
              ? "Project closeout"
              : project.progress > 70
                ? "Final validation"
                : project.progress > 40
                  ? "Trial production"
                  : "Site preparation"}
          </p>
          <p className="mt-1 text-xs text-slate-500">Due {project.dueDate}</p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortValue: (project) => project.status,
      render: (project) => (
        <span className={cn("font-bold", projectStatusClass(project))}>
          {projectStatus(project)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-7">
      <AdminPageHeader
        description={
          selectedProgram === "GIA"
            ? ""
            : selectedProgram === "SETUP"
              ? ""
              : "Track project progress, accomplishment reports, compliance requirements, and site visits."
        }
        eyebrow="Project Operations"
        title={programLabel}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail="Currently under implementation"
          icon={Activity}
          label="Active Projects"
          value={String(activeCount)}
        />
        <MetricCard
          detail={`${Math.round((onTrackCount / Math.max(programProjects.length, 1)) * 100)}% of portfolio`}
          icon={CheckCircle2}
          label="On Track"
          tone="green"
          value={String(onTrackCount)}
        />
        <MetricCard
          detail="Action required"
          icon={AlertTriangle}
          label="At Risk"
          tone="red"
          value={String(atRiskCount)}
        />
        <MetricCard
          detail="Next 14 days"
          icon={Bell}
          label="Reminders"
          tone="gold"
          value={String(reminders.length)}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,0.8fr)]">
        <AdminPanel
          description="Track current progress, milestone timing, and project status."
          title="Project progress"
        >
          <DataTable
            columns={projectColumns}
            data={programProjects}
            getRowKey={(project) => project.id}
            initialRowsPerPage={5}
            onRowClick={setSelectedProject}
            searchPlaceholder={`Search ${programLabel.toLowerCase()} projects...`}
            searchText={(project) =>
              `${project.id} ${project.title} ${project.enterprise} ${project.manager} ${project.status} ${project.program}`
            }
          />
        </AdminPanel>

        <div className="space-y-5">
          <AdminPanel
            action={
              <button
                aria-label="Open site visit calendar"
                className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#0f53b7] transition hover:border-blue-300 hover:bg-blue-50"
                onClick={() => setSiteVisitCalendarOpen(true)}
                title="Open site visit calendar"
                type="button"
              >
                <CalendarDays className="size-4" />
              </button>
            }
            title="Upcoming reminders"
          >
            <ul className="divide-y divide-slate-100">
              {reminders.map((reminder) => (
                <li
                  className="flex items-start gap-3 px-5 py-4"
                  key={reminder.title}
                >
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      reminder.tone,
                    )}
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {reminder.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {reminder.project} - {reminder.when}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </AdminPanel>

          <AdminPanel title="Compliance score">
            <div className="p-5">
              <p className="text-3xl font-black text-[#073b82]">
                92
                <span className="text-base font-normal text-slate-400">
                  /100
                </span>
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Reporting, financial, and milestone compliance.
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[92%] bg-[#0f53b7]" />
              </div>
            </div>
          </AdminPanel>
        </div>
      </div>

      {selectedProject ? (
        <AccomplishmentReportsModal
          onClose={() => setSelectedProject(null)}
          project={selectedProject}
        />
      ) : null}

      {siteVisitCalendarOpen ? (
        <SiteVisitCalendarModal
          onClose={() => setSiteVisitCalendarOpen(false)}
        />
      ) : null}
    </div>
  );
}
