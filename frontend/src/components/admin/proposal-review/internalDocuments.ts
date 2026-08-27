import type { DocumentApiRecord } from "../../../services/documentStore";
import type { DocumentTypeRecord } from "../../../services/setupProposalStore";
import type { ApplicationProgram } from "../../../types/application";

export type InternalDocumentStage = "implementation" | "post-inspection";
export type InternalDocumentStatus =
  | "not_uploaded"
  | "pending"
  | "approved"
  | "returned_for_revision";

export type InternalDocument = {
  backendId?: number;
  description?: string;
  documentTypeId?: number;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  id: string;
  label: string;
  remarks?: string;
  requiredForEndorsement: boolean;
  reviewedAt?: string;
  setNumber: DocumentTypeRecord["set_number"];
  stage: InternalDocumentStage;
  status: InternalDocumentStatus;
  updated?: string;
};

type SetupTemplate = Pick<
  InternalDocument,
  "id" | "label" | "requiredForEndorsement" | "setNumber" | "stage"
>;

const setupDocumentTemplate: SetupTemplate[] = [
  {
    id: "tna-form-01",
    label: "Filled-out TNA Form 01",
    requiredForEndorsement: true,
    setNumber: "SET1",
    stage: "post-inspection",
  },
  {
    id: "gad-assessment-gwp",
    label: "GAD Assessment (GWP)",
    requiredForEndorsement: true,
    setNumber: "SET1",
    stage: "post-inspection",
  },
  {
    id: "gad-checklist-msme",
    label: "GAD Checklist for S&T Interventions in MSMEs",
    requiredForEndorsement: true,
    setNumber: "SET1",
    stage: "post-inspection",
  },
  {
    id: "hazard-hunter",
    label: "Hazard Hunter",
    requiredForEndorsement: true,
    setNumber: "SET1",
    stage: "post-inspection",
  },
  {
    id: "tna-form-4",
    label: "TNA Form 4",
    requiredForEndorsement: false,
    setNumber: "SET2",
    stage: "implementation",
  },
  {
    id: "pre-project-implementation-sheet",
    label: "Pre-Project Implementation Sheet",
    requiredForEndorsement: false,
    setNumber: "SET3",
    stage: "implementation",
  },
];

function findUploadedDocument(
  documentTypeId: number,
  uploadedDocuments: DocumentApiRecord[],
) {
  return uploadedDocuments.find(
    (document) => document.document_type_id === documentTypeId,
  );
}

function mergeServerFields(
  base: Omit<InternalDocument, "status">,
  uploaded?: DocumentApiRecord,
): InternalDocument {
  return {
    ...base,
    backendId: uploaded?.id,
    fileName: uploaded?.file_name,
    fileSize: uploaded?.file_size ?? undefined,
    fileType: uploaded?.mime_type ?? undefined,
    remarks: uploaded?.remarks ?? undefined,
    reviewedAt: uploaded?.reviewed_at ?? undefined,
    status: uploaded?.status ?? "not_uploaded",
    updated: uploaded?.updated_at,
  };
}

function mergeSetupDocuments(
  documentTypes: DocumentTypeRecord[],
  uploadedDocuments: DocumentApiRecord[],
): InternalDocument[] {
  return setupDocumentTemplate.map((template) => {
    const documentType = documentTypes.find(
      (type) =>
        type.name.trim().toLowerCase() === template.label.toLowerCase(),
    );
    const uploaded = documentType
      ? findUploadedDocument(documentType.id, uploadedDocuments)
      : undefined;

    return mergeServerFields(
      {
        ...template,
        description: documentType?.description ?? undefined,
        documentTypeId: documentType?.id,
      },
      uploaded,
    );
  });
}

function mergeGiaDocuments(
  documentTypes: DocumentTypeRecord[],
  uploadedDocuments: DocumentApiRecord[],
): InternalDocument[] {
  return documentTypes
    .filter((type) => type.set_number === "SET3")
    .map((documentType) =>
      mergeServerFields(
        {
          description: documentType.description ?? undefined,
          documentTypeId: documentType.id,
          id: String(documentType.id),
          label: documentType.name,
          requiredForEndorsement: documentType.is_required,
          setNumber: documentType.set_number,
          stage: "implementation",
        },
        findUploadedDocument(documentType.id, uploadedDocuments),
      ),
    );
}

export function getInitialInternalDocuments(
  program: ApplicationProgram,
): InternalDocument[] {
  if (program === "GIA") return [];

  return setupDocumentTemplate.map((document) => ({
    ...document,
    status: "not_uploaded",
  }));
}

export function mergeInternalDocuments(
  program: ApplicationProgram,
  documentTypes: DocumentTypeRecord[],
  uploadedDocuments: DocumentApiRecord[],
): InternalDocument[] {
  return program === "GIA"
    ? mergeGiaDocuments(documentTypes, uploadedDocuments)
    : mergeSetupDocuments(documentTypes, uploadedDocuments);
}

export function requiredInternalDocumentsComplete(
  documents: InternalDocument[],
) {
  const requiredDocuments = documents.filter(
    (document) => document.requiredForEndorsement,
  );

  return (
    requiredDocuments.length > 0 &&
    requiredDocuments.every(
      (document) =>
        document.status !== "not_uploaded" &&
        document.status !== "returned_for_revision",
    )
  );
}
