import React from 'react';
import {
  ChevronDown,
  History,
  Inbox,
  Search,
  User,
} from 'lucide-react';
import { ROLE_LABEL, type UserRole } from '../../../../config/permissions';
import type {
  ChecklistHistoryItem,
  DocumentChecklistItem,
  ProposalChecklistRecord,
} from '../../../../services/documentChecklistStore';
import { cn } from '../../../../utils/cn';
import type { ChecklistCategoryItem } from '../types';
import { formatRelativeDate } from '../utils';

interface DocumentChecklistSidebarProps {
  activeProposal: ProposalChecklistRecord;
  stats: {
    percent: number;
    verified: number;
    required: number;
    uploaded: number;
  };
  setIsProjectSelectorOpen: (open: boolean) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  editingItems: DocumentChecklistItem[];
  categories: ChecklistCategoryItem[];
  canViewHistory: boolean;
  isHistoryExpanded: boolean;
  setIsHistoryExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  historyList: ChecklistHistoryItem[];
}

export function DocumentChecklistSidebar({
  activeProposal,
  stats,
  setIsProjectSelectorOpen,
  selectedCategory,
  setSelectedCategory,
  editingItems,
  categories,
  canViewHistory,
  isHistoryExpanded,
  setIsHistoryExpanded,
  historyList,
}: DocumentChecklistSidebarProps) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-4">
      <div className="overflow-hidden rounded-2xl border border-[#B5BFCD]/80 bg-white p-4 shadow-sm space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Project
            </span>
            <h3
              className="mt-0.5 text-sm font-bold leading-snug text-slate-950 break-words"
              title={activeProposal.enterpriseName}
            >
              {activeProposal.enterpriseName}
            </h3>
            <p className="mt-1 font-mono text-xs font-semibold text-[#285497]">
              {activeProposal.referenceNumber}
            </p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold',
              stats.percent >= 100
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                : 'bg-amber-50 text-amber-700 border border-amber-200/80'
            )}
          >
            {stats.percent}%
          </span>
        </div>

        <div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                stats.percent >= 100 ? 'bg-emerald-600' : 'bg-[#0f53b7]'
              )}
              style={{ width: `${stats.percent}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{stats.verified} / {stats.required} Complied</span>
            <span>{stats.uploaded} Uploaded</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsProjectSelectorOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white py-2 px-3 text-xs font-bold text-slate-700 hover:bg-[#E6EEF4]/60 hover:text-[#0f53b7] hover:border-[#0f53b7]/30 transition shadow-2xs cursor-pointer"
        >
          <Search className="size-3.5 text-slate-400 shrink-0" />
          <span>Switch Project</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#B5BFCD]/80 bg-white p-3 shadow-sm space-y-1">
        <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Categories
        </div>

        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer',
            selectedCategory === 'ALL'
              ? 'bg-[#0f53b7] font-bold text-white shadow-xs'
              : 'font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950'
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Inbox className="size-4 shrink-0" />
            <span className="tracking-tight">All Requirements</span>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold',
              selectedCategory === 'ALL'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-600'
            )}
          >
            {editingItems.length}
          </span>
        </button>

        <div className="max-h-[320px] overflow-y-auto space-y-1 pr-1 overscroll-contain custom-scrollbar">
          {categories.map((cat) => {
            const catItems = editingItems.filter((i) => i.setId === cat.id || i.stageId === cat.id);
            const catComplied = catItems.filter((i) => i.isPresent).length;
            const catTotal = catItems.length;
            const isCatComplete = catTotal > 0 && catComplied >= catTotal;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'group flex w-full flex-col gap-0.5 rounded-xl px-3 py-2 text-left transition cursor-pointer',
                  isSelected
                    ? 'bg-[#0f53b7] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                )}
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider',
                      isSelected ? 'text-blue-100' : 'text-slate-400'
                    )}
                  >
                    {cat.stageOrSetTag}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold',
                      isSelected
                        ? 'bg-white/20 text-white'
                        : isCatComplete
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                        : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {catComplied}/{catTotal}
                  </span>
                </div>
                <p
                  className={cn(
                    'text-xs leading-snug tracking-tight',
                    isSelected ? 'font-bold text-white' : 'font-semibold text-slate-800'
                  )}
                  title={cat.name}
                >
                  {cat.shortName}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {canViewHistory && (
        <div className="overflow-hidden rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setIsHistoryExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between p-3.5 text-left transition hover:bg-slate-50 cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex size-6 items-center justify-center rounded-lg bg-[#0f53b7]/10 text-[#0f53b7] shrink-0">
                <History className="size-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-900 truncate">History</span>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#0f53b7] border border-blue-200/80 shrink-0">
                {historyList.length}
              </span>
            </div>
            <ChevronDown
              className={cn(
                'size-4 text-slate-400 transition-transform duration-200 shrink-0',
                isHistoryExpanded && 'rotate-180 text-slate-700'
              )}
            />
          </button>

          {isHistoryExpanded && (
            <div className="border-t border-slate-100 bg-slate-50/60 p-3 max-h-64 sm:max-h-72 overflow-y-auto overscroll-contain space-y-2.5 divide-y divide-slate-100/80 pr-1.5 custom-scrollbar">
              {historyList.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  No activity records yet for this project.
                </div>
              ) : (
                historyList.map((item) => {
                  const roleFormatted = ROLE_LABEL[item.userRole as UserRole] || item.userRole;
                  return (
                    <div key={item.id} className="pt-2.5 first:pt-0 space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={cn(
                            'rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase',
                            item.action === 'UPLOAD' || item.action === 'REPLACE'
                              ? 'bg-blue-100 text-[#0f53b7]'
                              : item.action === 'REMOVE'
                              ? 'bg-rose-100 text-rose-700'
                              : item.action === 'REVIEW_APPROVED' || item.action === 'VERIFY'
                              ? 'bg-emerald-100 text-emerald-700'
                              : item.action === 'REVIEW_RETURNED'
                              ? 'bg-rose-100 text-rose-800'
                              : item.action === 'REVIEW_UNDER_REVIEW'
                              ? 'bg-blue-100 text-blue-700'
                              : item.action === 'REVIEW_PENDING' || item.action === 'UNVERIFY'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-purple-100 text-purple-700'
                          )}
                        >
                          {item.action === 'UPLOAD'
                            ? 'Uploaded'
                            : item.action === 'REPLACE'
                            ? 'Replaced'
                            : item.action === 'REMOVE'
                            ? 'Removed'
                            : item.action === 'VERIFY' || item.action === 'REVIEW_APPROVED'
                            ? 'Verified'
                            : item.action === 'UNVERIFY' || item.action === 'REVIEW_PENDING'
                            ? 'Pending'
                            : item.action === 'REVIEW_UNDER_REVIEW'
                            ? 'In Review'
                            : item.action === 'REVIEW_RETURNED'
                            ? 'Revision'
                            : item.action === 'COMPLETE_REVIEW'
                            ? 'Completed'
                            : 'Updated'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatRelativeDate(item.timestamp)}
                        </span>
                      </div>

                      {item.itemName && (
                        <p className="font-bold text-slate-800 text-[11px] leading-tight line-clamp-2">
                          {item.itemName}
                        </p>
                      )}

                      {item.fileName && (
                        <p className="font-mono text-[10px] text-slate-500 truncate bg-white rounded px-1.5 py-0.5 border border-slate-200/60">
                          {item.fileName}
                        </p>
                      )}

                      {item.details && (
                        <p className="text-[10px] text-slate-500 leading-snug italic">
                          {item.details}
                        </p>
                      )}

                      <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5">
                        <User className="size-2.5 text-slate-400" />
                        <span className="font-semibold text-slate-700 truncate">{item.userName}</span>
                        <span>•</span>
                        <span className="truncate">{roleFormatted}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
