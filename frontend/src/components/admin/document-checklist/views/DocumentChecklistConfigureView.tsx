/**
 * System: DPRMS
 * Purpose: Render document checklist configure view for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    Archive,
    FileText,
    GripVertical,
    MoreVertical,
    Pencil,
    Plus,
    RotateCcw,
    SlidersHorizontal,
    Trash2,
} from 'lucide-react';
import type { DocumentChecklistItem } from '../../../../services/document_checklist_store';
import { cn } from '../../../../utils/cn';

interface DocumentChecklistConfigureViewProps
{
    strTemplateSubTab: 'active' | 'archived';
    setTemplateSubTab: (strTab: 'active' | 'archived') => void;
    strActiveProgram: string;
    arrArchivedTemplates: any[];
    handleRestoreTemplateItem: (intId: number, strName: string) => void;
    handleOpenAddTemplateModal: () => void;
    arrFilteredItems: DocumentChecklistItem[];
    intDraggedIndex: number | null;
    setDraggedIndex: (intIndex: number | null) => void;
    intDragOverIndex: number | null;
    setDragOverIndex: (intIndex: number | null) => void;
    handleReorderTemplateItems: (intFromIdx: number, intToIdx: number) => void;
    handleToggleTemplateMandatory: (objItem: DocumentChecklistItem) => void;
    objRowMenuOpenId: string | number | null;
    setRowMenuOpenId: (objId: string | number | null) => void;
    handleOpenEditTemplateModal: (objItem: DocumentChecklistItem) => void;
    handleDeactivateTemplateItem: (objItem: DocumentChecklistItem) => void;
    handleDeleteTemplateItem: (objItem: DocumentChecklistItem) => void;
}

/** Render document checklist configure view and its available actions. */
export function DocumentChecklistConfigureView({
    strTemplateSubTab,
    setTemplateSubTab,
    strActiveProgram,
    arrArchivedTemplates,
    handleRestoreTemplateItem,
    handleOpenAddTemplateModal,
    arrFilteredItems,
    intDraggedIndex,
    setDraggedIndex,
    intDragOverIndex,
    setDragOverIndex,
    handleReorderTemplateItems,
    handleToggleTemplateMandatory,
    objRowMenuOpenId,
    setRowMenuOpenId,
    handleOpenEditTemplateModal,
    handleDeactivateTemplateItem,
    handleDeleteTemplateItem,
}: DocumentChecklistConfigureViewProps)
{
    if (strTemplateSubTab === 'archived')
    {
        return (
            <div className="overflow-hidden rounded-3xl border border-amber-300 bg-white p-6 shadow-sm space-y-4 animate-in fade-in duration-150 font-sans">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-amber-100 pb-4">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <span className="flex size-7 items-center justify-center rounded-xl bg-[#0f53b7] text-white shadow-2xs">
                                <Archive className="size-3.5" />
                            </span>
                            <span>Archived Requirements</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Deactivated requirement items are safely stored in Archive. Click{' '}
                            <b>Revert & Restore</b> to reactivate them into the active checklist.
                        </p>
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                        <div className="inline-flex items-center rounded-xl bg-slate-100/90 p-1 border border-slate-200/80 shadow-2xs">
                            <button
                                type="button"
                                onClick={() => setTemplateSubTab('active')}
                                className="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer select-none text-slate-500 hover:text-slate-900"
                            >
                                Active
                            </button>
                            <button
                                type="button"
                                onClick={() => setTemplateSubTab('archived')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer select-none bg-[#0f53b7] text-white shadow-xs"
                            >
                                <Archive className="size-3.5" />
                                <span>Archive</span>
                            </button>
                        </div>
                    </div>
                </div>

                {arrArchivedTemplates.length === 0 ? (
                    <div className="py-12 text-center text-xs font-medium text-slate-400">
                        No archived or deactivated requirement items found for {strActiveProgram}.
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {arrArchivedTemplates.map((objT: any) => (
                            <div
                                key={objT.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:bg-white hover:border-amber-300 hover:shadow-xs"
                            >
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="rounded-md bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-900">
                                            {objT.phase_code || objT.item_code}
                                        </span>
                                        <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                            {objT.group_name || 'General'}
                                        </span>
                                        {objT.is_mandatory && (
                                            <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200/60">
                                                Mandatory
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-950 leading-snug">
                                        {objT.document_name}
                                    </h4>
                                    <p className="text-xs text-slate-500 font-medium">
                                        {objT.phase_title}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleRestoreTemplateItem(objT.id, objT.document_name)
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition shadow-2xs cursor-pointer shrink-0"
                                    title="Revert and reactivate this requirement template item"
                                >
                                    <RotateCcw className="size-3.5" />
                                    <span>Revert & Restore</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ); // end return
    } /* end if */

    return (
        <div className="space-y-3 font-sans animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border-2 border-[#0f53b7] bg-white p-4 shadow-xs">
                <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <SlidersHorizontal className="size-4.5 text-[#0f53b7]" />
                        <span>Configure Requirements ({strActiveProgram})</span>
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                        Toggle mandatory status, edit template descriptions, or deactivate
                        requirements.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                    <div className="inline-flex items-center rounded-xl bg-slate-100/90 p-1 border border-slate-200/80 shadow-2xs">
                        <button
                            type="button"
                            onClick={() => setTemplateSubTab('active')}
                            className="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer select-none bg-white text-slate-950 shadow-xs"
                        >
                            Active
                        </button>
                        <button
                            type="button"
                            onClick={() => setTemplateSubTab('archived')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer select-none text-slate-500 hover:text-slate-900"
                        >
                            <Archive className="size-3.5" />
                            <span>Archive</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleOpenAddTemplateModal}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#0f53b7] px-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#0b3f8b] cursor-pointer"
                    >
                        <Plus className="size-4 stroke-[2.5]" />
                        <span>Add</span>
                    </button>
                </div>
            </div>

            {arrFilteredItems.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center">
                    <FileText className="size-8 text-slate-300" />
                    <p className="mt-3 text-sm font-bold text-slate-800">No requirements found</p>
                    <p className="text-xs text-slate-500">
                        Try selecting a different category or add a new requirement.
                    </p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {arrFilteredItems.map(
                        (objItem, intIndex) =>
                        {
                            const blnIsDropTarget =
                                intDragOverIndex === intIndex && intDraggedIndex !== intIndex;
                            return (
                                <div
                                    key={objItem.id}
                                    className="flex items-center gap-2.5 sm:gap-3"
                                >
                                    <span className="shrink-0 text-xs sm:text-sm font-bold font-mono text-slate-400 select-none min-w-[24px] text-right">
                                        {String(intIndex + 1).padStart(2, '0')}.
                                    </span>

                                    <div
                                        draggable
                                        onDragStart={(objEvent) =>
                                        {
                                            setDraggedIndex(intIndex);
                                            objEvent.dataTransfer.effectAllowed = 'move';
                                        }}
                                        onDragOver={(objEvent) =>
                                        {
                                            objEvent.preventDefault();
                                            objEvent.dataTransfer.dropEffect = 'move';
                                            setDragOverIndex(intIndex);
                                        }}
                                        onDragEnd={() =>
                                        {
                                            setDraggedIndex(null);
                                            setDragOverIndex(null);
                                        }}
                                        onDrop={(objEvent) =>
                                        {
                                            objEvent.preventDefault();
                                            if (
                                                intDraggedIndex !== null &&
                                                intDraggedIndex !== intIndex
                                            )
                                            {
                                                handleReorderTemplateItems(
                                                    intDraggedIndex,
                                                    intIndex,
                                                );
                                            }
                                            setDraggedIndex(null);
                                            setDragOverIndex(null);
                                        }}
                                        className={cn(
                                            'flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition duration-150 cursor-grab active:cursor-grabbing select-none',
                                            intDraggedIndex === intIndex &&
                                            'opacity-50 border-2 border-dashed border-[#0f53b7] bg-blue-50/40 shadow-md scale-[0.995]',
                                            blnIsDropTarget &&
                                            'border-2 border-[#0f53b7] bg-blue-50/20 ring-2 ring-blue-100',
                                        )}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div
                                                className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-[#0f53b7] transition p-1 rounded-xl hover:bg-slate-100 shrink-0 select-none"
                                                title="Drag to reorder requirement position"
                                            >
                                                <GripVertical className="size-5" />
                                            </div>

                                            <div className="min-w-0 flex-1 space-y-0.5">
                                                <h4 className="text-sm font-bold text-slate-900 leading-snug truncate">
                                                    {objItem.name}
                                                </h4>
                                                <p className="text-xs font-medium text-slate-400 truncate">
                                                    {objItem.isRequired ? 'Required' : 'Optional'} ·
                                                    PDF or JPG · Max 10MB
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-xs font-semibold text-slate-500 select-none">
                                                    Required
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggleTemplateMandatory(objItem)
                                                    }
                                                    className={cn(
                                                        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                                                        objItem.isRequired
                                                            ? 'bg-blue-600'
                                                            : 'bg-slate-200',
                                                    )}
                                                    title={
                                                        objItem.isRequired
                                                            ? 'Click to set as optional'
                                                            : 'Click to set as required'
                                                    }
                                                >
                                                    <span
                                                        className={cn(
                                                            'pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                                                            objItem.isRequired
                                                                ? 'translate-x-5'
                                                                : 'translate-x-0',
                                                        )}
                                                    />
                                                </button>
                                            </div>

                                            <div className="relative flex items-center pl-3 border-l border-slate-200">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setRowMenuOpenId(
                                                            objRowMenuOpenId === objItem.id
                                                                ? null
                                                                : objItem.id,
                                                        )
                                                    }
                                                    className="flex size-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer select-none"
                                                    title="More options"
                                                >
                                                    <MoreVertical className="size-4.5" />
                                                </button>

                                                {objRowMenuOpenId === objItem.id && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-20"
                                                            onClick={() => setRowMenuOpenId(null)}
                                                        />
                                                        <div className="absolute right-0 top-full mt-1.5 z-30 w-44 rounded-2xl bg-white p-1.5 shadow-xl border border-slate-200/80 animate-in fade-in zoom-in-95 duration-100 font-sans text-xs font-semibold text-slate-700">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                {
                                                                    setRowMenuOpenId(null);
                                                                    handleOpenEditTemplateModal(
                                                                        objItem,
                                                                    );
                                                                }}
                                                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer select-none"
                                                            >
                                                                <Pencil className="size-4 text-slate-500" />
                                                                <span>Edit</span>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                {
                                                                    setRowMenuOpenId(null);
                                                                    handleDeactivateTemplateItem(
                                                                        objItem,
                                                                    );
                                                                }}
                                                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer select-none"
                                                            >
                                                                <Archive className="size-4 text-slate-500" />
                                                                <span>Archive</span>
                                                            </button>

                                                            <div className="my-1 border-t border-slate-100" />

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                {
                                                                    setRowMenuOpenId(null);
                                                                    handleDeleteTemplateItem(
                                                                        objItem,
                                                                    );
                                                                }}
                                                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-rose-50 text-rose-600 transition cursor-pointer select-none"
                                                            >
                                                                <Trash2 className="size-4 text-rose-500" />
                                                                <span>Delete</span>
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ); // end return
                        } /* end DocumentChecklistConfigureView */,
                    )}
                </div>
            )}
        </div>
    ); // end return
} /* end DocumentChecklistConfigureView */
