import { ArrowRight, Eye, FileCheck2 } from 'lucide-react';

import { DataTable, type DataColumn } from '../../DataTable';
import type { ProposalChecklistRecord } from '../../../../services/documentChecklistStore';
import { cn } from '../../../../utils/cn';

interface DocumentChecklistProjectTableProps {
  canReview: boolean;
  isLoading: boolean;
  onSelectProject: (proposal: ProposalChecklistRecord) => void;
  proposals: ProposalChecklistRecord[];
}

type ReviewState = {
  label: string;
  tone: string;
};

function getReviewState(proposal: ProposalChecklistRecord): ReviewState {
  if (!proposal.detailsLoaded && proposal.reviewStatus) {
    const tones: Record<NonNullable<ProposalChecklistRecord['reviewStatus']>, string> = {
      Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      'Needs Revision': 'border-rose-200 bg-rose-50 text-rose-700',
      'In Review': 'border-blue-200 bg-blue-50 text-[#0f53b7]',
      'In Progress': 'border-amber-200 bg-amber-50 text-amber-700',
      'Not Started': 'border-slate-200 bg-slate-50 text-slate-600',
    };
    return { label: proposal.reviewStatus, tone: tones[proposal.reviewStatus] };
  }

  if (proposal.compliancePercentage >= 100) {
    return {
      label: 'Completed',
      tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  if (proposal.items.some((item) => item.status === 'Needs Revision')) {
    return {
      label: 'Needs Revision',
      tone: 'border-rose-200 bg-rose-50 text-rose-700',
    };
  }

  if (proposal.items.some((item) => item.status === 'Under Review')) {
    return {
      label: 'In Review',
      tone: 'border-blue-200 bg-blue-50 text-[#0f53b7]',
    };
  }

  if (proposal.items.some((item) => item.uploadedDoc || item.isPresent)) {
    return {
      label: 'In Progress',
      tone: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }

  return {
    label: 'Not Started',
    tone: 'border-slate-200 bg-slate-50 text-slate-600',
  };
}

export function DocumentChecklistProjectTable({
  canReview,
  isLoading,
  onSelectProject,
  proposals,
}: DocumentChecklistProjectTableProps) {
  const actionLabel = canReview ? 'Review Documents' : 'View Documents';

  const columns: DataColumn<ProposalChecklistRecord>[] = [
    {
      id: 'project',
      header: 'Project',
      className: 'w-[30%]',
      sortValue: (proposal) => proposal.enterpriseName,
      render: (proposal) => (
        <div className="min-w-0">
          <p className="line-clamp-2 font-semibold leading-snug text-slate-900">
            {proposal.enterpriseName}
          </p>
          <p className="mt-1 truncate font-mono text-xs text-[#285497]">
            {proposal.referenceNumber}
          </p>
        </div>
      ),
    },
    {
      id: 'program',
      header: 'Program',
      className: 'w-[10%]',
      sortValue: (proposal) => proposal.program,
      render: (proposal) => (
        <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#0f53b7]">
          {proposal.program}
        </span>
      ),
    },
    {
      id: 'proponent',
      header: 'Proponent',
      className: 'w-[18%]',
      sortValue: (proposal) => proposal.proponentName,
      render: (proposal) => (
        <p className="line-clamp-2 leading-snug text-slate-700">
          {proposal.proponentName}
        </p>
      ),
    },
    {
      id: 'progress',
      header: 'Document Progress',
      align: 'right',
      className: 'w-[18%]',
      sortValue: (proposal) => proposal.compliancePercentage,
      render: (proposal) => (
        <div className="ml-auto w-full max-w-40">
          <p className="text-right text-xs font-medium text-slate-700">
            {proposal.compliedCount} of {proposal.totalRequired} · {proposal.compliancePercentage}%
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                'h-full rounded-full',
                proposal.compliancePercentage >= 100 ? 'bg-emerald-600' : 'bg-[#0f53b7]',
              )}
              style={{ width: `${Math.min(100, proposal.compliancePercentage)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'reviewStatus',
      header: 'Review Status',
      className: 'w-[12%]',
      sortValue: (proposal) => getReviewState(proposal).label,
      render: (proposal) => {
        const state = getReviewState(proposal);
        return (
          <span
            className={cn(
              'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
              state.tone,
            )}
          >
            {state.label}
          </span>
        );
      },
    },
    {
      id: 'action',
      header: 'Action',
      align: 'right',
      className: 'w-[12%]',
      render: (proposal) => (
        <button
          type="button"
          aria-label={`${actionLabel} for ${proposal.enterpriseName}`}
          title={actionLabel}
          onClick={(event) => {
            event.stopPropagation();
            onSelectProject(proposal);
          }}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#0f53b7] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0b438f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
        >
          {canReview ? <FileCheck2 className="size-3.5" /> : <Eye className="size-3.5" />}
          <span className="hidden 2xl:inline">{actionLabel}</span>
          <ArrowRight className="size-3.5 2xl:hidden" />
        </button>
      ),
    },
  ];

  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-[#d8e1ee] bg-white shadow-[0_14px_36px_-32px_rgba(15,23,42,0.75)]">
      <DataTable
        columns={columns}
        data={proposals}
        emptyDescription="Approved projects will appear here when they are ready for document review."
        emptyTitle="No projects available"
        fitColumns
        getRowKey={(proposal) => String(proposal.proposalId)}
        initialRowsPerPage={10}
        isLoading={isLoading}
        mobileRender={(proposal) => {
          const state = getReviewState(proposal);
          return (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold leading-snug text-slate-900">
                    {proposal.enterpriseName}
                  </p>
                  <p className="mt-1 truncate font-mono text-xs text-[#285497]">
                    {proposal.referenceNumber}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-[#0f53b7]">
                  {proposal.program}
                </span>
              </div>

              <p className="text-sm text-slate-600">{proposal.proponentName}</p>

              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3 text-xs text-slate-600">
                    <span>Documents</span>
                    <span className="tabular-nums">
                      {proposal.compliedCount}/{proposal.totalRequired} · {proposal.compliancePercentage}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        proposal.compliancePercentage >= 100 ? 'bg-emerald-600' : 'bg-[#0f53b7]',
                      )}
                      style={{ width: `${Math.min(100, proposal.compliancePercentage)}%` }}
                    />
                  </div>
                </div>
                <span className={cn('shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold', state.tone)}>
                  {state.label}
                </span>
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectProject(proposal);
                }}
                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#0f53b7] px-3 text-xs font-semibold text-white"
              >
                {canReview ? <FileCheck2 className="size-3.5" /> : <Eye className="size-3.5" />}
                {actionLabel}
              </button>
            </div>
          );
        }}
        onRowClick={onSelectProject}
        searchPlaceholder="Search projects..."
        searchText={(proposal) =>
          `${proposal.enterpriseName} ${proposal.referenceNumber} ${proposal.proponentName} ${proposal.program} ${proposal.district || ''} ${getReviewState(proposal).label}`
        }
        variant="clean"
      />
    </section>
  );
}
