import { useEffect, useState } from "react";
import {
  Eye,
  Check,
  X,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";
import { DataTable, type DataColumn } from "../../components/admin/DataTable";
import {
  ProposalReviewModal,
  type ReviewSection,
} from "../../components/admin/ProposalReviewModal";
import { type ProposalRecord } from "../../data/admin";
import { cn } from "../../utils/cn";
import { getAllProposals, applyProposalDecision } from "../../services/proposalStore";
import { AnimatedTabs } from "../../components/common/AnimatedTabs";
import { getMockUser } from "../../lib/mockAuth";
import type { ApplicationRecord } from "../../types/application";

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

  const getDefaultLifecycleTab = (): "all" | "review" | "in_process" | "for_approval" | "approved" | "disapproved" => {
    if (currentUser?.role === "project_staff") return "review";
    if (currentUser?.role === "focal") return "in_process";
    if (currentUser?.role === "provincial_director") return "for_approval";
    return "all";
  };

  const [lifecycleTab, setLifecycleTab] = useState<"all" | "review" | "in_process" | "for_approval" | "approved" | "disapproved">(getDefaultLifecycleTab);
  const [review, setReview] = useState<{
    proposal: ProposalRecord;
    section: ReviewSection;
  } | null>(null);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Direct Row Action Modal (Disapprove / Return)
  const [directActionModal, setDirectActionModal] = useState<{
    proposal: ProposalRecord;
    type: "disapprove" | "return_in_process";
  } | null>(null);
  const [directRemarks, setDirectRemarks] = useState("");
  const [directSubmitting, setDirectSubmitting] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);

  async function handleApproveConfirmation(proposal: ProposalRecord) {
    if (!proposal.proposalId) return;

    const result = await Swal.fire({
      title: "Approve Application?",
      text: `Are you sure you want to officially approve "${proposal.title}" (${proposal.id})? This will approve the project for grant allocation.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, Approve",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: "Approving application...",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        const savedStatus = await applyProposalDecision({
          decision: "approve",
          proposalId: proposal.proposalId,
        });

        setApplications((current) =>
          current.map((app) =>
            app.referenceNo === proposal.id || String(app.proposalId) === String(proposal.proposalId)
              ? { ...app, status: savedStatus as ApplicationRecord["status"] }
              : app,
          ),
        );

        await Swal.fire({
          icon: "success",
          title: "Application Approved!",
          text: `Application "${proposal.id}" has been officially approved.`,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (err) {
        console.error("Failed to approve application:", err);
        const serverMessage = (
          err as { response?: { data?: { message?: string } } }
        ).response?.data?.message;
        await Swal.fire({
          icon: "error",
          title: "Approval Failed",
          text: serverMessage || "The application could not be approved. Please try again.",
        });
      }
    }
  }

  async function handleDirectDecision() {
    if (!directActionModal) return;
    const { proposal, type } = directActionModal;
    if (!directRemarks.trim()) {
      setDirectError("Remarks are required for this action.");
      return;
    }

    if (!proposal.proposalId) {
      setDirectError("Proposal ID is missing.");
      return;
    }

    setDirectSubmitting(true);
    setDirectError(null);

    try {
      const savedStatus = await applyProposalDecision({
        decision: type,
        proposalId: proposal.proposalId,
        remarks: directRemarks.trim() || undefined,
      });

      // Update in applications state
      setApplications((current) =>
        current.map((app) =>
          app.referenceNo === proposal.id || String(app.proposalId) === String(proposal.proposalId)
            ? {
                ...app,
                status: savedStatus as ApplicationRecord["status"],
                remarks: directRemarks.trim() || app.remarks,
              }
            : app,
        ),
      );

      const isReturn = type === "return_in_process";
      setDirectActionModal(null);
      setDirectRemarks("");

      await Swal.fire({
        icon: isReturn ? "info" : "warning",
        title: isReturn ? "Returned for Re-assessment" : "Application Disapproved",
        text: isReturn
          ? `Application "${proposal.id}" returned to In Process for technical clarification.`
          : `Application "${proposal.id}" has been formally disapproved.`,
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Failed to execute direct action:", err);
      const serverMessage = (
        err as { response?: { data?: { message?: string } } }
      ).response?.data?.message;
      setDirectError(serverMessage || "Failed to update application status.");
    } finally {
      setDirectSubmitting(false);
    }
  }

  useEffect(() => {
    setLifecycleTab(getDefaultLifecycleTab());
  }, [currentUser?.role]);

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
          : "Business Owner / Enterprise Lead",
      program: app.program as "SETUP" | "GIA",
      reviewer:
        app.program === "GIA"
          ? "Felix GIA Focal"
          : "Faith SETUP Focal",
      stage,
      status,
      remarks: app.remarks,
      submitted: new Date(app.createdAt).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
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

  const programScopedProposals = lockedProgram
    ? applicationProposals.filter((proposal) => proposal.program === lockedProgram)
    : applicationProposals;

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
    (p) => p.status === "Approved",
  ).length;
  const disapprovedCount = programScopedProposals.filter(
    (p) => p.status === "Disapproved" || p.status === "Rejected",
  ).length;
  const allCount = programScopedProposals.length;

  const filteredProposals = programScopedProposals.filter((proposal) => {
    if (lifecycleTab === "review") {
      return proposal.status === "Pending" || proposal.status === "Under review" || proposal.stage <= 1;
    }
    if (lifecycleTab === "in_process") {
      return proposal.status === "In Process" || proposal.status === "Returned for Revision" || proposal.stage === 2;
    }
    if (lifecycleTab === "for_approval") {
      return proposal.status === "Executive Approval" || proposal.stage === 3;
    }
    if (lifecycleTab === "approved") {
      return proposal.status === "Approved";
    }
    if (lifecycleTab === "disapproved") {
      return proposal.status === "Disapproved" || proposal.status === "Rejected";
    }
    return true;
  });

  function openReview(proposal: ProposalRecord, section: ReviewSection) {
    setReview({ proposal, section });
  }



  const columns: DataColumn<ProposalRecord>[] = [
    {
      id: "id",
      header: "Reference",
      className: "w-[10%]",
      sortValue: (proposal) => proposal.id,
      render: (proposal) => (
        <span className="font-mono text-[11px] font-bold text-slate-600 whitespace-nowrap block tracking-tight">
          {proposal.id}
        </span>
      ),
    },
    {
      id: "title",
      header: "Project Title",
      className: "w-[17%]",
      sortValue: (proposal) => proposal.title,
      render: (proposal) => (
        <p className="font-bold leading-snug text-slate-900 text-sm line-clamp-2">
          {proposal.title}
        </p>
      ),
    },
    {
      id: "proponent",
      header: "Proponent",
      className: "w-[13%]",
      sortValue: (proposal) => proposal.proponentName ?? "",
      render: (proposal) => (
        <p className="font-bold text-sm text-slate-900 leading-snug">
          {proposal.proponentName ?? "Maria Proponent"}
        </p>
      ),
    },
    {
      id: "organization",
      header: "Organization",
      className: "w-[19%]",
      sortValue: (proposal) => proposal.organization,
      render: (proposal) => (
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-slate-800 leading-snug">
            {proposal.organization || "—"}
          </p>
          {proposal.organizationType ? (
            <p className="text-[11px] text-slate-500 font-medium">
              {proposal.organizationType}
            </p>
          ) : null}
          <p
            className="truncate text-[11px] font-medium text-slate-500"
            title={proposal.location || "Location not recorded"}
          >
            {proposal.location || "Location not recorded"}
          </p>
        </div>
      ),
    },
    {
      id: "classification",
      header: "Sector / Scale",
      className: "w-[14%]",
      sortValue: (proposal) =>
        proposal.program === "SETUP"
          ? proposal.industrySector ?? ""
          : proposal.proponentCategory ?? "",
      render: (proposal) => (
        <div className="space-y-0.5">
          {proposal.program === "SETUP" ? (
            <>
              {proposal.industrySector ? (
                <p className="text-xs font-semibold text-slate-800 leading-snug">
                  {proposal.industrySector}
                </p>
              ) : (
                <span className="text-xs text-slate-400 font-medium">—</span>
              )}
              {proposal.enterpriseSize ? (
                <p className="text-[11px] font-medium text-slate-500">
                  {proposal.enterpriseSize} Enterprise
                </p>
              ) : null}
            </>
          ) : (
            <>
              {proposal.proponentCategory ? (
                <p className="text-xs font-semibold text-slate-800 leading-snug">
                  {proposal.proponentCategory}
                </p>
              ) : null}
              {proposal.researchCategory ? (
                <p className="text-[11px] font-medium text-slate-500">
                  {proposal.researchCategory}
                </p>
              ) : null}
            </>
          )}
        </div>
      ),
    },
    {
      id: "submitted",
      header: "Submission Date",
      className: "w-[9%]",
      sortValue: (proposal) => proposal.submitted,
      render: (proposal) => (
        <span className="text-xs font-medium text-slate-600 whitespace-nowrap block">
          {proposal.submitted}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      className: "w-[7%]",
      sortValue: (proposal) => proposal.status,
      render: (proposal) => {
        let toneClass = "text-[#0f53b7]";
        if (proposal.status === "Approved") {
          toneClass = "text-emerald-600";
        } else if (
          proposal.status === "Rejected" ||
          proposal.status === "Disapproved"
        ) {
          toneClass = "text-rose-600";
        } else if (
          proposal.status === "Pending" ||
          proposal.status === "Returned for Revision"
        ) {
          toneClass = "text-amber-600";
        } else if (proposal.status === "Executive Approval") {
          toneClass = "text-purple-600";
        }

        return (
          <span className={cn("text-xs font-bold leading-snug", toneClass)}>
            {proposal.status}
          </span>
        );
      },
    },
    {
      id: "action",
      header: "Action",
      className: "w-[11%] text-right",
      render: (proposal) => {
        const canDecide =
          currentUser?.role === "provincial_director" &&
          (proposal.status === "Executive Approval" || proposal.stage === 3);

        const canReview =
          currentUser?.role === "focal" &&
          (proposal.status === "Pending" || proposal.status === "Under review" || proposal.status === "In Process");

        const actionLabel = canReview ? "Review" : "View";

        if (canDecide) {
          return (
            <div className="flex items-center justify-end gap-1.5">
              <button
                className="inline-flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 transition"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleApproveConfirmation(proposal);
                }}
                title="Approve Application"
                type="button"
              >
                <Check className="size-4" />
              </button>
              <button
                className="inline-flex size-8 items-center justify-center rounded-lg bg-rose-600 text-white shadow-xs hover:bg-rose-700 transition"
                onClick={(event) => {
                  event.stopPropagation();
                  setDirectRemarks("");
                  setDirectError(null);
                  setDirectActionModal({ proposal, type: "disapprove" });
                }}
                title="Disapprove / Return for Technical Issue"
                type="button"
              >
                <X className="size-4" />
              </button>
              <button
                className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-100 hover:text-slate-900 transition"
                onClick={(event) => {
                  event.stopPropagation();
                  openReview(proposal, "overview");
                }}
                title="View Full Proposal"
                type="button"
              >
                <Eye className="size-4" />
              </button>
            </div>
          );
        }

        return (
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
              {actionLabel}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-sans">
        <div className="flex items-center gap-3">
          <span className="h-9 sm:h-10 w-1.5 rounded-full bg-[#0f53b7]" />
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold leading-none text-slate-400">
              <span>Applications</span>
              <span>&gt;</span>
              <span className="font-bold text-[#285497]">
                {lockedProgram ? `${lockedProgram} Program` : "All Programs"}
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black leading-tight tracking-tight text-slate-900">
              Applications
            </h1>
          </div>
        </div>
      </div>

      {/* Modern Segmented Lifecycle Tabs */}
      <div>
        <AnimatedTabs
          layoutId="approvals-lifecycle-tabs"
          activeTab={lifecycleTab}
          onChange={(id) => setLifecycleTab(id as any)}
          tabs={[
            { id: "all", label: "All", count: allCount },
            { id: "review", label: "Under Review", count: newCount },
            { id: "in_process", label: "In Process", count: inProcessCount },
            { id: "for_approval", label: "Executive Approval", count: endorsedCount },
            { id: "approved", label: "Approved", count: approvedCount },
            { id: "disapproved", label: "Disapproved", count: disapprovedCount },
          ]}
        />
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
          fitColumns
          getRowKey={(proposal) => proposal.id}
          onRowClick={(proposal) => openReview(proposal, "overview")}
          searchPlaceholder="Search applications..."
          searchText={(proposal) =>
            `${proposal.id} ${proposal.title} ${proposal.organization} ${proposal.proponentName ?? ""} ${proposal.organizationType ?? ""} ${proposal.program}`
          }
        />
      </section>

      {/* Direct Row Decision Confirmation Modal (Disapprove / Return for Technical Issue) */}
      {directActionModal ? (
        <div
          aria-labelledby="direct-decision-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900" id="direct-decision-title">
                  {directActionModal.type === "return_in_process"
                    ? "Return for Technical Issue"
                    : "Confirm Application Disapproval"}
                </h4>
                <p className="mt-0.5 text-xs text-slate-500 truncate max-w-xs font-mono">
                  {directActionModal.proposal.title} ({directActionModal.proposal.id})
                </p>
              </div>
              <button
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                onClick={() => setDirectActionModal(null)}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-xs font-bold transition",
                  directActionModal.type === "return_in_process"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900",
                )}
                onClick={() => setDirectActionModal({ ...directActionModal, type: "return_in_process" })}
                type="button"
              >
                Return for Technical Issue
              </button>
              <button
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-xs font-bold transition",
                  directActionModal.type === "disapprove"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900",
                )}
                onClick={() => setDirectActionModal({ ...directActionModal, type: "disapprove" })}
                type="button"
              >
                Disapprove
              </button>
            </div>

            <div className="mt-4">
              <label
                className="block text-xs font-bold text-slate-700"
                htmlFor="direct-remarks"
              >
                Remarks / Reason
                <span className="text-rose-500"> *</span>
              </label>
              <textarea
                className="mt-1.5 min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs leading-5 text-slate-900 outline-none transition focus:border-[#0f53b7] focus:bg-white focus:ring-2 focus:ring-blue-100"
                id="direct-remarks"
                onChange={(e) => setDirectRemarks(e.target.value)}
                placeholder={
                  directActionModal.type === "return_in_process"
                    ? "Specify technical or financial clarifications needed from focal person..."
                    : "State formal reason for disapproving this application..."
                }
                rows={3}
                value={directRemarks}
              />
            </div>

            {directError ? (
              <p className="mt-2 text-xs font-semibold text-rose-600">{directError}</p>
            ) : null}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                className="rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                onClick={() => setDirectActionModal(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition disabled:opacity-50",
                  directActionModal.type === "return_in_process"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-rose-600 hover:bg-rose-700",
                )}
                disabled={directSubmitting || !directRemarks.trim()}
                onClick={handleDirectDecision}
                type="button"
              >
                {directSubmitting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <X className="size-3.5" />
                )}
                {directActionModal.type === "return_in_process"
                  ? "Return for Technical Issue"
                  : "Confirm Disapproval"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
