import { useState } from "react";
import { Eye, MessageSquare } from "lucide-react";
import { AdminSelect } from "../../components/admin/AdminFilters";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminPanel } from "../../components/admin/AdminPanel";
import { DataTable, type DataColumn } from "../../components/admin/DataTable";
import {
  ProposalReviewModal,
  type ReviewSection,
} from "../../components/admin/ProposalReviewModal";
import {
  formatCurrency,
  proposalRecords,
  type ProposalRecord,
} from "../../data/admin";
import { cn } from "../../utils/cn";

const tabs = [
  "All",
  "Pending",
  "Under review",
  "Approved",
  "Rejected",
] as const;

function proposalStatusClass(status: ProposalRecord["status"]): string {
  if (status === "Approved") return "text-emerald-700";
  if (status === "Rejected") return "text-red-600";
  if (status === "Pending") return "text-amber-700";
  return "text-[#0f53b7]";
}

export function ApprovalsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [program, setProgram] = useState("all");
  const [review, setReview] = useState<{
    proposal: ProposalRecord;
    section: ReviewSection;
  } | null>(null);
  const filteredProposals = proposalRecords.filter(
    (proposal) =>
      (tab === "All" || proposal.status === tab) &&
      (program === "all" || proposal.program === program),
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
      id: "stage",
      header: "Stage",
      sortValue: (proposal) => proposal.stage,
      render: (proposal) => (
        <span className="whitespace-nowrap text-sm text-slate-600">
          {
            [
              "Encoded",
              "Initial Review",
              "Technical Evaluation",
              "Regional Director",
              "Final Approval",
            ][proposal.stage]
          }
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
      header: "Status",
      sortValue: (proposal) => proposal.status,
      render: (proposal) => (
        <span
          className={cn(
            "whitespace-nowrap text-sm font-bold",
            proposalStatusClass(proposal.status),
          )}
        >
          {proposal.status}
        </span>
      ),
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
            onClick={() => openReview(proposal, "overview")}
            title="Review proposal"
            type="button"
          >
            <Eye className="size-4" />
          </button>
          <button
            aria-label={`Comment on ${proposal.id}`}
            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-[#0f53b7]"
            onClick={() => openReview(proposal, "comments")}
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
          searchPlaceholder="Search proposal ID, title, applicant, or reviewer..."
          searchText={(proposal) =>
            `${proposal.id} ${proposal.title} ${proposal.organization} ${proposal.program} ${proposal.reviewer} ${proposal.status}`
          }
          toolbar={
            <>
              <div className="flex flex-wrap gap-1">
                {tabs.map((item) => (
                  <button
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-bold transition",
                      tab === item
                        ? "bg-[#073b82] text-white"
                        : "bg-blue-50 text-slate-600 hover:bg-blue-100 hover:text-[#073b82]",
                    )}
                    key={item}
                    onClick={() => setTab(item)}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
              <AdminSelect
                label="Filter by program"
                onChange={setProgram}
                options={[
                  { label: "All programs", value: "all" },
                  { label: "GIA", value: "GIA" },
                  { label: "SETUP", value: "SETUP" },
                ]}
                value={program}
              />
            </>
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
