import { ChevronRight, FolderOpen, Search, X } from 'lucide-react';
import type { ProposalChecklistRecord } from '../../../../services/documentChecklistStore';
import { cn } from '../../../../utils/cn';

interface ProjectSelectorModalProps {
  isProjectSelectorOpen: boolean;
  setIsProjectSelectorOpen: (open: boolean) => void;
  activeProgram: string;
  modalSearchQuery: string;
  setModalSearchQuery: (query: string) => void;
  modalFilter: 'ALL' | 'COMPLETE' | 'INCOMPLETE';
  setModalFilter: (filter: 'ALL' | 'COMPLETE' | 'INCOMPLETE') => void;
  filteredModalProposals: ProposalChecklistRecord[];
  activeProposal: ProposalChecklistRecord | null;
  handleSelectProposal: (proposal: ProposalChecklistRecord) => void;
}

export function ProjectSelectorModal({
  isProjectSelectorOpen,
  setIsProjectSelectorOpen,
  activeProgram,
  modalSearchQuery,
  setModalSearchQuery,
  modalFilter,
  setModalFilter,
  filteredModalProposals,
  activeProposal,
  handleSelectProposal,
}: ProjectSelectorModalProps) {
  if (!isProjectSelectorOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#B5BFCD]/60 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#B5BFCD]/50 bg-[#f7fbff] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E6EEF4] text-[#285497]">
              <FolderOpen className="size-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-950">Select Project Proposal</h3>
              <p className="text-xs text-slate-500">Choose a {activeProgram} project to inspect its document checklist</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsProjectSelectorOpen(false)}
            className="flex size-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="border-b border-[#B5BFCD]/40 bg-white p-4 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={modalSearchQuery}
              onChange={(e) => setModalSearchQuery(e.target.value)}
              placeholder="Search enterprise name, reference number, proponent, or location..."
              className="h-10 w-full rounded-xl border border-[#B5BFCD] bg-white pl-10 pr-4 text-xs sm:text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Status:</span>
            {(['ALL', 'COMPLETE', 'INCOMPLETE'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setModalFilter(filter)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer',
                  modalFilter === filter
                    ? 'bg-[#0f53b7] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {filter === 'ALL' ? 'All' : filter === 'COMPLETE' ? 'Complied' : 'Pending'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100">
          {filteredModalProposals.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center p-6 text-center text-slate-400">
              <Search className="size-6 text-slate-300" />
              <p className="mt-2 text-xs font-bold text-slate-700">No matching proposals found</p>
              <p className="text-[11px] text-slate-500">Try searching for a different keyword or change filter.</p>
            </div>
          ) : (
            filteredModalProposals.map((proposal) => {
              const isComplete = proposal.compliancePercentage >= 100;
              const isSelected = activeProposal?.proposalId === proposal.proposalId;

              return (
                <button
                  key={proposal.proposalId}
                  type="button"
                  onClick={() => handleSelectProposal(proposal)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-2xl border p-3.5 text-left transition cursor-pointer',
                    isSelected
                      ? 'border-[#0f53b7] bg-blue-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-[#0f53b7]/60 hover:bg-slate-50'
                  )}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-xs sm:text-sm font-bold text-slate-950" title={proposal.enterpriseName}>
                        {proposal.enterpriseName}
                      </h4>
                      <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.2 text-[10px] font-bold">
                        Approved
                      </span>
                      {isSelected && (
                        <span className="rounded-full bg-[#0f53b7] px-2 py-0.2 text-[10px] font-bold text-white">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-500">
                      <span className="font-mono font-semibold text-[#285497]">{proposal.referenceNumber}</span>
                      <span>•</span>
                      <span>{proposal.proponentName}</span>
                      {proposal.district && (
                        <>
                          <span>•</span>
                          <span>{proposal.district}</span>
                        </>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            isComplete ? 'bg-emerald-600' : 'bg-[#0f53b7]'
                          )}
                          style={{ width: `${Math.min(100, proposal.compliancePercentage)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 shrink-0">
                        {proposal.compliedCount}/{proposal.totalRequired} ({proposal.compliancePercentage}%)
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="size-4 text-slate-400 shrink-0" />
                </button>
              );
            })
          )}
        </div>

        <div className="border-t border-[#B5BFCD]/40 bg-[#f7fbff] px-6 py-3 text-right">
          <button
            type="button"
            onClick={() => setIsProjectSelectorOpen(false)}
            className="rounded-xl border border-[#B5BFCD] bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
