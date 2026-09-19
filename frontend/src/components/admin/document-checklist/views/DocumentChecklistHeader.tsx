/**
 * System: DPRMS
 * Purpose: Render document checklist header for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    ArrowLeft,
    Check,
    FileSpreadsheet,
    LoaderCircle,
    Lock,
    RefreshCw,
    SlidersHorizontal,
} from 'lucide-react';

import { cn } from '../../../../utils/cn';

interface DocumentChecklistHeaderProps
{
    strActiveProgram: string;
    strAutoSaveStatus: 'idle' | 'saving' | 'saved';
    exportSummaryCsv: () => void;
    blnIsAdmin: boolean;
    blnIsFocal: boolean;
    blnIsLoading: boolean;
    blnIsReadOnly: boolean;
    blnIsReviewMode: boolean;
    blnIsTemplateEditMode: boolean;
    strLastSavedTime: string | null;
    loadData: () => void;
    onBackToProjects: () => void;
    setIsTemplateEditMode: (blnValue: boolean) => void;
    setTemplateSubTab: (strValue: 'active' | 'archived') => void;
}

/** Render document checklist header and its available actions. */
export function DocumentChecklistHeader({
    strActiveProgram,
    strAutoSaveStatus,
    exportSummaryCsv,
    blnIsAdmin,
    blnIsFocal,
    blnIsLoading,
    blnIsReadOnly,
    blnIsReviewMode,
    blnIsTemplateEditMode,
    strLastSavedTime,
    loadData,
    onBackToProjects,
    setIsTemplateEditMode,
    setTemplateSubTab,
}: DocumentChecklistHeaderProps)
{
    return (
        <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
                <span className="h-10 w-1.5 shrink-0 rounded-full bg-[#0f53b7]" />
                <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium leading-none text-slate-400">
                        {blnIsReviewMode ? (
                            <button
                                type="button"
                                onClick={onBackToProjects}
                                className="inline-flex shrink-0 items-center gap-1 text-[#285497] transition hover:text-[#073b82]"
                            >
                                <ArrowLeft className="size-3" />
                                Projects
                            </button>
                        ) : (
                            <span>Document Checklist</span>
                        )}
                        <span aria-hidden="true">/</span>
                        <span className="truncate font-semibold text-[#285497]">
                            {strActiveProgram}
                        </span>
                        {blnIsReadOnly ? (
                            <>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex shrink-0 items-center gap-1 font-medium text-slate-500">
                                    <Lock className="size-2.5" />
                                    Read only
                                </span>
                            </>
                        ) : null}
                    </div>
                    <h1 className="mt-1 truncate text-2xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-3xl">
                        {blnIsReviewMode ? 'Document Review' : 'Document Checklist'}
                    </h1>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {blnIsReviewMode && !blnIsReadOnly ? (
                    <div className="mr-1 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        {strAutoSaveStatus === 'saving' ? (
                            <>
                                <LoaderCircle className="size-3.5 animate-spin text-[#0f53b7]" />
                                <span className="font-semibold text-[#0f53b7]">Saving…</span>
                            </>
                        ) : (
                            <>
                                <Check className="size-3.5 text-emerald-600" />
                                <span>
                                    {strAutoSaveStatus === 'saved' && strLastSavedTime
                                        ? `Saved at ${strLastSavedTime}`
                                        : 'Saved'}
                                </span>
                            </>
                        )}
                    </div>
                ) : null}

                {blnIsReviewMode && (blnIsAdmin || blnIsFocal) ? (
                    blnIsTemplateEditMode ? (
                        <button
                            type="button"
                            onClick={() =>
                            {
                                setIsTemplateEditMode(false);
                                setTemplateSubTab('active');
                            }}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-400 bg-amber-500 px-4 text-xs font-semibold text-slate-950 transition hover:bg-amber-400"
                            title="Finish requirement configuration"
                        >
                            <Check className="size-3.5" />
                            Done
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setIsTemplateEditMode(true)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                        >
                            <SlidersHorizontal className="size-3.5 text-slate-500" />
                            Configure
                        </button>
                    )
                ) : null}

                {!blnIsTemplateEditMode ? (
                    <>
                        {!blnIsReviewMode ? (
                            <button
                                type="button"
                                onClick={exportSummaryCsv}
                                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                            >
                                <FileSpreadsheet className="size-3.5 text-emerald-600" />
                                <span className="hidden sm:inline">Export</span>
                            </button>
                        ) : null}

                        <button
                            type="button"
                            onClick={loadData}
                            disabled={blnIsLoading}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            <RefreshCw
                                className={cn(
                                    'size-3.5 text-slate-500',
                                    blnIsLoading && 'animate-spin',
                                )}
                            />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </>
                ) : null}
            </div>
        </header>
    ); // end return
} /* end DocumentChecklistHeader */
