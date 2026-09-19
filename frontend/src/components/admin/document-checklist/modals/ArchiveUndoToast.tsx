/**
 * System: DPRMS
 * Purpose: Render archive undo toast for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { X } from 'lucide-react';
import React from 'react';

interface ArchiveUndoToastProps
{
    objArchiveToast: { id?: number; name: string; templateId?: number; } | null;
    handleRestoreTemplateItem: (intTemplateId: number, strName: string) => void;
    objArchiveToastTimerRef: React.MutableRefObject<any>;
    setArchiveToast: (objValue: { id: number; name: string; templateId?: number; } | null) => void;
}

/** Render archive undo toast and its available actions. */
export function ArchiveUndoToast({
    objArchiveToast,
    handleRestoreTemplateItem,
    objArchiveToastTimerRef,
    setArchiveToast,
}: ArchiveUndoToastProps)
{
    if (!objArchiveToast)
    {
        return null;
    }

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 rounded-2xl bg-[#333333] p-4 text-white shadow-2xl backdrop-blur-md border border-slate-700/80 animate-in slide-in-from-bottom-5 fade-in duration-200 min-w-[340px] max-w-md w-[92vw]">
            <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
            <div className="flex items-center justify-between gap-4 min-w-0">
                <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs font-bold text-white truncate leading-snug">
                        "{objArchiveToast.name}"
                    </p>
                    <p className="text-xs text-slate-300 font-medium">
                        is now <span className="font-bold text-slate-200">inactive</span>.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() =>
                        {
                            if (objArchiveToast.templateId)
                            {
                                handleRestoreTemplateItem(
                                    objArchiveToast.templateId,
                                    objArchiveToast.name,
                                );
                            }
                            if (objArchiveToastTimerRef.current)
                            {
                                clearTimeout(objArchiveToastTimerRef.current);
                            }
                            setArchiveToast(null);
                        }}
                        className="rounded-xl bg-[#4a4a4a] hover:bg-[#5a5a5a] px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-200 transition cursor-pointer border border-slate-600/50 shadow-2xs"
                    >
                        UNDO
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                        {
                            if (objArchiveToastTimerRef.current)
                            {
                                clearTimeout(objArchiveToastTimerRef.current);
                            }
                            setArchiveToast(null);
                        }}
                        className="flex size-7 items-center justify-center rounded-xl text-slate-400 hover:bg-[#444444] hover:text-white transition cursor-pointer"
                        title="Dismiss"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            </div>

            <div className="h-0.5 w-full bg-slate-700/80 rounded-full overflow-hidden">
                <div
                    className="h-full bg-slate-200"
                    style={{ animation: 'toastProgress 5s linear forwards' }}
                />
            </div>
        </div>
    ); // end return
} /* end ArchiveUndoToast */
