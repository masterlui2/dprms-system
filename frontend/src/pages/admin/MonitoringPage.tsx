import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Grid2X2,
  List,
  ListFilter,
} from "lucide-react";

import { ModalShell } from "../../components/admin/ModalShell";
import { SetupMonitoringHub } from "../../components/monitoring/SetupMonitoringHub";
import { GiaMonitoringHub } from "../../components/monitoring/GiaMonitoringHub";
import { MonitoringOverviewSection } from "../../components/monitoring/MonitoringOverviewSection";
import { GiaMonitoringOverviewSection } from "../../components/monitoring/GiaMonitoringOverviewSection";
import { MonitoredProjectsSection } from "../../components/monitoring/MonitoredProjectsSection";
import { ROLES } from "../../config/permissions";

import {
  projectRecords,
  type Program,
  type ProjectRecord,
} from "../../data/admin";
import { getMockUser } from "../../lib/mockAuth";
import { cn } from "../../utils/cn";

const visits = [


  {
    program: "GIA" as Program,
    agency: "PSTO-Davao Oriental",
    proponent: "Barangay Central Fisherfolk Association",
    type: "Site Inspection",
    date: "2024-08-15",
    time: "09:00 AM",
    status: "Upcoming",
    location: "Mati City, Davao Oriental",
  },
  {
    program: "GIA" as Program,
    agency: "PSTO-Davao Oriental",
    proponent: "Tagum Agricultural Reform Beneficiaries",
    type: "Validation Visit",
    date: "2024-08-20",
    time: "01:30 PM",
    status: "Upcoming",
    location: "Tagum City, Davao del Norte",
  },
  {
    program: "SETUP" as Program,
    agency: "PSTO-Davao Oriental",
    proponent: "Madayaway Food Products",
    type: "Progress Monitoring",
    date: "2024-08-25",
    time: "10:00 AM",
    status: "Pending Proponent",
    location: "Lower Kapayas, Mati City",
  },
];

function SiteVisitCalendarModal({
  onClose,
  program,
}: {
  onClose: () => void;
  program: Program;
}) {
  const [currentMonth, setCurrentMonth] = useState(7);


  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const filteredVisits = visits.filter((v) => v.program === program);

  return (
    <ModalShell
      onClose={onClose}
      title="Field Validation & Site Visits Calendar"
      description={`Scheduled site monitoring visits for ${program} portfolio.`}
      width="lg"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-[#B5BFCD]/80 bg-[#E6EEF4]/50 px-4 py-2 text-xs">
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => Math.max(0, m - 1))}
            className="p-1 hover:bg-[#E6EEF4] rounded text-[#285497]"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="font-bold text-slate-900">
            {monthNames[currentMonth]} 2024
          </span>
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => Math.min(11, m + 1))}
            className="p-1 hover:bg-[#E6EEF4] rounded text-[#285497]"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="space-y-2">
          {filteredVisits.map((v, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl border border-[#B5BFCD]/60 hover:bg-[#E6EEF4]/40 text-xs"
            >
              <div>
                <p className="font-bold text-slate-900">{v.proponent}</p>
                <p className="text-slate-500 text-[11px]">{v.location} · {v.type}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-[#0f53b7]">{v.date}</span>
                <p className="text-slate-400 text-[10px]">{v.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModalShell>
  );
}

export function MonitoringPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = getMockUser();

  const selectedProgram: Program =
    currentUser?.program === "SETUP" || currentUser?.program === "GIA"
      ? currentUser.program
      : "SETUP";

  const currentView = searchParams.get("view") === "projects" ? "projects" : "overview";
  const projectIdParam = searchParams.get("projectId");

  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);

  const programProjects = projectRecords.filter(
    (p) => p.program === selectedProgram,
  );

  useEffect(() => {
    if (projectIdParam) {
      const found = projectRecords.find((p) => p.id === projectIdParam);
      if (found) {
        setSelectedProject(found);
      }
    } else {
      setSelectedProject(null);
    }
  }, [projectIdParam]);

  const [globalQuarter, setGlobalQuarter] = useState("Q3 2024");
  const [globalViewMode, setGlobalViewMode] = useState<"box" | "list">("box");
  const [siteVisitCalendarOpen, setSiteVisitCalendarOpen] = useState(false);
  const isOverview = currentView === "overview";

  if (selectedProject && (selectedProgram === "SETUP" || selectedProject.program === "SETUP")) {
    return (
      <div className="space-y-6 font-sans">
        <SetupMonitoringHub
          project={selectedProject}
          readOnly={currentUser?.role !== ROLES.FOCAL}
          onBack={() => {
            setSelectedProject(null);
            setSearchParams({ view: "projects" });
          }}
        />
      </div>
    );
  }

  if (selectedProject && (selectedProgram === "GIA" || selectedProject.program === "GIA")) {
    return (
      <div className="space-y-6 font-sans">
        <GiaMonitoringHub
          project={selectedProject}
          readOnly={currentUser?.role !== ROLES.FOCAL}
          onBack={() => {
            setSelectedProject(null);
            setSearchParams({ view: "projects" });
          }}
        />
      </div>
    );
  }



  return (
    <div className="space-y-5 font-sans">
      {/* Unified Single-Row Header Bar (Theme Styled) */}
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#B5BFCD]/80 bg-white px-5 py-3.5 shadow-sm">
        {/* Left: Title + Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 leading-none">
              <span>Project Monitoring</span>
              <span>&gt;</span>
              <span className="text-[#285497] font-bold">{isOverview ? "Overview" : "Monitored Projects"}</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight mt-0.5">
              Project Monitoring
            </h1>
          </div>

          {/* Navigation Switcher Pills */}
          <div className="flex items-center gap-1 rounded-xl border border-[#B5BFCD]/80 bg-[#E6EEF4]/50 p-1">
            <button
              type="button"
              onClick={() => setSearchParams({ view: "overview" })}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition",
                currentView === "overview"
                  ? "bg-[#0f53b7] text-white shadow-md shadow-blue-900/15"
                  : "text-slate-600 hover:bg-[#E6EEF4] hover:text-[#285497]",
              )}
            >
              <BarChart3 className="size-3.5" />
              <span>Overview</span>
            </button>
            <button
              type="button"
              onClick={() => setSearchParams({ view: "projects" })}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition",
                currentView === "projects"
                  ? "bg-[#0f53b7] text-white shadow-md shadow-blue-900/15"
                  : "text-slate-600 hover:bg-[#E6EEF4] hover:text-[#285497]",
              )}
            >
              <ListFilter className="size-3.5" />
              <span>Monitored Projects</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.2 text-[10px] font-extrabold",
                  currentView === "projects"
                    ? "bg-white/25 text-white"
                    : "bg-[#E6EEF4] text-[#285497]",
                )}
              >
                {programProjects.length}
              </span>
            </button>
          </div>
        </div>

        {/* Right: Reporting Period Dropdown + Export Report + Grid/List View */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Reporting Period */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Period:
            </span>
            <select
              value={globalQuarter}
              onChange={(e) => setGlobalQuarter(e.target.value)}
              className="h-9 rounded-xl border border-[#B5BFCD] bg-white px-3 text-xs font-bold text-slate-700 shadow-sm focus:border-[#0f53b7] focus:outline-none"
            >
              <option value="Q3 2024">Q3 2024</option>
              <option value="Q2 2024">Q2 2024</option>
              <option value="Q1 2024">Q1 2024</option>
              <option value="Full Year 2024">Full Year 2024</option>
            </select>
          </div>

          {/* Export Report / Export List Button */}
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white px-3.5 text-xs font-bold text-[#285497] shadow-sm transition hover:bg-[#E6EEF4] active:scale-95"
          >
            <FileDown className="size-3.5 text-[#285497]" />
            <span>{isOverview ? "Export report" : "Export list"}</span>
          </button>

          {/* Grid / List View Toggle */}
          {!isOverview && (
            <div className="flex items-center gap-1 rounded-xl border border-[#B5BFCD]/80 bg-[#E6EEF4]/50 p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setGlobalViewMode("box")}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition",
                  globalViewMode === "box"
                    ? "bg-[#0f53b7] text-white shadow-sm"
                    : "text-slate-600 hover:text-[#285497]",
                )}
              >
                <Grid2X2 className="size-3" />
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setGlobalViewMode("list")}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition",
                  globalViewMode === "list"
                    ? "bg-[#0f53b7] text-white shadow-sm"
                    : "text-slate-600 hover:text-[#285497]",
                )}
              >
                <List className="size-3" />
                <span>List</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {currentView === "overview" ? (
        selectedProgram === "GIA" ? (
          <GiaMonitoringOverviewSection
            projects={programProjects}
            period={globalQuarter}
            onOpenCalendar={() => setSiteVisitCalendarOpen(true)}
            onSelectProject={(project) => {
              setSelectedProject(project);
              setSearchParams({ projectId: project.id });
            }}
          />
        ) : (
          <MonitoringOverviewSection
            projects={programProjects}
            period={globalQuarter}
            onOpenCalendar={() => setSiteVisitCalendarOpen(true)}
            onSelectProject={(project) => {
              setSelectedProject(project);
              setSearchParams({ projectId: project.id });
            }}
          />
        )
      ) : (

        <MonitoredProjectsSection
          projects={programProjects}
          viewMode={globalViewMode}
          onSelectProject={(project) => {
            setSelectedProject(project);
            setSearchParams({ projectId: project.id });
          }}
        />
      )}

      {siteVisitCalendarOpen ? (
        <SiteVisitCalendarModal
          onClose={() => setSiteVisitCalendarOpen(false)}
          program={selectedProgram}
        />
      ) : null}

    </div>
  );
}
