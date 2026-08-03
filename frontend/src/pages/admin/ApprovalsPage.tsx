import { useState } from "react";
import { Eye, Filter, Check } from "lucide-react";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminPanel } from "../../components/admin/AdminPanel";
import { DataTable, type DataColumn } from "../../components/admin/DataTable";
import {
  ProposalReviewModal,
  type ReviewSection,
} from "../../components/admin/ProposalReviewModal";
import {
  proposalRecords,
  type ProposalRecord,
} from "../../data/admin";
import { cn } from "../../utils/cn";
import { getApplications } from "../../services/applicationStore";

const programFilters = [
  { label: "All Programs", value: "all" },
  { label: "SETUP Program", value: "SETUP" },
  { label: "GIA Program", value: "GIA" },
];

export function ApprovalsPage() {
  const [program, setProgram] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [review, setReview] = useState<{
    proposal: ProposalRecord;
    section: ReviewSection;
  } | null>(null);

  const applications = getApplications();
  const applicationProposals: ProposalRecord[] = applications.map((app) => {
    let stage: 0 | 1 | 2 | 3 | 4 = 1;
    if (app.status === 'Submitted' || app.status === 'Draft Submitted') stage = 0;
    else if (app.status === 'Under review') stage = 1;
    else if (app.status === 'Technical evaluation') stage = 2;
    else if (app.status === 'In Process' || app.status === 'Executive Approval') stage = 3;
    else if (app.status === 'Approved') stage = 4;

    let status: 'Pending' | 'Under review' | 'Approved' | 'Rejected' = 'Under review';
    if (app.status === 'Approved') status = 'Approved';
    else if (app.status === 'Returned for Revision') status = 'Rejected';
    else if (stage === 0) status = 'Pending';

    return {
      amount: 1500000,
      completeness: 100,
      id: app.referenceNo,
      organization: app.organizationName,
      organizationType: app.program === 'GIA' ? 'HEI / SUC / LGU Proponent' : 'MSME Enterprise (Private Sector)',
      proponentName: app.applicantName || 'Maria Proponent',
      proponentRole: app.program === 'GIA' ? 'Project Leader / Researcher' : 'Authorized Enterprise Representative',
      program: app.program,
      reviewer: app.program === 'GIA' ? 'CEST Focal Officer' : 'SSCP Focal Officer',
      stage,
      status,
      submitted: new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      title: app.projectTitle,
    };
  });

  // Combine live submitted applications with mock proposals (avoid duplicates by id)
  const combinedProposals = [
    ...applicationProposals,
    ...proposalRecords.filter((p) => !applicationProposals.some((ap) => ap.id === p.id)),
  ];

  const filteredProposals = combinedProposals.filter((proposal) => {
    return program === "all" || proposal.program === program;
  });

  function openReview(proposal: ProposalRecord, section: ReviewSection) {
    setReview({ proposal, section });
  }

  const columns: DataColumn<ProposalRecord>[] = [
    {
      id: "id",
      header: "Application Ref",
      sortValue: (proposal) => proposal.id,
      render: (proposal) => (
        <span className="font-mono text-xs font-bold text-[#0f53b7]">{proposal.id}</span>
      ),
    },
    {
      id: "proponent",
      header: "Submitting Proponent",
      sortValue: (proposal) => proposal.proponentName ?? proposal.organization,
      render: (proposal) => (
        <div>
          <p className="font-bold text-slate-900">
            {proposal.proponentName ?? "Maria Proponent"}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">
            {proposal.proponentRole ?? "Authorized Representative"}
          </p>
        </div>
      ),
    },
    {
      id: "organization",
      header: "Firm / Office & Category",
      sortValue: (proposal) => proposal.organization,
      render: (proposal) => (
        <div className="space-y-1">
          <p className="font-bold text-slate-900 text-xs sm:text-sm">{proposal.organization}</p>
          <span className="inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-extrabold text-[#073b82] border border-blue-100">
            {proposal.organizationType ?? (proposal.program === "SETUP" ? "Cooperative (Private Sector)" : "HEI / SUC")}
          </span>
        </div>
      ),
    },
    {
      id: "title",
      header: "Project Title",
      sortValue: (proposal) => proposal.title,
      render: (proposal) => (
        <p className="max-w-xs font-semibold text-xs leading-snug text-slate-800">
          {proposal.title}
        </p>
      ),
    },
    {
      id: "program",
      header: "Program",
      sortValue: (proposal) => proposal.program,
      render: (proposal) => (
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-[#073b82] ring-1 ring-slate-200">
          {proposal.program}
        </span>
      ),
    },
    {
      id: "submitted",
      header: "Date Received",
      sortValue: (proposal) => proposal.submitted,
      render: (proposal) => (
        <span className="whitespace-nowrap text-xs font-medium text-slate-600">
          {proposal.submitted}
        </span>
      ),
    },
    {
      id: "action",
      header: "Action",
      className: "text-right whitespace-nowrap",
      render: (proposal) => (
        <div className="flex justify-end">
          <button
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f53b7] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0b3f8b] transition hover:shadow-md"
            onClick={(event) => {
              event.stopPropagation();
              openReview(proposal, "overview");
            }}
            type="button"
          >
            <Eye className="size-3.5" />
            Review Application
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-7">
      <AdminPageHeader
        description="View and cater incoming proposal submissions from SETUP and GIA program applicants."
        eyebrow="Application Intake"
        title="Incoming Applications"
      />

      <AdminPanel
        description={`${filteredProposals.length} applications received across GIA and SETUP programs.`}
        title="Applications Received"
      >
        <DataTable
          columns={columns}
          data={filteredProposals}
          emptyDescription="No applications match the selected filter."
          emptyTitle="No applications found"
          getRowKey={(proposal) => proposal.id}
          onRowClick={(proposal) => openReview(proposal, "overview")}
          searchPlaceholder="Search application ref, proponent, office, or project title..."
          searchText={(proposal) =>
            `${proposal.id} ${proposal.title} ${proposal.organization} ${proposal.proponentName ?? ''} ${proposal.organizationType ?? ''} ${proposal.program}`
          }
          toolbar={
            <div className="relative">
              <button
                aria-expanded={filtersOpen}
                aria-label="Filter by Program"
                className="relative inline-flex items-center gap-2 rounded-xl border border-[#d8e1ee] bg-white px-3.5 py-2 text-xs font-bold text-[#073b82] shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                onClick={() => setFiltersOpen((open) => !open)}
                type="button"
              >
                <Filter className="size-3.5" />
                <span>{program === "all" ? "Filter Program" : program}</span>
              </button>

              {filtersOpen ? (
                <div className="absolute right-0 top-11 z-30 w-56 overflow-hidden rounded-xl border border-[#d8e1ee] bg-white shadow-xl shadow-slate-900/10">
                  <div className="border-b border-slate-100 px-4 py-2.5">
                    <p className="text-xs font-black text-[#073b82]">
                      Filter by Program
                    </p>
                  </div>

                  <div className="p-2 space-y-1">
                    {programFilters.map((item) => (
                      <button
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold transition",
                          program === item.value
                            ? "bg-blue-50 text-[#073b82]"
                            : "text-slate-600 hover:bg-slate-50",
                        )}
                        key={item.value}
                        onClick={() => {
                          setProgram(item.value);
                          setFiltersOpen(false);
                        }}
                        type="button"
                      >
                        <span>{item.label}</span>
                        {program === item.value ? (
                          <Check className="size-3.5 text-[#0f53b7]" />
                        ) : null}
                      </button>
                    ))}
                  </div>
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
