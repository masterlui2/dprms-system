import { Eye, FileCheck2 } from 'lucide-react';

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
      Completed: 'text-emerald-700',
      'Needs Revision': 'text-rose-700',
      'In Review': 'text-[#0f53b7]',
      'In Progress': 'text-amber-700',
      'Not Started': 'text-slate-600',
    };
    return { label: proposal.reviewStatus, tone: tones[proposal.reviewStatus] };
  }

  if (proposal.compliancePercentage >= 100) {
    return {
      label: 'Completed',
      tone: 'text-emerald-700',
    };
  }

  if (proposal.items.some((item) => item.status === 'Needs Revision')) {
    return {
      label: 'Needs Revision',
      tone: 'text-rose-700',
    };
  }

  if (proposal.items.some((item) => item.status === 'Under Review')) {
    return {
      label: 'In Review',
      tone: 'text-[#0f53b7]',
    };
  }

  if (proposal.items.some((item) => item.uploadedDoc || item.isPresent)) {
    return {
      label: 'In Progress',
      tone: 'text-amber-700',
    };
  }

  return {
    label: 'Not Started',
    tone: 'text-slate-600',
  };
}

function getDocumentCounts(proposal: ProposalChecklistRecord) {
  if (typeof proposal.uploadedCount === 'number' && typeof proposal.remainingCount === 'number') {
    const total = proposal.uploadedCount + proposal.remainingCount;
    return {
      uploaded: proposal.uploadedCount,
      remaining: proposal.remainingCount,
      total,
      percentage: total > 0 ? Math.round((proposal.uploadedCount / total) * 100) : 0,
    };
  }

  const requiredItems = proposal.items.filter((item) => item.isRequired);
  const countableItems = requiredItems.length > 0 ? requiredItems : proposal.items;
  const uploaded = countableItems.length > 0
    ? countableItems.filter((item) => Boolean(item.uploadedDoc)).length
    : proposal.compliedCount;

  return {
    uploaded,
    remaining: Math.max(0, proposal.totalRequired - uploaded),
    total: proposal.totalRequired,
    percentage:
      proposal.totalRequired > 0
        ? Math.round((uploaded / proposal.totalRequired) * 100)
        : 0,
  };
}

export function DocumentChecklistProjectTable({
  canReview,
  isLoading,
  onSelectProject,
  proposals,
}: DocumentChecklistProjectTableProps) {
  const actionLabel = canReview ? 'Review' : 'View';

  const columns: DataColumn<ProposalChecklistRecord>[] = [
    {
      id: 'project',
      header: 'Project',
      className: 'w-[29%]',
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
      id: 'proponent',
      header: 'Proponent',
      className: 'w-[21%]',
      sortValue: (proposal) => proposal.proponentName,
      render: (proposal) => (
        <p className="truncate font-medium text-slate-800" title={proposal.proponentName}>
          {proposal.proponentName}
        </p>
      ),
    },
    {
      id: 'documents',
      header: 'Documents',
      align: 'right',
      className: 'w-[25%]',
      sortValue: (proposal) => getDocumentCounts(proposal).percentage,
      render: (proposal) => {
        const counts = getDocumentCounts(proposal);
        return (
          <div className="ml-auto w-full max-w-48">
            <div className="flex items-center justify-between gap-3 text-xs tabular-nums">
              <span className="font-semibold text-[#0f53b7]">
                {counts.uploaded}/{counts.total} uploaded
              </span>
              <span className="text-slate-500">{counts.remaining} left</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#0f53b7] transition-[width] duration-300"
                style={{ width: `${counts.percentage}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      id: 'reviewStatus',
      header: 'Status',
      className: 'w-[13%]',
      sortValue: (proposal) => getReviewState(proposal).label,
      render: (proposal) => {
        const state = getReviewState(proposal);
        return (
          <span
            className={cn(
              'inline-flex text-xs font-semibold leading-snug',
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
          className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#0f53b7] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0b438f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
        >
          {canReview ? <FileCheck2 className="size-3.5" /> : <Eye className="size-3.5" />}
          <span>{actionLabel}</span>
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
          const counts = getDocumentCounts(proposal);
          return (
            <div className="space-y-3">
              <div>
                <div className="min-w-0">
                  <p className="font-semibold leading-snug text-slate-900">
                    {proposal.enterpriseName}
                  </p>
                  <p className="mt-1 truncate font-mono text-xs text-[#285497]">
                    {proposal.referenceNumber}
                  </p>
                </div>
              </div>

              <div className="min-w-0 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Proponent</p>
                <p className="mt-1 truncate font-semibold text-slate-800">{proposal.proponentName}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs">
                <div className="flex items-center justify-between gap-3 tabular-nums">
                  <span className="font-semibold text-[#0f53b7]">
                    {counts.uploaded}/{counts.total} uploaded
                  </span>
                  <span className="text-slate-500">{counts.remaining} left</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[#0f53b7] transition-[width] duration-300"
                    style={{ width: `${counts.percentage}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <span className={cn('text-xs font-semibold leading-snug', state.tone)}>
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
          `${proposal.enterpriseName} ${proposal.referenceNumber} ${proposal.proponentName} ${proposal.proponentEmail} ${proposal.district || ''} ${proposal.focalName || ''} ${proposal.submittedDate} ${getReviewState(proposal).label}`
        }
        variant="clean"
      />
    </section>
  );
}
