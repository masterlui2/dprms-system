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
import { downloadBlob, prepareDownloadDirectory } from '../../services/downloadManager'
import { createCsvBlob } from '../../utils/csv'
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
import {
  defaultSetupMonitoringPeriod,
  parseSetupMonitoringPeriod,
  setupMonitoringPeriodOptions,
} from '../../utils/setupMonitoringPeriod'

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

function currentSemester(): { semester: Semester; year: number } {
  const now = new Date()
  return {
    semester: now.getMonth() < 6 ? 1 : 2,
    year: now.getFullYear(),
  }
}

function semesterLabel(semester: Semester, year: number): string {
  return `${semester === 1 ? '1st' : '2nd'} Semester ${year}`
}

function parseSemesterPeriod(value: string): { semester: Semester; year: number } {
  const match = /^(1st|2nd) Semester (\d{4})$/.exec(value)
  if (!match) return currentSemester()

  return { semester: match[1] === '1st' ? 1 : 2, year: Number(match[2]) }
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
    const current = defaultSetupMonitoringPeriod()
    const period = quarter && Number.isInteger(year)
      ? parseSetupMonitoringPeriod(`${quarter} ${year}`)
      : current

    return `${period.quarter} ${period.year}`
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
  const [isExporting, setIsExporting] = useState(false)
  const [exportNotice, setExportNotice] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

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
        const period = parseSetupMonitoringPeriod(globalQuarter)
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

  const setupPeriod = parseSetupMonitoringPeriod(globalQuarter)
  const giaPeriod = parseSemesterPeriod(globalSemester)
  const activePeriod = selectedProgram === 'SETUP' ? globalQuarter : globalSemester
  const programProjects = projects.filter((project) => project.program === selectedProgram)
  const isOverview = currentView === 'overview'

  async function handleExport() {
    if (!currentUser || isExporting) return
    setIsExporting(true); setExportNotice(null); setExportError(null)
    try {
      const directory = await prepareDownloadDirectory(currentUser)
      const fetchPage = (page: number) => selectedProgram === 'SETUP'
        ? fetchSetupMonitoringProjects({ search: searchValue.trim(), district: districtValue, ...setupPeriod, page })
        : fetchGiaMonitoringProjects({ search: searchValue.trim(), agency: agencyValue, status: statusValue, ...giaPeriod, page })
      const first = await fetchPage(1)
      const allProjects = [...first.projects]
      for (let page = 2; page <= first.pagination.lastPage; page += 1) {
        const next = await fetchPage(page)
        if (next.pagination.currentPage !== page || next.pagination.total !== first.pagination.total) throw new Error('The project list changed. Please try exporting again.')
        allProjects.push(...next.projects)
      }
      if (allProjects.length !== first.pagination.total || new Set(allProjects.map((project) => project.id)).size !== allProjects.length) {
        throw new Error('The project list changed. Please try exporting again.')
      }
      const rows: Array<Array<string | number | null | undefined>> = []
      if (isOverview) {
        rows.push(['Field', 'Value'], ['Program', selectedProgram], ['Period', activePeriod],
          ['Search', searchValue.trim()], ['District', selectedProgram === 'SETUP' ? districtValue : ''],
          ['Agency', selectedProgram === 'GIA' ? agencyValue : ''], ['Status', selectedProgram === 'GIA' ? statusValue : ''],
          ['Matching projects', first.pagination.total])
        const milestones = allProjects.flatMap((project) => project.gia?.milestones ?? [])
        const statistics = selectedProgram === 'SETUP' ? {
          activeProjects: allProjects.length,
          monitoredCount: allProjects.filter((project) => project.monitored).length,
          pendingReports: allProjects.reduce((sum, project) => sum + (project.pendingReports ?? 0), 0),
        } : {
          activeGrants: allProjects.length,
          monitoredProjects: allProjects.filter((project) => project.monitored).length,
          totalGrantAmount: allProjects.reduce((sum, project) => sum + project.budget, 0),
          averageMilestoneProgress: milestones.length ? Math.round(milestones.reduce((sum, milestone) => sum + milestone.completionPercentage, 0) / milestones.length * 10) / 10 : 0,
          pendingMilestones: milestones.filter((milestone) => ['PENDING', 'IN_PROGRESS', 'DELAYED'].includes(milestone.status)).length,
          delayedMilestones: milestones.filter((milestone) => milestone.status === 'DELAYED').length,
        }
        for (const [key, value] of Object.entries(statistics)) {
          rows.push([key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase()), value])
        }
      } else {
        rows.push(['Program', 'Period', 'Reference', 'Project title', 'Enterprise / agency', 'Manager', 'District', 'Status', 'Budget (PHP)', 'Progress (%)', 'Monitoring status', 'Last monitored', 'Pending reports'])
        for (const project of allProjects) {
          rows.push([selectedProgram, activePeriod, project.referenceNumber ?? project.id, project.title,
            project.enterprise, project.manager, project.district, project.status, project.budget, project.progress,
            project.monitoringStatus, project.lastMonitoredAt, project.pendingReports])
        }
      }
      const result = await downloadBlob({ blob: createCsvBlob(rows), directory, fileName: `${selectedProgram}_monitoring_${isOverview ? 'report' : 'list'}_${activePeriod.replace(/\s+/g, '_')}.csv`, program: selectedProgram, user: currentUser })
      setExportNotice(result.usedBrowserFallback ? 'CSV sent to browser downloads.' : `CSV saved to ${result.destination}`)
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'The CSV could not be exported. Please try again.')
    } finally { setIsExporting(false) }
  }

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
          key={String(selectedProject.backendId ?? selectedProject.id)}
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
                  const parsed = parseSetupMonitoringPeriod(event.target.value)
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
              {selectedProgram === 'SETUP'
                ? setupMonitoringPeriodOptions().map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))
                : semesterPeriods().map((period) => (
                    <option key={period} value={period}>{period}</option>
                  ))}
            </select>
          </div>

          <button
            type="button"
            disabled={isExporting || isLoadingProjects || Boolean(projectsError)}
            onClick={() => void handleExport()}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white px-3.5 text-xs font-bold text-[#285497] shadow-sm transition hover:bg-[#E6EEF4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExporting ? <LoaderCircle className="size-3.5 animate-spin" /> : <FileDown className="size-3.5" />}
            {isExporting ? 'Exporting…' : isOverview ? 'Export report' : 'Export list'}
          </button>
        </div>
      </div>

      {exportNotice ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{exportNotice}</p> : null}
      {exportError ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{exportError}</p> : null}
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
