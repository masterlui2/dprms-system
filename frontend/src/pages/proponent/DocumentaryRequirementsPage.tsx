import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
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
import type { SetupProposalFormHandle } from "../../components/proposal/SetupProposalForm";
import { GiaProposalForm } from "../../components/proposal/GiaProposalForm";
import type { GiaProposalFormHandle } from "../../components/proposal/GiaProposalForm";
import { getMockUser } from "../../lib/mockAuth";
import {
  deleteDocument,
  deleteDocumentRecord,
  documentRecordToStoredDocument,
  fetchDocumentBlobUrl,
  fetchGiaDocumentaryRequirements,
  fetchProposalDocuments,
  fetchSetupDocumentaryRequirements,
  fileToStoredDocument,
  getDocuments,
  saveDocument,
  uploadDocument,
  type DocumentaryRequirement,
  type RequirementGroup,
  type StoredDocument,
  type VerificationStatus,
} from "../../services/documentStore";
import {
  getApplications,
  saveApplication,
  syncUserApplicationsFromBackend,
  updateApplicationStatus,
} from "../../services/applicationStore";
import { resubmitProposal } from "../../services/proposalStore";
import { getSetupProposalId, submitSetupProposal } from "../../services/setupProposalStore";
import type { ApplicationRecord } from "../../types/application";
import {
  getGiaDraft,
  getGiaProposal,
  getGiaProposalId,
  submitGiaProposal,
} from "../../services/giaProposalStore";
import type { GiaProposalData } from "../../types/giaProposal";
import type { SetupProposalData } from "../../types/setupProposal";
import { cn } from "../../utils/cn";

// Both SETUP and GIA now go through the real /documents API —
// StoreDocumentRequest only accepts PDF up to 10MB (mimes:pdf|max:10240)
// regardless of program, so the UI has to match or every non-PDF /
// oversized upload will 422 after passing the client-side check.
const BACKEND_MAX_FILE_SIZE = 10 * 1024 * 1024;
const BACKEND_ACCEPTED_EXTENSIONS = ["pdf"];
const groupOrder: RequirementGroup[] = [
  "Business Documents",
  "Corporation / Cooperative Documents",
  "Financial Documents",
  "GIA Core Documents",
  "Additional Documents",
];

const statusClasses: Record<VerificationStatus, string> = {
  "Not Uploaded": "bg-slate-100 text-slate-600",
  "Pending Upload": "bg-blue-50 text-[#0f53b7]",
  Uploaded: "bg-blue-50 text-[#0f53b7]",
  "Under Review": "bg-amber-50 text-amber-700",
  Approved: "bg-emerald-50 text-emerald-700",
  "Needs Revision": "bg-red-50 text-red-700",
};

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function extractUploadErrorMessage(error: unknown): string {
  const response = (error as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } })?.response;
  if (response?.data?.errors) {
    const backendMessage = Object.values(response.data.errors).flat().join(" ");
    if (backendMessage) return backendMessage;
  }
  if (response?.data?.message) {
    return response.data.message;
  }
  return "Could not submit application. Please check that all required fields and documents are uploaded.";
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
  // Numeric backend proposals.id for the active application (SETUP or GIA),
  // resolved below (from activeApplication.proposalId, falling back to a
  // lookup by referenceNo). Needed for every real /documents call —
  // StoreDocumentRequest requires proposal_id, not the local referenceNo
  // string.
  const [activeProposalId, setActiveProposalId] = useState<number | null>(null);
  // Files picked before the proposal exists on the backend, keyed by
  // document_type_id. There's no proposal_id to upload against yet, so
  // these sit here until "Submit Application" creates the proposal and
  // uploads them in one pass.
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
  const setupFormRef = useRef<SetupProposalFormHandle>(null);
  const giaFormRef = useRef<GiaProposalFormHandle>(null);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [isResubmittingRevision, setIsResubmittingRevision] = useState(false);
  const [allApplicationsList, setAllApplicationsList] = useState<ApplicationRecord[]>(() => getApplications());

  useEffect(() => {
    let cancelled = false;

    async function refreshApplications() {
      const currentUser = getMockUser();
      if (!currentUser) return;
      const apps = await syncUserApplicationsFromBackend(currentUser);
      if (!cancelled && apps.length > 0) setAllApplicationsList(apps);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") void refreshApplications();
    }

    void refreshApplications();
    window.addEventListener("focus", refreshApplications);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", refreshApplications);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user?.id, user?.email, user?.applicationReference]);

  const applications = useMemo(() => {
    const ownedApplications = allApplicationsList.filter(
      (application) =>
        !user?.email ||
        application.contactEmail.toLowerCase() === user.email.toLowerCase(),
    );

    const programApplications = ownedApplications.filter(
      (application) => application.program === activeProgram,
    );

    if (user?.applicationReference) {
      const referencedApplication = programApplications.find(
        (application) =>
          application.referenceNo === user.applicationReference,
      );
      if (referencedApplication) return [referencedApplication];
    }

    // Do NOT fall back to all applications — a fresh user has no application
    // for this program and must not inherit another program's revision state.
    return programApplications;
  }, [user?.applicationReference, user?.email, activeProgram, allApplicationsList]);

  const requestedReference = searchParams.get("proposal");
  const baseApplication =
    applications.find((item) => item.referenceNo === requestedReference) ??
    applications[0];

  const activeApplication = useMemo(
    () =>
      baseApplication?.program === activeProgram ? baseApplication : null,
    [baseApplication, activeProgram],
  );
  const isDraftMode = activeApplication?.status === "Draft Submitted";
  const isRevisionMode = activeApplication?.status === "Returned for Revision";

  const [liveSetupProposal, setLiveSetupProposal] = useState<SetupProposalData | null>(null);
  const [liveGiaProposal, setLiveGiaProposal] = useState<GiaProposalData | null>(null);

  useEffect(() => {
    if (!activeApplication) return;
    if (activeApplication.program !== "SETUP") {
      setLiveGiaProposal(getGiaDraft() ?? getGiaProposal(activeApplication.referenceNo));
    }
    // SETUP's liveSetupProposal is populated by SetupProposalForm's onDraftChange.
  }, [activeApplication]);

  const [requirements, setRequirements] = useState<DocumentaryRequirement[]>([]);
  // Tracks the params of the most recently *issued* requirements fetch
  // (SETUP or GIA), and a monotonically increasing id so we can ignore
  // stale/duplicate requests.
  const requirementsFetchRef = useRef<{ key: string; requestId: number }>({
    key: "",
    requestId: 0,
  });

  useEffect(() => {
    if (!activeApplication) {
      setRequirements([]);
      return;
    }
    if (activeApplication.program === "SETUP") {
      const key = `SETUP|${activeApplication.referenceNo}|${liveSetupProposal?.organizationType ?? ""}|${liveSetupProposal?.businessSize ?? ""}`;
      // Same reference + org type + business size as the in-flight/last
      // request — skip. This is what was firing the request repeatedly
      // (and hammering /api/document-types) whenever liveSetupProposal
      // changed identity without its relevant fields actually changing.
      if (requirementsFetchRef.current.key === key) return;
      requirementsFetchRef.current.key = key;
      const requestId = ++requirementsFetchRef.current.requestId;

      fetchSetupDocumentaryRequirements(
        liveSetupProposal?.organizationType,
        liveSetupProposal?.businessSize,
      )
        .then((records) => {
          // Only apply the response if this is still the latest request —
          // prevents an older, slower response from clobbering a newer one.
          if (requirementsFetchRef.current.requestId === requestId) {
            setRequirements(records);
          }
        })
        .catch(() => {
          // Don't blank out a document list the user is already seeing
          // just because one fetch (possibly stale) failed. Only clear
          // if we don't have anything on screen yet.
          if (requirementsFetchRef.current.requestId === requestId) {
            setRequirements((current) => (current.length ? current : []));
          }
        });
      return;
    }

    const key = `GIA|${activeApplication.referenceNo}|${liveGiaProposal?.proponentCategory ?? ""}`;
    if (requirementsFetchRef.current.key === key) return;
    requirementsFetchRef.current.key = key;
    const requestId = ++requirementsFetchRef.current.requestId;

    fetchGiaDocumentaryRequirements(liveGiaProposal?.proponentCategory)
      .then((records) => {
        if (requirementsFetchRef.current.requestId === requestId) {
          setRequirements(records);
        }
      })
      .catch(() => {
        if (requirementsFetchRef.current.requestId === requestId) {
          setRequirements((current) => (current.length ? current : []));
        }
      });
  }, [
    activeApplication,
    liveGiaProposal?.proponentCategory,
    liveSetupProposal?.businessSize,
    liveSetupProposal?.organizationType,
  ]);

  useEffect(() => {
    setMessage(null);
    setQuery("");

    if (!activeApplication) {
      setDocuments({});
      setActiveProposalId(null);
      return;
    }

    let cancelled = false;
    setDocuments({});

    (async () => {
      // Only resolve proposal ID against backend if this is an actual submitted baseApplication
      const isDraft = !baseApplication || activeApplication.referenceNo.endsWith("-DRAFT");
      const proposalId = isDraft
        ? null
        : (activeApplication.proposalId ??
          (activeApplication.program === "SETUP"
            ? await getSetupProposalId(activeApplication.referenceNo)
            : await getGiaProposalId(activeApplication.referenceNo)));

      if (cancelled) return;

      if (!proposalId) {
        // This application only exists locally / hasn't synced with the
        // backend (e.g. the synthetic fallback record built above when no
        // matching submitted application is found, or a submission that
        // fell back to local-only after a backend error). Fall back to
        // whatever's cached in local storage instead of a real fetch.
        setActiveProposalId(null);
        setDocuments(getDocuments(activeApplication.referenceNo));
        return;
      }

      setActiveProposalId(proposalId);
      try {
        const records = await fetchProposalDocuments(proposalId);
        if (!cancelled) setDocuments(records);
      } catch {
        if (!cancelled) {
          setMessage(
            "Could not load your uploaded documents. Please refresh the page.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeApplication, baseApplication]);

  const requiredRequirements = useMemo(
    () => requirements.filter((item) => item.required),
    [requirements],
  );
  const completedRequiredCount = requiredRequirements.filter(
    (requirement) => documents[requirement.id] || pendingFiles[requirement.id],
  ).length;

  const overallProgressPercent = useMemo(() => {
    if (!activeApplication) return 0;
    let formFilled = 0;
    let formTotal = 0;

    if (activeApplication.program === "SETUP") {
      if (liveSetupProposal) {
        const requiredFields: (keyof SetupProposalData)[] = [
          'projectTitle', 'generalObjective', 'specificObjectives', 'projectBackground',
          'businessName', 'businessAddress', 'contactPerson', 'contactNumber',
          'emailAddress', 'yearEstablished', 'organizationType', 'businessSize',
          'numberOfEmployees', 'businessIndustry', 'productsServices', 'enterpriseBackground',
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
  const revisionDocuments = Object.entries(documents).filter(
    ([, document]) => document.verificationStatus === "Needs Revision",
  );
  const revisionItems = revisionDocuments.map(([requirementId, document]) => ({
    document,
    requirementId,
    title:
      requirements.find((requirement) => requirement.id === requirementId)?.title ??
      document.fileName,
  }));
  const visibleRequirements = requirements.filter(
    (requirement) =>
      (!isRevisionMode || Boolean(documents[requirement.id])) &&
      (!normalizedQuery ||
        requirement.title.toLowerCase().includes(normalizedQuery) ||
        requirement.group.toLowerCase().includes(normalizedQuery) ||
        requirement.description.toLowerCase().includes(normalizedQuery)),
  );

  async function handleFile(requirement: DocumentaryRequirement, file?: File) {
    if (!activeApplication || !file) return;
    if (
      isRevisionMode &&
      documents[requirement.id]?.verificationStatus !== "Needs Revision"
    ) {
      setMessage("Only documents marked Needs Revision can be replaced.");
      return;
    }
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

    if (!BACKEND_ACCEPTED_EXTENSIONS.includes(extension)) {
      setMessage("Please upload a PDF file.");
      return;
    }
    if (file.size > BACKEND_MAX_FILE_SIZE) {
      setMessage(
        `The selected file is larger than ${formatSize(BACKEND_MAX_FILE_SIZE)}. Please upload a smaller file.`,
      );
      return;
    }

    setUploadingRequirement(requirement.id);
    try {
      let nextDocuments: Record<string, StoredDocument>;

      if (!activeProposalId) {
        // Hold the file locally with visual loading transition,
        // to be uploaded when "Submit Application" is clicked.
        await new Promise((resolve) => setTimeout(resolve, 450));
        setPendingFiles((current) => ({
          ...current,
          [requirement.id]: file,
        }));
        setMessage(
          `${file.name} attached. It will be submitted with your application.`,
        );
        return;
      }
      // The backend replaces the existing proposal/document-type record
      // without deleting the reviewed file before the new upload succeeds.
      const stored = await uploadDocument(
        activeProposalId,
        requirement.id,
        file,
      );
      nextDocuments = { ...documents, [requirement.id]: stored };
      setPendingFiles((current) => {
        if (!(requirement.id in current)) return current;
        const next = { ...current };
        delete next[requirement.id];
        return next;
      });

      setDocuments(nextDocuments);
      const allRequiredUploaded =
        requiredRequirements.length > 0 &&
        requiredRequirements.every((item) => nextDocuments[item.id]);

      if (isRevisionMode) {
        setMessage(
          `${file.name} uploaded as the revised file. Resubmit when every flagged document has been replaced.`,
        );
      } else if (allRequiredUploaded) {
        updateApplicationStatus(activeApplication.referenceNo, "Under review");
        setMessage(
          "All required documents are complete. Your application is ready for DOST initial review.",
        );
      } else {
        setMessage(`${file.name} uploaded successfully.`);
      }
    } catch (error) {
      setMessage(extractUploadErrorMessage(error));
    } finally {
      setUploadingRequirement(null);
      setDraggingRequirement(null);
    }
  }

  async function remove(requirement: DocumentaryRequirement) {
    if (!activeApplication) return;
    if (isRevisionMode) {
      setMessage("Returned applications only allow replacement of flagged documents.");
      return;
    }
    if (!window.confirm(`Delete the uploaded file for “${requirement.title}”?`))
      return;

    const existing = documents[requirement.id];
    if (!existing?.backendId) {
      // Nothing on the backend yet — this is (at most) a pending local
      // file, or a local-only fallback record. Just drop it from wherever
      // it's held.
      setPendingFiles((current) => {
        if (!(requirement.id in current)) return current;
        const next = { ...current };
        delete next[requirement.id];
        return next;
      });
      if (documents[requirement.id]) {
        deleteDocument(activeApplication.referenceNo, requirement.id);
        setDocuments(getDocuments(activeApplication.referenceNo));
      }
      if (requirement.required) {
        updateApplicationStatus(activeApplication.referenceNo, "Draft Submitted");
      }
      setMessage("File removed.");
      return;
    }
    try {
      await deleteDocumentRecord(existing.backendId);
      const next = { ...documents };
      delete next[requirement.id];
      setDocuments(next);
      if (requirement.required) {
        updateApplicationStatus(activeApplication.referenceNo, "Draft Submitted");
      }
      setMessage("File deleted. You can upload a replacement at any time.");
    } catch {
      setMessage("Could not delete the file. Please try again.");
    }
  }

  function viewPendingFile(file: File) {
    const blobUrl = URL.createObjectURL(file);
    window.open(blobUrl, "_blank", "noopener,noreferrer");
    // Best-effort cleanup — the new tab has already grabbed the resource
    // by the time this fires.
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  }

  async function viewDocument(storedDocument: StoredDocument) {
    if (storedDocument.backendId) {
      try {
        const blobUrl = await fetchDocumentBlobUrl(storedDocument.backendId);
        window.open(blobUrl, "_blank", "noopener,noreferrer");
      } catch {
        setMessage("Could not open the file. Please try again.");
      }
      return;
    }
    window.open(storedDocument.dataUrl, "_blank", "noopener,noreferrer");
  }

  function showSubmittedDialog(app: ApplicationRecord) {
    Swal.fire({
      title: "Application Submitted Successfully!",
      html: `
        <div style="font-family: sans-serif; text-align: center;" class="space-y-3">
          <p style="font-size: 13px; color: #475569; margin-top: 8px;">
            Your application (<strong style="font-family: monospace; color: #0f53b7;">${app.referenceNo}</strong>) has been officially submitted to DOST PSTO.
          </p>
          <div style="background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 16px; padding: 16px; text-align: left; margin-top: 14px;">
            <p style="font-size: 12px; font-weight: 700; color: #073b82; margin: 0 0 4px 0;">
              Stage 2 Active: DOST Initial Review
            </p>
            <p style="font-size: 11px; color: #475569; margin: 0; line-height: 1.5;">
              ${
                app.program === "SETUP"
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
  }

  function scrollToMissingRequirement(missingRequiredDocs: DocumentaryRequirement[]) {
    const firstMissing = missingRequiredDocs[0];
    if (firstMissing) {
      const targetEl = document.getElementById(`requirement-${firstMissing.id}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /**
   * Shared by SETUP and GIA. One click, one request: submitSetupProposal()
   * / submitGiaProposal() send the proposal fields AND every file in
   * `pendingFiles` together in a single multipart POST. The backend
   * creates the Proposal, the SetupProposal/GiaProposal row, the
   * auto-generated proposal PDF, and every supporting document inside one
   * DB transaction — either all of it is created, or (validation failure,
   * a bad file, anything) none of it is. There's no partial
   * "proposal exists but some documents are missing" state to recover
   * from, so there's nothing to retry piecemeal on failure — the whole
   * submission just needs to be tried again.
   *
   * If a proposal already exists (activeProposalId set — e.g. the
   * applicant is revisiting after a previous successful submit, or an
   * older proposal created before this flow existed), there's nothing left
   * to submit; any remaining pending files just go through the normal
   * per-document upload control instead.
   */
  async function handleSubmitApplication() {
    if (!activeApplication) return;
    const isSetup = activeApplication.program === "SETUP";

    const proposalData = isSetup
      ? setupFormRef.current?.validate()
      : giaFormRef.current?.validate();
    if (!proposalData) return;

    const missingRequiredDocs = requiredRequirements.filter(
      (req) => !documents[req.id] && !pendingFiles[req.id],
    );
    if (missingRequiredDocs.length > 0) {
      const firstMissing = missingRequiredDocs[0];
      setMessage(
        `Upload ${missingRequiredDocs.length} remaining required document${missingRequiredDocs.length === 1 ? "" : "s"} before submitting.${firstMissing ? ` First required: ${firstMissing.title}.` : ""}`,
      );
      scrollToMissingRequirement(missingRequiredDocs);
      return;
    }

    setIsSubmittingApplication(true);
    setMessage(null);
    try {
      let proposalId = activeProposalId;
      let application = activeApplication;

      if (!proposalId) {
        const result = isSetup
          ? await submitSetupProposal(proposalData as SetupProposalData, pendingFiles)
          : await submitGiaProposal(proposalData as GiaProposalData, pendingFiles);
        application = result.application;
        proposalId = application.proposalId ?? null;
        setActiveProposalId(proposalId);

        const nextDocuments: Record<string, StoredDocument> = {};
        if (result.documents && result.documents.length > 0) {
          for (const record of result.documents) {
            const stored = documentRecordToStoredDocument(record);
            nextDocuments[String(record.document_type_id)] = stored;
            saveDocument(application.referenceNo, String(record.document_type_id), stored);
          }
        } else {
          for (const [reqId, file] of Object.entries(pendingFiles)) {
            const stored = await fileToStoredDocument(file);
            nextDocuments[reqId] = stored;
            saveDocument(application.referenceNo, reqId, stored);
          }
        }
        setDocuments(nextDocuments);
        setPendingFiles({});
      }

      if (!proposalId) {
        setMessage(
          "Your proposal could not be created on the server. Please try submitting again.",
        );
        return;
      }

      const updatedApp: ApplicationRecord = { ...application, status: "Under review" };
      saveApplication(updatedApp);
      updateApplicationStatus(application.referenceNo, "Under review");
      showSubmittedDialog(updatedApp);
    } catch (error) {
      setMessage(extractUploadErrorMessage(error));
    } finally {
      setIsSubmittingApplication(false);
    }
  }

  async function handleResubmitRevisions() {
    if (!activeProposalId || !isRevisionMode) return;

    if (revisionDocuments.length > 0) {
      const firstRequirement = requirements.find(
        (requirement) => requirement.id === revisionDocuments[0]?.[0],
      );
      if (firstRequirement) scrollToMissingRequirement([firstRequirement]);
      setMessage("Replace every document marked Needs Revision before resubmitting.");
      return;
    }

    setIsResubmittingRevision(true);
    setMessage(null);
    try {
      await resubmitProposal(activeProposalId);
      const updatedApplication: ApplicationRecord = {
        ...activeApplication,
        remarks: null,
        status: "In Process",
      };
      saveApplication(updatedApplication);
      setAllApplicationsList((current) =>
        current.map((application) =>
          application.referenceNo === updatedApplication.referenceNo
            ? updatedApplication
            : application,
        ),
      );
      await Swal.fire({
        confirmButtonColor: "#0f53b7",
        icon: "success",
        text: "Your revised documents are back in the DOST review queue.",
        title: "Revisions Resubmitted",
      });
    } catch (error) {
      setMessage(extractUploadErrorMessage(error));
    } finally {
      setIsResubmittingRevision(false);
    }
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
                    {activeApplication.program === "SETUP" ? "SETUP" : "GIA"} Application — {isDraftMode ? "Stage 1: Proposal & Documents" : isRevisionMode ? "Revision Required" : "Stage 2: DOST Initial Review"}
                  </span>
                  {isDraftMode ? (
                    <span className="font-mono text-xs font-bold text-[#0f53b7]">{overallProgressPercent}% Overall Progress</span>
                  ) : isRevisionMode ? (
                    <span className="text-xs font-bold text-rose-700">Action Required</span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-700">Submitted</span>
                  )}
                </div>
                {isDraftMode ? (
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/60">
                    <div
                      className="h-full rounded-full bg-[#0f53b7] transition-all duration-300"
                      style={{ width: `${overallProgressPercent}%` }}
                    />
                  </div>
                ) : null}
              </div>
              {isDraftMode ? (
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
          {!isDraftMode && !isRevisionMode ? (
            <InitialReviewStageCard application={activeApplication} />
          ) : (
            <>
              {isDraftMode ? (
                <section className="space-y-6">
                  {activeApplication.program === "GIA" ? (
                    <GiaProposalForm ref={giaFormRef} onDraftChange={setLiveGiaProposal} />
                  ) : (
                    <SetupProposalForm ref={setupFormRef} onDraftChange={setLiveSetupProposal} />
                  )}
                </section>
              ) : (
                <section
                  aria-labelledby="revision-required-title"
                  className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-rose-200"
                >
                  <div className="border-l-4 border-rose-500 px-5 py-6 sm:px-7">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600">
                          <AlertTriangle className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <span className="text-[11px] font-black uppercase tracking-[0.14em] text-rose-600">
                            Action required
                          </span>
                          <h2
                            className="mt-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl"
                            id="revision-required-title"
                          >
                            Your proposal was returned for revision
                          </h2>
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                            Update only the documents listed below, then resubmit your proposal to the DOST review queue.
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-black text-rose-700">
                        {revisionItems.length
                          ? `${revisionItems.length} file${revisionItems.length === 1 ? "" : "s"} to revise`
                          : "Ready to resubmit"}
                      </span>
                    </div>

                    {activeApplication.remarks ? (
                      <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3.5">
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                          Staff review summary
                        </p>
                        <p className="mt-1.5 text-sm leading-6 text-slate-700">
                          {activeApplication.remarks}
                        </p>
                      </div>
                    ) : null}

                    {revisionItems.length ? (
                      <div className="mt-5 divide-y divide-slate-100 rounded-2xl bg-rose-50/50 px-4 ring-1 ring-rose-100">
                        {revisionItems.map((item) => (
                          <div
                            className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                            key={item.requirementId}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <FileText className="size-4 shrink-0 text-rose-500" />
                                <p className="truncate text-sm font-black text-slate-900">
                                  {item.title}
                                </p>
                              </div>
                              <p className="mt-1.5 pl-6 text-xs leading-5 text-slate-600">
                                {item.document.remarks ||
                                  "Replace this document with the corrected version requested by the evaluator."}
                              </p>
                            </div>
                            <button
                              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold text-[#0f53b7] transition hover:bg-blue-50"
                              onClick={() => {
                                document
                                  .getElementById(`requirement-${item.requirementId}`)
                                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
                              }}
                              type="button"
                            >
                              Replace file
                              <ArrowRight className="size-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-emerald-50 px-4 py-3.5 text-emerald-800 ring-1 ring-emerald-100">
                        <Check className="mt-0.5 size-4 shrink-0" strokeWidth={3} />
                        <p className="text-sm font-semibold">
                          All requested files have been replaced. Use the resubmit button below to send them back for review.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

          {/* Attached Documents Section (Lower Page Divider) */}
          {requirements.length ? (
            <div className="mt-8 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {isRevisionMode ? "Document Revision Checklist" : "Attached Documentary Requirements"}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {isRevisionMode
                      ? "Only documents marked Needs Revision can be replaced. Other submitted files are locked."
                      : "Upload required supporting documents to accompany your proposal submission."}
                  </p>
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



                      <div className="divide-y divide-slate-100">
                        {groupRequirements.map((requirement) => {
                          const storedDocument = documents[requirement.id];
                          const pendingFile = storedDocument
                            ? undefined
                            : pendingFiles[requirement.id];
                          const status: VerificationStatus = storedDocument
                            ? storedDocument.verificationStatus
                            : pendingFile
                              ? "Pending Upload"
                              : "Not Uploaded";
                          const isDragging =
                            draggingRequirement === requirement.id;
                          const isUploading =
                            uploadingRequirement === requirement.id;
                          const isMissingRequired =
                            !storedDocument && !pendingFile && requirement.required;
                          const hasFile = Boolean(storedDocument || pendingFile);
                          const needsRevision = status === "Needs Revision";
                          const canReplace = !isRevisionMode || needsRevision;

                          return (
                            <article
                              className={cn(
                                "grid gap-4 px-5 py-5 transition sm:px-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(310px,1fr)] lg:items-center lg:gap-5",
                                isDragging &&
                                  "bg-blue-50 ring-2 ring-inset ring-[#0f53b7]",
                                isMissingRequired &&
                                  "bg-red-50/40 border-l-4 border-l-red-500",
                                needsRevision &&
                                  "border-l-4 border-l-rose-500 bg-rose-50/60",
                              )}
                              id={`requirement-${requirement.id}`}
                              key={requirement.id}
                              onDragEnter={(event) => {
                                if (!canReplace) return;
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
                              onDragOver={(event) => {
                                if (canReplace) event.preventDefault();
                              }}
                              onDrop={(event) => {
                                if (!canReplace) return;
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
                                    needsRevision
                                      ? "border-rose-500 bg-rose-500 text-white"
                                      : hasFile
                                      ? "border-emerald-500 bg-emerald-500 text-white"
                                      : isMissingRequired
                                        ? "border-red-400 bg-red-50 text-red-500"
                                        : "border-slate-200 text-slate-300",
                                  )}
                                >
                                  {needsRevision ? (
                                    <AlertTriangle className="size-4" />
                                  ) : hasFile ? (
                                    <Check className="size-4" strokeWidth={3} />
                                  ) : (
                                    <FileText className="size-3.5" />
                                  )}
                                </span>
                                <div className="min-w-0">
                                  <h3 className="font-bold leading-6 text-slate-900">
                                    {requirement.title}
                                    {requirement.required || activeApplication.program === "SETUP" ? (
                                      <span
                                        className="ml-1 font-extrabold text-red-600"
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
                                  ) : pendingFile ? (
                                    <p
                                      className="mt-2 truncate text-xs font-semibold text-slate-600"
                                      title={pendingFile.name}
                                    >
                                      {pendingFile.name} ·{" "}
                                      {formatSize(pendingFile.size)}
                                    </p>
                                  ) : null}
                                </div>
                              </div>

                              <div className="space-y-3">
                                {status !== "Not Uploaded" && status !== "Uploaded" && status !== "Pending Upload" ? (
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
                                  {canReplace ? <label
                                    className={cn(
                                      "inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#0f53b7] px-3.5 text-xs font-bold text-white transition hover:bg-[#0b3f8b]",
                                      isUploading &&
                                        "pointer-events-none opacity-70",
                                    )}
                                  >
                                    {isUploading ? (
                                      <LoaderCircle className="size-3.5 animate-spin" />
                                    ) : hasFile ? (
                                      <RefreshCw className="size-3.5" />
                                    ) : (
                                      <FileUp className="size-3.5" />
                                    )}
                                    {isUploading
                                      ? "Uploading"
                                      : hasFile
                                        ? "Replace File"
                                        : "Upload"}
                                    <input
                                      accept=".pdf"
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
                                  </label> : null}
                                  {hasFile ? (
                                    <>
                                      <button
                                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                                        onClick={() =>
                                          storedDocument
                                            ? void viewDocument(storedDocument)
                                            : pendingFile
                                              ? viewPendingFile(pendingFile)
                                              : undefined
                                        }
                                        type="button"
                                      >
                                        <Eye className="size-3.5" />
                                        View File
                                      </button>
                                      {!isRevisionMode ? <button
                                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-100 px-3 text-xs font-bold text-red-600 transition hover:bg-red-50"
                                        onClick={() => void remove(requirement)}
                                        type="button"
                                      >
                                        <Trash2 className="size-3.5" />
                                        Delete File
                                      </button> : null}
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
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0f53b7] px-8 text-sm font-bold text-white shadow-md transition hover:bg-[#0d479e] hover:shadow-lg disabled:pointer-events-none disabled:opacity-70"
                  disabled={
                    isRevisionMode
                      ? isResubmittingRevision || revisionDocuments.length > 0
                      : isSubmittingApplication
                  }
                  onClick={() => {
                    if (!activeApplication) return;
                    if (isRevisionMode) void handleResubmitRevisions();
                    else void handleSubmitApplication();
                  }}
                  type="button"
                >
                  {isSubmittingApplication || isResubmittingRevision ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : null}
                  {isRevisionMode
                    ? isResubmittingRevision
                      ? "Resubmitting"
                      : revisionDocuments.length
                        ? `${revisionDocuments.length} Revision${revisionDocuments.length === 1 ? "" : "s"} Remaining`
                        : "Resubmit Revised Documents"
                    : isSubmittingApplication
                      ? "Submitting"
                      : activeApplication.program === "GIA"
                        ? "Submit GIA Proposal"
                        : "Submit SETUP Application"}
                  {isSubmittingApplication || isResubmittingRevision ? null : (
                    <ArrowRight className="size-4" />
                  )}
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
