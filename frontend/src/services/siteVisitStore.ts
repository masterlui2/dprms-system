import api from '../lib/axios'

export type VisitPurpose =
  | 'PRE_IMPLEMENTATION'
  | 'EQUIPMENT_ARRIVAL'
  | 'QUARTERLY_MONITORING'
  | 'ENERGY_AUDIT'

export interface SiteVisit {
  id: number
  project_id: number
  program: 'SETUP' | 'GIA'
  reference_number: string
  project_title: string
  date: string
  start_time: string
  end_time: string
  purpose: VisitPurpose
  purpose_label: string
  location: string
  instructions: string | null
  visibility: 'INTERNAL' | 'BROADCAST'
  status: string
  personnel: Array<{ id: number; name: string }>
}

export interface MonitoringDeadline {
  id: string
  type: 'DEADLINE'
  project_id: number
  program: 'SETUP' | 'GIA'
  project_title: string
  label: string
  date: string
  status: 'DUE' | 'OVERDUE' | 'SUBMITTED'
}

export interface SiteVisitProjectOption {
  id: number
  program: 'SETUP' | 'GIA'
  reference_number: string
  title: string
  location: string
}

export interface SiteVisitPersonnelOption {
  id: number
  name: string
  role: string
  programs: Array<'SETUP' | 'GIA'>
}

export interface ScheduleSiteVisitPayload {
  project_id: number
  scheduled_date: string
  start_time: string
  end_time: string
  purpose: VisitPurpose
  assigned_user_ids: number[]
  facility_location: string
  proponent_instructions: string
}

export async function fetchSiteVisitCalendar(month: string) {
  const response = await api.get<{
    data: {
      visits: SiteVisit[]
      deadlines: MonitoringDeadline[]
      access: { can_schedule: boolean }
    }
  }>('/site-visits', { params: { month } })
  return response.data.data
}

export async function fetchSiteVisitOptions() {
  const response = await api.get<{
    data: { projects: SiteVisitProjectOption[]; personnel: SiteVisitPersonnelOption[] }
  }>('/site-visits/options')
  return response.data.data
}

export async function scheduleSiteVisit(payload: ScheduleSiteVisitPayload) {
  const response = await api.post<{ data: SiteVisit }>('/site-visits', payload)
  return response.data.data
}

export async function fetchMySiteVisits() {
  const response = await api.get<{ data: SiteVisit[] }>('/site-visits/mine')
  return response.data.data
}

export function googleCalendarUrl(visit: SiteVisit): string {
  const compact = (value: string) => value.replaceAll('-', '').replaceAll(':', '')
  const start = `${compact(visit.date)}T${compact(visit.start_time)}00`
  const end = `${compact(visit.date)}T${compact(visit.end_time)}00`
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `DOST Site Visit - ${visit.project_title}`,
    dates: `${start}/${end}`,
    ctz: 'Asia/Manila',
    location: visit.location,
    details: visit.instructions || visit.purpose_label,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export async function downloadVisitCalendar(visit: SiteVisit): Promise<void> {
  const response = await api.get<Blob>(`/site-visits/${visit.id}/calendar`, {
    responseType: 'blob',
  })
  const url = URL.createObjectURL(response.data)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `site-visit-${visit.id}.ics`
  anchor.click()
  URL.revokeObjectURL(url)
}
