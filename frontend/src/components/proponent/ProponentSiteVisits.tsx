/**
 * System: DPRMS
 * Purpose: Render proponent site visits for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { CalendarDays, Clock, Download, ExternalLink, MapPin, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import
{
    downloadVisitCalendar,
    fetchMySiteVisits,
    googleCalendarUrl,
    type SiteVisit,
} from '../../services/site_visit_store';

/** Time label. */
function _timeLabel(strValue: string)
{
    return new Date(`2026-01-01T${strValue}:00`).toLocaleTimeString('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
    });
}

/** Render proponent site visits and its available actions. */
export function ProponentSiteVisits()
{
    const [arrVisits, setArrVisits] = useState<SiteVisit[]>([]);
    const [blnLoading, setBlnLoading] = useState(true);

    useEffect(() =>
    {
        fetchMySiteVisits()
            .then(setArrVisits)
            .catch(() => setArrVisits([]))
            .finally(() => setBlnLoading(false));
    }, []);

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]">
                    <CalendarDays className="size-5" />
                </span>
                <div>
                    <h2 className="font-black text-slate-900">Scheduled Visits</h2>
                    <p className="text-xs text-slate-500">Upcoming DOST site activities</p>
                </div>
            </div>

            {blnLoading ? (
                <p className="py-10 text-center text-sm text-slate-500">Loading...</p>
            ) : arrVisits.length === 0 ? (
                <div className="py-10 text-center">
                    <CalendarDays className="mx-auto size-9 text-slate-300" />
                    <h3 className="mt-3 text-sm font-black text-slate-800">No scheduled visit</h3>
                    <p className="mt-1 text-xs text-slate-500">
                        DOST will coordinate with you before arriving.
                    </p>
                </div>
            ) : (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {arrVisits.map((objVisit) => (
                        <article
                            className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4"
                            key={objVisit.id}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-wide text-[#0f53b7]">
                                        {objVisit.purpose_label}
                                    </p>
                                    <h3 className="mt-1 font-black text-slate-900">
                                        {objVisit.project_title}
                                    </h3>
                                </div>
                                <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-black text-[#0f53b7]">
                                    {objVisit.program}
                                </span>
                            </div>
                            <div className="mt-4 space-y-2 text-xs text-slate-600">
                                <p className="flex items-center gap-2">
                                    <Clock className="size-4 text-[#0f53b7]" />
                                    {new Date(`${objVisit.date}T00:00:00`).toLocaleDateString(
                                        'en-PH',
                                        { month: 'long', day: 'numeric', year: 'numeric' },
                                    )}
                                    , {_timeLabel(objVisit.start_time)}–
                                    {_timeLabel(objVisit.end_time)}
                                </p>
                                <p className="flex items-center gap-2">
                                    <MapPin className="size-4 text-[#0f53b7]" />
                                    {objVisit.location}
                                </p>
                                <p className="flex items-center gap-2">
                                    <Users className="size-4 text-[#0f53b7]" />
                                    {objVisit.personnel
                                        .map((objPerson) => objPerson.name)
                                        .join(', ')}
                                </p>
                            </div>
                            {objVisit.instructions ? (
                                <p className="mt-4 rounded-xl bg-white px-3 py-2 text-xs leading-5 text-slate-600">
                                    <span className="font-bold text-slate-800">Prepare:</span>{' '}
                                    {objVisit.instructions}
                                </p>
                            ) : null}
                            <div className="mt-4 flex gap-2">
                                <a
                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#0f53b7] px-3 text-xs font-bold text-white"
                                    href={googleCalendarUrl(objVisit)}
                                    rel="noreferrer"
                                    target="_blank"
                                >
                                    <ExternalLink className="size-3.5" /> Google Calendar
                                </a>
                                <button
                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 text-xs font-bold text-[#0f53b7]"
                                    onClick={() => void downloadVisitCalendar(objVisit)}
                                    type="button"
                                >
                                    <Download className="size-3.5" /> .ics
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    ); // end return
} /* end ProponentSiteVisits */
