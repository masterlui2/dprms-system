import { useState } from "react";
import { Check, Eye, Filter, MessageSquare } from "lucide-react";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminPanel } from "../../components/admin/AdminPanel";
import { DataTable, type DataColumn } from "../../components/admin/DataTable";
import {
  ProposalReviewModal,
  type ReviewSection,
} from "../../components/admin/ProposalReviewModal";
import {
  formatCurrency,
  getProposalReviewStatus,
  proposalRecords,
  type ProposalRecord,
  type ProposalReviewStatus,
} from "../../data/admin";
import { cn } from "../../utils/cn";

const statusFilters: Array<"All" | ProposalReviewStatus> = [
  "All",
  "Submitted",
  "Document Validation",
  "Technical Review",
  "Finance Review",
  "Executive Approval",
  "Approved",
  "Disapproved",
];

const programFilters = [
  { label: "All programs", value: "all" },
  { label: "GIA", value: "GIA" },
  { label: "SETUP", value: "SETUP" },
];

function proposalStatusClass(status: ProposalReviewStatus): string {
  if (status === "Approved") return "text-emerald-700";
  if (status === "Disapproved") return "text-red-600";
  if (status === "Submitted") return "text-slate-600";
  if (status === "Document Validation") return "text-amber-700";
  return "text-[#0f53b7]";
}

export function ApprovalsPage() {
  const [statusFilter, setStatusFilter] =
    useState<(typeof statusFilters)[number]>("All");
  const [program, setProgram] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [review, setReview] = useState<{
    proposal: ProposalRecord;
    section: ReviewSection;
  } | null>(null);
  const activeFilterCount =
    (statusFilter === "All" ? 0 : 1) + (program === "all" ? 0 : 1);
  const filteredProposals = proposalRecords.filter(
    (proposal) => {
      const reviewStatus = getProposalReviewStatus(proposal);

      return (
        (statusFilter === "All" || reviewStatus === statusFilter) &&
        (program === "all" || proposal.program === program)
      );
    },
  );

  function openReview(proposal: ProposalRecord, section: ReviewSection) {
    setReview({ proposal, section });
  }

  const columns: DataColumn<ProposalRecord>[] = [
    {
      id: "id",
      header: "ID",
      sortValue: (proposal) => proposal.id,
      render: (proposal) => (
        <span className="font-mono text-xs text-slate-500">{proposal.id}</span>
      ),
    },
    {
      id: "applicant",
      header: "Applicant",
      sortValue: (proposal) => proposal.organization,
      render: (proposal) => (
        <div>
          <p className="font-bold text-slate-900">{proposal.organization}</p>
          <p className="mt-1 max-w-52 truncate text-xs text-slate-500">
            {proposal.title}
          </p>
        </div>
      ),
    },
    {
      id: "program",
      header: "Program",
      sortValue: (proposal) => proposal.program,
      render: (proposal) => (
        <span className="font-semibold text-slate-700">{proposal.program}</span>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      sortValue: (proposal) => proposal.amount,
      render: (proposal) => (
        <span className="whitespace-nowrap font-semibold tabular-nums text-slate-800">
          {formatCurrency(proposal.amount)}
        </span>
      ),
    },
    {
      id: "submitted",
      header: "Submitted",
      sortValue: (proposal) => proposal.submitted,
      render: (proposal) => (
        <span className="whitespace-nowrap text-slate-600">
          {proposal.submitted}
        </span>
      ),
    },
    {
      id: "status",
      header: "Review Status",
      sortValue: (proposal) => getProposalReviewStatus(proposal),
      render: (proposal) => {
        const reviewStatus = getProposalReviewStatus(proposal);

        return (
          <span
            className={cn(
              "inline-flex rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-black",
              proposalStatusClass(reviewStatus),
            )}
          >
            {reviewStatus}
          </span>
        );
      },
    },
    {
      id: "action",
      header: "Action",
      className: "text-right whitespace-nowrap",
      render: (proposal) => (
        <div className="flex justify-end gap-1">
          <button
            aria-label={`Review ${proposal.id}`}
            className="inline-flex size-8 items-center justify-center rounded-lg text-[#0f53b7] transition hover:bg-blue-50"
            onClick={(event) => {
              event.stopPropagation();
              openReview(proposal, "overview");
            }}
            title="Review proposal"
            type="button"
          >
            <Eye className="size-4" />
          </button>
          <button
            aria-label={`Comment on ${proposal.id}`}
            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-[#0f53b7]"
            onClick={(event) => {
              event.stopPropagation();
              openReview(proposal, "comments");
            }}
            title="Reviewer comment"
            type="button"
          >
            <MessageSquare className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-7">
      <AdminPageHeader
        description=""
        eyebrow="Proposal Management"
        title="Proposal Reviews"
      />

      <AdminPanel
        description={`${filteredProposals.length} proposals match the selected review filters.`}
        title="Proposal review queue"
      >
        <DataTable
          columns={columns}
          data={filteredProposals}
          emptyDescription="No proposals match the selected status or program."
          emptyTitle="No proposals to review"
          getRowKey={(proposal) => proposal.id}
          onRowClick={(proposal) => openReview(proposal, "overview")}
          searchPlaceholder="Search proposal ID, title, applicant, or reviewer..."
          searchText={(proposal) =>
            `${proposal.id} ${proposal.title} ${proposal.organization} ${proposal.program} ${proposal.reviewer} ${getProposalReviewStatus(proposal)}`
          }
          toolbar={
            <div className="relative">
              <button
                aria-expanded={filtersOpen}
                aria-label="Filter proposals"
                className="relative inline-flex size-10 items-center justify-center rounded-lg border border-[#d8e1ee] bg-white text-[#073b82] shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                onClick={() => setFiltersOpen((open) => !open)}
                title="Filter proposals"
                type="button"
              >
                <Filter className="size-4" />
                {activeFilterCount > 0 ? (
                  <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#f4c542] text-[11px] font-black text-[#073b82]">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>

              {filtersOpen ? (
                <div className="absolute right-0 top-12 z-30 w-[320px] overflow-hidden rounded-xl border border-[#d8e1ee] bg-white shadow-xl shadow-slate-900/10">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-black text-[#073b82]">
                      Filter proposals
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Narrow the review queue by status or program.
                    </p>
                  </div>

                  <div className="p-3">
                    <p className="px-1 pb-2 text-xs font-black uppercase tracking-wide text-slate-400">
                      Review status
                    </p>
                    <div className="grid gap-1">
                      {statusFilters.map((item) => (
                        <button
                          className={cn(
                            "flex min-h-9 items-center justify-between gap-3 rounded-lg px-3 text-left text-sm font-bold transition",
                            statusFilter === item
                              ? "bg-blue-50 text-[#073b82]"
                              : "text-slate-600 hover:bg-slate-50",
                          )}
                          key={item}
                          onClick={() => setStatusFilter(item)}
                          type="button"
                        >
                          <span>{item}</span>
                          {statusFilter === item ? (
                            <Check className="size-4" />
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 p-3">
                    <p className="px-1 pb-2 text-xs font-black uppercase tracking-wide text-slate-400">
                      Program
                    </p>
                    <div className="grid gap-1">
                      {programFilters.map((item) => (
                        <button
                          className={cn(
                            "flex h-9 items-center justify-between gap-3 rounded-lg px-3 text-left text-sm font-bold transition",
                            program === item.value
                              ? "bg-blue-50 text-[#073b82]"
                              : "text-slate-600 hover:bg-slate-50",
                          )}
                          key={item.value}
                          onClick={() => setProgram(item.value)}
                          type="button"
                        >
                          <span>{item.label}</span>
                          {program === item.value ? (
                            <Check className="size-4" />
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeFilterCount > 0 ? (
                    <div className="border-t border-slate-100 bg-slate-50 px-3 py-3">
                      <button
                        className="h-9 w-full rounded-lg text-sm font-black text-[#073b82] transition hover:bg-white"
                        onClick={() => {
                          setStatusFilter("All");
                          setProgram("all");
                        }}
                        type="button"
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          }
        />
      </AdminPanel>

      {review ? (
        <ProposalReviewModal
          initialSection={review.section}
          key={`${review.proposal.id}-${review.section}`}
          onClose={() => setReview(null)}
          proposal={review.proposal}
        />
      ) : null}
    </div>
  );
}
