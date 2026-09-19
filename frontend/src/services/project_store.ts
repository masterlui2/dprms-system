/**
 * System: DPRMS
 * Purpose: Manage project store operations and data access.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import g_objApi from '../lib/axios';
import type { GiaProposalRecord, RawProject, RawProjectIndexResponse } from '../types/api/project';
import { reportError } from '../utils/error_reporting';
export type {
    GiaProposalRecord,
    ProjectProposalRef,
    ProjectUserRef,
    RawProject,
    SetupProposalFormSnapshot,
    SetupProposalRecord,
} from '../types/api/project';

// ── Raw backend shapes (what the API actually returns) ────────────────────

// ⚠️ NEEDS VERIFICATION against the actual gia_proposals migration/model —
// live-monitoring's version used organization_name/office_address instead of
// agency/location. Confirm which is correct before relying on this in prod.

// ── UI-facing shapes (what the component actually renders) ────────────────

export type Program = 'SETUP' | 'GIA';

export interface GiaMonitoringDetails
{
    actualAccomplishment: string;
    agency: string;
    baseStation: string;
    catchUpPlan: string;
    cooperatingAgencies: string[];
    durationMonths: number;
    endDate: string;
    issueSummary: string;
    latestReport: { period: string; status: string; submitted: string; };
    location: string;
    objective: string;
    outputs: string[];
    reportingPeriod: string;
    startDate: string;
    suggestedSolution: string;
    targetProgress: number;
    yearlyBudgets: unknown[];
}

export interface ProjectRecord
{
    backendId: number;
    id: string;
    referenceNumber: string;
    title: string;
    enterprise: string;
    location: string;
    manager: string;
    program: Program;
    status: 'Active' | 'Completed' | 'At risk';
    compliance: 'Compliant' | 'Due soon' | 'Overdue';
    progress: number;
    dueDate: string;
    approvedAt: string | null;
    budget: number;
    used: number;
    monitored?: boolean;
    monitoringStatus?: string;
    lastMonitoredAt?: string | null;
    pendingReports?: number;
    checklistStats?: {
        complied: number;
        total: number;
        percentage: number;
    };
    district: string;
    agency: string;
    gia?: GiaMonitoringDetails;
    proposalId?: number;
    industrySector?: string;
    enterpriseSize?: string;
    businessStructure?: string;
    contactNumber?: string;
    proponentName?: string;
}

/** Snapshot string. */
function _snapshotString(
    objSnapshot: Record<string, unknown> | null | undefined,
    strKey: string,
): string
{
    const objValue = objSnapshot?.[strKey];
    return typeof objValue === 'string' ? objValue.trim() : '';
}

/** Format date. */
function _formatDate(strValue: string | null): string
{
    if (!strValue)
    {
        return 'Not scheduled';
    }
    const dtDate = new Date(`${strValue.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(dtDate.getTime()))
    {
        return strValue;
    }
    return dtDate.toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Map status. */
function _mapStatus(strStatus: RawProject['status']): ProjectRecord['status']
{
    if (strStatus === 'completed' || strStatus === 'archieved')
    {
        return 'Completed';
    }
    if (strStatus === 'terminated')
    {
        return 'At risk';
    }
    return 'Active';
}

/** Calculate progress. */
function _calculateProgress(objProject: RawProject): number
{
    if (objProject.status === 'completed' || objProject.status === 'archieved')
    {
        return 100;
    }
    if (!objProject.start_date || !objProject.expected_end_date)
    {
        return 0;
    }

    const intStart = new Date(`${objProject.start_date.slice(0, 10)}T00:00:00`).getTime();
    const intEnd = new Date(`${objProject.expected_end_date.slice(0, 10)}T00:00:00`).getTime();
    if (!Number.isFinite(intStart) || !Number.isFinite(intEnd) || intEnd <= intStart)
    {
        return 0;
    }

    const intElapsed = Date.now() - intStart;
    return Math.max(0, Math.min(99, Math.round((intElapsed / (intEnd - intStart)) * 100)));
}

/** Calculate compliance. */
function _calculateCompliance(objProject: RawProject): ProjectRecord['compliance']
{
    if (
        !objProject.expected_end_date ||
        objProject.status === 'completed' ||
        objProject.status === 'archieved'
    )
    {
        return 'Compliant';
    }
    const intDueAt = new Date(`${objProject.expected_end_date.slice(0, 10)}T23:59:59`).getTime();
    const intRemainingDays = (intDueAt - Date.now()) / 86_400_000;
    if (intRemainingDays < 0)
    {
        return 'Overdue';
    }
    if (intRemainingDays <= 30)
    {
        return 'Due soon';
    }
    return 'Compliant';
}

/** Create gia details. */
function _createGiaDetails(
    objProject: RawProject,
    objGia: GiaProposalRecord,
): GiaMonitoringDetails
{
    const objSnapshot = objGia.form_snapshot;
    const strAgency = objGia.organization_name || objGia.agency || 'Unspecified agency';
    const strBaseStation = objGia.office_address || objGia.location || '';

    return {
        actualAccomplishment: '',
        agency: strAgency,
        baseStation: strBaseStation,
        catchUpPlan: '',
        cooperatingAgencies: [],
        durationMonths: 0,
        endDate: _formatDate(objProject.expected_end_date),
        issueSummary: '',
        latestReport: {
            period: 'No report submitted',
            status: 'Pending',
            submitted: 'Not yet submitted',
        },
        location: _snapshotString(objSnapshot, 'siteOfImplementation') || strBaseStation,
        objective: _snapshotString(objSnapshot, 'generalObjective'),
        outputs: [],
        reportingPeriod: objGia.reporting_period || 'For monitoring setup',
        startDate: _formatDate(objProject.start_date),
        suggestedSolution: '',
        targetProgress: 0,
        yearlyBudgets: [],
    };
}

/** Map project. */
function _mapProject(objProject: RawProject): ProjectRecord
{
    const objProposal = objProject.proposal;
    const objSetup = objProposal.setup_proposal?.[0];
    const objGia = objProposal.gia_proposal?.[0];
    const objSnapshot = objSetup?.form_snapshot ?? objGia?.form_snapshot ?? null;

    const strEnterprise =
        objSetup?.business_name ||
        objGia?.organization_name ||
        objGia?.agency ||
        objProject.user?.name ||
        'Approved proponent';

    const strManager =
        objProject.program_type === 'GIA'
            ? _snapshotString(objSnapshot, 'projectLeader') || objProject.user?.name || 'Unassigned'
            : objProposal.assigned_focal?.name ||
            objProposal.assigned_staff?.name ||
            _snapshotString(objSnapshot, 'contactPerson') ||
            objProject.user?.name ||
            'Unassigned';

    const strLocation =
        (objSetup
            ? [objSetup.city_municipality, objSetup.province].filter(Boolean).join(', ') ||
            objSetup.business_address
            : objGia?.office_address || objGia?.location) || 'Location not recorded';

    const strDistrict = objSetup?.city_municipality || objSetup?.province || '';

    const strIndustrySector =
        objSetup?.industry_sector ||
        _snapshotString(objSnapshot, 'industrySector') ||
        _snapshotString(objSnapshot, 'sector') ||
        'Food Processing';

    const strEnterpriseSize =
        objSetup?.enterprise_size ||
        _snapshotString(objSnapshot, 'enterpriseSize') ||
        'Micro Enterprise';

    const strBusinessStructure =
        objSetup?.business_type ||
        _snapshotString(objSnapshot, 'businessType') ||
        _snapshotString(objSnapshot, 'businessStructure') ||
        'Sole Proprietorship';

    const strContactNumber =
        _snapshotString(objSnapshot, 'contactNumber') ||
        _snapshotString(objSnapshot, 'mobileNumber') ||
        _snapshotString(objSnapshot, 'landlinePhone') ||
        '+63 917 123 4567';

    const strProponentName =
        _snapshotString(objSnapshot, 'contactPerson') ||
        _snapshotString(objSnapshot, 'proponentName') ||
        objProject.user?.name ||
        'Maria Proponent';

    return {
        backendId: objProject.id,
        id: objProposal.reference_number || `P-${objProject.id}`,
        referenceNumber: objProposal.reference_number,
        title: objProposal.title,
        enterprise: strEnterprise,
        location: strLocation,
        manager: strManager,
        program: objProject.program_type,
        status: _mapStatus(objProject.status),
        compliance: _calculateCompliance(objProject),
        progress: _calculateProgress(objProject),
        dueDate: _formatDate(objProject.expected_end_date),
        approvedAt: objProject.approved_at,
        budget: objProject.budget ?? 0,
        used: 0,
        lastMonitoredAt: objProject.approved_at,
        checklistStats: objProject.checklist_stats,
        district: strDistrict,
        agency: objGia?.organization_name || objGia?.agency || '',
        gia:
            objProject.program_type === 'GIA' && objGia
                ? _createGiaDetails(objProject, objGia)
                : undefined,
        proposalId: objProposal.id,
        industrySector: strIndustrySector,
        enterpriseSize: strEnterpriseSize,
        businessStructure: strBusinessStructure,
        contactNumber: strContactNumber,
        proponentName: strProponentName,
    };
} /* end _mapProject */

/** Fetch projects. */
export async function fetchProjects(): Promise<ProjectRecord[]>
{
    try
    {
        const { data: objData } = await g_objApi.get<RawProjectIndexResponse>('/v1/projects', {
            params: { status: 'active' },
        });
        return (objData?.data ?? []).map(_mapProject);
    } catch (errOperation)
    {
        reportError(errOperation, 'project_store: fetch projects failed.');
        throw errOperation;
    }
}
