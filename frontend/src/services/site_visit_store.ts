/**
 * System: DPRMS
 * Purpose: Manage site visit store operations and data access.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import g_objApi from '../lib/axios';
import { reportError } from '../utils/error_reporting';

export type VisitPurpose =
    'PRE_IMPLEMENTATION' | 'EQUIPMENT_ARRIVAL' | 'QUARTERLY_MONITORING' | 'ENERGY_AUDIT';

export interface SiteVisit
{
    id: number;
    project_id: number;
    program: 'SETUP' | 'GIA';
    reference_number: string;
    project_title: string;
    date: string;
    start_time: string;
    end_time: string;
    purpose: VisitPurpose;
    purpose_label: string;
    location: string;
    instructions: string | null;
    visibility: 'INTERNAL' | 'BROADCAST';
    status: string;
    personnel: Array<{ id: number; name: string; }>;
}

export interface MonitoringDeadline
{
    id: string;
    type: 'DEADLINE';
    project_id: number;
    program: 'SETUP' | 'GIA';
    project_title: string;
    label: string;
    date: string;
    status: 'DUE' | 'OVERDUE' | 'SUBMITTED';
}

export interface SiteVisitProjectOption
{
    id: number;
    program: 'SETUP' | 'GIA';
    reference_number: string;
    title: string;
    location: string;
}

export interface SiteVisitPersonnelOption
{
    id: number;
    name: string;
    role: string;
    programs: Array<'SETUP' | 'GIA'>;
}

export interface ScheduleSiteVisitPayload
{
    project_id: number;
    scheduled_date: string;
    start_time: string;
    end_time: string;
    purpose: VisitPurpose;
    assigned_user_ids: number[];
    facility_location: string;
    proponent_instructions: string;
}

/** Fetch site visit calendar. */
export async function fetchSiteVisitCalendar(strMonth: string)
{
    try
    {
        const objResponse = await g_objApi.get<{
            data: {
                visits: SiteVisit[];
                deadlines: MonitoringDeadline[];
                access: { can_schedule: boolean; };
            };
        }>('/site-visits', { params: { month: strMonth } });
        return objResponse.data.data;
    } catch (errOperation)
    {
        reportError(errOperation, 'site_visit_store: fetch site visit calendar failed.');
        throw errOperation;
    }
}

/** Fetch site visit options. */
export async function fetchSiteVisitOptions()
{
    try
    {
        const objResponse = await g_objApi.get<{
            data: { projects: SiteVisitProjectOption[]; personnel: SiteVisitPersonnelOption[]; };
        }>('/site-visits/options');
        return objResponse.data.data;
    } catch (errOperation)
    {
        reportError(errOperation, 'site_visit_store: fetch site visit options failed.');
        throw errOperation;
    }
}

/** Schedule site visit. */
export async function scheduleSiteVisit(objPayload: ScheduleSiteVisitPayload)
{
    try
    {
        const objResponse = await g_objApi.post<{ data: SiteVisit; }>('/site-visits', objPayload);
        return objResponse.data.data;
    } catch (errOperation)
    {
        reportError(errOperation, 'site_visit_store: schedule site visit failed.');
        throw errOperation;
    }
}

/** Fetch my site visits. */
export async function fetchMySiteVisits()
{
    try
    {
        const objResponse = await g_objApi.get<{ data: SiteVisit[]; }>('/site-visits/mine');
        return objResponse.data.data;
    } catch (errOperation)
    {
        reportError(errOperation, 'site_visit_store: fetch my site visits failed.');
        throw errOperation;
    }
}

/** Google calendar url. */
export function googleCalendarUrl(objVisit: SiteVisit): string
{
    /** Compact. */
    const _compact = (strValue: string) => strValue.replaceAll('-', '').replaceAll(':', '');
    const strStart = `${_compact(objVisit.date)}T${_compact(objVisit.start_time)}00`;
    const strEnd = `${_compact(objVisit.date)}T${_compact(objVisit.end_time)}00`;
    const objParams = new URLSearchParams({
        action: 'TEMPLATE',
        text: `DOST Site Visit - ${objVisit.project_title}`,
        dates: `${strStart}/${strEnd}`,
        ctz: 'Asia/Manila',
        location: objVisit.location,
        details: objVisit.instructions || objVisit.purpose_label,
    });
    return `https://calendar.google.com/calendar/render?${objParams.toString()}`;
}

/** Download visit calendar. */
export async function downloadVisitCalendar(objVisit: SiteVisit): Promise<void>
{
    try
    {
        const objResponse = await g_objApi.get<Blob>(`/site-visits/${objVisit.id}/calendar`, {
            responseType: 'blob',
        });
        const strUrl = URL.createObjectURL(objResponse.data);
        const objAnchor = document.createElement('a');
        objAnchor.href = strUrl;
        objAnchor.download = `site-visit-${objVisit.id}.ics`;
        objAnchor.click();
        URL.revokeObjectURL(strUrl);
    } catch (errOperation)
    {
        reportError(errOperation, 'site_visit_store: download visit calendar failed.');
        throw errOperation;
    }
}
