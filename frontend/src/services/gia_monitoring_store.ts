/**
 * System: DPRMS
 * Purpose: Manage gia monitoring store operations and data access.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { GiaMonitoringDetails, GiaOutputCategory, ProjectRecord } from '../data/admin';
import g_objApi from '../lib/axios';
import type {
    BackendGiaMonitoringProject,
    BackendGiaMonitoringResponse,
    GiaMonitoringFormData,
    GiaMonitoringReportResponse,
} from '../types/api/gia_monitoring';
import type { ProjectPagination } from '../types/monitoring';
import { reportError } from '../utils/error_reporting';
export type {
    GiaAccomplishmentRow,
    GiaMonitoringFormData,
    GiaOutputRow,
} from '../types/api/gia_monitoring';

export interface GiaMonitoringStatistics
{
    activeGrants: number;
    monitoredProjects: number;
    totalGrantAmount: number;
    averageMilestoneProgress: number;
    pendingMilestones: number;
    delayedMilestones: number;
}

export interface GiaMonitoringProjectFilters
{
    search?: string;
    agency?: string;
    status?: string;
    year: number;
    semester: 1 | 2;
    page?: number;
}

export interface GiaMonitoringProjectsResult
{
    projects: ProjectRecord[];
    statistics: GiaMonitoringStatistics;
    agencies: string[];
    statuses: string[];
    pagination: ProjectPagination;
    canEdit: boolean;
    readOnly: boolean;
}

const OUTPUT_CATEGORIES: GiaOutputCategory[] = [
    'Publications',
    'Patents / IP',
    'Products',
    'People Services',
    'Places & Partnerships',
    'Policy',
];

/** Format date. */
function _formatDate(strValue: string | null): string
{
    if (!strValue)
    {
        return 'Not recorded';
    }
    const dtDate = new Date(`${strValue.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(dtDate.getTime()))
    {
        return strValue;
    }

    return dtDate.toLocaleDateString('en-PH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/** Duration months. */
function _durationMonths(strStartDate: string | null, strEndDate: string | null): number
{
    if (!strStartDate || !strEndDate)
    {
        return 0;
    }
    const dtStart = new Date(`${strStartDate.slice(0, 10)}T00:00:00`);
    const dtEnd = new Date(`${strEndDate.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(dtStart.getTime()) || Number.isNaN(dtEnd.getTime()) || dtEnd < dtStart)
    {
        return 0;
    }

    return Math.max(
        0,
        (dtEnd.getFullYear() - dtStart.getFullYear()) * 12 + dtEnd.getMonth() - dtStart.getMonth(),
    );
}

/** Report status. */
function _reportStatus(strStatus?: string): GiaMonitoringDetails['latestReport']['status']
{
    if (strStatus === 'ACCEPTED')
    {
        return 'Approved';
    }
    if (strStatus === 'SUBMITTED' || strStatus === 'UNDER_REVIEW')
    {
        return 'Under review';
    }
    return 'Pending';
}

/** Map project. */
function _mapProject(objProject: BackendGiaMonitoringProject): ProjectRecord
{
    const blnDelayed = objProject.milestones.some(
        (objMilestone) => objMilestone.status === 'DELAYED',
    );
    const blnPending = objProject.milestones.some((objMilestone) =>
        ['PENDING', 'IN_PROGRESS'].includes(objMilestone.status),
    );
    const strSemester = objProject.semestral_context.semester === 1 ? '1st' : '2nd';

    return {
        approvedAt: objProject.approved_at,
        backendId: objProject.id,
        proposalId: objProject.proposal_id ?? objProject.id,
        budget: objProject.grant_amount,
        compliance: blnDelayed ? 'Overdue' : blnPending ? 'Due soon' : 'Compliant',
        dueDate: _formatDate(objProject.latest_report?.due_date ?? objProject.expected_end_date),
        enterprise: objProject.implementing_agency,
        id: String(objProject.id),
        lastMonitoredAt: objProject.last_monitored_at,
        checklistStats: objProject.checklist_stats,
        location: objProject.office_address ?? 'Location not recorded',
        manager: objProject.project_leader,
        monitored: objProject.last_monitored_at !== null,
        monitoringStatus: objProject.monitoring_status,
        pendingReports: 0,
        program: 'GIA',
        progress: Math.max(0, Math.min(100, Math.round(objProject.milestone_progress))),
        referenceNumber: objProject.reference_number,
        status: objProject.monitoring_status === 'TERMINATED' ? 'At risk' : 'Active',
        title: objProject.title,
        used: 0,
        gia: {
            actualAccomplishment: `${objProject.milestone_progress}% milestone completion`,
            agency: objProject.implementing_agency,
            baseStation: objProject.office_address ?? '',
            catchUpPlan: '',
            cooperatingAgencies: [],
            durationMonths: _durationMonths(objProject.start_date, objProject.expected_end_date),
            endDate: _formatDate(objProject.expected_end_date),
            issueSummary: blnDelayed ? 'One or more milestones are delayed.' : '',
            latestReport: {
                period:
                    objProject.latest_report?.reporting_period ??
                    `${strSemester} Semester ${objProject.semestral_context.year}`,
                status: _reportStatus(objProject.latest_report?.status),
                submitted: objProject.latest_report?.submitted_at
                    ? _formatDate(objProject.latest_report.submitted_at)
                    : 'Not yet submitted',
            },
            location: objProject.office_address ?? '',
            objective: objProject.title,
            outputs: objProject.milestones.map((objMilestone, intIndex) => ({
                actual: objMilestone.completion_percentage,
                category: OUTPUT_CATEGORIES[Math.min(intIndex, OUTPUT_CATEGORIES.length - 1)],
                description: objMilestone.title,
                target: 100,
            })),
            milestones: objProject.milestones.map((objMilestone) => ({
                completionPercentage: objMilestone.completion_percentage,
                description: objMilestone.description ?? '',
                expectedCompletion: objMilestone.expected_completion,
                id: objMilestone.id,
                number: objMilestone.number,
                status: objMilestone.status,
                title: objMilestone.title,
            })),
            reportingPeriod:
                objProject.latest_report?.reporting_period ??
                `${strSemester} Semester ${objProject.semestral_context.year}`,
            startDate: _formatDate(objProject.start_date),
            suggestedSolution: '',
            targetProgress: 100,
            yearlyBudgets:
                objProject.grant_amount > 0
                    ? [
                        {
                            amount: objProject.grant_amount,
                            label: String(objProject.semestral_context.year),
                        },
                    ]
                    : [],
        },
    };
} /* end _mapProject */

/** Fetch gia monitoring projects. */
export async function fetchGiaMonitoringProjects(
    objFilters: GiaMonitoringProjectFilters,
): Promise<GiaMonitoringProjectsResult>
{
    try
    {
        const objResponse = await g_objApi.get<BackendGiaMonitoringResponse>(
            '/gia/monitoring/projects',
            {
                params: {
                    search: objFilters.search?.trim() || undefined,
                    agency: objFilters.agency || undefined,
                    status: objFilters.status || undefined,
                    year: objFilters.year,
                    semester: objFilters.semester,
                    page: objFilters.page ?? 1,
                },
            },
        );

        return {
            projects: objResponse.data.data.map(_mapProject),
            statistics: {
                activeGrants: objResponse.data.statistics.active_grants,
                monitoredProjects: objResponse.data.statistics.monitored_projects,
                totalGrantAmount: objResponse.data.statistics.total_grant_amount,
                averageMilestoneProgress: objResponse.data.statistics.average_milestone_progress,
                pendingMilestones: objResponse.data.statistics.pending_milestones,
                delayedMilestones: objResponse.data.statistics.delayed_milestones,
            },
            agencies: objResponse.data.filters.agencies,
            statuses: objResponse.data.filters.statuses,
            pagination: {
                currentPage: objResponse.data.pagination.current_page,
                lastPage: objResponse.data.pagination.last_page,
                perPage: objResponse.data.pagination.per_page,
                total: objResponse.data.pagination.total,
                from: objResponse.data.pagination.from,
                to: objResponse.data.pagination.to,
            },
            canEdit: objResponse.data.access.can_edit,
            readOnly: objResponse.data.access.read_only,
        };
    } catch (errOperation)
    {
        /* end try */

        reportError(errOperation, 'gia_monitoring_store: fetch gia monitoring projects failed.');
        throw errOperation;
    }
} /* end fetchGiaMonitoringProjects */

/** Fetch gia monitoring report. */
export async function fetchGiaMonitoringReport(
    intProjectId: number,
    intYear: number,
    intSemester: 1 | 2,
): Promise<GiaMonitoringReportResponse['data']>
{
    try
    {
        const objResponse = await g_objApi.get<GiaMonitoringReportResponse>(
            `/gia/monitoring/projects/${intProjectId}/report`,
            { params: { year: intYear, semester: intSemester } },
        );

        return objResponse.data.data;
    } catch (errOperation)
    {
        reportError(errOperation, 'gia_monitoring_store: fetch gia monitoring report failed.');
        throw errOperation;
    }
}

/** Save gia monitoring report. */
export async function saveGiaMonitoringReport(
    intProjectId: number,
    intYear: number,
    intSemester: 1 | 2,
    objFormData: GiaMonitoringFormData,
): Promise<NonNullable<GiaMonitoringReportResponse['data']>>
{
    try
    {
        const objResponse = await g_objApi.put<GiaMonitoringReportResponse>(
            `/gia/monitoring/projects/${intProjectId}/report`,
            { year: intYear, semester: intSemester, form_data: objFormData },
        );

        if (!objResponse.data.data)
        {
            throw new Error('The server did not return the saved GIA monitoring report.');
        }

        return objResponse.data.data;
    } catch (errOperation)
    {
        reportError(errOperation, 'gia_monitoring_store: save gia monitoring report failed.');
        throw errOperation;
    }
}
