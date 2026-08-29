import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Gauge,
  MapPin,
  Target,
  Users,
} from "lucide-react";

import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminPanel } from "../../components/admin/AdminPanel";
import { DataTable, type DataColumn } from "../../components/admin/DataTable";
import { MetricCard } from "../../components/admin/MetricCard";
import { ModalShell } from "../../components/admin/ModalShell";
import {
  StatusPill,
  type StatusTone,
} from "../../components/admin/StatusPill";
import {
  formatCurrency,
  projectRecords,
  type GiaMonitoringDetails,
  type Program,
  type ProjectRecord,
} from "../../data/admin";
import { getProjects } from "../../services/applicationStore";
import { getMockUser } from "../../lib/mockAuth";
import { cn } from "../../utils/cn";

type GiaProject = ProjectRecord & { gia: GiaMonitoringDetails };

const setupProjectLocations: Record<string, string> = {
  "P-187": "Tarragona, Davao Oriental",
  "P-203": "Lupon, Davao Oriental",
  "P-208": "Manay, Davao Oriental",
  "P-211": "Banaybanay, Davao Oriental",
  "P-214": "Mati City, Davao Oriental",
};

const projectProgramTabs: Array<{ label: string; value: Program }> = [
  { label: "GIA", value: "GIA" },
  { label: "SETUP Project", value: "SETUP" },
];

const reminders = [
  {
    program: "GIA" as Program,
    project: "Water Quality Monitoring",
    title: "Field validation milestone",
    tone: "bg-[#0f53b7]",
    when: "Sep 12, 2026",
  },
  {
    program: "GIA" as Program,
    project: "Bamboo Product Development",
    title: "Catch-up plan review",
    tone: "bg-red-500",
    when: "Sep 18, 2026",
  },
  {
    program: "GIA" as Program,
    project: "GIA portfolio",
    title: "Annual technical report update",
    tone: "bg-amber-500",
    when: "Oct 1, 2026",
  },
  {
    program: "SETUP" as Program,
    project: "GreenHarvest",
    title: "Quarterly compliance report due",
    tone: "bg-red-500",
    when: "In 3 days",
  },
  {
    program: "SETUP" as Program,
    project: "Highland Coffee",
    title: "Site visit scheduled",
    tone: "bg-[#0f53b7]",
    when: "Sep 15, 2026",
  },
  {
    program: "SETUP" as Program,
    project: "Bright Foods",
    title: "Equipment turnover activity",
    tone: "bg-amber-500",
    when: "Sep 20, 2026",
  },
];

const visits = [
  {
    program: "GIA" as Program,
    date: "Sep 12, 2026",
    id: "VIS-026",
    lead: "Dr. Kevin Lim",
    project: "Water Quality Monitoring",
    site: "Baganga, Davao Oriental",
    status: "Scheduled",
  },
  {
    program: "GIA" as Program,
    date: "Sep 18, 2026",
    id: "VIS-027",
    lead: "Maria Torres",
    project: "Bamboo Product Development",
    site: "Cateel, Davao Oriental",
    status: "Planned",
  },
  {
    date: "Sep 15, 2026",
    id: "VIS-024",
    lead: "Ana Reyes",
    program: "SETUP" as Program,
    project: "Highland Coffee",
    site: "Manay, Davao Oriental",
    status: "Scheduled",
  },
  {
    date: "Sep 20, 2026",
    id: "VIS-025",
    lead: "Maria Santos",
    program: "SETUP" as Program,
    project: "Bright Foods",
    site: "Mati City",
    status: "Planned",
  },
];

function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    maximumFractionDigits: 2,
    notation: "compact",
    style: "currency",
  }).format(value);
}

function financialProgress(project: ProjectRecord): number {
  return Math.round((project.used / project.budget) * 100);
}

function isGiaProject(project: ProjectRecord): project is GiaProject {
  return project.program === "GIA" && project.gia !== undefined;
}

function projectLocation(project: ProjectRecord): string {
  return project.gia?.location ?? setupProjectLocations[project.id] ?? "Not set";
}

function projectStatus(project: ProjectRecord): string {
  if (project.status === "At risk") return "At Risk";
  if (project.status === "Completed") return "Completed";
  return "On Track";
}

function projectStatusTone(project: ProjectRecord): StatusTone {
  if (project.status === "At risk") return "danger";
  if (project.status === "Completed") return "success";
  return "info";
}

function ProgressBar({
  tone = "blue",
  value,
}: {
  tone?: "blue" | "green" | "red";
  value: number;
}) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className={cn(
          "h-full rounded-full",
          tone === "blue" && "bg-[#0f53b7]",
          tone === "green" && "bg-emerald-500",
          tone === "red" && "bg-red-500",
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <div className="mt-1.5 text-sm font-semibold leading-6 text-slate-700">
        {value}
      </div>
    </div>
  );
}

function SummaryCard({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-[#f8fbff] p-4">
      <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-[#073b82]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function ProjectDetailsModal({
  onClose,
  project,
}: {
  onClose: () => void;
  project: GiaProject;
}) {
  const details = project.gia;
  const utilization = financialProgress(project);
  const progressGap = project.progress - details.targetProgress;

  return (
    <ModalShell
      description={`${project.id} · ${details.reportingPeriod} · DOST-GIA technical progress monitoring`}
      footer={
        <div className="flex justify-end">
          <button
            className="h-10 rounded-lg px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      }
      onClose={onClose}
      title={project.title}
      width="xl"
    >
      <div className="space-y-5">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            detail={`Yearly target: ${details.targetProgress}%`}
            label="Physical accomplishment"
            value={`${project.progress}%`}
          />
          <SummaryCard
            detail={`${formatCurrency(project.used)} utilized`}
            label="Financial utilization"
            value={`${utilization}%`}
          />
          <SummaryCard
            detail={`${details.startDate} – ${details.endDate}`}
            label="Project duration"
            value={`${details.durationMonths} months`}
          />
          <SummaryCard
            detail={`Submitted ${details.latestReport.submitted}`}
            label="Latest report"
            value={details.latestReport.status}
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-[#0f53b7]" />
            <h3 className="font-black text-[#073b82]">Project profile</h3>
          </div>
          <div className="mt-5 grid gap-x-8 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
            <DetailField label="Implementing agency" value={details.agency} />
            <DetailField label="Project leader" value={project.manager} />
            <DetailField
              label="Cooperating agencies"
              value={details.cooperatingAgencies.join(", ")}
            />
            <DetailField label="Base station" value={details.baseStation} />
            <DetailField label="Implementation site" value={details.location} />
            <DetailField
              label="Approved project budget"
              value={formatCurrency(project.budget)}
            />
          </div>
          <div className="mt-5 border-t border-slate-100 pt-5">
            <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">
              Yearly approved cost
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {details.yearlyBudgets.map((budget) => (
                <span
                  className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-[#073b82]"
                  key={budget.label}
                >
                  {budget.label}: {formatCurrency(budget.amount)}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Target className="size-5 text-[#0f53b7]" />
              <h3 className="font-black text-[#073b82]">
                Technical accomplishment
              </h3>
            </div>
            <div className="mt-5 space-y-5">
              <DetailField label="Objective" value={details.objective} />
              <DetailField
                label="Actual accomplishment"
                value={details.actualAccomplishment}
              />
              <div className="rounded-xl bg-[#f8fbff] p-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">
                      Actual vs. yearly target
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-700">
                      {project.progress}% actual / {details.targetProgress}% target
                    </p>
                  </div>
                  <p
                    className={cn(
                      "text-xs font-black",
                      progressGap < 0 ? "text-red-600" : "text-emerald-700",
                    )}
                  >
                    {progressGap < 0
                      ? `${Math.abs(progressGap)} pts behind`
                      : `${progressGap} pts ahead`}
                  </p>
                </div>
                <div className="mt-3">
                  <ProgressBar
                    tone={progressGap < 0 ? "red" : "blue"}
                    value={project.progress}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="size-5 text-[#0f53b7]" />
              <h3 className="font-black text-[#073b82]">Fund utilization</h3>
            </div>
            <div className="mt-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-2xl font-black text-slate-900">
                    {formatCurrency(project.used)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    of {formatCurrency(project.budget)} approved
                  </p>
                </div>
                <p className="text-sm font-black text-[#0f53b7]">
                  {utilization}%
                </p>
              </div>
              <div className="mt-4">
                <ProgressBar tone="green" value={utilization} />
              </div>
              <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <DetailField
                  label="Reporting period"
                  value={details.latestReport.period}
                />
                <div className="mt-4">
                  <DetailField
                    label="Report review status"
                    value={details.latestReport.status}
                  />
                </div>
                <div className="mt-4">
                  <DetailField
                    label="Next monitoring date"
                    value={project.dueDate}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-[#0f53b7]" />
            <div>
              <h3 className="font-black text-[#073b82]">6Ps outputs</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Current measurable outputs against approved commitments.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {details.outputs.map((output) => (
              <article
                className="rounded-xl border border-slate-200 bg-[#f8fbff] p-4"
                key={output.category}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-black text-slate-800">
                    {output.category}
                  </p>
                  <span className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-black text-[#0f53b7] shadow-sm">
                    {output.actual}/{output.target}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {output.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          className={cn(
            "rounded-2xl border p-5",
            project.status === "At risk"
              ? "border-red-200 bg-red-50/60"
              : "border-emerald-200 bg-emerald-50/60",
          )}
        >
          <div className="flex items-center gap-2">
            {project.status === "At risk" ? (
              <AlertTriangle className="size-5 text-red-600" />
            ) : (
              <CheckCircle2 className="size-5 text-emerald-700" />
            )}
            <h3 className="font-black text-slate-900">Issues and actions</h3>
          </div>
          <div className="mt-5 grid gap-x-8 gap-y-5 md:grid-cols-3">
            <DetailField label="Problem / concern" value={details.issueSummary} />
            <DetailField label="Catch-up plan" value={details.catchUpPlan} />
            <DetailField
              label="Suggested solution"
              value={details.suggestedSolution}
            />
          </div>
        </section>
      </div>
    </ModalShell>
  );
}

function SetupProjectDetailsModal({
  onClose,
  project,
}: {
  onClose: () => void;
  project: ProjectRecord;
}) {
  const utilization = financialProgress(project);

  return (
    <ModalShell
      description={`${project.id} · SETUP implementation monitoring`}
      footer={
        <div className="flex justify-end">
          <button
            className="h-10 rounded-lg px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      }
      onClose={onClose}
      title={project.title}
      width="lg"
    >
      <div className="space-y-5">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            detail="Current implementation progress"
            label="Physical progress"
            value={`${project.progress}%`}
          />
          <SummaryCard
            detail={`${formatCurrency(project.used)} utilized`}
            label="Fund utilization"
            value={`${utilization}%`}
          />
          <SummaryCard
            detail="Approved project support"
            label="Approved budget"
            value={formatCompactCurrency(project.budget)}
          />
          <SummaryCard
            detail={`Next monitoring: ${project.dueDate}`}
            label="Status"
            value={projectStatus(project)}
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-[#0f53b7]" />
            <h3 className="font-black text-[#073b82]">Project profile</h3>
          </div>
          <div className="mt-5 grid gap-x-8 gap-y-5 md:grid-cols-2">
            <DetailField label="Enterprise" value={project.enterprise} />
            <DetailField label="Project manager" value={project.manager} />
            <DetailField label="Compliance" value={project.compliance} />
            <DetailField
              label="Approved budget"
              value={formatCurrency(project.budget)}
            />
          </div>
        </section>
      </div>
    </ModalShell>
  );
}

function SiteVisitCalendarModal({
  onClose,
  program,
}: {
  onClose: () => void;
  program: Program;
}) {
  const programVisits = visits.filter((visit) => visit.program === program);
  const monthDays = [
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
    null,
    null,
    null,
    null,
  ];
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const visitByDay = new Map(
    programVisits.map((visit) => [
      Number(visit.date.match(/Sep (\d+)/)?.[1]),
      visit,
    ]),
  );
  const nextVisitDay = Math.min(...visitByDay.keys());

  return (
    <ModalShell
      description={`Upcoming field validation activities for active ${program} projects.`}
      footer={
        <div className="flex justify-end">
          <button
            className="h-10 rounded-lg px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      }
      onClose={onClose}
      title={`${program} site visit calendar`}
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
              <p className="text-sm font-black text-slate-900">
                September 2026
              </p>
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
                    day === nextVisitDay &&
                      "bg-[#0f53b7] text-white hover:bg-[#0f53b7]",
                    visitByDay.has(day ?? 0) &&
                      day !== nextVisitDay &&
                      "bg-blue-50 text-[#0f53b7]",
                  )}
                  key={`${day ?? "blank"}-${index}`}
                >
                  {day ?? 0}
                </span>
              ))}
            </div>

            <div className="mt-6 space-y-5">
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
                  Monitoring leads
                </p>
                <div className="mt-3 space-y-2">
                  {programVisits.map((visit) => (
                    <label
                      className="flex items-center gap-2 text-xs font-bold text-slate-600"
                      key={visit.id}
                    >
                      <input
                        checked
                        className="size-4 rounded accent-[#0f53b7]"
                        readOnly
                        type="checkbox"
                      />
                      {visit.lead}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className="min-w-0 p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Month view
              </p>
              <h3 className="mt-1 text-2xl font-black text-slate-900">
                Site visits
              </h3>
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
                          day === nextVisitDay
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

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {programVisits.map((visit) => (
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
  const currentUser = getMockUser();
  const lockedProgram =
    currentUser?.program === "SETUP" || currentUser?.program === "GIA"
      ? (currentUser.program as Program)
      : currentUser?.email?.toLowerCase().startsWith("gia.") ||
          currentUser?.email?.toLowerCase().includes("gia") ||
          currentUser?.name?.toUpperCase().includes("GIA") ||
          currentUser?.name?.toUpperCase().includes("CEST")
        ? ("GIA" as Program)
        : currentUser?.email?.toLowerCase().startsWith("setup.") ||
            currentUser?.email?.toLowerCase().includes("setup") ||
            currentUser?.name?.toUpperCase().includes("SETUP") ||
            currentUser?.name?.toUpperCase().includes("SSCP")
          ? ("SETUP" as Program)
          : null;

  const [selectedProgram, setSelectedProgram] = useState<Program>(
    lockedProgram || "GIA",
  );

  useEffect(() => {
    if (lockedProgram) {
      setSelectedProgram(lockedProgram);
    }
  }, [lockedProgram]);

  const createdProjects = getProjects().filter(
    (project) => project.program === selectedProgram,
  );
  const programProjects = projectRecords.filter(
    (project) => project.program === selectedProgram,
  );
  const programReminders = reminders.filter(
    (reminder) => reminder.program === selectedProgram,
  );
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(
    null,
  );
  const [siteVisitCalendarOpen, setSiteVisitCalendarOpen] = useState(false);
  const activeCount = programProjects.filter(
    (project) => project.status !== "Completed",
  ).length;
  const onTrackCount = programProjects.filter(
    (project) => project.status === "Active",
  ).length;
  const atRiskCount = programProjects.filter(
    (project) => project.status === "At risk",
  ).length;
  const averageProgress = Math.round(
    programProjects.reduce((total, project) => total + project.progress, 0) /
      Math.max(programProjects.length, 1),
  );

  const headerEyebrow =
    lockedProgram === "SETUP"
      ? "SSCP Implementation Monitoring"
      : lockedProgram === "GIA"
        ? "CEST Implementation Monitoring"
        : "Project Operations";

  const headerTitle =
    lockedProgram === "SETUP"
      ? "SETUP Project Monitoring"
      : lockedProgram === "GIA"
        ? "GIA Project Monitoring"
        : "Project Monitoring";

  const headerDescription =
    lockedProgram === "SETUP"
      ? "Monitor MSME technological adoption progress, repayment amortization schedules, and site visit logs."
      : lockedProgram === "GIA"
        ? "Monitor research deliverable milestones, Line-Item Budget releases, and 6Ps accomplishment scorecards."
        : "Monitor implementation progress, approved funding, schedules, and project status.";

  const projectColumns: DataColumn<ProjectRecord>[] = [
    {
      className: "w-[38%]",
      header: "Project",
      id: "project",
      render: (project) => (
        <div>
          <p className="font-black leading-5 text-slate-900">{project.title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {project.gia?.agency ?? project.enterprise}
          </p>
        </div>
      ),
      sortValue: (project) => project.title,
    },
    {
      className: "w-[22%]",
      header: "Location",
      id: "location",
      render: (project) => (
        <p className="text-xs font-semibold leading-5 text-slate-700">
          {projectLocation(project)}
        </p>
      ),
      sortValue: projectLocation,
    },
    {
      className: "w-[16%]",
      header: "Budget",
      id: "budget",
      render: (project) => (
        <p className="font-black text-slate-900">
          {formatCompactCurrency(project.budget)}
        </p>
      ),
      sortValue: (project) => project.budget,
    },
    {
      className: "w-[24%]",
      header: "Progress",
      id: "progress",
      render: (project) => (
        <div>
          <div className="flex items-center gap-2">
            <div className="min-w-16 flex-1">
              <ProgressBar
                tone={project.status === "At risk" ? "red" : "blue"}
                value={project.progress}
              />
            </div>
            <span className="w-9 text-right text-xs font-black text-slate-700">
              {project.progress}%
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-3">
            <StatusPill tone={projectStatusTone(project)}>
              {projectStatus(project)}
            </StatusPill>
            <button
              className="inline-flex items-center gap-1 text-xs font-black text-[#0f53b7] transition hover:underline"
              onClick={(event) => {
                event.stopPropagation();
                setSelectedProject(project);
              }}
              type="button"
            >
              Details
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      ),
      sortValue: (project) => project.progress,
    },
  ];

  return (
    <div className="space-y-7">
      <AdminPageHeader
        description={headerDescription}
        eyebrow={headerEyebrow}
        title={headerTitle}
      />

      {createdProjects.length > 0 ? (
        <AdminPanel
          description={`Official ${selectedProgram} project records created from approved applications.`}
          title={`Recently created ${selectedProgram} projects`}
        >
          <div className="divide-y divide-slate-100">
            {createdProjects.map((project) => (
              <article
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                key={project.id}
              >
                <div>
                  <p className="font-bold text-slate-900">{project.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {project.id} · {project.beneficiary}
                  </p>
                </div>
                <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-black text-[#073b82]">
                  {project.complianceStatus}
                </span>
              </article>
            ))}
          </div>
        </AdminPanel>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail="Currently under implementation"
          icon={Activity}
          label={`Active ${selectedProgram} Projects`}
          value={String(activeCount)}
        />
        <MetricCard
          detail={`${Math.round((onTrackCount / Math.max(activeCount, 1)) * 100)}% of active portfolio`}
          icon={CheckCircle2}
          label="On Track"
          tone="green"
          value={String(onTrackCount)}
        />
        <MetricCard
          detail="Catch-up action required"
          icon={AlertTriangle}
          label="At Risk"
          tone="red"
          value={String(atRiskCount)}
        />
        <MetricCard
          detail={`Across active ${selectedProgram} projects`}
          icon={Gauge}
          label="Avg. Physical"
          tone="gold"
          value={`${averageProgress}%`}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#d8e1ee] bg-white shadow-[0_14px_36px_-32px_rgba(15,23,42,0.75)]">
        <DataTable
          columns={projectColumns}
          data={programProjects}
          getRowKey={(project) => project.id}
          initialRowsPerPage={5}
          onRowClick={setSelectedProject}
          searchPlaceholder={`Search ${selectedProgram.toLowerCase()} projects...`}
          searchText={(project) =>
            `${project.id} ${project.title} ${project.gia?.agency ?? project.enterprise} ${project.manager} ${projectLocation(project)} ${project.status}`
          }
          toolbar={
            lockedProgram ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-black text-[#073b82]">
                <span className="size-2 rounded-full bg-[#0f53b7]" />
                {lockedProgram === "SETUP" ? "SSCP / SETUP Track" : "CEST / GIA Track"}
              </span>
            ) : (
              <div
                aria-label="Project program filter"
                className="inline-flex rounded-lg border border-[#d8e1ee] bg-[#f8fbff] p-1"
                role="tablist"
              >
                {projectProgramTabs.map((tab) => (
                  <button
                    aria-selected={selectedProgram === tab.value}
                    className={cn(
                      "h-8 rounded-md px-3 text-xs font-black transition",
                      selectedProgram === tab.value
                        ? "bg-[#0f53b7] text-white shadow-sm"
                        : "text-[#073b82] hover:bg-white",
                    )}
                    key={tab.value}
                    onClick={() => {
                      setSelectedProgram(tab.value);
                      setSelectedProject(null);
                    }}
                    role="tab"
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )
          }
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
        <AdminPanel
          action={
            <button
              aria-label={`Open ${selectedProgram} site visit calendar`}
              className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#0f53b7] transition hover:border-blue-300 hover:bg-blue-50"
              onClick={() => setSiteVisitCalendarOpen(true)}
              title={`Open ${selectedProgram} site visits`}
              type="button"
            >
              <CalendarDays className="size-4" />
            </button>
          }
          title={`Upcoming ${selectedProgram} reminders`}
        >
          <ul className="divide-y divide-slate-100">
            {programReminders.map((reminder) => (
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
                    {reminder.project} · {reminder.when}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </AdminPanel>

        <AdminPanel title="Reporting readiness">
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-3xl font-black text-[#073b82]">
                  {selectedProgram === "GIA" ? 86 : 92}
                  <span className="text-base font-normal text-slate-400">
                    /100
                  </span>
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {selectedProgram === "GIA"
                    ? "Technical, 6Ps, financial, and issue-action records."
                    : "Milestone, financial, equipment, and compliance records."}
                </p>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]">
                <Bell className="size-5" />
              </span>
            </div>
            <div className="mt-4">
              <ProgressBar value={selectedProgram === "GIA" ? 86 : 92} />
            </div>
            <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-semibold leading-5 text-amber-800">
              {selectedProgram === "GIA"
                ? "1 project needs an updated catch-up plan before the next review."
                : "1 project has an overdue compliance requirement."}
            </div>
          </div>
        </AdminPanel>
      </div>

      {selectedProject && isGiaProject(selectedProject) ? (
        <ProjectDetailsModal
          onClose={() => setSelectedProject(null)}
          project={selectedProject}
        />
      ) : selectedProject ? (
        <SetupProjectDetailsModal
          onClose={() => setSelectedProject(null)}
          project={selectedProject}
        />
      ) : null}

      {siteVisitCalendarOpen ? (
        <SiteVisitCalendarModal
          onClose={() => setSiteVisitCalendarOpen(false)}
          program={selectedProgram}
        />
      ) : null}
    </div>
  );
}
