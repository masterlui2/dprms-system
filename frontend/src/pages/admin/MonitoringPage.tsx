import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BarChart3,
  FileDown,
  ListFilter,
  LoaderCircle,
  RefreshCw,
} from 'lucide-react'

import { AnimatedTabs } from '../../components/common/AnimatedTabs'
import { GiaMonitoringHub } from '../../components/monitoring/GiaMonitoringHub'
import { GiaMonitoringOverviewSection } from '../../components/monitoring/GiaMonitoringOverviewSection'
import { MonitoredProjectsSection } from '../../components/monitoring/MonitoredProjectsSection'
import { MonitoringOverviewSection } from '../../components/monitoring/MonitoringOverviewSection'
import { SetupMonitoringHub } from '../../components/monitoring/SetupMonitoringHub'
import { ROLES } from '../../config/permissions'
import type { Program, ProjectRecord } from '../../data/admin'
import { getMockUser } from '../../lib/mockAuth'
import {
  fetchGiaMonitoringProjects,
  type GiaMonitoringStatistics,
} from '../../services/giaMonitoringStore'
import {
  fetchSetupMonitoringProjects,
  type SetupMonitoringStatistics,
} from '../../services/setupMonitoringStore'
import type { ProjectPagination } from '../../types/monitoring'
import { cn } from '../../utils/cn'

type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'
type Semester = 1 | 2

const EMPTY_SETUP_STATISTICS: SetupMonitoringStatistics = {
  activeProjects: 0,
  monitoredCount: 0,
  pendingReports: 0,
}

const EMPTY_GIA_STATISTICS: GiaMonitoringStatistics = {
  activeGrants: 0,
  monitoredProjects: 0,
  totalGrantAmount: 0,
  averageMilestoneProgress: 0,
  pendingMilestones: 0,
  delayedMilestones: 0,
}

const EMPTY_PAGINATION: ProjectPagination = {
  currentPage: 1,
  lastPage: 1,
  perPage: 6,
  total: 0,
  from: null,
  to: null,
}

function currentQuarter(): { quarter: Quarter; year: number } {
  const now = new Date()
  return {
    quarter: `Q${Math.ceil((now.getMonth() + 1) / 3)}` as Quarter,
    year: now.getFullYear(),
  }
}

function currentSemester(): { semester: Semester; year: number } {
  const now = new Date()
  return {
    semester: now.getMonth() < 6 ? 1 : 2,
    year: now.getFullYear(),
  }
}

function parseQuarterPeriod(value: string): { quarter: Quarter; year: number } {
  const match = /^(Q[1-4])\s+(\d{4})$/.exec(value)
  if (!match) return currentQuarter()

  return { quarter: match[1] as Quarter, year: Number(match[2]) }
}

function semesterLabel(semester: Semester, year: number): string {
  return `${semester === 1 ? '1st' : '2nd'} Semester ${year}`
}

function parseSemesterPeriod(value: string): { semester: Semester; year: number } {
  const match = /^(1st|2nd) Semester (\d{4})$/.exec(value)
  if (!match) return currentSemester()

  return { semester: match[1] === '1st' ? 1 : 2, year: Number(match[2]) }
}

function quarterPeriods(): string[] {
  const current = currentQuarter()
  const periods: string[] = []
  let quarter = Number(current.quarter.slice(1))
  let year = current.year

  for (let index = 0; index < 8; index += 1) {
    periods.push(`Q${quarter} ${year}`)
    quarter -= 1
    if (quarter === 0) {
      quarter = 4
      year -= 1
    }
  }

  return periods
}

function semesterPeriods(): string[] {
  const current = currentSemester()
  const periods: string[] = []
  let semester = current.semester
  let year = current.year

  for (let index = 0; index < 6; index += 1) {
    periods.push(semesterLabel(semester, year))
    if (semester === 1) {
      semester = 2
      year -= 1
    } else {
      semester = 1
    }
  }

  return periods
}

function readableError(program: Program): string {
  return program === 'SETUP'
    ? 'SETUP monitoring projects could not be loaded from the server.'
    : 'GIA monitoring projects could not be loaded. Confirm that you are signed in as the CEST Focal or Provincial Director.'
}

export function MonitoringPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentUser = getMockUser()

  const lockedProgram: Program | null =
    currentUser?.program === 'SETUP' || currentUser?.program === 'GIA'
      ? currentUser.program
      : null
  const selectedProgram: Program = lockedProgram ??
    (searchParams.get('program') === 'GIA' ? 'GIA' : 'SETUP')
  const [currentView, setCurrentView] = useState<'overview' | 'projects'>(
    searchParams.get('view') === 'projects' ? 'projects' : 'overview'
  )
  const projectIdParam = searchParams.get('projectId')

  const initialQuarter = (() => {
    const quarter = searchParams.get('quarter')
    const year = Number(searchParams.get('year'))
    if (/^Q[1-4]$/.test(quarter ?? '') && Number.isInteger(year) && year >= 2000) {
      return `${quarter} ${year}`
    }
    const current = currentQuarter()
    return `${current.quarter} ${current.year}`
  })()
  const initialSemester = (() => {
    const semester = Number(searchParams.get('semester'))
    const year = Number(searchParams.get('year'))
    if ((semester === 1 || semester === 2) && Number.isInteger(year) && year >= 2000) {
      return semesterLabel(semester, year)
    }
    const current = currentSemester()
    return semesterLabel(current.semester, current.year)
  })()
  const initialPage = Math.max(1, Number(searchParams.get('page')) || 1)

  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null)
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false)
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [projectsError, setProjectsError] = useState<string | null>(null)
  const [setupStatistics, setSetupStatistics] = useState(EMPTY_SETUP_STATISTICS)
  const [giaStatistics, setGiaStatistics] = useState(EMPTY_GIA_STATISTICS)
  const [pagination, setPagination] = useState<ProjectPagination>(EMPTY_PAGINATION)
  const [districts, setDistricts] = useState<string[]>([])
  const [agencies, setAgencies] = useState<string[]>([])
  const [giaStatuses, setGiaStatuses] = useState<string[]>([])
  const [giaCanEdit, setGiaCanEdit] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [districtValue, setDistrictValue] = useState('')
  const [agencyValue, setAgencyValue] = useState('')
  const [statusValue, setStatusValue] = useState('')
  const [projectPage, setProjectPage] = useState(initialPage)
  const [globalQuarter, setGlobalQuarter] = useState(initialQuarter)
  const [globalSemester, setGlobalSemester] = useState(initialSemester)
  const [globalViewMode, setGlobalViewMode] = useState<'box' | 'list'>('box')
  const loadRequestRef = useRef(0)

  const updateSearchParams = useCallback((updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) next.delete(key)
      else next.set(key, value)
    }
    setSearchParams(next)
  }, [searchParams, setSearchParams])

  useEffect(() => {
    const view = searchParams.get('view') === 'projects' ? 'projects' : 'overview'
    setCurrentView(view)
  }, [searchParams])

  const handleTabSwitch = (view: 'overview' | 'projects') => {
    setCurrentView(view)
    updateSearchParams({ projectId: null, view: view === 'projects' ? 'projects' : null })
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchValue.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchValue])

  const loadProjects = useCallback(async () => {
    const requestId = ++loadRequestRef.current
    setIsLoadingProjects(true)
    setProjectsError(null)

    try {
      if (selectedProgram === 'SETUP') {
        const period = parseQuarterPeriod(globalQuarter)
        const result = await fetchSetupMonitoringProjects({
          search: debouncedSearch,
          district: districtValue,
          year: period.year,
          quarter: period.quarter,
          page: projectPage,
        })

        if (requestId !== loadRequestRef.current) return
        setProjects(result.projects)
        setSetupStatistics(result.statistics)
        setDistricts(result.districts)
        setPagination(result.pagination)
      } else {
        const period = parseSemesterPeriod(globalSemester)
        const result = await fetchGiaMonitoringProjects({
          search: debouncedSearch,
          agency: agencyValue,
          status: statusValue,
          year: period.year,
          semester: period.semester,
          page: projectPage,
        })

        if (requestId !== loadRequestRef.current) return
        setProjects(result.projects)
        setGiaStatistics(result.statistics)
        setAgencies(result.agencies)
        setGiaStatuses(result.statuses)
        setGiaCanEdit(result.canEdit)
        setPagination(result.pagination)
      }
      setHasLoadedInitial(true)
    } catch (error) {
      if (requestId !== loadRequestRef.current) return
      console.error('Failed to load monitoring projects:', error)
      setProjectsError(readableError(selectedProgram))
    } finally {
      if (requestId === loadRequestRef.current) setIsLoadingProjects(false)
    }
  }, [
    agencyValue,
    debouncedSearch,
    districtValue,
    globalQuarter,
    globalSemester,
    projectPage,
    selectedProgram,
    statusValue,
  ])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  useEffect(() => {
    if (!projectIdParam) {
      setSelectedProject(null)
      return
    }

    const found = projects.find((project) =>
      (String(project.backendId ?? project.id) === projectIdParam || project.id === projectIdParam) &&
      project.program === selectedProgram,
    )
    if (found) setSelectedProject(found)
    else if (!isLoadingProjects) setSelectedProject(null)
  }, [isLoadingProjects, projectIdParam, projects, selectedProgram])

  const setupPeriod = parseQuarterPeriod(globalQuarter)
  const giaPeriod = parseSemesterPeriod(globalSemester)
  const activePeriod = selectedProgram === 'SETUP' ? globalQuarter : globalSemester
  const programProjects = projects.filter((project) => project.program === selectedProgram)
  const isOverview = currentView === 'overview'

  const resetFilters = () => {
    setSearchValue('')
    setDebouncedSearch('')
    setDistrictValue('')
    setAgencyValue('')
    setStatusValue('')
    setProjectPage(1)
  }

  const switchProgram = (program: Program) => {
    setSelectedProject(null)
    setProjects([])
    setPagination(EMPTY_PAGINATION)
    resetFilters()
    updateSearchParams({ program, projectId: null, page: null })
  }

  const changePage = (page: number) => {
    setProjectPage(page)
    updateSearchParams({ page: String(page) })
  }

  const openProject = (project: ProjectRecord) => {
    setSelectedProject(project)
    updateSearchParams({
      projectId: String(project.backendId ?? project.id),
      page: String(projectPage),
      quarter: project.program === 'SETUP' ? setupPeriod.quarter : null,
      semester: project.program === 'GIA' ? String(giaPeriod.semester) : null,
      year: String(project.program === 'SETUP' ? setupPeriod.year : giaPeriod.year),
    })
  }

  if (selectedProject?.program === 'SETUP') {
    return (
      <div className="space-y-6 font-sans">
        <SetupMonitoringHub
          project={selectedProject}
          initialQuarter={setupPeriod.quarter}
          initialYear={setupPeriod.year}
          readOnly={currentUser?.role !== ROLES.FOCAL}
          onBack={() => {
            setSelectedProject(null)
            updateSearchParams({ projectId: null, view: 'projects' })
          }}
        />
      </div>
    )
  }

  if (selectedProject?.program === 'GIA') {
    return (
      <div className="space-y-6 font-sans">
        <GiaMonitoringHub
          project={selectedProject}
          initialSemester={giaPeriod.semester}
          initialYear={giaPeriod.year}
          readOnly={!giaCanEdit}
          onBack={() => {
            setSelectedProject(null)
            updateSearchParams({ projectId: null, view: 'projects' })
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-5 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="h-9 sm:h-10 w-1.5 rounded-full bg-[#0f53b7]" />
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold leading-none text-slate-400">
              <span>Project Monitoring</span>
              <span>&gt;</span>
              <span className="font-bold text-[#285497]">{isOverview ? 'Overview' : 'Monitored Projects'}</span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black leading-tight tracking-tight text-slate-900">
              Project Monitoring
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <AnimatedTabs
            layoutId="monitoring-view-tabs"
            activeTab={currentView}
            onChange={(id) => handleTabSwitch(id as 'overview' | 'projects')}
            tabs={[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              {
                id: 'projects',
                label: 'Monitored Projects',
                icon: ListFilter,
                count: pagination.total,
              },
            ]}
          />

          {!lockedProgram ? (
            <AnimatedTabs
              layoutId="monitoring-program-tabs"
              activeTab={selectedProgram}
              onChange={(id) => switchProgram(id as Program)}
              tabs={[
                { id: 'SETUP', label: 'SETUP' },
                { id: 'GIA', label: 'GIA' },
              ]}
            />
          ) : null}

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {selectedProgram === 'SETUP' ? 'Quarter:' : 'Semester:'}
            </span>
            <select
              value={activePeriod}
              onChange={(event) => {
                setSelectedProject(null)
                setProjectPage(1)
                if (selectedProgram === 'SETUP') {
                  const parsed = parseQuarterPeriod(event.target.value)
                  setGlobalQuarter(event.target.value)
                  updateSearchParams({
                    projectId: null,
                    page: null,
                    quarter: parsed.quarter,
                    semester: null,
                    year: String(parsed.year),
                  })
                } else {
                  const parsed = parseSemesterPeriod(event.target.value)
                  setGlobalSemester(event.target.value)
                  updateSearchParams({
                    projectId: null,
                    page: null,
                    quarter: null,
                    semester: String(parsed.semester),
                    year: String(parsed.year),
                  })
                }
              }}
              className="h-9 rounded-xl border border-[#B5BFCD] bg-white px-3 text-xs font-bold text-slate-700 shadow-sm outline-none focus:border-[#0f53b7]"
            >
              {(selectedProgram === 'SETUP' ? quarterPeriods() : semesterPeriods()).map((period) => (
                <option key={period} value={period}>{period}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white px-3.5 text-xs font-bold text-[#285497] shadow-sm transition hover:bg-[#E6EEF4]"
          >
            <FileDown className="size-3.5" />
            {isOverview ? 'Export report' : 'Export list'}
          </button>
        </div>
      </div>

      {!hasLoadedInitial && isLoadingProjects ? (
        <div className="flex min-h-52 items-center justify-center rounded-2xl border border-[#B5BFCD]/80 bg-white text-sm font-semibold text-slate-500 shadow-sm">
          <LoaderCircle className="mr-2 size-5 animate-spin text-[#285497]" />
          Loading {selectedProgram} monitoring projects...
        </div>
      ) : projectsError ? (
        <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-rose-200 bg-white px-6 text-center shadow-sm">
          <p className="text-sm font-bold text-rose-700">{projectsError}</p>
          <button
            type="button"
            onClick={() => void loadProjects()}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#0f53b7] px-4 py-2 text-xs font-bold text-white hover:bg-[#0b3f8b]"
          >
            <RefreshCw className="size-3.5" /> Retry
          </button>
        </div>
      ) : (
        <>
          <div className={cn(currentView === 'overview' ? 'block animate-in fade-in duration-150' : 'hidden')}>
            {selectedProgram === 'GIA' ? (
              <GiaMonitoringOverviewSection
                projects={programProjects}
                statistics={giaStatistics}
                period={globalSemester}
                onSelectProject={openProject}
              />
            ) : (
              <MonitoringOverviewSection
                projects={programProjects}
                statistics={setupStatistics}
                period={globalQuarter}
                onSelectProject={openProject}
              />
            )}
          </div>

          <div className={cn(currentView === 'projects' ? 'block animate-in fade-in duration-150' : 'hidden')}>
            <MonitoredProjectsSection
              program={selectedProgram}
              projects={programProjects}
              viewMode={globalViewMode}
              onViewModeChange={setGlobalViewMode}
              searchValue={searchValue}
              isFiltering={isLoadingProjects}
              pagination={pagination}
              districtValue={selectedProgram === 'SETUP' ? districtValue : undefined}
              districts={selectedProgram === 'SETUP' ? districts : undefined}
              agencyValue={selectedProgram === 'GIA' ? agencyValue : undefined}
              agencies={selectedProgram === 'GIA' ? agencies : undefined}
              statusValue={selectedProgram === 'GIA' ? statusValue : undefined}
              statuses={selectedProgram === 'GIA' ? giaStatuses : undefined}
              onSearchChange={(value: string) => {
                setSearchValue(value)
                setProjectPage(1)
              }}
              onDistrictChange={selectedProgram === 'SETUP' ? (value: string) => {
                setDistrictValue(value)
                setProjectPage(1)
              } : undefined}
              onAgencyChange={selectedProgram === 'GIA' ? (value: string) => {
                setAgencyValue(value)
                setProjectPage(1)
              } : undefined}
              onStatusChange={selectedProgram === 'GIA' ? (value: string) => {
                setStatusValue(value)
                setProjectPage(1)
              } : undefined}
              onPageChange={changePage}
              onSelectProject={openProject}
            />
          </div>
        </>
      )}
    </div>
  )
}
