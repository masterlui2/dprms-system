/**
 * System: DPRMS
 * Purpose: Render document checklist remarks for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { Check, LoaderCircle } from 'lucide-react';
import { cn } from '../../../../utils/cn';

interface DocumentChecklistRemarksProps
{
    blnIsStaff: boolean;
    blnCanReview: boolean;
    strAutoSaveStatus: 'idle' | 'saving' | 'saved';
    strLastSavedTime: string | null;
    txtEditingOverallRemarks: string;
    setEditingOverallRemarks: (strValue: string) => void;
    blnCanMarkComplete: boolean;
    objStats: {
        percent: number;
        verified: number;
        required: number;
    };
    handleMarkReviewCompleted: () => void;
    blnIsCompletingReview: boolean;
}

/** Render document checklist remarks and its available actions. */
export function DocumentChecklistRemarks({
    blnIsStaff,
    blnCanReview,
    strAutoSaveStatus,
    strLastSavedTime,
    txtEditingOverallRemarks,
    setEditingOverallRemarks,
    blnCanMarkComplete,
    objStats,
    handleMarkReviewCompleted,
    blnIsCompletingReview,
}: DocumentChecklistRemarksProps)
{
    if (blnIsStaff)
    {
        return null;
    }

    return (
        <div className="overflow-hidden rounded-3xl border border-[#B5BFCD]/70 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-700">
                    Overall Evaluation Remarks & Notes
                </label>
                {blnCanReview && (
                    <span className="text-[11px] font-medium text-slate-400">
                        {strAutoSaveStatus === 'saving'
                            ? 'Saving remarks...'
                            : strAutoSaveStatus === 'saved'
                                ? `Saved ${strLastSavedTime ? `at ${strLastSavedTime}` : ''}`
                                : 'Changes save automatically'}
                    </span>
                )}
            </div>
            {blnCanReview ? (
                <textarea
                    rows={2}
                    value={txtEditingOverallRemarks}
                    onChange={(objEvent) => setEditingOverallRemarks(objEvent.target.value)}
                    placeholder="Enter overall review notes or remarks for this project..."
                    className="w-full rounded-2xl border border-[#B5BFCD] bg-slate-50/70 p-3 text-xs text-slate-800 placeholder-slate-400 transition focus:border-[#0f53b7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 sm:text-sm"
                />
            ) : (
                <div className="w-full rounded-2xl border border-[#B5BFCD] bg-slate-50/70 p-3.5 text-xs text-slate-800">
                    {txtEditingOverallRemarks || (
                        <span className="text-slate-400 italic">No overall remarks recorded.</span>
                    )}
                </div>
            )}

            {blnCanMarkComplete && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span
                            className={cn(
                                'size-2 rounded-full',
                                objStats.percent === 100 ? 'bg-emerald-500' : 'bg-amber-500',
                            )}
                        />
                        <span className="font-semibold text-slate-700">
                            {objStats.verified} of {objStats.required} requirements verified
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleMarkReviewCompleted}
                        disabled={blnIsCompletingReview}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md disabled:opacity-50 cursor-pointer"
                    >
                        {blnIsCompletingReview ? (
                            <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                            <Check className="size-4 stroke-[2.5]" />
                        )}
                        <span>Mark Review as Completed</span>
                    </button>
                </div>
            )}
        </div>
    ); // end return
} /* end DocumentChecklistRemarks */
