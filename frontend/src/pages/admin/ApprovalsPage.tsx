import { useEffect, useState } from "react";
import {
  Eye,
  Filter,
  Check,
  Layers,
  Inbox,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { DataTable, type DataColumn } from "../../components/admin/DataTable";
import {
  ProposalReviewModal,
  type ReviewSection,
} from "../../components/admin/ProposalReviewModal";
import { type ProposalRecord } from "../../data/admin";
import { cn } from "../../utils/cn";
import { getAllProposals } from "../../services/proposalStore";
import { getMockUser } from "../../lib/mockAuth";
import type { ApplicationRecord } from "../../types/application";

const programFilters = [
  { label: "All Programs", value: "all" },
  { label: "SETUP Program", value: "SETUP" },
  { label: "GIA Program", value: "GIA" },
];

export function ApprovalsPage() {
  const currentUser = getMockUser();
  const lockedProgram =
    currentUser?.program === "SETUP" || currentUser?.program === "GIA"
      ? currentUser.program
      : currentUser?.email?.toLowerCase().startsWith("gia.") ||
          currentUser?.email?.toLowerCase().includes("gia") ||
          currentUser?.name?.toUpperCase().includes("GIA") ||
          currentUser?.name?.toUpperCase().includes("CEST")
        ? "GIA"
        : currentUser?.email?.toLowerCase().startsWith("setup.") ||
            currentUser?.email?.toLowerCase().includes("setup") ||
            currentUser?.name?.toUpperCase().includes("SETUP") ||
            currentUser?.name?.toUpperCase().includes("SSCP")
          ? "SETUP"
          : null;

  const [program, setProgram] = useState<string>(lockedProgram || "all");
  const [lifecycleTab, setLifecycleTab] = useState<"all" | "new" | "in_process" | "endorsed" | "approved">("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [review, setReview] = useState<{
    proposal: ProposalRecord;
    section: ReviewSection;
  } | null>(null);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lockedProgram) {
      setProgram(lockedProgram);
    }
  }, [lockedProgram]);

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
          ? (app.proponentCategory || "HEI / SUC / LGU Proponent")
          : (app.businessType || "MSME Enterprise"),
      proponentName: app.applicantName || "Maria Proponent",
      proponentRole:
        app.program === "GIA"
          ? "Project Leader / Researcher"
          : "Authorized Enterprise Representative",
      program: app.program,
      reviewer: app.program === "GIA" ? "Felix (CEST Focal)" : "Faith (SSCP Focal)",
      stage,
      status,
      submitted: new Date(app.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      title: app.projectTitle,
      industrySector: app.industrySector,
      enterpriseSize: app.enterpriseSize,
      businessType: app.businessType,
      location: app.location,
      proponentCategory: app.proponentCategory,
      researchCategory: app.researchCategory,
      contactNumber: app.contactNumber,
    };
  });

  const effectiveProgram = lockedProgram || program;
  const programScopedProposals = applicationProposals.filter((proposal) => {
    return effectiveProgram === "all" || proposal.program === effectiveProgram;
  });

  const newCount = programScopedProposals.filter(
    (p) => p.status === "Pending" || p.status === "Under review" || p.stage <= 1,
  ).length;
  const inProcessCount = programScopedProposals.filter(
    (p) => p.status === "In Process" || p.status === "Returned for Revision" || p.stage === 2,
  ).length;
  const endorsedCount = programScopedProposals.filter(
    (p) => p.status === "Executive Approval" || p.stage === 3,
  ).length;
  const approvedCount = programScopedProposals.filter(
    (p) => p.status === "Approved" || p.status === "Disapproved" || p.stage === 4,
  ).length;
  const allCount = programScopedProposals.length;

  const filteredProposals = programScopedProposals.filter((proposal) => {
    if (lifecycleTab === "new") {
      return proposal.status === "Pending" || proposal.status === "Under review" || proposal.stage <= 1;
    }
    if (lifecycleTab === "in_process") {
      return proposal.status === "In Process" || proposal.status === "Returned for Revision" || proposal.stage === 2;
    }
    if (lifecycleTab === "endorsed") {
      return proposal.status === "Executive Approval" || proposal.stage === 3;
    }
    if (lifecycleTab === "approved") {
      return proposal.status === "Approved" || proposal.status === "Disapproved" || proposal.stage === 4;
    }
    return true;
  });

  function openReview(proposal: ProposalRecord, section: ReviewSection) {
    setReview({ proposal, section });
  }

  const headerEyebrow = "Proposal Management";

  const headerTitle =
    lockedProgram === "SETUP"
      ? "SETUP Applications"
      : lockedProgram === "GIA"
        ? "GIA Proposals"
        : "Applications";

  const headerDescription =
    lockedProgram === "SETUP"
      ? "Process newly submitted MSME technology upgrading applications, conduct technical evaluation, verify documents, and endorse to Director."
      : lockedProgram === "GIA"
        ? "Process newly submitted R&D and community S&T proposals, evaluate Line-Item Budgets, verify documents, and endorse to Director."
        : "View, process, evaluate, and manage incoming applications across SETUP and GIA programs.";

  const columns: DataColumn<ProposalRecord>[] = [
    {
      id: "id",
      header: "Application & Project Details",
      className: "w-[44%]",
      sortValue: (proposal) => proposal.title,
      render: (proposal) => (
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#0f53b7] bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80">
              {proposal.id}
            </span>
            {proposal.program === "SETUP" ? (
              <>
                {proposal.industrySector ? (
                  <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                    {proposal.industrySector}
                  </span>
                ) : null}
                {proposal.enterpriseSize ? (
                  <span className="inline-flex items-center rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200/60">
                    {proposal.enterpriseSize} Enterprise
                  </span>
                ) : null}
              </>
            ) : (
              <>
                {proposal.proponentCategory ? (
                  <span className="inline-flex items-center rounded bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-800 border border-purple-200/60">
                    {proposal.proponentCategory}
                  </span>
                ) : null}
                {proposal.researchCategory ? (
                  <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                    {proposal.researchCategory}
                  </span>
                ) : null}
              </>
            )}
          </div>
          <p className="font-bold leading-snug text-slate-900 line-clamp-2">{proposal.title}</p>
          {proposal.location ? (
            <p className="text-xs text-slate-500 font-medium">
              📍 {proposal.location}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "proponent",
      header: "Proponent / Organization",
      className: "w-[26%]",
      sortValue: (proposal) => proposal.proponentName ?? proposal.organization,
      render: (proposal) => {
        const showOrganization =
          proposal.organization.trim().toLowerCase() !==
            proposal.title.trim().toLowerCase() &&
          proposal.organization.trim().toLowerCase() !==
            proposal.proponentName?.trim().toLowerCase();

        return (
          <div className="space-y-1">
            <p className="font-bold text-slate-900">
              {proposal.proponentName ?? "Maria Proponent"}
            </p>
            {showOrganization ? (
              <p className="text-xs font-semibold text-slate-600">{proposal.organization}</p>
            ) : null}
            {proposal.organizationType ? (
              <p className="text-[11px] text-slate-400 font-medium">{proposal.organizationType}</p>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      className: "w-[14%]",
      sortValue: (proposal) => proposal.status,
      render: (proposal) => {
        let toneClass = "text-[#0f53b7] bg-blue-50 border-blue-200";
        if (proposal.status === "Approved") {
          toneClass = "text-emerald-700 bg-emerald-50 border-emerald-200";
        } else if (
          proposal.status === "Rejected" ||
          proposal.status === "Disapproved"
        ) {
          toneClass = "text-rose-700 bg-rose-50 border-rose-200";
        } else if (
          proposal.status === "Pending" ||
          proposal.status === "Returned for Revision"
        ) {
          toneClass = "text-amber-700 bg-amber-50 border-amber-200";
        } else if (proposal.status === "Executive Approval") {
          toneClass = "text-purple-700 bg-purple-50 border-purple-200";
        }

        return (
          <span className={cn("inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold", toneClass)}>
            {proposal.status}
          </span>
        );
      },
    },
    {
      id: "submitted",
      header: "Received",
      className: "w-[10%]",
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
      className: "w-[6%] text-right whitespace-nowrap",
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
        description={headerDescription}
        eyebrow={headerEyebrow}
        title={headerTitle}
      />

      {/* Lifecycle Stage Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3.5">
        <button
          className={cn(
            "group inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-xs",
            lifecycleTab === "all"
              ? "bg-[#0f53b7] text-white shadow-md shadow-blue-900/15"
              : "border border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          )}
          onClick={() => setLifecycleTab("all")}
          type="button"
        >
          <Layers className={cn("size-3.5", lifecycleTab === "all" ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
          <span>All</span>
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[11px] font-black tabular-nums transition",
              lifecycleTab === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-slate-200/60"
            )}
          >
            {allCount}
          </span>
        </button>

        <button
          className={cn(
            "group inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-xs",
            lifecycleTab === "new"
              ? "bg-[#0f53b7] text-white shadow-md shadow-blue-900/15"
              : "border border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          )}
          onClick={() => setLifecycleTab("new")}
          type="button"
        >
          <Inbox className={cn("size-3.5", lifecycleTab === "new" ? "text-white" : "text-blue-500 group-hover:text-blue-600")} />
          <span>Intake Queue</span>
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[11px] font-black tabular-nums transition",
              lifecycleTab === "new" ? "bg-white/20 text-white" : "bg-blue-50 text-[#073b82] group-hover:bg-blue-100/60"
            )}
          >
            {newCount}
          </span>
        </button>

        <button
          className={cn(
            "group inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-xs",
            lifecycleTab === "in_process"
              ? "bg-[#0f53b7] text-white shadow-md shadow-blue-900/15"
              : "border border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          )}
          onClick={() => setLifecycleTab("in_process")}
          type="button"
        >
          <FileCheck className={cn("size-3.5", lifecycleTab === "in_process" ? "text-white" : "text-amber-500 group-hover:text-amber-600")} />
          <span>Under Review</span>
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[11px] font-black tabular-nums transition",
              lifecycleTab === "in_process" ? "bg-white/20 text-white" : "bg-amber-50 text-amber-800 group-hover:bg-amber-100/60"
            )}
          >
            {inProcessCount}
          </span>
        </button>

        <button
          className={cn(
            "group inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-xs",
            lifecycleTab === "endorsed"
              ? "bg-[#0f53b7] text-white shadow-md shadow-blue-900/15"
              : "border border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          )}
          onClick={() => setLifecycleTab("endorsed")}
          type="button"
        >
          <ShieldCheck className={cn("size-3.5", lifecycleTab === "endorsed" ? "text-white" : "text-purple-500 group-hover:text-purple-600")} />
          <span>Executive Approval</span>
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[11px] font-black tabular-nums transition",
              lifecycleTab === "endorsed" ? "bg-white/20 text-white" : "bg-purple-50 text-purple-800 group-hover:bg-purple-100/60"
            )}
          >
            {endorsedCount}
          </span>
        </button>

        <button
          className={cn(
            "group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs",
            lifecycleTab === "approved"
              ? "bg-[#0f53b7] text-white shadow-md shadow-blue-900/15"
              : "border border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          )}
          onClick={() => setLifecycleTab("approved")}
          type="button"
        >
          <CheckCircle2 className={cn("size-3.5", lifecycleTab === "approved" ? "text-white" : "text-emerald-500 group-hover:text-emerald-600")} />
          <span>Approved</span>
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[11px] font-black tabular-nums transition",
              lifecycleTab === "approved" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-800 group-hover:bg-emerald-100/60"
            )}
          >
            {approvedCount}
          </span>
        </button>
      </div>

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
            lockedProgram ? null : (
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
            )
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
