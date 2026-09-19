/**
 * System: DPRMS
 * Purpose: Render project combobox for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import type { EquipmentProjectOption } from '../../../services/equipment_store';

const MAX_VISIBLE_RESULTS = 50;

/** Searchable text. */
function _searchableText(objProject: EquipmentProjectOption): string
{
    return [
        objProject.reference_number,
        objProject.title,
        objProject.cooperator,
        objProject.location,
    ]
        .join(' ')
        .toLocaleLowerCase();
}

/** Render project combobox and its available actions. */
export function ProjectCombobox({
    onChange,
    placeholder: strPlaceholder,
    arrProjects,
    value: strValue,
}: {
    onChange: (strProjectId: string) => void;
    placeholder: string;
    arrProjects: EquipmentProjectOption[];
    value: string;
})
{
    const objRootRef = useRef<HTMLDivElement>(null);
    const objInputRef = useRef<HTMLInputElement>(null);
    const [blnOpen, setBlnOpen] = useState(false);
    const [strQuery, setStrQuery] = useState('');
    const [intActiveIndex, setIntActiveIndex] = useState(0);
    const objSelected = arrProjects.find((objProject) => String(objProject.id) === strValue);
    const arrMatches = useMemo(() =>
    {
        const arrTerms = strQuery.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
        return arrTerms.length === 0
            ? arrProjects
            : arrProjects.filter((objProject) =>
                arrTerms.every((strTerm) => _searchableText(objProject).includes(strTerm)),
            );
    }, [arrProjects, strQuery]);
    const arrVisibleMatches = arrMatches.slice(0, MAX_VISIBLE_RESULTS);
    const strListboxId = 'active-project-options';

    useEffect(() =>
    {
        /** Close when clicking outside. */
        function _closeWhenClickingOutside(objEvent: MouseEvent)
        {
            if (!objRootRef.current?.contains(objEvent.target as Node))
            {
                setBlnOpen(false);
            }
        }
        document.addEventListener('mousedown', _closeWhenClickingOutside);
        return () => document.removeEventListener('mousedown', _closeWhenClickingOutside);
    }, []);

    /** Show options. */
    function _showOptions()
    {
        setBlnOpen(true);
        setIntActiveIndex(
            Math.max(
                0,
                arrVisibleMatches.findIndex((objProject) => String(objProject.id) === strValue),
            ),
        );
        window.requestAnimationFrame(() => objInputRef.current?.focus());
    }

    /** Choose. */
    function _choose(objProject: EquipmentProjectOption)
    {
        onChange(String(objProject.id));
        setStrQuery('');
        setBlnOpen(false);
    }

    /** Handle key down. */
    function _handleKeyDown(objEvent: KeyboardEvent<HTMLInputElement>)
    {
        if (objEvent.key === 'Escape')
        {
            objEvent.preventDefault();
            objEvent.stopPropagation();
            setBlnOpen(false);
        } else if (objEvent.key === 'ArrowDown' || objEvent.key === 'ArrowUp')
        {
            objEvent.preventDefault();
            if (!blnOpen)
            {
                setBlnOpen(true);
            }
            const intDirection = objEvent.key === 'ArrowDown' ? 1 : -1;
            setIntActiveIndex((intCurrent) =>
                Math.max(0, Math.min(arrVisibleMatches.length - 1, intCurrent + intDirection)),
            );
        } else if (objEvent.key === 'Enter' && blnOpen && arrVisibleMatches[intActiveIndex])
        {
            objEvent.preventDefault();
            _choose(arrVisibleMatches[intActiveIndex]);
        }
    }

    return (
        <div className="relative mt-1.5" ref={objRootRef}>
            {blnOpen ? (
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                        aria-label="Search active projects"
                        aria-activedescendant={
                            arrVisibleMatches[intActiveIndex]
                                ? `project-option-${arrVisibleMatches[intActiveIndex].id}`
                                : undefined
                        }
                        aria-autocomplete="list"
                        aria-controls={strListboxId}
                        aria-expanded="true"
                        autoComplete="off"
                        className="h-11 w-full rounded-xl border border-[#0f53b7] bg-white pl-10 pr-10 text-sm outline-none ring-4 ring-blue-100 placeholder:text-slate-400"
                        onChange={(objEvent) =>
                        {
                            setStrQuery(objEvent.target.value);
                            setIntActiveIndex(0);
                        }}
                        onKeyDown={_handleKeyDown}
                        placeholder="Search reference, title, cooperator, or location"
                        ref={objInputRef}
                        role="combobox"
                        value={strQuery}
                    />
                    <button
                        aria-label="Close project search"
                        className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        onClick={() => setBlnOpen(false)}
                        type="button"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            ) : (
                <button
                    aria-expanded="false"
                    aria-haspopup="listbox"
                    aria-label={
                        objSelected
                            ? `Active project: ${objSelected.reference_number} — ${objSelected.title}`
                            : strPlaceholder
                    }
                    aria-required="true"
                    className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm outline-none transition hover:border-blue-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                    onClick={_showOptions}
                    type="button"
                >
                    <span className={objSelected ? 'min-w-0 text-slate-800' : 'text-slate-400'}>
                        {objSelected ? (
                            <>
                                <span className="font-bold text-[#073b82]">
                                    {objSelected.reference_number}
                                </span>
                                <span className="mx-1.5 text-slate-300">—</span>
                                {objSelected.title}
                            </>
                        ) : (
                            strPlaceholder
                        )}
                    </span>
                    <ChevronsUpDown className="size-4 shrink-0 text-slate-400" />
                </button>
            )}

            {blnOpen ? (
                <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                        <span>
                            {arrMatches.length.toLocaleString()}{' '}
                            {arrMatches.length === 1 ? 'project' : 'projects'} found
                        </span>
                        {strQuery ? (
                            <button
                                className="font-bold text-[#0f53b7] hover:underline"
                                onClick={() =>
                                {
                                    setStrQuery('');
                                    setIntActiveIndex(0);
                                    objInputRef.current?.focus();
                                }}
                                type="button"
                            >
                                Clear search
                            </button>
                        ) : null}
                    </div>
                    <ul className="max-h-64 overflow-y-auto p-1.5" id={strListboxId} role="listbox">
                        {arrVisibleMatches.map((objProject, intIndex) =>
                        {
                            const blnIsSelected = String(objProject.id) === strValue;
                            return (
                                <li
                                    aria-selected={blnIsSelected}
                                    className={`flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 ${intIndex === intActiveIndex ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                                    id={`project-option-${objProject.id}`}
                                    key={objProject.id}
                                    onMouseDown={(objEvent) =>
                                    {
                                        objEvent.preventDefault();
                                        _choose(objProject);
                                    }}
                                    onMouseEnter={() => setIntActiveIndex(intIndex)}
                                    role="option"
                                    title={`${objProject.reference_number} — ${objProject.title}`}
                                >
                                    <Check
                                        className={`size-3.5 shrink-0 ${blnIsSelected ? 'text-[#0f53b7]' : 'text-transparent'}`}
                                    />
                                    <span className="min-w-0 truncate text-sm text-slate-800">
                                        <span className="font-bold text-[#073b82]">
                                            {objProject.reference_number}
                                        </span>
                                        <span className="mx-1.5 text-slate-300">—</span>
                                        {objProject.title}
                                    </span>
                                </li>
                            );
                        })}
                        {arrMatches.length === 0 ? (
                            <li
                                aria-disabled="true"
                                className="px-4 py-8 text-center"
                                role="option"
                            >
                                <p className="text-sm font-bold text-slate-700">
                                    No matching projects
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Try a reference number, a shorter title, cooperator, or
                                    location.
                                </p>
                            </li>
                        ) : null}
                    </ul>
                    {arrMatches.length > MAX_VISIBLE_RESULTS ? (
                        <p className="border-t border-slate-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            Showing the first {MAX_VISIBLE_RESULTS} matches. Add another search word
                            to narrow the list.
                        </p>
                    ) : null}
                </div>
            ) : null}

            {objSelected ? (
                <button
                    className="mt-1.5 text-xs font-bold text-[#0f53b7] hover:underline"
                    onClick={() =>
                    {
                        onChange('');
                        setStrQuery('');
                        _showOptions();
                    }}
                    type="button"
                >
                    Change project
                </button>
            ) : null}
        </div>
    ); // end return
} /* end ProjectCombobox */
