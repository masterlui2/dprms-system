import {
  ArrowLeft,
  Check,
  FileSpreadsheet,
  LoaderCircle,
  Lock,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

import { cn } from '../../../../utils/cn';

interface DocumentChecklistHeaderProps {
  activeProgram: string;
  autoSaveStatus: 'idle' | 'saving' | 'saved';
  exportSummaryCsv: () => void;
  isAdmin: boolean;
  isFocal: boolean;
  isLoading: boolean;
  isReadOnly: boolean;
  isReviewMode: boolean;
  isTemplateEditMode: boolean;
  lastSavedTime: string | null;
  loadData: () => void;
  onBackToProjects: () => void;
  setIsTemplateEditMode: (value: boolean) => void;
  setTemplateSubTab: (value: 'active' | 'archived') => void;
}

export function DocumentChecklistHeader({
  activeProgram,
  autoSaveStatus,
  exportSummaryCsv,
  isAdmin,
  isFocal,
  isLoading,
  isReadOnly,
  isReviewMode,
  isTemplateEditMode,
  lastSavedTime,
  loadData,
  onBackToProjects,
  setIsTemplateEditMode,
  setTemplateSubTab,
}: DocumentChecklistHeaderProps) {
  return (
    <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="h-10 w-1.5 shrink-0 rounded-full bg-[#0f53b7]" />
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium leading-none text-slate-400">
            {isReviewMode ? (
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
            <span className="truncate font-semibold text-[#285497]">{activeProgram}</span>
            {isReadOnly ? (
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
            {isReviewMode ? 'Document Review' : 'Document Checklist'}
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {isReviewMode && !isReadOnly ? (
          <div className="mr-1 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            {autoSaveStatus === 'saving' ? (
              <>
                <LoaderCircle className="size-3.5 animate-spin text-[#0f53b7]" />
                <span className="font-semibold text-[#0f53b7]">Saving…</span>
              </>
            ) : (
              <>
                <Check className="size-3.5 text-emerald-600" />
                <span>
                  {autoSaveStatus === 'saved' && lastSavedTime
                    ? `Saved at ${lastSavedTime}`
                    : 'Saved'}
                </span>
              </>
            )}
          </div>
        ) : null}

        {isReviewMode && (isAdmin || isFocal) ? (
          isTemplateEditMode ? (
            <button
              type="button"
              onClick={() => {
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

        {!isTemplateEditMode ? (
          <>
            {!isReviewMode ? (
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
              disabled={isLoading}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={cn('size-3.5 text-slate-500', isLoading && 'animate-spin')} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}
