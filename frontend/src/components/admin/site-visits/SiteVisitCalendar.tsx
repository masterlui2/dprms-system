import { CalendarDays, ChevronLeft, ChevronRight, Clock, Download, ExternalLink, MapPin, Plus, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  downloadVisitCalendar,
  fetchSiteVisitCalendar,
  googleCalendarUrl,
  type MonitoringDeadline,
  type SiteVisit,
} from '../../../services/siteVisitStore'
import { cn } from '../../../utils/cn'
import { ScheduleSiteVisitModal } from './ScheduleSiteVisitModal'

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function isoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function monthValue(date: Date) {
  return isoDate(date).slice(0, 7)
}

function monthGrid(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = new Date(first)
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7))
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

function weekGrid(selected: Date) {
  const start = new Date(selected)
  start.setDate(selected.getDate() - ((selected.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

function timeLabel(time: string) {
  return new Date(`2026-01-01T${time}:00`).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
}

export function SiteVisitCalendar({ focusDate }: { focusDate?: string | null }) {
  const initial = focusDate ? new Date(`${focusDate}T00:00:00`) : new Date()
  const [month, setMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(initial)
  const [view, setView] = useState<'month' | 'week'>('month')
  const [visits, setVisits] = useState<SiteVisit[]>([])
  const [deadlines, setDeadlines] = useState<MonitoringDeadline[]>([])
  const [canSchedule, setCanSchedule] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState<SiteVisit | null>(null)
  const [scheduleDate, setScheduleDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchSiteVisitCalendar(monthValue(month))
      setVisits(result.visits)
      setDeadlines(result.deadlines)
      setCanSchedule(result.access.can_schedule)
    } catch {
      setError('Calendar could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { void load() }, [load])

  const days = view === 'month' ? monthGrid(month) : weekGrid(selectedDate)
  const eventsByDate = useMemo(() => {
    const result = new Map<string, Array<SiteVisit | MonitoringDeadline>>()
    for (const event of [...visits, ...deadlines]) {
      result.set(event.date, [...(result.get(event.date) ?? []), event])
    }
    return result
  }, [deadlines, visits])

  function move(direction: number) {
    if (view === 'month') {
      setMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1))
    } else {
      setSelectedDate((current) => {
        const next = new Date(current)
        next.setDate(current.getDate() + direction * 7)
        setMonth(new Date(next.getFullYear(), next.getMonth(), 1))
        return next
      })
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]"><CalendarDays className="size-5" /></span>
          <div><h2 className="font-black text-slate-900">Site Visits</h2><p className="text-xs text-slate-500">Visits and report deadlines</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            {(['month', 'week'] as const).map((mode) => <button className={cn('rounded-lg px-3 py-1.5 text-xs font-bold capitalize', view === mode && 'bg-white text-[#0f53b7] shadow-sm')} key={mode} onClick={() => setView(mode)} type="button">{mode}</button>)}
          </div>
          {canSchedule ? <button className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#0f53b7] px-4 text-xs font-bold text-white" onClick={() => setScheduleDate(isoDate(selectedDate))} type="button"><Plus className="size-4" /> Schedule</button> : null}
        </div>
      </div>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <button aria-label="Previous period" className="grid size-9 place-items-center rounded-lg hover:bg-slate-100" onClick={() => move(-1)} type="button"><ChevronLeft className="size-4" /></button>
          <h3 className="font-black text-slate-900">{month.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}</h3>
          <button aria-label="Next period" className="grid size-9 place-items-center rounded-lg hover:bg-slate-100" onClick={() => move(1)} type="button"><ChevronRight className="size-4" /></button>
        </div>
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">{weekdays.map((day) => <div className="px-2 py-2 text-center text-[11px] font-black text-slate-500" key={day}>{day}</div>)}</div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const date = isoDate(day)
            const events = eventsByDate.get(date) ?? []
            const outsideMonth = day.getMonth() !== month.getMonth()
            return (
              <div className={cn('min-h-28 border-b border-r border-slate-100 p-1.5 sm:p-2', outsideMonth && view === 'month' && 'bg-slate-50/70')} key={date}>
                <button className={cn('grid size-7 place-items-center rounded-full text-xs font-bold text-slate-600 hover:bg-blue-50', date === isoDate(new Date()) && 'bg-[#0f53b7] text-white')} onClick={() => { setSelectedDate(day); if (canSchedule) setScheduleDate(date) }} type="button">{day.getDate()}</button>
                <div className="mt-1 space-y-1">
                  {events.slice(0, 3).map((event) => {
                    const isDeadline = 'type' in event
                    const overdue = isDeadline && event.status === 'OVERDUE'
                    return (
                      <button className={cn('block w-full truncate rounded-md px-1.5 py-1 text-left text-[10px] font-bold', isDeadline ? (overdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-50 text-amber-700') : 'bg-blue-50 text-[#0f53b7]')} key={event.id} onClick={(click) => { click.stopPropagation(); if (!isDeadline) setSelectedVisit(event) }} title={isDeadline ? event.label : event.project_title} type="button">
                        {isDeadline ? event.label : `${event.start_time} ${event.project_title}`}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        {loading ? <p className="border-t border-slate-100 px-4 py-3 text-center text-xs text-slate-500">Loading calendar...</p> : null}
      </div>

      {selectedVisit ? (
        <article className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2"><h3 className="font-black text-slate-900">{selectedVisit.project_title}</h3>{selectedVisit.visibility === 'INTERNAL' ? <span className="rounded-md bg-slate-200 px-2 py-1 text-[10px] font-black text-slate-600">Internal</span> : null}</div>
              <p className="mt-1 text-sm font-semibold text-[#0f53b7]">{selectedVisit.purpose_label}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" />{new Date(`${selectedVisit.date}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}, {timeLabel(selectedVisit.start_time)}–{timeLabel(selectedVisit.end_time)}</span>
                <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{selectedVisit.location}</span>
                <span className="inline-flex items-center gap-1.5"><Users className="size-3.5" />{selectedVisit.personnel.map((person) => person.name).join(', ')}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <a className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 text-xs font-bold text-[#0f53b7]" href={googleCalendarUrl(selectedVisit)} rel="noreferrer" target="_blank"><ExternalLink className="size-3.5" /> Google</a>
              <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 text-xs font-bold text-[#0f53b7]" onClick={() => void downloadVisitCalendar(selectedVisit)} type="button"><Download className="size-3.5" /> .ics</button>
            </div>
          </div>
        </article>
      ) : null}

      {scheduleDate ? <ScheduleSiteVisitModal initialDate={scheduleDate} onClose={() => setScheduleDate(null)} onSaved={() => { setScheduleDate(null); void load() }} /> : null}
    </section>
  )
}
