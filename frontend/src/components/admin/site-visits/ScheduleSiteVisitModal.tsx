/**
 * System: DPRMS
 * Purpose: Render schedule site visit modal for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import axios from 'axios';
import { Check, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { reportError } from '../../../utils/error_reporting';

import { notifyNotificationsChanged } from '../../../services/notification_store';
import
{
    fetchSiteVisitOptions,
    scheduleSiteVisit,
    type SiteVisitPersonnelOption,
    type SiteVisitProjectOption,
    type VisitPurpose,
} from '../../../services/site_visit_store';
import { ModalShell } from '../ModalShell';

const PURPOSES: Array<{ value: VisitPurpose; label: string; }> = [
    { value: 'PRE_IMPLEMENTATION', label: 'Pre-Implementation' },
    { value: 'EQUIPMENT_ARRIVAL', label: 'Equipment Arrival' },
    { value: 'QUARTERLY_MONITORING', label: 'Quarterly Monitoring' },
    { value: 'ENERGY_AUDIT', label: 'Energy Audit' },
];

/** Render schedule site visit modal and its available actions. */
export function ScheduleSiteVisitModal({
    strInitialDate,
    onClose,
    onSaved,
}: {
    strInitialDate: string;
    onClose: () => void;
    onSaved: () => void;
})
{
    const [arrProjects, setArrProjects] = useState<SiteVisitProjectOption[]>([]);
    const [arrPersonnel, setArrPersonnel] = useState<SiteVisitPersonnelOption[]>([]);
    const [strProjectSearch, setStrProjectSearch] = useState('');
    const [objSelectedProject, setObjSelectedProject] = useState<SiteVisitProjectOption | null>(
        null,
    );
    const [strDate, setStrDate] = useState(strInitialDate);
    const [strStartTime, setStrStartTime] = useState('09:00');
    const [strEndTime, setStrEndTime] = useState('11:00');
    const [strPurpose, setStrPurpose] = useState<VisitPurpose>('QUARTERLY_MONITORING');
    const [arrAssignedIds, setArrAssignedIds] = useState<number[]>([]);
    const [strPersonnelSearch, setStrPersonnelSearch] = useState('');
    const [strLocation, setStrLocation] = useState('');
    const [strInstructions, setStrInstructions] = useState('');
    const [blnLoading, setBlnLoading] = useState(true);
    const [blnSaving, setBlnSaving] = useState(false);
    const [strError, setStrError] = useState<string | null>(null);

    useEffect(() =>
    {
        fetchSiteVisitOptions()
            .then((objResult) =>
            {
                setArrProjects(objResult.projects);
                setArrPersonnel(objResult.personnel);
            })
            .catch(() => setStrError('Scheduling options could not be loaded.'))
            .finally(() => setBlnLoading(false));
    }, []);

    const arrMatchingProjects = useMemo(() =>
    {
        const strSearch = strProjectSearch.trim().toLowerCase();
        if (!strSearch)
        {
            return arrProjects.slice(0, 8);
        }
        return arrProjects
            .filter((objProject) =>
                `${objProject.reference_number} ${objProject.title}`
                    .toLowerCase()
                    .includes(strSearch),
            )
            .slice(0, 12);
    }, [strProjectSearch, arrProjects]);

    const arrAvailablePersonnel = arrPersonnel.filter(
        (objPerson) =>
            !objSelectedProject || objPerson.programs.includes(objSelectedProject.program),
    );

    const arrMatchingPersonnel = arrAvailablePersonnel
        .filter((objPerson) =>
            `${objPerson.name} ${objPerson.role}`
                .toLowerCase()
                .includes(strPersonnelSearch.trim().toLowerCase()),
        )
        .sort((objLeft, objRight) =>
        {
            const intSelectedOrder =
                Number(arrAssignedIds.includes(objRight.id)) -
                Number(arrAssignedIds.includes(objLeft.id));
            return intSelectedOrder || objLeft.name.localeCompare(objRight.name);
        })
        .slice(0, 50);

    /** Select project. */
    function _selectProject(objProject: SiteVisitProjectOption)
    {
        setObjSelectedProject(objProject);
        setStrProjectSearch(`${objProject.reference_number} — ${objProject.title}`);
        setStrLocation(objProject.location);
        setArrAssignedIds((arrIds) =>
            arrIds.filter((intId) =>
                arrPersonnel
                    .find((objPerson) => objPerson.id === intId)
                    ?.programs.includes(objProject.program),
            ),
        );
    }

    /** Submit. */
    async function _submit()
    {
        if (!objSelectedProject || arrAssignedIds.length === 0)
        {
            setStrError('Choose a project and at least one officer.');
            return;
        }
        setBlnSaving(true);
        setStrError(null);
        try
        {
            await scheduleSiteVisit({
                project_id: objSelectedProject.id,
                scheduled_date: strDate,
                start_time: strStartTime,
                end_time: strEndTime,
                purpose: strPurpose,
                assigned_user_ids: arrAssignedIds,
                facility_location: strLocation,
                proponent_instructions: strInstructions,
            });
            notifyNotificationsChanged();
            onSaved();
        } catch (errCause)
        {
            reportError(errCause, 'ScheduleSiteVisitModal: submit failed.');

            if (axios.isAxiosError(errCause))
            {
                const objErrors = errCause.response?.data?.errors as
                    Record<string, string[]> | undefined;
                setStrError(
                    objErrors
                        ? Object.values(objErrors)[0]?.[0]
                        : 'The visit could not be scheduled.',
                );
            } else
            {
                setStrError('The visit could not be scheduled.');
            }
        } finally
        {
            setBlnSaving(false);
        }
    } /* end _submit */

    const blnShowProjectResults = Boolean(
        !objSelectedProject &&
        !blnLoading &&
        (arrMatchingProjects.length > 0 || strProjectSearch.trim()),
    );
    const blnHasAvailablePersonnel = !blnLoading && arrAvailablePersonnel.length > 0;
    const blnHasNoAvailablePersonnel = !blnLoading && arrAvailablePersonnel.length === 0;

    return (
        <ModalShell
            txtDescription="Add a field visit"
            objFooter={
                <div className="flex justify-end gap-2">
                    <button
                        className="h-10 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
                        onClick={onClose}
                        type="button"
                    >
                        Cancel
                    </button>
                    <button
                        className="h-10 rounded-xl bg-[#0f53b7] px-5 text-sm font-bold text-white disabled:opacity-60"
                        disabled={blnSaving || blnLoading}
                        onClick={() => void _submit()}
                        type="button"
                    >
                        {blnSaving ? 'Saving...' : 'Schedule Visit'}
                    </button>
                </div>
            }
            onClose={onClose}
            title="Schedule Site Visit"
            strWidth="lg"
        >
            {strError ? (
                <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {strError}
                </p>
            ) : null}
            <div className="grid gap-4 lg:grid-cols-2">
                <div className="lg:col-span-2">
                    <label className="text-sm font-bold text-slate-800">Project</label>
                    <div className="relative mt-2">
                        <Search className="absolute left-3 top-3 size-4 text-slate-400" />
                        <input
                            className="h-10 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-[#0f53b7]"
                            onChange={(objEvent) =>
                            {
                                setStrProjectSearch(objEvent.target.value);
                                setObjSelectedProject(null);
                            }}
                            placeholder="Search project or reference"
                            value={strProjectSearch}
                        />
                    </div>
                    {blnShowProjectResults ? (
                        <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1">
                            {arrMatchingProjects.map((objProject) => (
                                <button
                                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-blue-50"
                                    key={objProject.id}
                                    onClick={() => _selectProject(objProject)}
                                    type="button"
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-bold text-slate-800">
                                            {objProject.title}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {objProject.reference_number}
                                        </span>
                                    </span>
                                    <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-black text-[#0f53b7]">
                                        {objProject.program}
                                    </span>
                                </button>
                            ))}
                            {!blnLoading && arrMatchingProjects.length === 0 ? (
                                <p className="px-3 py-4 text-center text-sm text-slate-500">
                                    No active project found
                                </p>
                            ) : null}
                        </div>
                    ) : null}
                </div>

                <label className="text-sm font-bold text-slate-800">
                    Date
                    <input
                        className="mt-2 h-10 w-full rounded-xl border border-slate-300 px-3 font-normal outline-none focus:border-[#0f53b7]"
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={(objEvent) => setStrDate(objEvent.target.value)}
                        type="date"
                        value={strDate}
                    />
                </label>
                <label className="text-sm font-bold text-slate-800">
                    Purpose
                    <select
                        className="mt-2 h-10 w-full rounded-xl border border-slate-300 px-3 font-normal outline-none focus:border-[#0f53b7]"
                        onChange={(objEvent) =>
                            setStrPurpose(objEvent.target.value as VisitPurpose)
                        }
                        value={strPurpose}
                    >
                        {PURPOSES.map((objItem) => (
                            <option key={objItem.value} value={objItem.value}>
                                {objItem.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="text-sm font-bold text-slate-800">
                    Start
                    <input
                        className="mt-2 h-10 w-full rounded-xl border border-slate-300 px-3 font-normal"
                        onChange={(objEvent) => setStrStartTime(objEvent.target.value)}
                        type="time"
                        value={strStartTime}
                    />
                </label>
                <label className="text-sm font-bold text-slate-800">
                    End
                    <input
                        className="mt-2 h-10 w-full rounded-xl border border-slate-300 px-3 font-normal"
                        onChange={(objEvent) => setStrEndTime(objEvent.target.value)}
                        type="time"
                        value={strEndTime}
                    />
                </label>
                <label className="text-sm font-bold text-slate-800 lg:col-span-2">
                    Location
                    <input
                        className="mt-2 h-10 w-full rounded-xl border border-slate-300 px-3 font-normal outline-none focus:border-[#0f53b7]"
                        onChange={(objEvent) => setStrLocation(objEvent.target.value)}
                        value={strLocation}
                    />
                </label>

                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-slate-800">Assigned personnel</p>
                        {arrAssignedIds.length > 0 ? (
                            <span className="text-xs font-semibold text-[#0f53b7]">
                                {arrAssignedIds.length} selected
                            </span>
                        ) : null}
                    </div>
                    {blnLoading ? <p className="mt-2 text-sm text-slate-500">Loading...</p> : null}
                    {blnHasAvailablePersonnel ? (
                        <>
                            <div className="relative mt-2">
                                <Search className="absolute left-3 top-3 size-4 text-slate-400" />
                                <input
                                    aria-label="Search personnel"
                                    className="h-10 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-[#0f53b7]"
                                    onChange={(objEvent) =>
                                        setStrPersonnelSearch(objEvent.target.value)
                                    }
                                    placeholder="Search personnel"
                                    value={strPersonnelSearch}
                                />
                            </div>
                            <div className="mt-2 grid max-h-40 gap-1.5 overflow-y-auto rounded-xl border border-slate-200 p-2 sm:grid-cols-2 lg:grid-cols-3">
                                {arrMatchingPersonnel.map((objPerson) =>
                                {
                                    const blnChecked = arrAssignedIds.includes(objPerson.id);
                                    return (
                                        <button
                                            className={`flex items-center gap-3 rounded-lg border px-3 py-1.5 text-left ${blnChecked ? 'border-blue-300 bg-blue-50' : 'border-slate-200'}`}
                                            key={objPerson.id}
                                            onClick={() =>
                                                setArrAssignedIds((arrIds) =>
                                                    blnChecked
                                                        ? arrIds.filter(
                                                            (intId) => intId !== objPerson.id,
                                                        )
                                                        : [...arrIds, objPerson.id],
                                                )
                                            }
                                            type="button"
                                        >
                                            <span
                                                className={`grid size-5 place-items-center rounded border ${blnChecked ? 'border-[#0f53b7] bg-[#0f53b7] text-white' : 'border-slate-300'}`}
                                            >
                                                {blnChecked ? <Check className="size-3" /> : null}
                                            </span>
                                            <span>
                                                <span className="block text-sm font-bold text-slate-800">
                                                    {objPerson.name}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {objPerson.role}
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })}
                                {arrMatchingPersonnel.length === 0 ? (
                                    <p className="col-span-full px-3 py-4 text-center text-sm text-slate-500">
                                        No personnel found
                                    </p>
                                ) : null}
                            </div>
                            {arrAvailablePersonnel.length > 50 && !strPersonnelSearch.trim() ? (
                                <p className="mt-1 text-xs text-slate-500">
                                    Search to view more personnel
                                </p>
                            ) : null}
                        </>
                    ) : null}
                    {blnHasNoAvailablePersonnel ? (
                        <p className="mt-2 text-sm text-slate-500">No personnel available</p>
                    ) : null}
                </div>

                <label className="text-sm font-bold text-slate-800 lg:col-span-2">
                    Instructions <span className="font-normal text-slate-400">(optional)</span>
                    <textarea
                        className="mt-2 min-h-16 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal outline-none focus:border-[#0f53b7]"
                        onChange={(objEvent) => setStrInstructions(objEvent.target.value)}
                        value={strInstructions}
                    />
                </label>
            </div>
        </ModalShell>
    ); // end return
} /* end ScheduleSiteVisitModal */
