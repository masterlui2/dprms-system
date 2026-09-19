/**
 * System: DPRMS
 * Purpose: Render monitoring page for the application pages.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    BarChart3,
    CalendarDays,
    FileDown,
    ListFilter,
    LoaderCircle,
    RefreshCw,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { reportError } from '../../utils/error_reporting';

import { SiteVisitCalendar } from '../../components/admin/site-visits/SiteVisitCalendar';
import { AnimatedTabs } from '../../components/common/AnimatedTabs';
import { GiaMonitoringHub } from '../../components/monitoring/GiaMonitoringHub';
import { GiaMonitoringOverviewSection } from '../../components/monitoring/GiaMonitoringOverviewSection';
import { MonitoredProjectsSection } from '../../components/monitoring/MonitoredProjectsSection';
import { MonitoringOverviewSection } from '../../components/monitoring/MonitoringOverviewSection';
import { SetupMonitoringHub } from '../../components/monitoring/SetupMonitoringHub';
import { ROLES } from '../../config/permissions';
import type { Program, ProjectRecord } from '../../data/admin';
import { getMockUser } from '../../lib/mock_auth';
import { downloadBlob, prepareDownloadDirectory } from '../../services/download_manager';
import
{
    fetchGiaMonitoringProjects,
    type GiaMonitoringStatistics,
} from '../../services/gia_monitoring_store';
import
{
    fetchSetupMonitoringProjects,
    type SetupMonitoringStatistics,
} from '../../services/setup_monitoring_store';
import type { ProjectPagination } from '../../types/monitoring';
import { cn } from '../../utils/cn';
import { createCsvBlob } from '../../utils/csv';
import
{
    defaultSetupMonitoringPeriod,
    parseSetupMonitoringPeriod,
    setupMonitoringPeriodOptions,
} from '../../utils/setup_monitoring_period';

type Semester = 1 | 2;

const EMPTY_SETUP_STATISTICS: SetupMonitoringStatistics = {
    activeProjects: 0,
    monitoredCount: 0,
    pendingReports: 0,
};

const EMPTY_GIA_STATISTICS: GiaMonitoringStatistics = {
    activeGrants: 0,
    monitoredProjects: 0,
    totalGrantAmount: 0,
    averageMilestoneProgress: 0,
    pendingMilestones: 0,
    delayedMilestones: 0,
};

const EMPTY_PAGINATION: ProjectPagination = {
    currentPage: 1,
    lastPage: 1,
    perPage: 6,
    total: 0,
    from: null,
    to: null,
};

/** Current semester. */
function _currentSemester(): { semester: Semester; year: number; }
{
    const dtNow = new Date();
    return {
        semester: dtNow.getMonth() < 6 ? 1 : 2,
        year: dtNow.getFullYear(),
    };
}

/** Semester label. */
function _semesterLabel(intSemester: Semester, intYear: number): string
{
    return `${intSemester === 1 ? '1st' : '2nd'} Semester ${intYear}`;
}

/** Parse semester period. */
function _parseSemesterPeriod(strValue: string): { semester: Semester; year: number; }
{
    const objMatch = /^(1st|2nd) Semester (\d{4})$/.exec(strValue);
    if (!objMatch)
    {
        return _currentSemester();
    }

    return { semester: objMatch[1] === '1st' ? 1 : 2, year: Number(objMatch[2]) };
}

/** Semester periods. */
function _semesterPeriods(): string[]
{
    const objCurrent = _currentSemester();
    const arrPeriods: string[] = [];
    let intSemester = objCurrent.semester;
    let intYear = objCurrent.year;

    let intIndex = 0;
    for (; intIndex < 6; intIndex += 1)
    {
        arrPeriods.push(_semesterLabel(intSemester, intYear));
        if (intSemester === 1)
        {
            intSemester = 2;
            intYear -= 1;
        } else
        {
            intSemester = 1;
        }
    }

    return arrPeriods;
}

/** Readable error. */
function _readableError(strProgram: Program): string
{
    return strProgram === 'SETUP'
        ? 'SETUP monitoring projects could not be loaded from the server.'
        : 'GIA monitoring projects could not be loaded. Confirm that you are signed in as the CEST Focal or Provincial Director.';
}

/** Render monitoring page and its available actions. */
export function MonitoringPage()
{
    const [objSearchParams, setSearchParams] = useSearchParams();
    const objCurrentUser = getMockUser();

    const strLockedProgram: Program | null =
        objCurrentUser?.program === 'SETUP' || objCurrentUser?.program === 'GIA'
            ? objCurrentUser.program
            : null;
    const strSelectedProgram: Program =
        strLockedProgram ?? (objSearchParams.get('program') === 'GIA' ? 'GIA' : 'SETUP');
    const [strCurrentView, setStrCurrentView] = useState<'overview' | 'projects' | 'calendar'>(
        () =>
        {
            const strRequested = objSearchParams.get('view');
            if (strRequested === 'projects' || strRequested === 'calendar')
            {
                return strRequested;
            }
            return objCurrentUser?.role === ROLES.PROJECT_STAFF ? 'calendar' : 'overview';
        },
    );
    const strProjectIdParam = objSearchParams.get('projectId');

    const strInitialQuarter = (() =>
    {
        const strQuarter = objSearchParams.get('quarter');
        const intYear = Number(objSearchParams.get('year'));
        const objCurrent = defaultSetupMonitoringPeriod();
        const objPeriod =
            strQuarter && Number.isInteger(intYear)
                ? parseSetupMonitoringPeriod(`${strQuarter} ${intYear}`)
                : objCurrent;

        return `${objPeriod.quarter} ${objPeriod.year}`;
    })();
    const strInitialSemester = (() =>
    {
        const intSemester = Number(objSearchParams.get('semester'));
        const intYear = Number(objSearchParams.get('year'));
        if (
            (intSemester === 1 || intSemester === 2) &&
            Number.isInteger(intYear) &&
            intYear >= 2000
        )
        {
            return _semesterLabel(intSemester, intYear);
        }
        const objCurrent = _currentSemester();
        return _semesterLabel(objCurrent.semester, objCurrent.year);
    })();
    const intInitialPage = Math.max(1, Number(objSearchParams.get('page')) || 1);

    const [objSelectedProject, setObjSelectedProject] = useState<ProjectRecord | null>(null);
    const [arrProjects, setArrProjects] = useState<ProjectRecord[]>([]);
    const [blnHasLoadedInitial, setBlnHasLoadedInitial] = useState(false);
    const [blnIsLoadingProjects, setBlnIsLoadingProjects] = useState(true);
    const [strProjectsError, setStrProjectsError] = useState<string | null>(null);
    const [objSetupStatistics, setObjSetupStatistics] = useState(EMPTY_SETUP_STATISTICS);
    const [objGiaStatistics, setObjGiaStatistics] = useState(EMPTY_GIA_STATISTICS);
    const [objPagination, setObjPagination] = useState<ProjectPagination>(EMPTY_PAGINATION);
    const [arrDistricts, setArrDistricts] = useState<string[]>([]);
    const [arrAgencies, setArrAgencies] = useState<string[]>([]);
    const [arrGiaStatuses, setArrGiaStatuses] = useState<string[]>([]);
    const [blnGiaCanEdit, setBlnGiaCanEdit] = useState(false);
    const [strSearchValue, setStrSearchValue] = useState('');
    const [strDebouncedSearch, setStrDebouncedSearch] = useState('');
    const [strDistrictValue, setStrDistrictValue] = useState('');
    const [strAgencyValue, setStrAgencyValue] = useState('');
    const [strStatusValue, setStrStatusValue] = useState('');
    const [intProjectPage, setIntProjectPage] = useState(intInitialPage);
    const [strGlobalQuarter, setStrGlobalQuarter] = useState(strInitialQuarter);
    const [strGlobalSemester, setStrGlobalSemester] = useState(strInitialSemester);
    const [strGlobalViewMode, setStrGlobalViewMode] = useState<'box' | 'list'>('box');
    const objLoadRequestRef = useRef(0);
    const [blnIsExporting, setBlnIsExporting] = useState(false);
    const [strExportNotice, setStrExportNotice] = useState<string | null>(null);
    const [strExportError, setStrExportError] = useState<string | null>(null);

    const _updateSearchParams = useCallback(
        (objUpdates: Record<string, string | null>) =>
        {
            const objNext = new URLSearchParams(objSearchParams);
            for (const [strKey, strValue] of Object.entries(objUpdates))
            {
                if (strValue === null)
                {
                    objNext.delete(strKey);
                } else
                {
                    objNext.set(strKey, strValue);
                }
            }
            setSearchParams(objNext);
        },
        [objSearchParams, setSearchParams],
    );

    useEffect(() =>
    {
        const strRequested = objSearchParams.get('view');
        const strView =
            strRequested === 'projects' || strRequested === 'calendar'
                ? strRequested
                : objCurrentUser?.role === ROLES.PROJECT_STAFF
                    ? 'calendar'
                    : 'overview';
        setStrCurrentView(strView);
    }, [objCurrentUser?.role, objSearchParams]);

    /** Handle tab switch. */
    const _handleTabSwitch = (strView: 'overview' | 'projects' | 'calendar') =>
    {
        setStrCurrentView(strView);
        _updateSearchParams({ projectId: null, view: strView === 'overview' ? null : strView });
    };

    useEffect(() =>
    {
        const intTimer = window.setTimeout(() => setStrDebouncedSearch(strSearchValue.trim()), 300);
        return () => window.clearTimeout(intTimer);
    }, [strSearchValue]);

    const _loadProjects = useCallback(
        async () =>
        {
            const intRequestId = ++objLoadRequestRef.current;
            setBlnIsLoadingProjects(true);
            setStrProjectsError(null);

            try
            {
                if (strSelectedProgram === 'SETUP')
                {
                    const objPeriod = parseSetupMonitoringPeriod(strGlobalQuarter);
                    const objResult = await fetchSetupMonitoringProjects({
                        search: strDebouncedSearch,
                        district: strDistrictValue,
                        year: objPeriod.year,
                        quarter: objPeriod.quarter,
                        page: intProjectPage,
                    });

                    if (intRequestId !== objLoadRequestRef.current)
                    {
                        return;
                    }
                    setArrProjects(objResult.projects);
                    setObjSetupStatistics(objResult.statistics);
                    setArrDistricts(objResult.districts);
                    setObjPagination(objResult.pagination);
                } else
                {
                    const objPeriod = _parseSemesterPeriod(strGlobalSemester);
                    const objResult = await fetchGiaMonitoringProjects({
                        search: strDebouncedSearch,
                        agency: strAgencyValue,
                        status: strStatusValue,
                        year: objPeriod.year,
                        semester: objPeriod.semester,
                        page: intProjectPage,
                    });

                    if (intRequestId !== objLoadRequestRef.current)
                    {
                        return;
                    }
                    setArrProjects(objResult.projects);
                    setObjGiaStatistics(objResult.statistics);
                    setArrAgencies(objResult.agencies);
                    setArrGiaStatuses(objResult.statuses);
                    setBlnGiaCanEdit(objResult.canEdit);
                    setObjPagination(objResult.pagination);
                }
                setBlnHasLoadedInitial(true);
            } /* end try */ catch (errError)
            {
                reportError(errError, 'MonitoringPage: load projects failed.');

                if (intRequestId !== objLoadRequestRef.current)
                {
                    return;
                }
                reportError(errError, 'Failed to load monitoring projects:');
                setStrProjectsError(_readableError(strSelectedProgram));
            } finally
            {
                if (intRequestId === objLoadRequestRef.current)
                {
                    setBlnIsLoadingProjects(false);
                }
            }
        } /* end _loadProjects */,
        [
            strAgencyValue,
            strDebouncedSearch,
            strDistrictValue,
            strGlobalQuarter,
            strGlobalSemester,
            intProjectPage,
            strSelectedProgram,
            strStatusValue,
        ],
    );

    useEffect(() =>
    {
        if (strCurrentView === 'calendar')
        {
            setBlnIsLoadingProjects(false);
            return;
        }
        void _loadProjects();
    }, [strCurrentView, _loadProjects]);

    useEffect(() =>
    {
        if (!strProjectIdParam)
        {
            setObjSelectedProject(null);
            return;
        }

        const objFound = arrProjects.find(
            (objProject) =>
                (String(objProject.backendId ?? objProject.id) === strProjectIdParam ||
                    objProject.id === strProjectIdParam) &&
                objProject.program === strSelectedProgram,
        );
        if (objFound)
        {
            setObjSelectedProject(objFound);
        } else if (!blnIsLoadingProjects)
        {
            setObjSelectedProject(null);
        }
    }, [blnIsLoadingProjects, strProjectIdParam, arrProjects, strSelectedProgram]);

    const objSetupPeriod = parseSetupMonitoringPeriod(strGlobalQuarter);
    const objGiaPeriod = _parseSemesterPeriod(strGlobalSemester);
    const strActivePeriod = strSelectedProgram === 'SETUP' ? strGlobalQuarter : strGlobalSemester;
    const arrProgramProjects = arrProjects.filter(
        (objProject) => objProject.program === strSelectedProgram,
    );
    const blnIsOverview = strCurrentView === 'overview';
    const strViewLabel =
        strCurrentView === 'calendar'
            ? 'Site Visits'
            : blnIsOverview
                ? 'Overview'
                : 'Monitored Projects';

    /** Handle export. */
    async function _handleExport()
    {
        if (!objCurrentUser || blnIsExporting)
        {
            return;
        }
        setBlnIsExporting(true);
        setStrExportNotice(null);
        setStrExportError(null);
        try
        {
            const objDirectory = await prepareDownloadDirectory(objCurrentUser);
            /** Fetch page. */
            const _fetchPage = (intPage: number) =>
                strSelectedProgram === 'SETUP'
                    ? fetchSetupMonitoringProjects({
                        search: strSearchValue.trim(),
                        district: strDistrictValue,
                        ...objSetupPeriod,
                        page: intPage,
                    })
                    : fetchGiaMonitoringProjects({
                        search: strSearchValue.trim(),
                        agency: strAgencyValue,
                        status: strStatusValue,
                        ...objGiaPeriod,
                        page: intPage,
                    });
            const objFirst = await _fetchPage(1);
            const arrAllProjects = [...objFirst.projects];
            let intPage = 2;
            for (; intPage <= objFirst.pagination.lastPage; intPage += 1)
            {
                const objNext = await _fetchPage(intPage);
                if (
                    objNext.pagination.currentPage !== intPage ||
                    objNext.pagination.total !== objFirst.pagination.total
                )
                {
                    throw new Error('The project list changed. Please try exporting again.');
                }
                arrAllProjects.push(...objNext.projects);
            }
            if (
                arrAllProjects.length !== objFirst.pagination.total ||
                new Set(arrAllProjects.map((objProject) => objProject.id)).size !==
                arrAllProjects.length
            )
            {
                throw new Error('The project list changed. Please try exporting again.');
            }
            const arrRows: Array<Array<string | number | null | undefined>> = [];
            if (blnIsOverview)
            {
                arrRows.push(
                    ['Field', 'Value'],
                    ['Program', strSelectedProgram],
                    ['Period', strActivePeriod],
                    ['Search', strSearchValue.trim()],
                    ['District', strSelectedProgram === 'SETUP' ? strDistrictValue : ''],
                    ['Agency', strSelectedProgram === 'GIA' ? strAgencyValue : ''],
                    ['Status', strSelectedProgram === 'GIA' ? strStatusValue : ''],
                    ['Matching projects', objFirst.pagination.total],
                );
                const arrMilestones = arrAllProjects.flatMap(
                    (objProject) => objProject.gia?.milestones ?? [],
                );
                const objStatistics =
                    strSelectedProgram === 'SETUP'
                        ? {
                            activeProjects: arrAllProjects.length,
                            monitoredCount: arrAllProjects.filter(
                                (objProject) => objProject.monitored,
                            ).length,
                            pendingReports: arrAllProjects.reduce(
                                (intSum, objProject) => intSum + (objProject.pendingReports ?? 0),
                                0,
                            ),
                        }
                        : {
                            activeGrants: arrAllProjects.length,
                            monitoredProjects: arrAllProjects.filter(
                                (objProject) => objProject.monitored,
                            ).length,
                            totalGrantAmount: arrAllProjects.reduce(
                                (intSum, objProject) => intSum + objProject.budget,
                                0,
                            ),
                            averageMilestoneProgress: arrMilestones.length
                                ? Math.round(
                                    (arrMilestones.reduce(
                                        (intSum, objMilestone) =>
                                            intSum + objMilestone.completionPercentage,
                                        0,
                                    ) /
                                        arrMilestones.length) *
                                    10,
                                ) / 10
                                : 0,
                            pendingMilestones: arrMilestones.filter((objMilestone) =>
                                ['PENDING', 'IN_PROGRESS', 'DELAYED'].includes(
                                    objMilestone.status,
                                ),
                            ).length,
                            delayedMilestones: arrMilestones.filter(
                                (objMilestone) => objMilestone.status === 'DELAYED',
                            ).length,
                        };
                for (const [strKey, objValue] of Object.entries(objStatistics))
                {
                    arrRows.push([
                        strKey
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, (strLetter) => strLetter.toUpperCase()),
                        objValue,
                    ]);
                }
            } else
            {
                arrRows.push([
                    'Program',
                    'Period',
                    'Reference',
                    'Project title',
                    'Enterprise / agency',
                    'Manager',
                    'District',
                    'Status',
                    'Budget (PHP)',
                    'Progress (%)',
                    'Monitoring status',
                    'Last monitored',
                    'Pending reports',
                ]);
                for (const objProject of arrAllProjects)
                {
                    arrRows.push([
                        strSelectedProgram,
                        strActivePeriod,
                        objProject.referenceNumber ?? objProject.id,
                        objProject.title,
                        objProject.enterprise,
                        objProject.manager,
                        objProject.district,
                        objProject.status,
                        objProject.budget,
                        objProject.progress,
                        objProject.monitoringStatus,
                        objProject.lastMonitoredAt,
                        objProject.pendingReports,
                    ]);
                }
            }
            const objResult = await downloadBlob({
                blob: createCsvBlob(arrRows),
                directory: objDirectory,
                fileName: `${strSelectedProgram}_monitoring_${blnIsOverview ? 'report' : 'list'}_${strActivePeriod.replace(/\s+/g, '_')}.csv`,
                program: strSelectedProgram,
                user: objCurrentUser,
            });
            setStrExportNotice(
                objResult.usedBrowserFallback
                    ? 'CSV sent to browser downloads.'
                    : `CSV saved to ${objResult.destination}`,
            );
        } /* end try */ catch (errError)
        {
            reportError(errError, 'MonitoringPage: handle export failed.');

            setStrExportError(
                errError instanceof Error
                    ? errError.message
                    : 'The CSV could not be exported. Please try again.',
            );
        } finally
        {
            setBlnIsExporting(false);
        }
    } /* end _handleExport */

    /** Reset filters. */
    const _resetFilters = () =>
    {
        setStrSearchValue('');
        setStrDebouncedSearch('');
        setStrDistrictValue('');
        setStrAgencyValue('');
        setStrStatusValue('');
        setIntProjectPage(1);
    };

    /** Switch program. */
    const _switchProgram = (strProgram: Program) =>
    {
        setObjSelectedProject(null);
        setArrProjects([]);
        setObjPagination(EMPTY_PAGINATION);
        _resetFilters();
        _updateSearchParams({ program: strProgram, projectId: null, page: null });
    };

    /** Change page. */
    const _changePage = (intPage: number) =>
    {
        setIntProjectPage(intPage);
        _updateSearchParams({ page: String(intPage) });
    };

    /** Open project. */
    const _openProject = (objProject: ProjectRecord) =>
    {
        setObjSelectedProject(objProject);
        _updateSearchParams({
            projectId: String(objProject.backendId ?? objProject.id),
            page: String(intProjectPage),
            quarter: objProject.program === 'SETUP' ? objSetupPeriod.quarter : null,
            semester: objProject.program === 'GIA' ? String(objGiaPeriod.semester) : null,
            year: String(objProject.program === 'SETUP' ? objSetupPeriod.year : objGiaPeriod.year),
        });
    };

    if (objSelectedProject?.program === 'SETUP')
    {
        return (
            <div className="space-y-6 font-sans">
                <SetupMonitoringHub
                    key={String(objSelectedProject.backendId ?? objSelectedProject.id)}
                    objProject={objSelectedProject}
                    strInitialQuarter={objSetupPeriod.quarter}
                    intInitialYear={objSetupPeriod.year}
                    blnReadOnly={objCurrentUser?.role !== ROLES.FOCAL}
                    onBack={() =>
                    {
                        setObjSelectedProject(null);
                        _updateSearchParams({ projectId: null, view: 'projects' });
                    }}
                />
            </div>
        );
    }

    if (objSelectedProject?.program === 'GIA')
    {
        return (
            <div className="space-y-6 font-sans">
                <GiaMonitoringHub
                    objProject={objSelectedProject}
                    intInitialSemester={objGiaPeriod.semester}
                    intInitialYear={objGiaPeriod.year}
                    blnReadOnly={!blnGiaCanEdit}
                    onBack={() =>
                    {
                        setObjSelectedProject(null);
                        _updateSearchParams({ projectId: null, view: 'projects' });
                    }}
                />
            </div>
        );
    }

    const blnShowProgramFilter = strCurrentView !== 'calendar' && !strLockedProgram;

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
                            <span className="font-bold text-[#285497]">{strViewLabel}</span>
                        </div>
                        <h1 className="mt-1 text-2xl sm:text-3xl font-black leading-tight tracking-tight text-slate-900">
                            Project Monitoring
                        </h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <AnimatedTabs
                        strLayoutId="monitoring-view-tabs"
                        strActiveTab={strCurrentView}
                        onChange={(strId) =>
                            _handleTabSwitch(strId as 'overview' | 'projects' | 'calendar')
                        }
                        arrTabs={[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            {
                                id: 'projects',
                                label: 'Monitored Projects',
                                icon: ListFilter,
                                count: objPagination.total,
                            },
                            { id: 'calendar', label: 'Site Visits', icon: CalendarDays },
                        ]}
                    />

                    {blnShowProgramFilter ? (
                        <AnimatedTabs
                            strLayoutId="monitoring-program-tabs"
                            strActiveTab={strSelectedProgram}
                            onChange={(strId) => _switchProgram(strId as Program)}
                            arrTabs={[
                                { id: 'SETUP', label: 'SETUP' },
                                { id: 'GIA', label: 'GIA' },
                            ]}
                        />
                    ) : null}

                    <div
                        className={cn(
                            'flex items-center gap-2',
                            strCurrentView === 'calendar' && 'hidden',
                        )}
                    >
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {strSelectedProgram === 'SETUP' ? 'Quarter:' : 'Semester:'}
                        </span>
                        <select
                            value={strActivePeriod}
                            onChange={
                                (objEvent) =>
                                {
                                    setObjSelectedProject(null);
                                    setIntProjectPage(1);
                                    if (strSelectedProgram === 'SETUP')
                                    {
                                        const objParsed = parseSetupMonitoringPeriod(
                                            objEvent.target.value,
                                        );
                                        setStrGlobalQuarter(objEvent.target.value);
                                        _updateSearchParams({
                                            projectId: null,
                                            page: null,
                                            quarter: objParsed.quarter,
                                            semester: null,
                                            year: String(objParsed.year),
                                        });
                                    } else
                                    {
                                        const objParsed = _parseSemesterPeriod(
                                            objEvent.target.value,
                                        );
                                        setStrGlobalSemester(objEvent.target.value);
                                        _updateSearchParams({
                                            projectId: null,
                                            page: null,
                                            quarter: null,
                                            semester: String(objParsed.semester),
                                            year: String(objParsed.year),
                                        });
                                    }
                                } /* end MonitoringPage */
                            }
                            className="h-9 rounded-xl border border-[#B5BFCD] bg-white px-3 text-xs font-bold text-slate-700 shadow-sm outline-none focus:border-[#0f53b7]"
                        >
                            {strSelectedProgram === 'SETUP'
                                ? setupMonitoringPeriodOptions().map((objOption) => (
                                    <option key={objOption.value} value={objOption.value}>
                                        {objOption.label}
                                    </option>
                                ))
                                : _semesterPeriods().map((strPeriod) => (
                                    <option key={strPeriod} value={strPeriod}>
                                        {strPeriod}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        disabled={
                            blnIsExporting || blnIsLoadingProjects || Boolean(strProjectsError)
                        }
                        onClick={() => void _handleExport()}
                        className={cn(
                            'inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white px-3.5 text-xs font-bold text-[#285497] shadow-sm transition hover:bg-[#E6EEF4] disabled:cursor-not-allowed disabled:opacity-50',
                            strCurrentView === 'calendar' && 'hidden',
                        )}
                    >
                        {blnIsExporting ? (
                            <LoaderCircle className="size-3.5 animate-spin" />
                        ) : (
                            <FileDown className="size-3.5" />
                        )}
                        {blnIsExporting
                            ? 'Exporting…'
                            : blnIsOverview
                                ? 'Export report'
                                : 'Export list'}
                    </button>
                </div>
            </div>

            {strExportNotice ? (
                <p
                    className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                    role="status"
                >
                    {strExportNotice}
                </p>
            ) : null}
            {strExportError ? (
                <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
                    {strExportError}
                </p>
            ) : null}
            {strCurrentView === 'calendar' ? (
                <SiteVisitCalendar strFocusDate={objSearchParams.get('date')} />
            ) : !blnHasLoadedInitial && blnIsLoadingProjects ? (
                <div className="flex min-h-52 items-center justify-center rounded-2xl border border-[#B5BFCD]/80 bg-white text-sm font-semibold text-slate-500 shadow-sm">
                    <LoaderCircle className="mr-2 size-5 animate-spin text-[#285497]" />
                    Loading {strSelectedProgram} monitoring projects...
                </div>
            ) : strProjectsError ? (
                <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-rose-200 bg-white px-6 text-center shadow-sm">
                    <p className="text-sm font-bold text-rose-700">{strProjectsError}</p>
                    <button
                        type="button"
                        onClick={() => void _loadProjects()}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#0f53b7] px-4 py-2 text-xs font-bold text-white hover:bg-[#0b3f8b]"
                    >
                        <RefreshCw className="size-3.5" /> Retry
                    </button>
                </div>
            ) : (
                <>
                    <div
                        className={cn(
                            strCurrentView === 'overview'
                                ? 'block animate-in fade-in duration-150'
                                : 'hidden',
                        )}
                    >
                        {strSelectedProgram === 'GIA' ? (
                            <GiaMonitoringOverviewSection
                                arrProjects={arrProgramProjects}
                                objStatistics={objGiaStatistics}
                                strPeriod={strGlobalSemester}
                                onSelectProject={_openProject}
                            />
                        ) : (
                            <MonitoringOverviewSection
                                arrProjects={arrProgramProjects}
                                objStatistics={objSetupStatistics}
                                strPeriod={strGlobalQuarter}
                                onSelectProject={_openProject}
                            />
                        )}
                    </div>

                    <div
                        className={cn(
                            strCurrentView === 'projects'
                                ? 'block animate-in fade-in duration-150'
                                : 'hidden',
                        )}
                    >
                        <MonitoredProjectsSection
                            strProgram={strSelectedProgram}
                            objProjects={arrProgramProjects}
                            strViewMode={strGlobalViewMode}
                            onViewModeChange={setStrGlobalViewMode}
                            strSearchValue={strSearchValue}
                            blnIsFiltering={blnIsLoadingProjects}
                            objPagination={objPagination}
                            strDistrictValue={
                                strSelectedProgram === 'SETUP' ? strDistrictValue : undefined
                            }
                            arrDistricts={strSelectedProgram === 'SETUP' ? arrDistricts : undefined}
                            strAgencyValue={
                                strSelectedProgram === 'GIA' ? strAgencyValue : undefined
                            }
                            arrAgencies={strSelectedProgram === 'GIA' ? arrAgencies : undefined}
                            strStatusValue={
                                strSelectedProgram === 'GIA' ? strStatusValue : undefined
                            }
                            arrStatuses={strSelectedProgram === 'GIA' ? arrGiaStatuses : undefined}
                            onSearchChange={(strValue: string) =>
                            {
                                setStrSearchValue(strValue);
                                setIntProjectPage(1);
                            }}
                            onDistrictChange={
                                strSelectedProgram === 'SETUP'
                                    ? (strValue: string) =>
                                    {
                                        setStrDistrictValue(strValue);
                                        setIntProjectPage(1);
                                    }
                                    : undefined
                            }
                            onAgencyChange={
                                strSelectedProgram === 'GIA'
                                    ? (strValue: string) =>
                                    {
                                        setStrAgencyValue(strValue);
                                        setIntProjectPage(1);
                                    }
                                    : undefined
                            }
                            onStatusChange={
                                strSelectedProgram === 'GIA'
                                    ? (strValue: string) =>
                                    {
                                        setStrStatusValue(strValue);
                                        setIntProjectPage(1);
                                    }
                                    : undefined
                            }
                            onPageChange={_changePage}
                            onSelectProject={_openProject}
                        />
                    </div>
                </>
            )}
        </div>
    ); // end return
} /* end MonitoringPage */
