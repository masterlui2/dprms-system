import React from 'react';
import { Filter, Grid2X2, List, Search } from 'lucide-react';
import { cn } from '../../../../utils/cn';

interface DocumentChecklistFilterBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  viewMode: 'list' | 'grid';
  setViewMode: (val: 'list' | 'grid') => void;
  statusTab: 'ALL' | 'VERIFIED' | 'UNDER_REVIEW' | 'RETURNED' | 'PENDING' | 'UPLOADED';
  setStatusTab: (val: 'ALL' | 'VERIFIED' | 'UNDER_REVIEW' | 'RETURNED' | 'PENDING' | 'UPLOADED') => void;
  isFilterDropdownOpen: boolean;
  setIsFilterDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  stats: {
    total: number;
    verified: number;
    underReview: number;
    returned: number;
    pending: number;
  };
}

export function DocumentChecklistFilterBar({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  statusTab,
  setStatusTab,
  isFilterDropdownOpen,
  setIsFilterDropdownOpen,
  stats,
}: DocumentChecklistFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-3xl border border-[#B5BFCD]/70 bg-white p-3 sm:px-4 shadow-sm">
      <div className="relative flex-1 min-w-0 sm:max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search requirement name or file..."
          className="h-10 w-full rounded-2xl border border-[#B5BFCD] bg-slate-50/50 pl-10 pr-4 text-xs sm:text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:bg-white focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center rounded-2xl border border-[#B5BFCD]/60 bg-slate-100/80 p-1">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={cn(
              'flex size-8 items-center justify-center rounded-xl text-slate-500 transition cursor-pointer',
              viewMode === 'list'
                ? 'bg-white text-[#0f53b7] shadow-xs font-bold'
                : 'hover:text-slate-900'
            )}
            title="List View (Default)"
          >
            <List className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={cn(
              'flex size-8 items-center justify-center rounded-xl text-slate-500 transition cursor-pointer',
              viewMode === 'grid'
                ? 'bg-white text-[#0f53b7] shadow-xs font-bold'
                : 'hover:text-slate-900'
            )}
            title="Grid View (5 Columns)"
          >
            <Grid2X2 className="size-4" />
          </button>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-2xl border px-4 text-xs font-bold transition shadow-xs cursor-pointer',
              statusTab !== 'ALL' || isFilterDropdownOpen
                ? 'border-[#0f53b7] bg-blue-50 text-[#0f53b7]'
                : 'border-[#B5BFCD] bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
            )}
          >
            <Filter className="size-3.5" />
            <span>
              {statusTab === 'ALL'
                ? 'Filter'
                : statusTab === 'VERIFIED'
                ? 'Verified'
                : statusTab === 'UNDER_REVIEW'
                ? 'In Review'
                : statusTab === 'RETURNED'
                ? 'Revision'
                : 'Missing File'}
            </span>
          </button>

          {isFilterDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsFilterDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 z-30 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100 font-sans">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Filter by Status
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStatusTab('ALL');
                    setIsFilterDropdownOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer',
                    statusTab === 'ALL'
                      ? 'bg-blue-50 text-[#0f53b7]'
                      : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <span>All Requirements</span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {stats.total}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusTab('VERIFIED');
                    setIsFilterDropdownOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer',
                    statusTab === 'VERIFIED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span>Verified</span>
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {stats.verified}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusTab('UNDER_REVIEW');
                    setIsFilterDropdownOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer',
                    statusTab === 'UNDER_REVIEW'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-blue-500" />
                    <span>In Review</span>
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {stats.underReview}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusTab('RETURNED');
                    setIsFilterDropdownOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer',
                    statusTab === 'RETURNED'
                      ? 'bg-rose-50 text-rose-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-rose-500" />
                    <span>Revision</span>
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {stats.returned}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusTab('PENDING');
                    setIsFilterDropdownOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer',
                    statusTab === 'PENDING'
                      ? 'bg-slate-100 text-slate-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-slate-400" />
                    <span>Missing File</span>
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {stats.pending}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
