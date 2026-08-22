import type { DocumentApiRecord } from "../../../services/documentStore";
import type { DocumentTypeRecord } from "../../../services/setupProposalStore";

export type InternalDocumentStage = "later" | "post-inspection";

export type InternalDocument = {
  backendId?: number;
  documentTypeId?: number;
  fileName?: string;
  fileSize?: number;
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

export function getSetupInternalDocumentTemplate(): InternalDocument[] {
  return documentTemplate.map((document) => ({ ...document }));
}

export function mergeSetupInternalDocuments(
  documentTypes: DocumentTypeRecord[],
  uploadedDocuments: DocumentApiRecord[],
): InternalDocument[] {
  return getSetupInternalDocumentTemplate().map((document) => {
    const documentType = documentTypes.find(
      (type) => type.name.trim().toLowerCase() === document.label.toLowerCase(),
    );
    const uploaded = documentType
      ? uploadedDocuments.find(
          (record) => record.document_type_id === documentType.id,
        )
      : undefined;

    return {
      ...document,
      backendId: uploaded?.id,
      documentTypeId: documentType?.id,
      fileName: uploaded?.file_name,
      fileSize: uploaded?.file_size ?? undefined,
      fileType: uploaded?.mime_type ?? undefined,
      status: uploaded ? "Uploaded" : "Not uploaded",
      updated: uploaded?.updated_at,
    };
  });
}

export function setupPostInspectionComplete(documents: InternalDocument[]) {
  return documents
    .filter((document) => document.requiredForEndorsement)
    .every((document) => document.status === "Uploaded");
}
