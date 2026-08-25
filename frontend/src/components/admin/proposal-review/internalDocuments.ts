import type { DocumentApiRecord } from "../../../services/documentStore";
import {
  fetchProposalDocumentsForStaff,
  fetchSetupInternalDocumentTypes,
} from "../../../services/documentStore";
import type { DocumentTypeRecord } from "../../../services/setupProposalStore";

export type InternalDocumentStage = "later" | "post-inspection";

export type InternalDocument = {
  backendId?: number;
  documentTypeId: number;
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

// ... rest of the file unchanged (stageForSetNumber, mergeSetupInternalDocuments,
// fetchSetupInternalDocuments, setupPostInspectionComplete)

/**
 * Internal SETUP documents are split into two stages based on which
 * checklist "set" they were seeded under (see DocumentTypeSeeder):
 *   - SET1 internal docs (TNA Form 01, GAD Assessment, GAD Checklist,
 *     Hazard Hunter) are gathered during/after the site inspection and are
 *     required before the proposal can be endorsed.
 *   - SET2/SET3 internal docs (TNA Form 4, Pre-Project Implementation
 *     Sheet, etc.) are handled later in the workflow (post-approval) and
 *     don't block endorsement.
 *
 * This is derived from set_number rather than hardcoded per document, so
 * any new internal doc type seeded under SET1 automatically becomes part
 * of the required post-inspection set without a frontend change.
 */
function stageForSetNumber(setNumber: DocumentTypeRecord["set_number"]): InternalDocumentStage {
  return setNumber === "SET1" ? "post-inspection" : "later";
}

/**
 * Builds the internal document checklist directly from backend document
 * types (GET /document-types?program=SETUP&visibility=internal), matched
 * against already-uploaded documents by document_type_id — no local
 * hardcoded template, no label string-matching.
 */
export function mergeSetupInternalDocuments(
  documentTypes: DocumentTypeRecord[],
  uploadedDocuments: DocumentApiRecord[],
): InternalDocument[] {
  return documentTypes.map((documentType) => {
    const uploaded = uploadedDocuments.find(
      (record) => record.document_type_id === documentType.id,
    );
    const stage = stageForSetNumber(documentType.set_number);

    return {
      backendId: uploaded?.id,
      documentTypeId: documentType.id,
      fileName: uploaded?.file_name,
      fileSize: uploaded?.file_size ?? undefined,
      fileType: uploaded?.mime_type ?? undefined,
      id: String(documentType.id),
      label: documentType.name,
      requiredForEndorsement: stage === "post-inspection" && documentType.is_required,
      stage,
      status: uploaded ? "Uploaded" : "Not uploaded",
      updated: uploaded?.updated_at,
    };
  });
}

/**
 * Fetches internal SETUP document types and this proposal's uploaded
 * documents in parallel, then merges them into the checklist shape used
 * by the UI. Replaces the old local-template + label-matching approach.
 */
export async function fetchSetupInternalDocuments(
  proposalId: number,
): Promise<InternalDocument[]> {
  const [documentTypes, uploadedDocuments] = await Promise.all([
    fetchSetupInternalDocumentTypes(),
    fetchProposalDocumentsForStaff(proposalId),
  ]);

  return mergeSetupInternalDocuments(documentTypes, uploadedDocuments);
}

export function setupPostInspectionComplete(documents: InternalDocument[]) {
  return documents
    .filter((document) => document.requiredForEndorsement)
    .every((document) => document.status === "Uploaded");
}