import {
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
  isReadOnly: boolean;
  autoSaveStatus: 'idle' | 'saving' | 'saved';
  lastSavedTime: string | null;
  isAdmin: boolean;
  isFocal: boolean;
  isTemplateEditMode: boolean;
  setIsTemplateEditMode: (val: boolean) => void;
  setTemplateSubTab: (val: 'active' | 'archived') => void;
  exportSummaryCsv: () => void;
  loadData: () => void;
  isLoading: boolean;
}

export function DocumentChecklistHeader({
  activeProgram,
  isReadOnly,
  autoSaveStatus,
  lastSavedTime,
  isAdmin,
  isFocal,
  isTemplateEditMode,
  setIsTemplateEditMode,
  setTemplateSubTab,
  exportSummaryCsv,
  loadData,
  isLoading,
}: DocumentChecklistHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="h-9 sm:h-10 w-1.5 rounded-full bg-[#0f53b7]" />
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold leading-none text-slate-400">
            <span>Document Checklist</span>
            <span>&gt;</span>
            <span className="font-bold text-[#285497]">{activeProgram} Program</span>
            {isReadOnly && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1 font-bold text-slate-500">
                  <Lock className="size-2.5" />
                  Regional View
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="mt-1 text-2xl sm:text-3xl font-black leading-tight tracking-tight text-slate-900">
              Documents
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {!isReadOnly && (
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 mr-1">
            {autoSaveStatus === 'saving' ? (
              <>
                <LoaderCircle className="size-3.5 animate-spin text-[#0f53b7]" />
                <span className="text-[#0f53b7] font-semibold">Saving...</span>
              </>
            ) : (
              <>
                <Check className="size-3.5 text-emerald-600 stroke-[3]" />
                <span className="text-slate-600">
                  {autoSaveStatus === 'saved' && lastSavedTime
                    ? `Autosaved at ${lastSavedTime}`
                    : 'Autosaved Just now'}
                </span>
              </>
            )}
          </div>
        )}

        {(isAdmin || isFocal) && (
          isTemplateEditMode ? (
            <button
              type="button"
              onClick={() => {
                setIsTemplateEditMode(false);
                setTemplateSubTab('active');
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 text-xs font-black shadow-xs border border-amber-400 transition cursor-pointer"
              title="Finish requirement configuration"
            >
              <Check className="size-3.5 text-slate-950 stroke-[3]" />
              <span>Done</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsTemplateEditMode(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-950 cursor-pointer"
            >
              <SlidersHorizontal className="size-3.5 text-slate-500" />
              <span>Configure</span>
            </button>
          )
        )}

        {!isTemplateEditMode && (
          <>
            <button
              type="button"
              onClick={exportSummaryCsv}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
            >
              <FileSpreadsheet className="size-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
            >
              <RefreshCw className={cn('size-3.5 text-slate-500', isLoading && 'animate-spin')} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
