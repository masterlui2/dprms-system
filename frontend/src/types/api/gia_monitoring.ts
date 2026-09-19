/**
 * System: DPRMS
 * Purpose: Describe the current gia monitoring API contract without changing wire keys.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */

export interface GiaAccomplishmentRow
{
    id: string;
    objective: string;
    objectiveWeight: number;
    activities: string;
    targetAccomplishment: string;
    targetWeightY1: number;
    targetWeightY2: number;
    targetWeightY3: number;
    actualAccomplishment: string;
    actualY1Percent: number;
    actualY2Percent: number;
    actualY3Percent: number;
    remarks?: string;
}

export interface GiaOutputRow
{
    id: string;
    category: string;
    targetY1: number;
    targetY2: number;
    targetY3: number;
    actualFigureY1: number;
    actualDescY1: string;
    actualFigureY2: number;
    actualDescY2: string;
    actualFigureY3: number;
    actualDescY3: string;
}

export interface GiaMonitoringFormData
{
    projectLeaderGender: string;
    agency: string;
    addressContact: string;
    cooperatingAgencies: string;
    baseStation: string;
    sitesOfImplementation: string;
    durationMonths: number;
    startDate: string;
    endDate: string;
    totalBudget: number;
    accomplishments: GiaAccomplishmentRow[];
    catchUpPlan: string;
    outputs: GiaOutputRow[];
    problemConcern: string;
    suggestedSolution: string;
    preparedBy: string;
    reviewedBy: string;
    approvedBy: string;
}

export interface GiaMonitoringReportResponse
{
    data: {
        id: number;
        status: string;
        reporting_period: string;
        year: number;
        form_data: GiaMonitoringFormData;
        updated_at: string;
    } | null;
}

export interface BackendGiaMilestone
{
    id: number;
    number: number;
    title: string;
    description: string | null;
    status: string;
    completion_percentage: number;
    expected_completion: string | null;
    actual_completion: string | null;
}

export interface BackendGiaMonitoringProject
{
    id: number;
    proposal_id?: number | null;
    reference_number: string;
    title: string;
    implementing_agency: string;
    project_leader: string;
    office_address: string | null;
    approved_at: string | null;
    start_date: string | null;
    expected_end_date: string | null;
    grant_amount: number;
    currency: string;
    monitoring_status: string;
    last_monitored_at: string | null;
    milestone_progress: number;
    checklist_stats?: {
        complied: number;
        total: number;
        percentage: number;
    };
    milestones: BackendGiaMilestone[];
    latest_report: {
        status: string;
        reporting_period: string;
        year: number;
        submitted_at: string | null;
        due_date: string | null;
    } | null;
    semestral_context: {
        year: number;
        semester: 1 | 2;
    };
}

export interface BackendGiaMonitoringResponse
{
    access: {
        can_edit: boolean;
        read_only: boolean;
    };
    statistics: {
        active_grants: number;
        monitored_projects: number;
        total_grant_amount: number;
        average_milestone_progress: number;
        pending_milestones: number;
        delayed_milestones: number;
    };
    filters: {
        agencies: string[];
        statuses: string[];
    };
    data: BackendGiaMonitoringProject[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
}
