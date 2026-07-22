import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
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
import { Link, useSearchParams } from "react-router-dom";

import { ProposalProgress } from "../../components/proponent/ProposalProgress";
import { isSampleSetupApplication } from "../../data/sampleSetupProposal";
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
  updateApplicationStatus,
} from "../../services/applicationStore";
import { getGiaProposal } from "../../services/giaProposalStore";
import { getSetupProposal } from "../../services/setupProposalStore";
import { cn } from "../../utils/cn";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ["pdf", "doc", "docx", "jpg", "jpeg", "png"];
const groupOrder: RequirementGroup[] = [
  "Business Documents",
  "Corporation / Cooperative Documents",
  "Financial Documents",
  "Additional Documents",
  "GIA Core Documents",
  "Category-specific Documents",
];

const statusClasses: Record<VerificationStatus, string> = {
  "Not Uploaded": "bg-slate-100 text-slate-600",
  Uploaded: "bg-blue-50 text-[#0f53b7]",
  "Under Review": "bg-amber-50 text-amber-700",
  Approved: "bg-emerald-50 text-emerald-700",
  "Needs Revision": "bg-red-50 text-red-700",
};

const compactNotes: Partial<Record<string, string>> = {
  "recent-mayors-permit": "Must show the firm’s line of business.",
  "three-equipment-quotations":
    "Upload one PDF containing all three quotations.",
  "manufacturing-space-lease": "Only if the manufacturing space is rented.",
  "government-id-approved-signatory": "Include three specimen signatures.",
  "gia-private-registration": "Include the registration, articles, and by-laws.",
  "gia-private-financial-statements": "Submit the past three years.",
  "gia-private-board-resolution": "Must identify the authorized representative.",
  "gia-barangay-official-bond": "The amount must cover the grant.",
  "gia-barangay-project-track-record": "Upload when previous projects are available.",
};

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatUploadDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function GroupIcon({ group }: { group: RequirementGroup }) {
  if (group === "Business Documents") return <Building2 className="size-5" />;
  if (group === "Corporation / Cooperative Documents")
    return <Landmark className="size-5" />;
  if (group === "Financial Documents") return <FileText className="size-5" />;
  if (group === "GIA Core Documents") return <FileCheck2 className="size-5" />;
  return <UserRoundCheck className="size-5" />;
}

export function DocumentaryRequirementsPage() {
  const user = getMockUser();
  const registrationPath =
    user?.program === "GIA"
      ? "/programs/gia/register"
      : "/programs/setup/register";
  const [searchParams, setSearchParams] = useSearchParams();
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
    const accountApplications = allApplications.filter((application) =>
      user?.applicationReference
        ? application.referenceNo === user.applicationReference
        : !user?.email ||
          application.contactEmail.toLowerCase() === user.email.toLowerCase(),
    );

    if (accountApplications.length || user?.program !== "SETUP")
      return accountApplications;
    return allApplications.filter((application) =>
      isSampleSetupApplication(application.referenceNo),
    );
  }, [user?.applicationReference, user?.email, user?.program]);

  const requestedReference = searchParams.get("proposal");
  const activeApplication =
    applications.find((item) => item.referenceNo === requestedReference) ??
    applications[0];
  const setupProposal =
    activeApplication?.program === "SETUP"
      ? getSetupProposal(activeApplication.referenceNo)
      : null;
  const giaProposal =
    activeApplication?.program === "GIA"
      ? getGiaProposal(activeApplication.referenceNo)
      : null;
  const requirements = useMemo(
    () =>
      activeApplication
        ? getDocumentaryRequirements(
            activeApplication.program,
            setupProposal?.organizationType,
            giaProposal?.proponentCategory,
          )
        : [],
    [activeApplication, giaProposal?.proponentCategory, setupProposal?.organizationType],
  );

  useEffect(() => {
    setDocuments(
      activeApplication ? getDocuments(activeApplication.referenceNo) : {},
    );
    setMessage(null);
    setQuery("");
  }, [activeApplication]);

  const requiredRequirements = requirements.filter(
    (requirement) => requirement.required,
  );
  const completedRequiredCount = requiredRequirements.filter(
    (requirement) => documents[requirement.id],
  ).length;
  const uploadedCount = requirements.filter(
    (requirement) => documents[requirement.id],
  ).length;
  const requiredComplete =
    requiredRequirements.length > 0 &&
    completedRequiredCount === requiredRequirements.length;
  const progressPercent = requiredRequirements.length
    ? Math.round((completedRequiredCount / requiredRequirements.length) * 100)
    : 0;
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

  function focusNextMissing() {
    const nextRequirement = requiredRequirements.find(
      (requirement) => !documents[requirement.id],
    );
    if (!nextRequirement) return;
    document
      .getElementById(`requirement-${nextRequirement.id}`)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  }

  return (
    <div className="space-y-7 pb-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f53b7]">
            Application Stage
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#073b82] sm:text-4xl">
            Supporting Documents
          </h1>
        </div>
        {activeApplication ? (
          <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-[#0f53b7]">
            {activeApplication.program}{" "}
            {isSampleSetupApplication(activeApplication.referenceNo)
              ? "sample application"
              : "application"}
          </span>
        ) : null}
      </header>

      {!activeApplication ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <FileCheck2 className="mx-auto size-11 text-slate-300" />
          <h2 className="mt-4 text-lg font-black text-slate-800">
            Submit a proposal first
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Supporting document uploads become available after proposal
            submission.
          </p>
          <Link
            className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white"
            to={registrationPath}
          >
            Register Proposal
          </Link>
        </div>
      ) : (
        <>
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-7">
            <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-xs font-bold text-[#0f53b7]">
                    {activeApplication.referenceNo}
                  </p>
                  {isSampleSetupApplication(activeApplication.referenceNo) ? (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700">
                      Sample data
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-1 truncate text-lg font-black text-slate-900">
                  {activeApplication.projectTitle}
                </h2>
              </div>
              {applications.length > 1 ? (
                <label className="block w-full max-w-md text-xs font-bold text-slate-600">
                  Select proposal
                  <select
                    className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                    onChange={(event) =>
                      setSearchParams({ proposal: event.target.value })
                    }
                    value={activeApplication.referenceNo}
                  >
                    {applications.map((application) => (
                      <option
                        key={application.id}
                        value={application.referenceNo}
                      >
                        {application.referenceNo} — {application.projectTitle}
                      </option>
                    ))}
                  </select>
                </label>
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

          {requirements.length ? (
            <>
              <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)] lg:items-center">
                  <div>
                    <div className="flex items-center justify-between gap-4 text-sm font-bold text-slate-700">
                      <span>Required upload progress</span>
                      <span className="text-[#0f53b7]">
                        {completedRequiredCount} of{" "}
                        {requiredRequirements.length} complete
                      </span>
                    </div>
                    <div
                      className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-label="Required supporting documents uploaded"
                      aria-valuemax={100}
                      aria-valuemin={0}
                      aria-valuenow={progressPercent}
                    >
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {uploadedCount} file{uploadedCount === 1 ? "" : "s"}{" "}
                      uploaded · PDF, DOCX, JPG or PNG · Maximum 2 MB
                    </p>
                  </div>
                  <label className="relative block">
                    <span className="sr-only">
                      Search supporting document checklist
                    </span>
                    <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:bg-white focus:ring-4 focus:ring-blue-100"
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search the checklist"
                      type="search"
                      value={query}
                    />
                  </label>
                </div>
              </section>

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
                            Required for {setupProposal?.organizationType}
                          </span>
                        ) : null}
                        {group === "Category-specific Documents" ? (
                          <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
                            Required for {giaProposal?.proponentCategory}
                          </span>
                        ) : null}
                      </div>

                      <div className="hidden grid-cols-[minmax(0,1.7fr)_170px_minmax(310px,1fr)] gap-5 border-y border-slate-100 bg-white px-6 py-3 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 lg:grid">
                        <span>Document name</span>
                        <span>Upload date</span>
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

                          return (
                            <article
                              className={cn(
                                "grid gap-4 px-5 py-5 transition sm:px-6 lg:grid-cols-[minmax(0,1.7fr)_170px_minmax(310px,1fr)] lg:items-center lg:gap-5",
                                isDragging &&
                                  "bg-blue-50 ring-2 ring-inset ring-[#0f53b7]",
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
                                        className="ml-1 text-red-600"
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
                                  {compactNotes[requirement.id] ? (
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                      {compactNotes[requirement.id]}
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

                              <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400 lg:hidden">
                                  Upload date
                                </p>
                                <p
                                  className={cn(
                                    "mt-1 text-xs font-semibold lg:mt-0",
                                    storedDocument
                                      ? "text-slate-700"
                                      : "text-slate-400",
                                  )}
                                >
                                  {formatUploadDate(storedDocument?.uploadedAt)}
                                </p>
                              </div>

                              <div className="space-y-3">
                                <span
                                  className={cn(
                                    "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold",
                                    statusClasses[status],
                                  )}
                                >
                                  {status === "Not Uploaded"
                                    ? "Pending"
                                    : status}
                                </span>
                                <div className="flex flex-wrap gap-2">
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

              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-full",
                      requiredComplete
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-50 text-[#0f53b7]",
                    )}
                  >
                    {requiredComplete ? (
                      <CheckCircle2 className="size-5" />
                    ) : (
                      <FileUp className="size-5" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-black text-slate-900">
                      {requiredComplete
                        ? "Final document upload complete"
                        : `${requiredRequirements.length - completedRequiredCount} document${requiredRequirements.length - completedRequiredCount === 1 ? "" : "s"} still needed`}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {requiredComplete
                        ? "Your application is ready for DOST initial review."
                        : "Complete the checklist for final submission."}
                    </p>
                  </div>
                </div>
                {requiredComplete ? (
                  <Link
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white"
                    to="/dashboard/application-status"
                  >
                    View Application Status
                    <ArrowRight className="size-4" />
                  </Link>
                ) : (
                  <button
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white"
                    onClick={focusNextMissing}
                    type="button"
                  >
                    Submit Documents
                    <FileUp className="size-4" />
                  </button>
                )}
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
