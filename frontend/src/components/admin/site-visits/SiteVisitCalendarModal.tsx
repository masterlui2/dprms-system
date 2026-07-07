import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";

import { cn } from "../../../utils/cn";
import { ModalShell } from "../ModalShell";

const visits = [
  {
    id: "VIS-024",
    project: "Highland Coffee",
    site: "Manay, Davao Oriental",
    date: "Jul 5, 2026",
    lead: "Ana Reyes",
    status: "Scheduled",
  },
  {
    id: "VIS-025",
    project: "Bright Foods",
    site: "Mati City",
    date: "Jul 8, 2026",
    lead: "Maria Santos",
    status: "Scheduled",
  },
  {
    id: "VIS-026",
    project: "DOrSU Research Center",
    site: "Baganga",
    date: "Jul 12, 2026",
    lead: "Kevin Lim",
    status: "Scheduled",
  },
  {
    id: "VIS-027",
    project: "Cateel Bamboo Association",
    site: "Cateel",
    date: "Jul 18, 2026",
    lead: "Kevin Lim",
    status: "Planned",
  },
];

const monthDays = [
  null,
  null,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  28,
  29,
  30,
  31,
  null,
  null,
];

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function SiteVisitCalendarModal({ onClose }: { onClose: () => void }) {
  const visitByDay = new Map(
    visits.map((visit) => [Number(visit.date.match(/Jul (\d+)/)?.[1]), visit]),
  );

  return (
    <ModalShell
      description="Upcoming field validation activities"
      footer={
        <div className="flex justify-end">
          <button
            className="h-10 rounded-lg px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      }
      onClose={onClose}
      title="Site visit calendar"
      width="xl"
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#f8fbff]">
        <div className="grid min-h-[620px] lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 bg-white p-5 lg:border-b-0 lg:border-r">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Calendar
            </p>
            <div className="mt-3 flex items-center justify-between">
              <button
                aria-label="Previous month"
                className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-50"
                type="button"
              >
                <ChevronLeft className="size-4" />
              </button>
              <p className="text-sm font-black text-slate-900">July 2026</p>
              <button
                aria-label="Next month"
                className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-50"
                type="button"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <span
                  className="py-1 font-bold text-slate-400"
                  key={`${day}-${index}`}
                >
                  {day}
                </span>
              ))}
              {monthDays.map((day, index) => (
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-md font-semibold",
                    day
                      ? "text-slate-600 hover:bg-blue-50"
                      : "text-transparent",
                    day === 5 && "bg-[#0f53b7] text-white hover:bg-[#0f53b7]",
                    visitByDay.has(day ?? 0) &&
                      day !== 5 &&
                      "bg-blue-50 text-[#0f53b7]",
                  )}
                  key={`${day ?? "blank"}-${index}`}
                >
                  {day ?? 0}
                </span>
              ))}
            </div>
          </aside>

          <section className="min-w-0 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Month view
            </p>
            <h3 className="mt-1 text-2xl font-black text-slate-900">
              Site visits
            </h3>

            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {weekDays.map((day) => (
                  <div
                    className="px-3 py-3 text-center text-xs font-black text-slate-500"
                    key={day}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {monthDays.map((day, index) => {
                  const visit = visitByDay.get(day ?? 0);

                  return (
                    <div
                      className={cn(
                        "min-h-28 border-b border-r border-slate-100 p-2",
                        index % 7 === 6 && "border-r-0",
                        index >= 28 && "border-b-0",
                        !day && "bg-slate-50/60",
                      )}
                      key={`${day ?? "empty"}-${index}`}
                    >
                      <span
                        className={cn(
                          "grid size-6 place-items-center rounded-full text-xs font-black",
                          day === 5
                            ? "bg-[#0f53b7] text-white"
                            : "text-slate-500",
                        )}
                      >
                        {day ?? ""}
                      </span>
                      {visit ? (
                        <div
                          className={cn(
                            "mt-2 rounded-md border px-2 py-1.5 text-xs",
                            visit.status === "Scheduled"
                              ? "border-blue-100 bg-blue-50 text-[#073b82]"
                              : "border-amber-100 bg-amber-50 text-amber-800",
                          )}
                        >
                          <p className="truncate font-black">{visit.project}</p>
                          <p className="mt-1 truncate text-[11px] font-semibold opacity-80">
                            {visit.site}
                          </p>
                          <p className="mt-1 truncate text-[11px] opacity-80">
                            Lead: {visit.lead}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {visits.map((visit) => (
                <article
                  className="rounded-xl border border-slate-200 bg-white p-3"
                  key={visit.id}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-[#0f53b7]" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">
                        {visit.project}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {visit.date}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {visit.site}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </ModalShell>
  );
}
