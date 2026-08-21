import { useEffect, useState } from "react";
import { Eye, Filter, Check } from "lucide-react";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { DataTable, type DataColumn } from "../../components/admin/DataTable";
import {
  ProposalReviewModal,
  type ReviewSection,
} from "../../components/admin/ProposalReviewModal";
import { type ProposalRecord } from "../../data/admin";
import { cn } from "../../utils/cn";
import { getAllProposals } from "../../services/proposalStore";
import type { ApplicationRecord } from "../../types/application";

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
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    getAllProposals()
      .then((data) => {
        if (!cancelled) setApplications(data);
      })
      .catch((err) => {
        console.error("Failed to load proposals:", err);
        if (!cancelled) setError("Could not load applications. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const applicationProposals: ProposalRecord[] = applications.map((app) => {
    let stage: 0 | 1 | 2 | 3 | 4 = 1;
    if (app.status === "Submitted" || app.status === "Draft Submitted") stage = 0;
    else if (app.status === "Under review") stage = 1;
    else if (app.status === "Technical evaluation" || app.status === "In Process") stage = 2;
    else if (app.status === "Executive Approval") stage = 3;
    else if (app.status === "Approved") stage = 4;

    let status: ProposalRecord["status"] = "Under review";
    if (app.status === "Approved") status = "Approved";
    else if (app.status === "Returned for Revision") status = "Returned for Revision";
    else if (app.status === "Disapproved") status = "Disapproved";
    else if (app.status === "In Process") status = "In Process";
    else if (app.status === "Executive Approval") status = "Executive Approval";
    else if (stage === 0) status = "Pending";

    return {
      amount: 1500000,
      completeness: 100,
      id: app.referenceNo,
      proposalId: app.proposalId, // numeric backend id, needed by ProposalDocumentsSection
      organization: app.organizationName,
      organizationType:
        app.program === "GIA"
          ? "HEI / SUC / LGU Proponent"
          : "MSME Enterprise (Private Sector)",
      proponentName: app.applicantName || "Maria Proponent",
      proponentRole:
        app.program === "GIA"
          ? "Project Leader / Researcher"
          : "Authorized Enterprise Representative",
      program: app.program,
      reviewer: app.program === "GIA" ? "CEST Focal Officer" : "SSCP Focal Officer",
      stage,
      status,
      submitted: new Date(app.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      title: app.projectTitle,
    };
  });

  const filteredProposals = applicationProposals.filter((proposal) => {
    return program === "all" || proposal.program === program;
  });

  function openReview(proposal: ProposalRecord, section: ReviewSection) {
    setReview({ proposal, section });
  }

  const columns: DataColumn<ProposalRecord>[] = [
    {
      id: "id",
      header: "Application",
      className: "w-[30%]",
      sortValue: (proposal) => proposal.title,
      render: (proposal) => (
        <div>
          <p className="font-semibold leading-5 text-slate-900">{proposal.title}</p>
          <p className="mt-1 font-mono text-xs font-bold text-[#0f53b7]">{proposal.id}</p>
        </div>
      ),
    },
    {
      id: "proponent",
      header: "Proponent",
      className: "w-[22%]",
      sortValue: (proposal) => proposal.proponentName ?? proposal.organization,
      render: (proposal) => {
        const showOrganization =
          proposal.organization.trim().toLowerCase() !==
            proposal.title.trim().toLowerCase() &&
          proposal.organization.trim().toLowerCase() !==
            proposal.proponentName?.trim().toLowerCase();

        return (
          <div>
            <p className="font-bold text-slate-900">
              {proposal.proponentName ?? "Maria Proponent"}
            </p>
            {showOrganization ? (
              <p className="mt-1 text-xs leading-5 text-slate-500">{proposal.organization}</p>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "reviewer",
      header: "Assigned Officer",
      className: "w-[15%]",
      sortValue: (proposal) => proposal.reviewer,
      render: (proposal) => (
        <span className="text-xs font-semibold text-slate-700">
          {proposal.reviewer || "Project Staff"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      className: "w-[11%]",
      sortValue: (proposal) => proposal.status,
      render: (proposal) => {
        let toneClass = "text-[#0f53b7]";
        if (proposal.status === "Approved") {
          toneClass = "text-emerald-700";
        } else if (
          proposal.status === "Rejected" ||
          proposal.status === "Disapproved"
        ) {
          toneClass = "text-rose-700";
        } else if (
          proposal.status === "Pending" ||
          proposal.status === "Returned for Revision"
        ) {
          toneClass = "text-amber-700";
        }

        return (
          <span className={cn("text-xs font-bold", toneClass)}>
            {proposal.status}
          </span>
        );
      },
    },
    {
      id: "submitted",
      header: "Received",
      className: "w-[11%]",
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
      className: "w-[11%] text-right whitespace-nowrap",
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
            Review
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

      <section className="overflow-hidden rounded-2xl border border-[#d8e1ee] bg-white shadow-[0_14px_36px_-32px_rgba(15,23,42,0.75)]">
        {error ? (
          <p
            className="border-b border-red-100 bg-red-50 px-5 py-3 text-xs font-semibold text-red-700"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <DataTable
          columns={columns}
          data={filteredProposals}
          emptyDescription="No applications match the selected filter."
          emptyTitle="No applications found"
          getRowKey={(proposal) => proposal.id}
          onRowClick={(proposal) => openReview(proposal, "overview")}
          searchPlaceholder="Search applications..."
          searchText={(proposal) =>
            `${proposal.id} ${proposal.title} ${proposal.organization} ${proposal.proponentName ?? ""} ${proposal.organizationType ?? ""} ${proposal.program}`
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
                    <p className="text-xs font-black text-[#073b82]">Filter by Program</p>
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
      </section>

      {review ? (
        <ProposalReviewModal
          initialSection={review.section}
          key={`${review.proposal.id}-${review.section}`}
          onClose={() => setReview(null)}
          onStatusChange={(status, remarks) => {
            setApplications((current) =>
              current.map((application) =>
                application.referenceNo === review.proposal.id
                  ? { ...application, remarks: remarks ?? application.remarks, status }
                  : application,
              ),
            );
            void getAllProposals()
              .then(setApplications)
              .catch((refreshError) => {
                console.error("Failed to refresh proposal status:", refreshError);
              });
          }}
          proposal={review.proposal}
        />
      ) : null}
    </div>
  );
}
