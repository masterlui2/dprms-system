/**
 * System: DPRMS
 * Purpose: Render site visit calendar for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    ExternalLink,
    MapPin,
    Plus,
    Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { reportError } from '../../../utils/error_reporting';

import
{
    downloadVisitCalendar,
    fetchSiteVisitCalendar,
    googleCalendarUrl,
    type MonitoringDeadline,
    type SiteVisit,
} from '../../../services/site_visit_store';
import { cn } from '../../../utils/cn';
import { ScheduleSiteVisitModal } from './ScheduleSiteVisitModal';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Iso date. */
function _isoDate(dtDate: Date)
{
    const intYear = dtDate.getFullYear();
    const strMonth = String(dtDate.getMonth() + 1).padStart(2, '0');
    const strDay = String(dtDate.getDate()).padStart(2, '0');
    return `${intYear}-${strMonth}-${strDay}`;
}

/** Month value. */
function _monthValue(dtDate: Date)
{
    return _isoDate(dtDate).slice(0, 7);
}

/** Month grid. */
function _monthGrid(dtMonth: Date)
{
    const dtFirst = new Date(dtMonth.getFullYear(), dtMonth.getMonth(), 1);
    const dtStart = new Date(dtFirst);
    dtStart.setDate(dtFirst.getDate() - ((dtFirst.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_objUnused, intIndex) =>
    {
        const dtDate = new Date(dtStart);
        dtDate.setDate(dtStart.getDate() + intIndex);
        return dtDate;
    });
}

/** Week grid. */
function _weekGrid(dtSelected: Date)
{
    const dtStart = new Date(dtSelected);
    dtStart.setDate(dtSelected.getDate() - ((dtSelected.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_objUnused, intIndex) =>
    {
        const dtDate = new Date(dtStart);
        dtDate.setDate(dtStart.getDate() + intIndex);
        return dtDate;
    });
}

/** Time label. */
function _timeLabel(strTime: string)
{
    return new Date(`2026-01-01T${strTime}:00`).toLocaleTimeString('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
    });
}

/** Render site visit calendar and its available actions. */
export function SiteVisitCalendar({ strFocusDate }: { strFocusDate?: string | null; })
{
    const dtInitial = strFocusDate ? new Date(`${strFocusDate}T00:00:00`) : new Date();
    const [dtMonth, setDtMonth] = useState(
        new Date(dtInitial.getFullYear(), dtInitial.getMonth(), 1),
    );
    const [dtSelectedDate, setDtSelectedDate] = useState(dtInitial);
    const [strView, setStrView] = useState<'month' | 'week'>('month');
    const [arrVisits, setArrVisits] = useState<SiteVisit[]>([]);
    const [arrDeadlines, setArrDeadlines] = useState<MonitoringDeadline[]>([]);
    const [blnCanSchedule, setBlnCanSchedule] = useState(false);
    const [objSelectedVisit, setObjSelectedVisit] = useState<SiteVisit | null>(null);
    const [strScheduleDate, setStrScheduleDate] = useState<string | null>(null);
    const [blnLoading, setBlnLoading] = useState(true);
    const [strError, setStrError] = useState<string | null>(null);

    const _load = useCallback(async () =>
    {
        setBlnLoading(true);
        setStrError(null);
        try
        {
            const objResult = await fetchSiteVisitCalendar(_monthValue(dtMonth));
            setArrVisits(objResult.visits);
            setArrDeadlines(objResult.deadlines);
            setBlnCanSchedule(objResult.access.can_schedule);
        } catch (errCaught)
        {
            reportError(errCaught, 'SiteVisitCalendar: load failed.');

            setStrError('Calendar could not be loaded.');
        } finally
        {
            setBlnLoading(false);
        }
    }, [dtMonth]);

    useEffect(() =>
    {
        void _load();
    }, [_load]);

    const arrDays = strView === 'month' ? _monthGrid(dtMonth) : _weekGrid(dtSelectedDate);
    const objEventsByDate = useMemo(() =>
    {
        const objResult = new Map<string, Array<SiteVisit | MonitoringDeadline>>();
        for (const objEvent of [...arrVisits, ...arrDeadlines])
        {
            objResult.set(objEvent.date, [...(objResult.get(objEvent.date) ?? []), objEvent]);
        }
        return objResult;
    }, [arrDeadlines, arrVisits]);

    /** Move. */
    /** Move. */
    function _move(intDirection: number)
    {
        if (strView === 'month')
        {
            setDtMonth(
                (dtCurrent) =>
                    new Date(dtCurrent.getFullYear(), dtCurrent.getMonth() + intDirection, 1),
            );
        } else
        {
            setDtSelectedDate((dtCurrent) =>
            {
                const dtNext = new Date(dtCurrent);
                dtNext.setDate(dtCurrent.getDate() + intDirection * 7);
                setDtMonth(new Date(dtNext.getFullYear(), dtNext.getMonth(), 1));
                return dtNext;
            });
        }
    }

    return (
        <section className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]">
                        <CalendarDays className="size-5" />
                    </span>
                    <div>
                        <h2 className="font-black text-slate-900">Site Visits</h2>
                        <p className="text-xs text-slate-500">Visits and report deadlines</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-xl bg-slate-100 p-1">
                        {(['month', 'week'] as const).map((strMode) => (
                            <button
                                className={cn(
                                    'rounded-lg px-3 py-1.5 text-xs font-bold capitalize',
                                    strView === strMode && 'bg-white text-[#0f53b7] shadow-sm',
                                )}
                                key={strMode}
                                onClick={() => setStrView(strMode)}
                                type="button"
                            >
                                {strMode}
                            </button>
                        ))}
                    </div>
                    {blnCanSchedule ? (
                        <button
                            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#0f53b7] px-4 text-xs font-bold text-white"
                            onClick={() => setStrScheduleDate(_isoDate(dtSelectedDate))}
                            type="button"
                        >
                            <Plus className="size-4" /> Schedule
                        </button>
                    ) : null}
                </div>
            </div>

            {strError ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {strError}
                </p>
            ) : null}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <button
                        aria-label="Previous period"
                        className="grid size-9 place-items-center rounded-lg hover:bg-slate-100"
                        onClick={() => _move(-1)}
                        type="button"
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                    <h3 className="font-black text-slate-900">
                        {dtMonth.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button
                        aria-label="Next period"
                        className="grid size-9 place-items-center rounded-lg hover:bg-slate-100"
                        onClick={() => _move(1)}
                        type="button"
                    >
                        <ChevronRight className="size-4" />
                    </button>
                </div>
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                    {WEEKDAYS.map((strDay) => (
                        <div
                            className="px-2 py-2 text-center text-[11px] font-black text-slate-500"
                            key={strDay}
                        >
                            {strDay}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {arrDays.map(
                        (dtDay) =>
                        {
                            const strDate = _isoDate(dtDay);
                            const arrEvents = objEventsByDate.get(strDate) ?? [];
                            const blnOutsideMonth = dtDay.getMonth() !== dtMonth.getMonth();
                            return (
                                <div
                                    className={cn(
                                        'min-h-28 border-b border-r border-slate-100 p-1.5 sm:p-2',
                                        blnOutsideMonth && strView === 'month' && 'bg-slate-50/70',
                                    )}
                                    key={strDate}
                                >
                                    <button
                                        className={cn(
                                            'grid size-7 place-items-center rounded-full text-xs font-bold text-slate-600 hover:bg-blue-50',
                                            strDate === _isoDate(new Date()) &&
                                            'bg-[#0f53b7] text-white',
                                        )}
                                        onClick={() =>
                                        {
                                            setDtSelectedDate(dtDay);
                                            if (blnCanSchedule)
                                            {
                                                setStrScheduleDate(strDate);
                                            }
                                        }}
                                        type="button"
                                    >
                                        {dtDay.getDate()}
                                    </button>
                                    <div className="mt-1 space-y-1">
                                        {arrEvents.slice(0, 3).map((objEvent) =>
                                        {
                                            const blnIsDeadline = 'type' in objEvent;
                                            const blnOverdue =
                                                blnIsDeadline && objEvent.status === 'OVERDUE';
                                            return (
                                                <button
                                                    className={cn(
                                                        'block w-full truncate rounded-md px-1.5 py-1 text-left text-[10px] font-bold',
                                                        blnIsDeadline
                                                            ? blnOverdue
                                                                ? 'bg-rose-100 text-rose-700'
                                                                : 'bg-amber-50 text-amber-700'
                                                            : 'bg-blue-50 text-[#0f53b7]',
                                                    )}
                                                    key={objEvent.id}
                                                    onClick={(objClick) =>
                                                    {
                                                        objClick.stopPropagation();
                                                        if (!blnIsDeadline)
                                                        {
                                                            setObjSelectedVisit(objEvent);
                                                        }
                                                    }}
                                                    title={
                                                        blnIsDeadline
                                                            ? objEvent.label
                                                            : objEvent.project_title
                                                    }
                                                    type="button"
                                                >
                                                    {blnIsDeadline
                                                        ? objEvent.label
                                                        : `${objEvent.start_time} ${objEvent.project_title}`}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ); // end return
                        } /* end SiteVisitCalendar */,
                    )}
                </div>
                {blnLoading ? (
                    <p className="border-t border-slate-100 px-4 py-3 text-center text-xs text-slate-500">
                        Loading calendar...
                    </p>
                ) : null}
            </div>

            {objSelectedVisit ? (
                <article className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-slate-900">
                                    {objSelectedVisit.project_title}
                                </h3>
                                {objSelectedVisit.visibility === 'INTERNAL' ? (
                                    <span className="rounded-md bg-slate-200 px-2 py-1 text-[10px] font-black text-slate-600">
                                        Internal
                                    </span>
                                ) : null}
                            </div>
                            <p className="mt-1 text-sm font-semibold text-[#0f53b7]">
                                {objSelectedVisit.purpose_label}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock className="size-3.5" />
                                    {new Date(
                                        `${objSelectedVisit.date}T00:00:00`,
                                    ).toLocaleDateString('en-PH', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                    , {_timeLabel(objSelectedVisit.start_time)}–
                                    {_timeLabel(objSelectedVisit.end_time)}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <MapPin className="size-3.5" />
                                    {objSelectedVisit.location}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Users className="size-3.5" />
                                    {objSelectedVisit.personnel
                                        .map((objPerson) => objPerson.name)
                                        .join(', ')}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <a
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 text-xs font-bold text-[#0f53b7]"
                                href={googleCalendarUrl(objSelectedVisit)}
                                rel="noreferrer"
                                target="_blank"
                            >
                                <ExternalLink className="size-3.5" /> Google
                            </a>
                            <button
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 text-xs font-bold text-[#0f53b7]"
                                onClick={() => void downloadVisitCalendar(objSelectedVisit)}
                                type="button"
                            >
                                <Download className="size-3.5" /> .ics
                            </button>
                        </div>
                    </div>
                </article>
            ) : null}

            {strScheduleDate ? (
                <ScheduleSiteVisitModal
                    strInitialDate={strScheduleDate}
                    onClose={() => setStrScheduleDate(null)}
                    onSaved={() =>
                    {
                        setStrScheduleDate(null);
                        void _load();
                    }}
                />
            ) : null}
        </section>
    ); // end return
} /* end SiteVisitCalendar */
