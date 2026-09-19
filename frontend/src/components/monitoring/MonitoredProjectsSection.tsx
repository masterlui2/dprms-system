/**
 * System: DPRMS
 * Purpose: Render monitored projects section for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    ArrowRight,
    Building2,
    CheckSquare,
    ChevronLeft,
    ChevronRight,
    FileCheck2,
    Grid2X2,
    List,
    LoaderCircle,
    MapPin,
    MoreHorizontal,
    Plus,
    Search,
    Store,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProjects, type Program, type ProjectRecord } from '../../services/project_store';
import { cn } from '../../utils/cn';

interface Props
{
    onSelectProject: (objProject: any) => void;
    strViewMode?: 'box' | 'list';
    onViewModeChange?: (strMode: 'box' | 'list') => void;
    strProgram?: Program;
    objProjects?: any;
    strSearchValue?: string;
    blnIsFiltering?: boolean;
    objPagination?: any;
    strDistrictValue?: string;
    arrDistricts?: string[];
    strAgencyValue?: string;
    arrAgencies?: string[];
    strStatusValue?: string;
    arrStatuses?: string[];
    onSearchChange?: (strValue: string) => void;
    onDistrictChange?: (strValue: string) => void;
    onAgencyChange?: (strValue: string) => void;
    onStatusChange?: (strValue: string) => void;
    onPageChange?: (intPage: number) => void;
}

const PER_PAGE = 6;

/** Readable status. */
function _readableStatus(strValue?: string): string
{
    if (!strValue)
    {
        return 'Not started';
    }
    return strValue
        .toLowerCase()
        .replaceAll('_', ' ')
        .replace(/^./, (strLetter) => strLetter.toUpperCase());
}

/** Get initials. */
function _getInitials(strName: string): string
{
    if (!strName)
    {
        return 'DO';
    }
    const arrParts = strName.trim().split(/\s+/);
    if (arrParts.length === 1)
    {
        return arrParts[0].slice(0, 2).toUpperCase();
    }
    return (arrParts[0][0] + arrParts[arrParts.length - 1][0]).toUpperCase();
}

/** Render project status and its available actions. */
function ProjectStatus({ objProject }: { objProject: ProjectRecord; })
{
    if (objProject.program === 'GIA')
    {
        if (objProject.compliance === 'Overdue')
        {
            return (
                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                    Delayed milestone
                </span>
            );
        }
        return (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#0f53b7]">
                {objProject.progress}% complete
            </span>
        );
    }

    const intPending = objProject.pendingReports ?? 0;
    if (intPending > 0)
    {
        return (
            <span className="text-[11px] font-semibold text-amber-700">{intPending} pending</span>
        );
    }
    if (objProject.monitored)
    {
        return <span className="text-[11px] font-semibold text-emerald-700">Monitored</span>;
    }
    return <span className="text-[11px] font-semibold text-emerald-700">Newly Active</span>;
}

/** Render project card skeleton and its available actions. */
function ProjectCardSkeleton()
{
    return (
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs animate-pulse space-y-4">
            <div>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="size-11 rounded-xl bg-slate-100" />
                        <div className="space-y-1.5">
                            <div className="h-4 w-32 rounded-md bg-slate-200" />
                            <div className="h-3 w-20 rounded bg-slate-100" />
                        </div>
                    </div>
                    <div className="h-5 w-16 rounded-full bg-slate-100" />
                </div>
                <div className="mt-4 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-slate-100" />
                    <div className="h-3 w-1/2 rounded bg-slate-100" />
                </div>
                <div className="mt-4 rounded-xl bg-slate-50 p-3 space-y-2">
                    <div className="flex justify-between">
                        <div className="h-3 w-20 rounded bg-slate-200" />
                        <div className="h-3 w-14 rounded bg-slate-200" />
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200" />
                </div>
                <div className="mt-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-slate-200" />
                        <div className="h-3 w-24 rounded bg-slate-200" />
                    </div>
                    <div className="h-5 w-20 rounded-md bg-slate-100" />
                </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex gap-2">
                <div className="h-8.5 w-20 rounded-xl bg-slate-100" />
                <div className="h-8.5 flex-1 rounded-xl bg-slate-200" />
            </div>
        </div>
    ); // end return
} /* end ProjectCardSkeleton */

/** Render monitored projects section and its available actions. */
export function MonitoredProjectsSection({
    onSelectProject,
    strViewMode: strPropViewMode,
    onViewModeChange,
    strProgram,
    objProjects: objPassedProjects,
    strSearchValue: strPropSearchValue,
    blnIsFiltering = false,
    objPagination: objPropPagination,
    strDistrictValue: strPropDistrictValue,
    arrDistricts: arrPropDistricts,
    strAgencyValue: strPropAgencyValue,
    arrAgencies: arrPropAgencies,
    strStatusValue: strPropStatusValue,
    arrStatuses: arrPropStatuses,
    onSearchChange,
    onDistrictChange,
    onAgencyChange,
    onStatusChange,
    onPageChange,
}: Props)
{
    const _navigate = useNavigate();
    const [strInternalViewMode, setStrInternalViewMode] = useState<'box' | 'list'>('box');
    const strViewMode = strPropViewMode ?? strInternalViewMode;
    /** Set view mode. */
    const _setViewMode = (strMode: 'box' | 'list') =>
    {
        setStrInternalViewMode(strMode);
        onViewModeChange?.(strMode);
    };

    const blnIsControlled = objPassedProjects !== undefined;
    const [arrFetchedProjects, setArrFetchedProjects] = useState<ProjectRecord[]>([]);
    const [blnIsLoadingInternal, setBlnIsLoadingInternal] = useState(!blnIsControlled);
    const [strLoadError, setStrLoadError] = useState<string | null>(null);

    const [strInternalSearch, setStrInternalSearch] = useState('');
    const [strInternalAgency, setStrInternalAgency] = useState('');
    const [strInternalStatus, setStrInternalStatus] = useState('');
    const [intInternalPage, setIntInternalPage] = useState(1);

    useEffect(
        () =>
        {
            if (blnIsControlled)
            {
                return;
            }
            let blnCancelled = false;
            setBlnIsLoadingInternal(true);
            fetchProjects()
                .then((arrData) =>
                {
                    if (!blnCancelled)
                    {
                        setArrFetchedProjects(arrData);
                        setBlnIsLoadingInternal(false);
                    }
                })
                .catch((errError) =>
                {
                    if (!blnCancelled)
                    {
                        setStrLoadError(errError?.message ?? 'Failed to load projects');
                        setBlnIsLoadingInternal(false);
                    }
                });
            return () =>
            {
                blnCancelled = true;
            };
        } /* end MonitoredProjectsSection */,
        [blnIsControlled],
    );

    const strSearchValue = blnIsControlled ? (strPropSearchValue ?? '') : strInternalSearch;
    const strAgencyValue = blnIsControlled ? (strPropAgencyValue ?? '') : strInternalAgency;
    const strStatusValue = blnIsControlled ? (strPropStatusValue ?? '') : strInternalStatus;
    const strDistrictValue = strPropDistrictValue ?? '';

    /** Handle search change. */
    const _handleSearchChange = (strValue: string) =>
    {
        if (onSearchChange)
        {
            onSearchChange(strValue);
        } else
        {
            setStrInternalSearch(strValue);
        }
    };

    /** Handle agency change. */
    const _handleAgencyChange = (strValue: string) =>
    {
        if (onAgencyChange)
        {
            onAgencyChange(strValue);
        } else
        {
            setStrInternalAgency(strValue);
        }
    };

    /** Handle status change. */
    const _handleStatusChange = (strValue: string) =>
    {
        if (onStatusChange)
        {
            onStatusChange(strValue);
        } else
        {
            setStrInternalStatus(strValue);
        }
    };

    /** Handle district change. */
    const _handleDistrictChange = (strValue: string) =>
    {
        onDistrictChange?.(strValue);
    };

    /** Handle page change. */
    const _handlePageChange = (intPage: number) =>
    {
        if (onPageChange)
        {
            onPageChange(intPage);
        } else
        {
            setIntInternalPage(intPage);
        }
    };

    const arrFallbackScoped = useMemo(() =>
    {
        if (blnIsControlled)
        {
            return [];
        }
        return strProgram
            ? arrFetchedProjects.filter((objItem) => objItem.program === strProgram)
            : arrFetchedProjects;
    }, [blnIsControlled, strProgram, arrFetchedProjects]);

    const objIsGia =
        strProgram === 'GIA' ||
        (blnIsControlled
            ? objPassedProjects?.some((objItem: any) => objItem.program === 'GIA')
            : arrFallbackScoped.some((objItem) => objItem.program === 'GIA'));

    const arrAgencies =
        arrPropAgencies ??
        Array.from(
            new Set(arrFallbackScoped.map((objItem) => objItem.agency).filter(Boolean)),
        ).sort();
    const arrStatuses =
        arrPropStatuses ??
        Array.from(new Set(arrFallbackScoped.map((objItem) => objItem.status))).sort();
    const arrDistricts = arrPropDistricts ?? [];

    const arrInternallyFilteredProjects = useMemo(() =>
    {
        const strTerm = strInternalSearch.trim().toLowerCase();
        const arrFiltered = arrFallbackScoped.filter((objItem) =>
        {
            if (strTerm)
            {
                const strHaystack =
                    `${objItem.enterprise} ${objItem.referenceNumber} ${objItem.location}`.toLowerCase();
                if (!strHaystack.includes(strTerm))
                {
                    return false;
                }
            }
            if (strInternalAgency && objItem.agency !== strInternalAgency)
            {
                return false;
            }
            if (strInternalStatus && objItem.status !== strInternalStatus)
            {
                return false;
            }
            return true;
        });
        const intPageStart = (intInternalPage - 1) * PER_PAGE;
        return arrFiltered.slice(intPageStart, intPageStart + PER_PAGE);
    }, [
        arrFallbackScoped,
        strInternalSearch,
        strInternalAgency,
        strInternalStatus,
        intInternalPage,
    ]);

    const arrProjects: ProjectRecord[] = blnIsControlled
        ? Array.isArray(objPassedProjects)
            ? objPassedProjects
            : []
        : arrInternallyFilteredProjects;

    const objPagination =
        blnIsControlled && objPropPagination
            ? objPropPagination
            : {
                currentPage: intInternalPage,
                lastPage: Math.max(1, Math.ceil(arrFallbackScoped.length / PER_PAGE)),
                total: arrFallbackScoped.length,
                from: arrFallbackScoped.length === 0 ? 0 : (intInternalPage - 1) * PER_PAGE + 1,
                to: Math.min(intInternalPage * PER_PAGE, arrFallbackScoped.length),
            };

    const arrVisiblePages = Array.from(
        { length: objPagination.lastPage || 1 },
        (_objUnused, intIndex) => intIndex + 1,
    ).filter(
        (intPage) =>
            intPage === 1 ||
            intPage === objPagination.lastPage ||
            Math.abs(intPage - objPagination.currentPage) <= 1,
    );

    const blnHasActiveFilters =
        strSearchValue.trim() !== '' ||
        strAgencyValue !== '' ||
        strStatusValue !== '' ||
        strDistrictValue !== '';

    /** Clear filters. */
    const _clearFilters = () =>
    {
        _handleSearchChange('');
        _handleAgencyChange('');
        _handleStatusChange('');
        if (onDistrictChange)
        {
            onDistrictChange('');
        }
    };

    if (!blnIsControlled && blnIsLoadingInternal)
    {
        return <div className="py-10 text-center text-sm text-slate-400">Loading projects…</div>;
    }

    if (strLoadError)
    {
        return <div className="py-10 text-center text-sm text-red-500">{strLoadError}</div>;
    }

    return (
        <div className="space-y-4 font-sans">
            <section className="overflow-hidden rounded-2xl border border-[#B5BFCD]/70 bg-white shadow-sm">
                <div className="flex flex-col gap-3.5 border-b border-[#B5BFCD]/50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <label className="relative block min-w-0 flex-1 lg:max-w-md">
                        <span className="sr-only">Search monitored projects</span>
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={strSearchValue}
                            onChange={(objEvent) => _handleSearchChange(objEvent.target.value)}
                            placeholder={
                                objIsGia
                                    ? 'Search agency, project, or reference...'
                                    : 'Search enterprise, reference, or address...'
                            }
                            className="h-10 w-full rounded-xl border border-[#B5BFCD] bg-white pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100"
                        />
                        {blnIsFiltering ? (
                            <LoaderCircle className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-[#0f53b7]" />
                        ) : null}
                    </label>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {!objIsGia && arrDistricts.length > 0 ? (
                            <label>
                                <span className="sr-only">Filter by district</span>
                                <select
                                    value={strDistrictValue}
                                    onChange={(objEvent) =>
                                        _handleDistrictChange(objEvent.target.value)
                                    }
                                    className="h-10 rounded-xl border border-[#B5BFCD] bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100 sm:w-44"
                                >
                                    <option value="">All Districts</option>
                                    {arrDistricts.map((strDistrict) => (
                                        <option key={strDistrict} value={strDistrict}>
                                            {strDistrict}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ) : null}

                        {objIsGia && arrAgencies.length > 0 ? (
                            <label>
                                <span className="sr-only">Filter by implementing agency</span>
                                <select
                                    value={strAgencyValue}
                                    onChange={(objEvent) =>
                                        _handleAgencyChange(objEvent.target.value)
                                    }
                                    className="h-10 rounded-xl border border-[#B5BFCD] bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100 sm:w-48"
                                >
                                    <option value="">All Agencies</option>
                                    {arrAgencies.map((strAgency) => (
                                        <option key={strAgency} value={strAgency}>
                                            {strAgency}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ) : null}

                        {arrStatuses.length > 0 ? (
                            <label>
                                <span className="sr-only">Filter by monitoring status</span>
                                <select
                                    value={strStatusValue}
                                    onChange={(objEvent) =>
                                        _handleStatusChange(objEvent.target.value)
                                    }
                                    className="h-10 rounded-xl border border-[#B5BFCD] bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100 sm:w-44"
                                >
                                    <option value="">All Statuses</option>
                                    {arrStatuses.map((strStatus) => (
                                        <option key={strStatus} value={strStatus}>
                                            {_readableStatus(strStatus)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ) : null}

                        <button
                            type="button"
                            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#0f53b7] px-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#0b3f8b] hover:shadow-sm"
                            title="Add Active Project"
                        >
                            <Plus className="size-4" />
                            <span>Add Active Project</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => _setViewMode('box')}
                                className={cn(
                                    'flex size-10 items-center justify-center rounded-xl border border-[#B5BFCD] transition',
                                    strViewMode === 'box'
                                        ? 'bg-[#E6EEF4] text-[#285497] border-[#0f53b7]/30'
                                        : 'bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700',
                                )}
                                title="Box View"
                            >
                                <Grid2X2 className="size-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => _setViewMode('list')}
                                className={cn(
                                    'flex size-10 items-center justify-center rounded-xl border border-[#B5BFCD] transition',
                                    strViewMode === 'list'
                                        ? 'bg-[#E6EEF4] text-[#285497] border-[#0f53b7]/30'
                                        : 'bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700',
                                )}
                                title="List View"
                            >
                                <List className="size-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {blnIsFiltering && arrProjects.length === 0 ? (
                    <div className="grid gap-4.5 p-5 sm:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_objUnused, intIndex) => (
                            <ProjectCardSkeleton key={intIndex} />
                        ))}
                    </div>
                ) : arrProjects.length === 0 ? (
                    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                        <span className="flex size-12 items-center justify-center rounded-2xl bg-[#E6EEF4] text-[#285497]">
                            <Search className="size-5" />
                        </span>
                        <h3 className="mt-3 text-sm font-bold text-slate-900">
                            {blnHasActiveFilters
                                ? 'No matching projects'
                                : `No active ${objIsGia ? 'GIA' : 'SETUP'} projects`}
                        </h3>
                        <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                            {blnHasActiveFilters
                                ? 'Try a different search term or select another filter.'
                                : 'Approved projects will appear automatically when they become active.'}
                        </p>
                        {blnHasActiveFilters ? (
                            <button
                                type="button"
                                onClick={_clearFilters}
                                className="mt-4 rounded-xl bg-[#0f53b7] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0b3f8b]"
                            >
                                Clear filters
                            </button>
                        ) : null}
                    </div>
                ) : strViewMode === 'box' ? (
                    <div
                        className={cn(
                            'grid gap-4.5 p-5 sm:grid-cols-2 xl:grid-cols-3 transition-opacity duration-150',
                            blnIsFiltering ? 'opacity-60' : 'opacity-100',
                        )}
                    >
                        {arrProjects.map(
                            (objProject) =>
                            {
                                const blnIsGiaProject = objProject.program === 'GIA';

                                if (blnIsGiaProject)
                                {
                                    const curGrantAmount = objProject.budget || 0;
                                    const intMilestoneProgress = Math.max(
                                        0,
                                        Math.min(100, Math.round(objProject.progress ?? 0)),
                                    );
                                    const strAgency =
                                        objProject.enterprise ||
                                        objProject.gia?.agency ||
                                        'Implementing Agency';
                                    const strLeader = objProject.manager || 'Project Leader';

                                    return (
                                        <article
                                            key={objProject.backendId || objProject.id}
                                            onClick={() => onSelectProject(objProject)}
                                            className="group relative flex min-w-0 flex-col justify-between rounded-2xl border border-blue-200/80 bg-linear-to-b from-white to-blue-50/20 p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0f53b7] hover:shadow-md cursor-pointer space-y-4"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#0f53b7] group-hover:bg-[#0f53b7] group-hover:text-white transition shadow-2xs">
                                                            <Building2 className="size-5.5" />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#073b82]">
                                                                    GIA Grant
                                                                </span>
                                                                {objProject.proposalId ? (
                                                                    <span className="rounded bg-sky-50 px-1.5 py-0.2 text-[10px] font-bold text-sky-700 border border-sky-200">
                                                                        Online
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                            <h3
                                                                className="mt-1 text-base font-black tracking-tight text-slate-900 truncate group-hover:text-[#0f53b7] transition"
                                                                title={objProject.title}
                                                            >
                                                                {objProject.title}
                                                            </h3>
                                                            <div className="mt-0.5 font-mono text-xs font-bold text-slate-500">
                                                                <span>
                                                                    {objProject.referenceNumber ||
                                                                        objProject.id}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <ProjectStatus objProject={objProject} />
                                                        <button
                                                            type="button"
                                                            onClick={(objEvent) =>
                                                            {
                                                                objEvent.stopPropagation();
                                                                onSelectProject(objProject);
                                                            }}
                                                            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
                                                            title="Options"
                                                        >
                                                            <MoreHorizontal className="size-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="mt-3.5 space-y-1 rounded-xl bg-blue-50/50 p-2.5 border border-blue-100/60">
                                                    <p
                                                        className="text-xs font-semibold text-slate-800 truncate"
                                                        title={strAgency}
                                                    >
                                                        <span className="text-[#0f53b7] font-bold">
                                                            Agency:
                                                        </span>{' '}
                                                        {strAgency}
                                                    </p>
                                                    <p className="flex items-center gap-1.5 text-xs text-slate-600">
                                                        <MapPin className="size-3.5 shrink-0 text-blue-500" />
                                                        <span className="truncate">
                                                            {objProject.location ||
                                                                'Location not recorded'}
                                                        </span>
                                                    </p>
                                                </div>

                                                <div className="mt-4 rounded-xl border border-blue-100 bg-white p-3 space-y-2 shadow-2xs">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-bold text-[#073b82]">
                                                            Milestone Progress
                                                        </span>
                                                        <span className="font-extrabold text-[#0f53b7] font-mono">
                                                            {intMilestoneProgress}% Completed
                                                        </span>
                                                    </div>
                                                    <div className="h-2 w-full rounded-full bg-blue-100 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-[#0f53b7] transition-all duration-500"
                                                            style={{
                                                                width: `${Math.max(4, intMilestoneProgress)}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                                                        <span>Approved Grant:</span>
                                                        <strong className="font-mono font-bold text-slate-800">
                                                            {curGrantAmount > 0
                                                                ? `₱${curGrantAmount.toLocaleString()}`
                                                                : 'Funding Pending'}
                                                        </strong>
                                                    </div>
                                                </div>

                                                <div className="mt-3.5 flex items-center justify-between gap-2 text-xs text-slate-600">
                                                    <div
                                                        className="flex items-center gap-2 min-w-0"
                                                        title={`Project Leader: ${strLeader}`}
                                                    >
                                                        <div className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[#0f53b7] text-[10px] font-black text-white">
                                                            {_getInitials(strLeader)}
                                                        </div>
                                                        <span className="font-bold text-slate-800 truncate text-xs">
                                                            {strLeader}
                                                        </span>
                                                    </div>

                                                    {(() =>
                                                    {
                                                        const intCompliedDocs =
                                                            objProject.checklistStats?.complied ??
                                                            0;
                                                        const intTotalDocs =
                                                            objProject.checklistStats?.total ?? 0;

                                                        return (
                                                            <button
                                                                type="button"
                                                                onClick={(objEvent) =>
                                                                {
                                                                    if (
                                                                        objProject.proposalId ||
                                                                        objProject.backendId
                                                                    )
                                                                    {
                                                                        objEvent.stopPropagation();
                                                                        _navigate(
                                                                            `/dashboard/document-checklist?proposalId=${objProject.proposalId || objProject.backendId}&program=GIA`,
                                                                        );
                                                                    }
                                                                }}
                                                                className="inline-flex items-center gap-1.5 shrink-0 font-semibold text-slate-600 text-xs hover:text-[#0f53b7] transition cursor-pointer"
                                                                title={`Document Checklist: ${intCompliedDocs} of ${intTotalDocs} required documents complied`}
                                                            >
                                                                <CheckSquare className="size-3.5 text-blue-500" />
                                                                <span>
                                                                    {intCompliedDocs}/{intTotalDocs}{' '}
                                                                    docs
                                                                </span>
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t border-blue-100 flex items-center gap-2">
                                                {objProject.proposalId || objProject.backendId ? (
                                                    <button
                                                        type="button"
                                                        onClick={(objEvent) =>
                                                        {
                                                            objEvent.stopPropagation();
                                                            _navigate(
                                                                `/dashboard/document-checklist?proposalId=${objProject.proposalId || objProject.backendId}&program=GIA`,
                                                            );
                                                        }}
                                                        className="inline-flex h-8.5 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 text-xs font-bold text-[#073b82] shadow-2xs hover:bg-blue-50 transition shrink-0"
                                                        title="Open Document Checklist"
                                                    >
                                                        <FileCheck2 className="size-3.5 text-[#0f53b7]" />
                                                        <span>Checklist</span>
                                                    </button>
                                                ) : null}

                                                <button
                                                    type="button"
                                                    onClick={(objEvent) =>
                                                    {
                                                        objEvent.stopPropagation();
                                                        onSelectProject(objProject);
                                                    }}
                                                    className="inline-flex h-8.5 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0f53b7] px-3 text-xs font-bold text-white shadow-xs transition hover:bg-[#0b3f8b] active:scale-[0.98]"
                                                >
                                                    <span>Open Workspace</span>
                                                    <ArrowRight className="size-3.5" />
                                                </button>
                                            </div>
                                        </article>
                                    ); // end return
                                } /* end if */

                                const intTotalGrant = Number(objProject.budget) || 0;
                                const curTotalRefunded = Number(objProject.used) || 0;
                                const blnHasFunding = intTotalGrant > 0;
                                const curRefundPercent = blnHasFunding
                                    ? Math.min(
                                        100,
                                        Math.round((curTotalRefunded / intTotalGrant) * 100),
                                    )
                                    : 0;

                                return (
                                    <article
                                        key={objProject.backendId || objProject.id}
                                        onClick={() => onSelectProject(objProject)}
                                        className="group relative flex min-w-0 flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0f53b7] hover:shadow-md cursor-pointer space-y-4"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E6EEF4] text-[#0f53b7] group-hover:bg-[#0f53b7] group-hover:text-white transition shadow-2xs">
                                                        <Store className="size-5.5" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <h3 className="text-base font-black tracking-tight text-slate-900 truncate group-hover:text-[#0f53b7] transition">
                                                            {objProject.enterprise ||
                                                                objProject.title}
                                                        </h3>
                                                        <div className="mt-0.5 flex items-center gap-1.5 font-mono text-xs font-bold text-slate-500">
                                                            <span>
                                                                {objProject.referenceNumber ||
                                                                    objProject.id}
                                                            </span>
                                                            {objProject.proposalId ? (
                                                                <span className="font-sans rounded bg-sky-50 px-1.5 py-0.2 text-[10px] font-bold text-sky-700 border border-sky-200">
                                                                    Online
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    <ProjectStatus objProject={objProject} />
                                                    <button
                                                        type="button"
                                                        onClick={(objEvent) =>
                                                        {
                                                            objEvent.stopPropagation();
                                                            onSelectProject(objProject);
                                                        }}
                                                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
                                                        title="Options"
                                                    >
                                                        <MoreHorizontal className="size-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mt-3.5 space-y-1">
                                                <p className="text-xs font-semibold text-slate-700">
                                                    {objProject.industrySector || 'Food Processing'}{' '}
                                                    <span className="text-slate-300">•</span>{' '}
                                                    <span className="font-medium text-slate-500">
                                                        {objProject.businessStructure ||
                                                            'Sole Proprietorship'}
                                                    </span>
                                                </p>
                                                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                                                    <MapPin className="size-3.5 shrink-0 text-slate-400" />
                                                    <span className="truncate">
                                                        {objProject.location || 'Davao Region'}
                                                    </span>
                                                </p>
                                            </div>

                                            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-2">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-bold text-slate-700">
                                                        Refund Progress
                                                    </span>
                                                    <span className="font-extrabold text-slate-900 font-mono">
                                                        {blnHasFunding
                                                            ? `₱${curTotalRefunded.toLocaleString()} / ₱${intTotalGrant.toLocaleString()} (${curRefundPercent}%)`
                                                            : 'Schedule Pending'}
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full rounded-full bg-slate-200/80 overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            'h-full rounded-full transition-all duration-500',
                                                            blnHasFunding && curRefundPercent > 0
                                                                ? 'bg-[#0f53b7]'
                                                                : 'bg-slate-300',
                                                        )}
                                                        style={{
                                                            width: `${blnHasFunding ? Math.max(4, curRefundPercent) : 0}%`,
                                                        }}
                                                    />
                                                </div>
                                                {!blnHasFunding ? (
                                                    <p className="text-[11px] text-slate-400 font-medium">
                                                        Repayment ledger not yet initialized
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="mt-3.5 flex items-center justify-between gap-2 text-xs text-slate-600">
                                                <div
                                                    className="flex items-center gap-2 min-w-0"
                                                    title={`Assigned Monitor: ${objProject.manager || 'Maria SETUP Proponent'}`}
                                                >
                                                    <div className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[#0f53b7] text-[10px] font-black text-white">
                                                        {_getInitials(
                                                            objProject.manager ||
                                                            'Maria SETUP Proponent',
                                                        )}
                                                    </div>
                                                    <span className="font-bold text-slate-800 truncate text-xs">
                                                        {objProject.manager ||
                                                            'Maria SETUP Proponent'}
                                                    </span>
                                                </div>

                                                {(() =>
                                                {
                                                    const intCompliedDocs =
                                                        objProject.checklistStats?.complied ?? 0;
                                                    const intTotalDocs =
                                                        objProject.checklistStats?.total ?? 0;

                                                    return (
                                                        <button
                                                            type="button"
                                                            onClick={(objEvent) =>
                                                            {
                                                                if (
                                                                    objProject.proposalId ||
                                                                    objProject.backendId
                                                                )
                                                                {
                                                                    objEvent.stopPropagation();
                                                                    _navigate(
                                                                        `/dashboard/document-checklist?proposalId=${objProject.proposalId || objProject.backendId}&program=${objProject.program}`,
                                                                    );
                                                                }
                                                            }}
                                                            className="inline-flex items-center gap-1.5 shrink-0 font-semibold text-slate-600 text-xs hover:text-[#0f53b7] transition group/docs cursor-pointer"
                                                            title={`Document Checklist (Whole Sets): ${intCompliedDocs} of ${intTotalDocs} required documents complied`}
                                                        >
                                                            <CheckSquare className="size-3.5 text-slate-400 group-hover/docs:text-[#0f53b7] transition" />
                                                            <span>
                                                                {intCompliedDocs}/{intTotalDocs}{' '}
                                                                docs
                                                            </span>
                                                        </button>
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                                            {objProject.proposalId || objProject.backendId ? (
                                                <button
                                                    type="button"
                                                    onClick={(objEvent) =>
                                                    {
                                                        objEvent.stopPropagation();
                                                        _navigate(
                                                            `/dashboard/document-checklist?proposalId=${objProject.proposalId || objProject.backendId}&program=${objProject.program}`,
                                                        );
                                                    }}
                                                    className="inline-flex h-8.5 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-[#0f53b7] transition shrink-0"
                                                    title="Open Document Checklist"
                                                >
                                                    <FileCheck2 className="size-3.5 text-[#0f53b7]" />
                                                    <span>Checklist</span>
                                                </button>
                                            ) : null}

                                            <button
                                                type="button"
                                                onClick={(objEvent) =>
                                                {
                                                    objEvent.stopPropagation();
                                                    onSelectProject(objProject);
                                                }}
                                                className="inline-flex h-8.5 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0f53b7] px-3 text-xs font-bold text-white shadow-xs transition hover:bg-[#0b3f8b] active:scale-[0.98]"
                                            >
                                                <span>Open Workspace</span>
                                                <ArrowRight className="size-3.5" />
                                            </button>
                                        </div>
                                    </article>
                                ); // end return
                            } /* end MonitoredProjectsSection */,
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-[#B5BFCD]/40">
                        {arrProjects.map(
                            (objProject) =>
                            {
                                const blnIsGiaProject = objProject.program === 'GIA';
                                const curTotalFunding = Number(objProject.budget) || 0;
                                const curTotalRefunded = Number(objProject.used) || 0;

                                return (
                                    <article
                                        key={objProject.backendId || objProject.id}
                                        onClick={() => onSelectProject(objProject)}
                                        className={cn(
                                            'grid gap-4 px-6 py-4.5 transition cursor-pointer md:grid-cols-[minmax(240px,1.5fr)_minmax(180px,1fr)_minmax(150px,0.9fr)_minmax(130px,0.8fr)_auto] md:items-center',
                                            blnIsGiaProject
                                                ? 'hover:bg-blue-50/40'
                                                : 'hover:bg-[#E6EEF4]/40',
                                        )}
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        'rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase',
                                                        blnIsGiaProject
                                                            ? 'bg-blue-100 text-[#0f53b7]'
                                                            : 'bg-blue-100 text-blue-700',
                                                    )}
                                                >
                                                    {objProject.program ||
                                                        (objIsGia ? 'GIA' : 'SETUP')}
                                                </span>
                                                <h3 className="truncate text-sm font-bold text-slate-900">
                                                    {objProject.enterprise || objProject.title}
                                                </h3>
                                                <ProjectStatus objProject={objProject} />
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 text-xs">
                                                <span className="font-mono text-[11px] font-bold text-[#285497]">
                                                    {objProject.referenceNumber || objProject.id}
                                                </span>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-[11px] text-slate-500">
                                                    {objProject.proposalId
                                                        ? 'Online Application'
                                                        : 'Active Project'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="min-w-0 text-xs">
                                            <p className="font-bold text-slate-800 truncate">
                                                {objProject.industrySector ||
                                                    (blnIsGiaProject
                                                        ? objProject.enterprise ||
                                                        'Implementing Agency'
                                                        : 'Food Processing')}
                                            </p>
                                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                                {objProject.businessStructure ||
                                                    (blnIsGiaProject
                                                        ? 'Grant Grantee'
                                                        : 'Sole Proprietorship')}{' '}
                                                · {objProject.manager}
                                            </p>
                                        </div>

                                        <div className="min-w-0 text-xs">
                                            <p className="flex items-center gap-1 text-slate-600 truncate">
                                                <MapPin className="size-3 text-slate-400 shrink-0" />
                                                <span className="truncate">
                                                    {objProject.location || 'Davao Region'}
                                                </span>
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                                Monitor / Lead:{' '}
                                                <strong className="text-slate-700">
                                                    {objProject.manager}
                                                </strong>
                                            </p>
                                        </div>

                                        <div className="text-right text-xs tabular-nums">
                                            <span className="block text-[10px] font-medium uppercase text-slate-400">
                                                {blnIsGiaProject
                                                    ? 'Grant Outlay'
                                                    : 'Repayment Status'}
                                            </span>
                                            {blnIsGiaProject ? (
                                                <p className="text-sm font-semibold text-[#073b82]">
                                                    {curTotalFunding > 0
                                                        ? `₱${curTotalFunding.toLocaleString()}`
                                                        : 'Pending'}
                                                </p>
                                            ) : curTotalFunding > 0 ? (
                                                <p className="text-sm font-semibold text-slate-900">
                                                    ₱{curTotalRefunded.toLocaleString()}
                                                    <span className="text-xs font-normal text-slate-500">
                                                        {' '}
                                                        / ₱{curTotalFunding.toLocaleString()}
                                                    </span>
                                                </p>
                                            ) : (
                                                <p className="font-medium text-slate-400 text-xs">
                                                    Schedule Pending
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                            {objProject.proposalId || objProject.backendId ? (
                                                <button
                                                    type="button"
                                                    onClick={(objEvent) =>
                                                    {
                                                        objEvent.stopPropagation();
                                                        _navigate(
                                                            `/dashboard/document-checklist?proposalId=${objProject.proposalId || objProject.backendId}&program=${objProject.program}`,
                                                        );
                                                    }}
                                                    className="inline-flex h-8.5 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100 hover:text-[#0f53b7] transition"
                                                    title="Open Document Checklist"
                                                >
                                                    <FileCheck2 className="size-3.5 text-[#0f53b7]" />
                                                    <span>Checklist</span>
                                                </button>
                                            ) : null}

                                            <button
                                                type="button"
                                                onClick={(objEvent) =>
                                                {
                                                    objEvent.stopPropagation();
                                                    onSelectProject(objProject);
                                                }}
                                                className="inline-flex h-8.5 items-center justify-center gap-1.5 rounded-xl bg-[#0f53b7] px-3.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#0b3f8b]"
                                            >
                                                <span>Workspace</span>
                                                <ArrowRight className="size-3.5" />
                                            </button>
                                        </div>
                                    </article>
                                ); // end return
                            } /* end MonitoredProjectsSection */,
                        )}
                    </div>
                )}

                {objPagination.total > 0 ? (
                    <footer className="flex flex-col gap-3 border-t border-[#B5BFCD]/50 bg-slate-50/70 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">
                            Showing{' '}
                            <strong className="text-slate-800">
                                {objPagination.from}-{objPagination.to}
                            </strong>{' '}
                            of <strong className="text-slate-800">{objPagination.total}</strong>{' '}
                            projects · {PER_PAGE} per page
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                aria-label="Previous page"
                                disabled={objPagination.currentPage <= 1}
                                onClick={() =>
                                    _handlePageChange(Math.max(1, objPagination.currentPage - 1))
                                }
                                className="grid size-8 place-items-center rounded-lg border border-[#B5BFCD] bg-white text-slate-600 transition hover:border-[#0f53b7] hover:text-[#0f53b7] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft className="size-4" />
                            </button>
                            {arrVisiblePages.map((intPage, intIndex) =>
                            {
                                const intPrevious = arrVisiblePages[intIndex - 1];
                                return (
                                    <div key={intPage} className="flex items-center gap-1.5">
                                        {intPrevious && intPage - intPrevious > 1 ? (
                                            <span className="px-1 text-xs text-slate-400">…</span>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={() => _handlePageChange(intPage)}
                                            className={`size-8 rounded-lg text-xs font-bold transition ${intPage === objPagination.currentPage
                                                ? 'bg-[#0f53b7] text-white shadow-sm'
                                                : 'border border-[#B5BFCD] bg-white text-slate-600 hover:border-[#0f53b7] hover:text-[#0f53b7]'
                                                }`}
                                        >
                                            {intPage}
                                        </button>
                                    </div>
                                );
                            })}
                            <button
                                type="button"
                                aria-label="Next page"
                                disabled={objPagination.currentPage >= objPagination.lastPage}
                                onClick={() =>
                                    _handlePageChange(
                                        Math.min(
                                            objPagination.lastPage,
                                            objPagination.currentPage + 1,
                                        ),
                                    )
                                }
                                className="grid size-8 place-items-center rounded-lg border border-[#B5BFCD] bg-white text-slate-600 transition hover:border-[#0f53b7] hover:text-[#0f53b7] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronRight className="size-4" />
                            </button>
                        </div>
                    </footer>
                ) : null}
            </section>
        </div>
    ); // end return
} /* end MonitoredProjectsSection */
