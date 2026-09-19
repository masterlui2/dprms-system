/**
 * System: DPRMS
 * Purpose: Internal documents definitions for DPRMS.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { DocumentApiRecord } from '../../../services/document_store';
import type { DocumentTypeRecord } from '../../../services/setup_proposal_store';
import type { ApplicationProgram } from '../../../types/application';

export type InternalDocumentStage = 'implementation' | 'post-inspection';
export type InternalDocumentStatus =
    'not_uploaded' | 'pending' | 'approved' | 'returned_for_revision';

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
    setNumber: DocumentTypeRecord['set_number'];
    stage: InternalDocumentStage;
    status: InternalDocumentStatus;
    updated?: string;
};

type SetupTemplate = Pick<
    InternalDocument,
    'id' | 'label' | 'requiredForEndorsement' | 'setNumber' | 'stage'
>;

const SETUP_DOCUMENT_TEMPLATE: SetupTemplate[] = [
    {
        id: 'tna-form-01',
        label: 'Filled-out TNA Form 01',
        requiredForEndorsement: true,
        setNumber: 'SET1',
        stage: 'post-inspection',
    },
    {
        id: 'gad-assessment-gwp',
        label: 'GAD Assessment (GWP)',
        requiredForEndorsement: true,
        setNumber: 'SET1',
        stage: 'post-inspection',
    },
    {
        id: 'gad-checklist-msme',
        label: 'GAD Checklist for S&T Interventions in MSMEs',
        requiredForEndorsement: true,
        setNumber: 'SET1',
        stage: 'post-inspection',
    },
    {
        id: 'hazard-hunter',
        label: 'Hazard Hunter',
        requiredForEndorsement: true,
        setNumber: 'SET1',
        stage: 'post-inspection',
    },
    {
        id: 'tna-form-4',
        label: 'TNA Form 4',
        requiredForEndorsement: false,
        setNumber: 'SET2',
        stage: 'implementation',
    },
    {
        id: 'pre-project-implementation-sheet',
        label: 'Pre-Project Implementation Sheet',
        requiredForEndorsement: false,
        setNumber: 'SET3',
        stage: 'implementation',
    },
];

/** Find uploaded document. */
function _findUploadedDocument(
    intDocumentTypeId: number,
    arrUploadedDocuments: DocumentApiRecord[],
)
{
    return arrUploadedDocuments.find(
        (objDocument) => objDocument.document_type_id === intDocumentTypeId,
    );
}

/** Merge server fields. */
function _mergeServerFields(
    objBase: Omit<InternalDocument, 'status'>,
    objUploaded?: DocumentApiRecord,
): InternalDocument
{
    return {
        ...objBase,
        backendId: objUploaded?.id,
        fileName: objUploaded?.file_name,
        fileSize: objUploaded?.file_size ?? undefined,
        fileType: objUploaded?.mime_type ?? undefined,
        remarks: objUploaded?.remarks ?? undefined,
        reviewedAt: objUploaded?.reviewed_at ?? undefined,
        status: objUploaded?.status ?? 'not_uploaded',
        updated: objUploaded?.updated_at,
    };
}

/** Merge setup documents. */
function _mergeSetupDocuments(
    arrDocumentTypes: DocumentTypeRecord[],
    arrUploadedDocuments: DocumentApiRecord[],
): InternalDocument[]
{
    return SETUP_DOCUMENT_TEMPLATE.map((objTemplate) =>
    {
        const objDocumentType = arrDocumentTypes.find(
            (objType) => objType.name.trim().toLowerCase() === objTemplate.label.toLowerCase(),
        );
        const objUploaded = objDocumentType
            ? _findUploadedDocument(objDocumentType.id, arrUploadedDocuments)
            : undefined;

        return _mergeServerFields(
            {
                ...objTemplate,
                description: objDocumentType?.description ?? undefined,
                documentTypeId: objDocumentType?.id,
            },
            objUploaded,
        );
    });
}

/** Merge gia documents. */
function _mergeGiaDocuments(
    arrDocumentTypes: DocumentTypeRecord[],
    arrUploadedDocuments: DocumentApiRecord[],
): InternalDocument[]
{
    return arrDocumentTypes
        .filter((objType) => objType.set_number === 'GIA1' && objType.applicable_program === 'GIA')
        .map((objDocumentType) =>
            _mergeServerFields(
                {
                    description: objDocumentType.description ?? undefined,
                    documentTypeId: objDocumentType.id,
                    id: String(objDocumentType.id),
                    label: objDocumentType.name,
                    requiredForEndorsement: objDocumentType.is_required,
                    setNumber: objDocumentType.set_number,
                    stage: 'implementation',
                },
                _findUploadedDocument(objDocumentType.id, arrUploadedDocuments),
            ),
        );
}

/** Get initial internal documents. */
export function getInitialInternalDocuments(strProgram: ApplicationProgram): InternalDocument[]
{
    if (strProgram === 'GIA')
    {
        return [];
    }

    return SETUP_DOCUMENT_TEMPLATE.map((objDocument) => ({
        ...objDocument,
        status: 'not_uploaded',
    }));
}

/** Merge internal documents. */
export function mergeInternalDocuments(
    strProgram: ApplicationProgram,
    arrDocumentTypes: DocumentTypeRecord[],
    arrUploadedDocuments: DocumentApiRecord[],
): InternalDocument[]
{
    return strProgram === 'GIA'
        ? _mergeGiaDocuments(arrDocumentTypes, arrUploadedDocuments)
        : _mergeSetupDocuments(arrDocumentTypes, arrUploadedDocuments);
}

/** Is required internal documents complete. */
export function isRequiredInternalDocumentsComplete(arrDocuments: InternalDocument[])
{
    const arrRequiredDocuments = arrDocuments.filter(
        (objDocument) => objDocument.requiredForEndorsement,
    );

    return (
        arrRequiredDocuments.length > 0 &&
        arrRequiredDocuments.every(
            (objDocument) =>
                objDocument.status !== 'not_uploaded' &&
                objDocument.status !== 'returned_for_revision',
        )
    );
}
