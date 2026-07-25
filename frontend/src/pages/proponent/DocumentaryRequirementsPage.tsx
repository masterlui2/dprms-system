import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  Download,
  Eye,
  FileCheck2,
  FileText,
  FileUp,
  Landmark,
  LoaderCircle,
  RefreshCw,
  Search,
  Trash2,
  UserRoundCheck,
} from "lucide-react";
import { useLocation, useSearchParams } from "react-router-dom";

import Swal from "sweetalert2";
import { ProposalProgress } from "../../components/proponent/ProposalProgress";
import { InitialReviewStageCard } from "../../components/proponent/InitialReviewStageCard";
import { SetupProposalForm } from "../../components/proposal/SetupProposalForm";
import { GiaProposalForm } from "../../components/proposal/GiaProposalForm";
import { getMockUser } from "../../lib/mockAuth";
import {
  deleteDocument,
  fileToStoredDocument,
  getDocumentaryRequirements,
  getDocuments,
  saveDocument,
  type DocumentaryRequirement,
  type RequirementGroup,
  type StoredDocument,
  type VerificationStatus,
} from "../../services/documentStore";
import {
  getApplications,
  saveApplication,
  updateApplicationStatus,
} from "../../services/applicationStore";
import type { ApplicationRecord } from "../../types/application";
import {
  getGiaDraft,
  getGiaProposal,
} from "../../services/giaProposalStore";
import {
  getSetupDraft,
  getSetupProposal,
} from "../../services/setupProposalStore";
import type { GiaProposalData } from "../../types/giaProposal";
import type { SetupProposalData } from "../../types/setupProposal";
import { cn } from "../../utils/cn";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ["pdf", "doc", "docx", "jpg", "jpeg", "png"];
const groupOrder: RequirementGroup[] = [
  "Business Documents",
  "Corporation / Cooperative Documents",
  "Financial Documents",
  "GIA Core Documents",
  "Additional Documents",
];

const statusClasses: Record<VerificationStatus, string> = {
  "Not Uploaded": "bg-slate-100 text-slate-600",
  Uploaded: "bg-blue-50 text-[#0f53b7]",
  "Under Review": "bg-amber-50 text-amber-700",
  Approved: "bg-emerald-50 text-emerald-700",
  "Needs Revision": "bg-red-50 text-red-700",
};

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}



function GroupIcon({ group }: { group: RequirementGroup }) {
  if (group === "Business Documents") return <Building2 className="size-5" />;
  if (group === "Corporation / Cooperative Documents")
    return <Landmark className="size-5" />;
  if (group === "Financial Documents") return <FileText className="size-5" />;
  if (group === "GIA Core Documents") return <FileCheck2 className="size-5" />;
  return <UserRoundCheck className="size-5" />;
}

export function DocumentaryRequirementsPage({ program }: { program?: 'SETUP' | 'GIA' } = {}) {
  const user = getMockUser();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const activeProgram: 'SETUP' | 'GIA' = useMemo(() => {
    if (program) return program;
    if (location.pathname.includes('/gia')) return 'GIA';
    if (location.pathname.includes('/setup')) return 'SETUP';
    return (user?.program as 'SETUP' | 'GIA') || 'SETUP';
  }, [program, location.pathname, user?.program]);
  const [documents, setDocuments] = useState<Record<string, StoredDocument>>(
    {},
  );
  const [draggingRequirement, setDraggingRequirement] = useState<string | null>(
    null,
  );
  const [uploadingRequirement, setUploadingRequirement] = useState<
    string | null
  >(null);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const applications = useMemo(() => {
    const allApplications = getApplications();
    const filtered = allApplications.filter((application) =>
      user?.applicationReference
        ? application.referenceNo === user.applicationReference
        : !user?.email ||
          application.contactEmail.toLowerCase() === user.email.toLowerCase(),
    );
    const matching = filtered.filter((app) => app.program === activeProgram);
    if (matching.length) return matching;
    if (filtered.length) return filtered;
    return allApplications;
  }, [user?.applicationReference, user?.email, activeProgram]);

  const requestedReference = searchParams.get("proposal");
  const baseApplication =
    applications.find((item) => item.referenceNo === requestedReference) ??
    applications[0];

  const activeApplication: ApplicationRecord = useMemo(() => {
    if (baseApplication && baseApplication.program === activeProgram) {
      return baseApplication;
    }
    return {
      id: `${activeProgram.toLowerCase()}-app-1`,
      applicantName: user?.name ?? "Proponent Representative",
      referenceNo: `${activeProgram}-2026-0001`,
      projectTitle:
        activeProgram === "GIA"
          ? "Community Empowerment & Technology Transfer Project"
          : "Enterprise Technology Upgrading Project",
      organizationName: user?.name
        ? `${user.name} Organization`
        : "DOST Proponent Enterprise",
      program: activeProgram,
      status: "Draft Submitted",
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contactName: user?.name ?? "Proponent Representative",
      contactEmail: user?.email ?? "proponent@example.com",
      contactNumber: "09171234567",
    };
  }, [baseApplication, activeProgram, user]);

  const [liveSetupProposal, setLiveSetupProposal] = useState<SetupProposalData | null>(null);
  const [liveGiaProposal, setLiveGiaProposal] = useState<GiaProposalData | null>(null);

  useEffect(() => {
    if (!activeApplication) return;
    if (activeApplication.program === "SETUP") {
      setLiveSetupProposal(getSetupDraft() ?? getSetupProposal(activeApplication.referenceNo));
    } else {
      setLiveGiaProposal(getGiaDraft() ?? getGiaProposal(activeApplication.referenceNo));
    }
  }, [activeApplication]);

  const requirements = useMemo(
    () =>
      activeApplication
        ? getDocumentaryRequirements(
            activeApplication.program,
            liveSetupProposal?.organizationType,
            liveGiaProposal?.proponentCategory,
            liveSetupProposal?.businessSize,
          )
        : [],
    [activeApplication, liveGiaProposal?.proponentCategory, liveSetupProposal?.businessSize, liveSetupProposal?.organizationType],
  );

  useEffect(() => {
    setDocuments(
      activeApplication ? getDocuments(activeApplication.referenceNo) : {},
    );
    setMessage(null);
    setQuery("");
  }, [activeApplication]);

  const requiredRequirements = useMemo(
    () => requirements.filter((item) => item.required),
    [requirements],
  );
  const completedRequiredCount = requiredRequirements.filter(
    (requirement) => documents[requirement.id],
  ).length;

  const overallProgressPercent = useMemo(() => {
    if (!activeApplication) return 0;
    let formFilled = 0;
    let formTotal = 0;

    if (activeApplication.program === "SETUP") {
      if (liveSetupProposal) {
        const requiredFields: (keyof SetupProposalData)[] = [
          'projectTitle', 'businessName', 'businessAddress', 'contactPerson',
          'contactNumber', 'emailAddress', 'organizationType', 'businessSize',
          'businessIndustry', 'productsServices', 'existingProblems', 'proposedTechnologyIntervention'
        ];
        formTotal = requiredFields.length;
        formFilled = requiredFields.filter(f => {
          const v = liveSetupProposal[f];
          return Array.isArray(v) ? v.length > 0 : Boolean(String(v ?? '').trim());
        }).length;
      }
    } else {
      if (liveGiaProposal) {
        const requiredFields: (keyof GiaProposalData)[] = [
          'proponentCategory', 'organizationName', 'officeAddress', 'projectLeader',
          'contactNumber', 'emailAddress', 'projectTitle', 'projectSummary', 'generalObjective'
        ];
        formTotal = requiredFields.length;
        formFilled = requiredFields.filter(f => Boolean(String(liveGiaProposal[f] ?? '').trim())).length;
      }
    }

    const docsTotal = requiredRequirements.length;
    const docsFilled = completedRequiredCount;
    const total = formTotal + docsTotal;

    if (total === 0) return 0;
    return Math.min(100, Math.round(((formFilled + docsFilled) / total) * 100));
  }, [activeApplication, liveSetupProposal, liveGiaProposal, requiredRequirements.length, completedRequiredCount]);
  const requiredComplete =
    requiredRequirements.length > 0 &&
    completedRequiredCount === requiredRequirements.length;
  const normalizedQuery = query.trim().toLowerCase();
  const visibleRequirements = requirements.filter(
    (requirement) =>
      !normalizedQuery ||
      requirement.title.toLowerCase().includes(normalizedQuery) ||
      requirement.group.toLowerCase().includes(normalizedQuery) ||
      requirement.description.toLowerCase().includes(normalizedQuery),
  );

  async function handleFile(requirement: DocumentaryRequirement, file?: File) {
    if (!activeApplication || !file) return;
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setMessage("Please upload a PDF, DOC, DOCX, JPG, or PNG file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setMessage(
        "The selected file is larger than 2 MB. Please upload a smaller file.",
      );
      return;
    }

    setUploadingRequirement(requirement.id);
    try {
      const storedDocument = await fileToStoredDocument(file);
      saveDocument(
        activeApplication.referenceNo,
        requirement.id,
        storedDocument,
      );
      const nextDocuments = getDocuments(activeApplication.referenceNo);
      setDocuments(nextDocuments);
      const allRequiredUploaded =
        requiredRequirements.length > 0 &&
        requiredRequirements.every((item) => nextDocuments[item.id]);

      if (allRequiredUploaded) {
        updateApplicationStatus(activeApplication.referenceNo, "Under review");
        setMessage(
          "All required documents are complete. Your application is ready for DOST initial review.",
        );
      } else {
        setMessage(`${file.name} uploaded successfully.`);
      }
    } catch {
      setMessage("The file could not be saved. Please try a smaller file.");
    } finally {
      setUploadingRequirement(null);
      setDraggingRequirement(null);
    }
  }

  function remove(requirement: DocumentaryRequirement) {
    if (!activeApplication) return;
    if (!window.confirm(`Delete the uploaded file for “${requirement.title}”?`))
      return;

    deleteDocument(activeApplication.referenceNo, requirement.id);
    setDocuments(getDocuments(activeApplication.referenceNo));
    if (requirement.required)
      updateApplicationStatus(activeApplication.referenceNo, "Draft Submitted");
    setMessage("File deleted. You can upload a replacement at any time.");
  }

  const handleStartApplication = (programType: "SETUP" | "GIA") => {
    const referenceNo = `${programType}-${new Date().getFullYear()}-${Math.floor(
      1000 + Math.random() * 9000,
    )}`;
    const newApp: ApplicationRecord = {
      applicantName: user?.name || "Proponent User",
      contactEmail: user?.email || "proponent@dost.gov.ph",
      createdAt: new Date().toISOString(),
      id: crypto.randomUUID(),
      organizationName: "",
      program: programType,
      projectTitle:
        programType === "SETUP"
          ? "SETUP Technology Transfer & Upgrade Proposal"
          : "GIA Research & Community Innovation Project",
      referenceNo,
      status: "Draft Submitted",
    };
    saveApplication(newApp);
    window.location.reload();
  };

  return (
    <div className="space-y-7 pb-4">

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f53b7]">
            {activeProgram === "GIA" ? "GIA Proposal Workspace" : "SETUP Application Workspace"}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#073b82] sm:text-4xl">
            {activeProgram === "GIA" ? "My Proposal" : "My Application"}
          </h1>
        </div>
      </header>

      {!activeApplication ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm sm:p-12">
          <FileCheck2 className="mx-auto size-12 text-[#0f53b7]" />
          <h2 className="mt-4 text-xl font-black text-slate-900">
            No Active {activeProgram} Application
          </h2>
          <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-slate-500">
            You do not have an active proposal application. Click below to start your online proposal and document submission.
          </p>
          <div className="mt-6 flex items-center justify-center">
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0f53b7] px-8 text-xs font-bold text-white shadow-sm transition hover:bg-[#0d479e]"
              onClick={() => handleStartApplication(activeProgram)}
              type="button"
            >
              {activeProgram === "SETUP" ? "Submit SETUP Application" : "Submit GIA Proposal"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="min-w-[280px] flex-1">
                <div className="flex items-center justify-between gap-3 text-sm font-bold text-slate-800">
                  <span className="text-base font-black text-[#073b82]">
                    {activeApplication.program === "SETUP" ? "SETUP" : "GIA"} Application — {activeApplication.status === "Draft Submitted" ? "Stage 1: Proposal & Documents" : "Stage 2: DOST Initial Review"}
                  </span>
                  {activeApplication.status === "Draft Submitted" ? (
                    <span className="font-mono text-xs font-bold text-[#0f53b7]">{overallProgressPercent}% Overall Progress</span>
                  ) : (
                    <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      ✓ Submitted
                    </span>
                  )}
                </div>
                {activeApplication.status === "Draft Submitted" ? (
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/60">
                    <div
                      className="h-full rounded-full bg-[#0f53b7] transition-all duration-300"
                      style={{ width: `${overallProgressPercent}%` }}
                    />
                  </div>
                ) : null}
              </div>
              {activeApplication.status === "Draft Submitted" ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 shrink-0">
                  <Check className="size-3.5 text-emerald-600" />
                  <span>Draft saved</span>
                </div>
              ) : null}
            </div>
            <div className="pt-6">
              <ProposalProgress
                application={activeApplication}
                documentsComplete={requiredComplete}
                compact
              />
            </div>
          </section>

          {/* Stage 2+ Review / DOST Initial Review Stage View */}
          {activeApplication.status !== "Draft Submitted" ? (
            <InitialReviewStageCard application={activeApplication} />
          ) : (
            <>
              {/* Stage 1: Continuous Single Page Layout (Proposal Form + Attached Documents) */}
              <section className="space-y-6">
                {activeApplication.program === "GIA" ? (
                  <GiaProposalForm onDraftChange={setLiveGiaProposal} />
                ) : (
                  <SetupProposalForm onDraftChange={setLiveSetupProposal} />
                )}
              </section>

          {/* Attached Documents Section (Lower Page Divider) */}
          {requirements.length ? (
            <div className="mt-8 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Attached Documentary Requirements</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Upload required supporting documents to accompany your proposal submission.</p>
                </div>
                <label className="relative block w-full sm:w-72">
                  <span className="sr-only">
                    Search supporting document checklist
                  </span>
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search required documents..."
                    type="search"
                    value={query}
                  />
                </label>
              </div>

              {message ? (
                <div
                  className="flex items-start justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-[#073b82]"
                  role="status"
                >
                  <span>{message}</span>
                  <button
                    aria-label="Dismiss message"
                    className="shrink-0 text-lg leading-none"
                    onClick={() => setMessage(null)}
                    type="button"
                  >
                    ×
                  </button>
                </div>
              ) : null}

              <div className="space-y-5">
                {groupOrder.map((group) => {
                  const groupRequirements = visibleRequirements.filter(
                    (requirement) => requirement.group === group,
                  );
                  if (!groupRequirements.length) return null;
                  const groupUploaded = groupRequirements.filter(
                    (requirement) => documents[requirement.id],
                  ).length;

                  return (
                    <section
                      className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70"
                      key={group}
                    >
                      <div className="flex flex-col gap-3 bg-[#f8fbff] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div className="flex items-center gap-3">
                          <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]">
                            <GroupIcon group={group} />
                          </span>
                          <div>
                            <h2 className="font-black text-slate-900">
                              {group}
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {groupUploaded} of {groupRequirements.length}{" "}
                              uploaded
                            </p>
                          </div>
                        </div>
                        {group === "Corporation / Cooperative Documents" ? (
                          <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-700">
                            Required for Corporations / Cooperatives
                          </span>
                        ) : null}
                        {group === "Additional Documents" && activeProgram === "GIA" && liveGiaProposal?.proponentCategory ? (
                          <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
                            Required for {liveGiaProposal.proponentCategory}
                          </span>
                        ) : null}
                      </div>

                      {group === "Financial Documents" ? (
                        <div className="border-t border-blue-100 bg-blue-50/70 px-5 py-3 text-xs leading-5 text-[#073b82] sm:px-6">
                          <span className="font-bold">Official Requirement Note:</span> Financial Statements for the past three (3) years for Small and Medium enterprises and at least one (1) year for microenterprises together with notarized Sworn Statement from the proponent that all information provided are correct and true.
                        </div>
                      ) : null}

                      <div className="hidden grid-cols-[minmax(0,1.7fr)_minmax(310px,1fr)] gap-5 border-y border-slate-100 bg-white px-6 py-3 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 lg:grid">
                        <span>Document name</span>
                        <span>Verification and actions</span>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {groupRequirements.map((requirement) => {
                          const storedDocument = documents[requirement.id];
                          const status: VerificationStatus =
                            storedDocument?.verificationStatus ??
                            "Not Uploaded";
                          const isDragging =
                            draggingRequirement === requirement.id;
                          const isUploading =
                            uploadingRequirement === requirement.id;
                          const isMissingRequired = !storedDocument && requirement.required;

                          return (
                            <article
                              className={cn(
                                "grid gap-4 px-5 py-5 transition sm:px-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(310px,1fr)] lg:items-center lg:gap-5",
                                isDragging &&
                                  "bg-blue-50 ring-2 ring-inset ring-[#0f53b7]",
                                isMissingRequired &&
                                  "bg-red-50/40 border-l-4 border-l-red-500",
                              )}
                              id={`requirement-${requirement.id}`}
                              key={requirement.id}
                              onDragEnter={(event) => {
                                event.preventDefault();
                                setDraggingRequirement(requirement.id);
                              }}
                              onDragLeave={(event) => {
                                if (
                                  !event.currentTarget.contains(
                                    event.relatedTarget as Node | null,
                                  )
                                )
                                  setDraggingRequirement(null);
                              }}
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={(event) => {
                                event.preventDefault();
                                void handleFile(
                                  requirement,
                                  event.dataTransfer.files[0],
                                );
                              }}
                            >
                              <div className="flex min-w-0 items-start gap-3">
                                <span
                                  className={cn(
                                    "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border-2",
                                    storedDocument
                                      ? "border-emerald-500 bg-emerald-500 text-white"
                                      : isMissingRequired
                                        ? "border-red-400 bg-red-50 text-red-500"
                                        : "border-slate-200 text-slate-300",
                                  )}
                                >
                                  {storedDocument ? (
                                    <Check className="size-4" strokeWidth={3} />
                                  ) : (
                                    <FileText className="size-3.5" />
                                  )}
                                </span>
                                <div className="min-w-0">
                                  <h3 className="font-bold leading-6 text-slate-900">
                                    {requirement.title}
                                    {requirement.required ? (
                                      <span
                                        className="ml-1 text-red-600 font-extrabold"
                                        aria-label="required"
                                      >
                                        *
                                      </span>
                                    ) : (
                                      <span className="ml-2 text-xs font-semibold text-slate-400">
                                        Optional
                                      </span>
                                    )}
                                  </h3>
                                  {requirement.instructions ? (
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                      {requirement.instructions}
                                    </p>
                                  ) : requirement.description ? (
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                      {requirement.description}
                                    </p>
                                  ) : null}
                                  {storedDocument ? (
                                    <p
                                      className="mt-2 truncate text-xs font-semibold text-slate-600"
                                      title={storedDocument.fileName}
                                    >
                                      {storedDocument.fileName} ·{" "}
                                      {formatSize(storedDocument.fileSize)}
                                    </p>
                                  ) : null}
                                </div>
                              </div>

                              <div className="space-y-3">
                                {isMissingRequired ? (
                                  <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-700 border border-red-200">
                                    Required — Not Uploaded
                                  </span>
                                ) : status !== "Not Uploaded" && status !== "Uploaded" ? (
                                  <span
                                    className={cn(
                                      "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold",
                                      statusClasses[status],
                                    )}
                                  >
                                    {status}
                                  </span>
                                ) : null}
                                <div className="flex flex-wrap gap-2">
                                  {requirement.templateUrl ? (
                                    <a
                                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-[#0f53b7] transition hover:bg-blue-100"
                                      download
                                      href={requirement.templateUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Download className="size-3.5" />
                                      Download Template
                                    </a>
                                  ) : null}
                                  <label
                                    className={cn(
                                      "inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#0f53b7] px-3.5 text-xs font-bold text-white transition hover:bg-[#0b3f8b]",
                                      isUploading &&
                                        "pointer-events-none opacity-70",
                                    )}
                                  >
                                    {isUploading ? (
                                      <LoaderCircle className="size-3.5 animate-spin" />
                                    ) : storedDocument ? (
                                      <RefreshCw className="size-3.5" />
                                    ) : (
                                      <FileUp className="size-3.5" />
                                    )}
                                    {isUploading
                                      ? "Uploading"
                                      : storedDocument
                                        ? "Replace File"
                                        : "Upload"}
                                    <input
                                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                      className="sr-only"
                                      disabled={isUploading}
                                      onChange={(event) => {
                                        void handleFile(
                                          requirement,
                                          event.target.files?.[0],
                                        );
                                        event.target.value = "";
                                      }}
                                      type="file"
                                    />
                                  </label>
                                  {storedDocument ? (
                                    <>
                                      <button
                                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                                        onClick={() =>
                                          window.open(
                                            storedDocument.dataUrl,
                                            "_blank",
                                            "noopener,noreferrer",
                                          )
                                        }
                                        type="button"
                                      >
                                        <Eye className="size-3.5" />
                                        View File
                                      </button>
                                      <button
                                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-100 px-3 text-xs font-bold text-red-600 transition hover:bg-red-50"
                                        onClick={() => remove(requirement)}
                                        type="button"
                                      >
                                        <Trash2 className="size-3.5" />
                                        Delete File
                                      </button>
                                    </>
                                  ) : null}
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}

                {!visibleRequirements.length ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                    <Search className="mx-auto size-8 text-slate-300" />
                    <p className="mt-3 font-bold text-slate-700">
                      No documents match “{query}”
                    </p>
                    <button
                      className="mt-3 text-sm font-bold text-[#0f53b7]"
                      onClick={() => setQuery("")}
                      type="button"
                    >
                      Clear search
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end pt-4 pb-8">
                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0f53b7] px-8 text-sm font-bold text-white shadow-md hover:bg-[#0d479e] transition hover:shadow-lg"
                  onClick={() => {
                    if (!activeApplication) return;
                    const missingRequiredDocs = requiredRequirements.filter(
                      (req) => !documents[req.id]
                    );

                    if (missingRequiredDocs.length > 0 || !requiredComplete) {
                      const firstMissing = missingRequiredDocs[0];
                      const missingTitles = missingRequiredDocs.map((d) => d.title).join(", ");
                      setMessage(`⚠️ Cannot submit application. Please upload the following required document${missingRequiredDocs.length === 1 ? '' : 's'}: ${missingTitles}`);
                      
                      if (firstMissing) {
                        const targetEl = document.getElementById(`requirement-${firstMissing.id}`);
                        if (targetEl) {
                          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          return;
                        }
                      }
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      return;
                    }
                    const updatedApp: ApplicationRecord = {
                      ...activeApplication,
                      status: "Under review",
                    };
                    saveApplication(updatedApp);
                    updateApplicationStatus(activeApplication.referenceNo, "Under review");
                    Swal.fire({
                      title: "Application Submitted Successfully!",
                      html: `
                        <div style="font-family: sans-serif; text-align: center;" class="space-y-3">
                          <p style="font-size: 13px; color: #475569; margin-top: 8px;">
                            Your application (<strong style="font-family: monospace; color: #0f53b7;">${activeApplication.referenceNo}</strong>) has been officially submitted to DOST PSTO.
                          </p>
                          <div style="background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 16px; padding: 16px; text-align: left; margin-top: 14px;">
                            <p style="font-size: 12px; font-weight: 700; color: #073b82; margin: 0 0 4px 0;">
                              Stage 2 Active: DOST Initial Review
                            </p>
                            <p style="font-size: 11px; color: #475569; margin: 0; line-height: 1.5;">
                              ${
                                activeApplication.program === "SETUP"
                                  ? "Your application is scheduled for a Technology Needs Assessment (TNA) site visit by DOST PSTO."
                                  : "Your GIA proposal is currently under technical review by the DOST evaluation committee."
                              }
                            </p>
                          </div>
                        </div>
                      `,
                      icon: "success",
                      showConfirmButton: false,
                      timer: 1600,
                      timerProgressBar: true,
                    }).then(() => {
                      window.location.reload();
                    });
                  }}
                  type="button"
                >
                  Submit Application
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </>
  )}
    </div>
  );
}
