export type InternalDocumentStage = "later" | "post-inspection";

export type InternalDocument = {
  dataUrl?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  id: string;
  label: string;
  requiredForEndorsement: boolean;
  stage: InternalDocumentStage;
  status: "Not uploaded" | "Uploaded";
  updated?: string;
};

const documentTemplate: InternalDocument[] = [
  {
    id: "tna-form-01",
    label: "Filled-out TNA Form 01",
    requiredForEndorsement: true,
    stage: "post-inspection",
    status: "Not uploaded",
  },
  {
    id: "gad-assessment-gwp",
    label: "GAD Assessment (GWP)",
    requiredForEndorsement: true,
    stage: "post-inspection",
    status: "Not uploaded",
  },
  {
    id: "gad-checklist-msme",
    label: "GAD Checklist for S&T Interventions in MSMEs",
    requiredForEndorsement: true,
    stage: "post-inspection",
    status: "Not uploaded",
  },
  {
    id: "hazard-hunter",
    label: "Hazard Hunter",
    requiredForEndorsement: true,
    stage: "post-inspection",
    status: "Not uploaded",
  },
  {
    id: "tna-form-4",
    label: "TNA Form 4",
    requiredForEndorsement: false,
    stage: "later",
    status: "Not uploaded",
  },
  {
    id: "pre-project-implementation-sheet",
    label: "Pre-Project Implementation Sheet",
    requiredForEndorsement: false,
    stage: "later",
    status: "Not uploaded",
  },
];

const storageKey = (proposalId: string) =>
  `dprms.setup-internal-documents.${proposalId}`;

export function readSetupInternalDocuments(proposalId: string) {
  if (typeof window === "undefined") return documentTemplate;

  try {
    const stored = JSON.parse(
      window.localStorage.getItem(storageKey(proposalId)) ?? "[]",
    ) as InternalDocument[];

    if (!Array.isArray(stored)) return documentTemplate;

    return documentTemplate.map((document) => {
      const match = stored.find((item) => item.id === document.id);
      return match ? { ...document, ...match } : document;
    });
  } catch {
    return documentTemplate;
  }
}

export function storeSetupInternalDocuments(
  proposalId: string,
  documents: InternalDocument[],
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(proposalId), JSON.stringify(documents));
}

export function setupPostInspectionComplete(documents: InternalDocument[]) {
  return documents
    .filter((document) => document.requiredForEndorsement)
    .every((document) => document.status === "Uploaded");
}

export function areSetupPostInspectionDocumentsComplete(proposalId: string) {
  return setupPostInspectionComplete(readSetupInternalDocuments(proposalId));
}
