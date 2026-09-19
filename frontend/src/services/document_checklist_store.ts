/**
 * System: DPRMS
 * Purpose: Manage document checklist store operations and data access.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import g_objApi from '../lib/axios';
import type { ApplicationProgram } from '../types/application';
import { reportError } from '../utils/error_reporting';
import { getApplications } from './application_store';
import
{
    fetchProposalDocumentsForStaff,
    getDocuments,
    saveDocument,
    type DocumentApiRecord,
    type StoredDocument,
} from './document_store';

export const CHECKLIST_ITEM_DOC_TYPE_ID: Record<string, number> = {
    // SET 1
    'setup-s1-tna-01': 19,
    'setup-s1-gad-assessment': 20,
    'setup-s1-gad-checklist': 21,
    'setup-s1-hazard-hunter': 22,
    'setup-s1-mayors-permit': 3,
    'setup-s1-dti-registration': 4,
    'setup-s1-corp-sec-cda': 5,
    'setup-s1-bir-registration': 6,
    'setup-s1-blank-or': 7,
    'setup-s1-equipment-quotations': 8,
    'setup-s1-lease-contract': 9,
    'setup-s1-corp-board-res': 10,
    'setup-s1-corp-aoi': 11,
    'setup-s1-corp-sec-cert': 12,
    'setup-s1-fs-financial-position': 13,
    'setup-s1-fs-financial-operation': 14,
    'setup-s1-fs-cash-flows': 15,
    'setup-s1-fs-changes-equity': 16,
    'setup-s1-fs-notes': 17,
    'setup-s1-loi-commitment': 18,

    // SET 2
    'setup-s2-biodata': 23,
    'setup-s2-govt-id': 24,
    'setup-s2-brgy-cert': 25,
    'setup-s2-omnibus': 26,
    'setup-s2-tna-form-4': 27,

    // SET 3
    'setup-s3-request-funds': 28,
    'setup-s3-lbp-waiver': 29,
    'setup-s3-payee-form': 30,
    'setup-s3-notarized-moa': 31,
    'setup-s3-pre-project-sheet': 32,
    'setup-s3-notice-approval': 33,
    'setup-s3-approved-lib': 34,
    'setup-s3-ard-approval': 35,
    'setup-s3-psto-endorsement': 36,
    'setup-s3-final-proposal': 37,
    'setup-s3-rtec-report': 38,
    'setup-s3-risk-register': 39,
    'setup-s3-seti-scorecard': 40,

    // GIA Stage 01
    'gia-s1-loi': 41,
    'gia-s1-endorsement': 36,
    'gia-s1-eligibility': 43,
    'gia-s1-dost-form-4': 42,
    'gia-s1-dost-form-6': 34,
    'gia-s1-dost-form-5': 44,
    'gia-s1-rtec-report': 38,
    'gia-s1-seti-scorecard': 40,
    'gia-s1-gad-checklist': 21,
    'gia-s1-moa-resolution': 31,
    'gia-s1-cfa': 45,
    'gia-s1-ched-accreditation': 51,
    'gia-s1-good-track-record': 52,
    'gia-s1-sec-cda-dole': 46,
    'gia-s1-audited-fs': 47,
    'gia-s1-sworn-affidavit': 48,
    'gia-s1-secretary-cert': 49,
    'gia-s1-board-resolution': 50,

    // GIA Stage 02
    'gia-s2-request-release': 28,
    'gia-s2-payee-data-form': 30,
    'gia-s2-notarized-moa': 31,
    'gia-s2-rtec-report': 38,
    'gia-s2-dost-form-4b': 42,
    'gia-s2-dost-form-6': 34,
    'gia-s2-dost-form-5': 44,
    'gia-s2-cfa': 45,
    'gia-s2-loi': 41,
    'gia-s2-dost-form-7': 52,
    'gia-s2-brgy-bond': 53,
    'gia-s2-brgy-certification': 54,
    'gia-s2-ched-accreditation': 51,
    'gia-s2-good-track-record': 52,

    // GIA Stage 03
    'gia-s3-dost-form-10': 71,
    'gia-s3-dost-form-8': 72,
    'gia-s3-dost-form-9': 73,
    'gia-s3-dost-form-11': 74,
    'gia-s3-dost-form-13': 75,
    'gia-s3-coa-checks': 76,
    'gia-s3-coa-disbursements': 77,
    'gia-s3-dost-form-12': 78,
    'gia-s3-far-6': 79,
    'gia-s3-dost-form-14': 80,
    'gia-s3-jev-equipment': 81,
    'gia-s3-dost-form-15': 82,

    // GIA Stage 04
    'gia-s4-request-extension': 83,
    'gia-s4-endorsement-monitoring': 84,
    'gia-s4-latest-dost-form-11': 85,
    'gia-s4-latest-dost-form-10': 86,
    'gia-s4-dost-form-6': 87,
    'gia-s4-updated-dost-form-5': 88,

    // GIA Stage 05
    'gia-s5-endorsement-complete': 89,
    'gia-s5-dost-form-11-updated': 90,
    'gia-s5-dost-form-18': 91,
    'gia-s5-coa-checks': 92,
    'gia-s5-coa-disbursement': 93,
    'gia-s5-or-unexpended': 94,
    'gia-s5-lib-realignment': 95,
    'gia-s5-dost-form-8': 96,
    'gia-s5-dost-form-9': 97,
    'gia-s5-dost-form-17': 98,
    'gia-s5-narrative-report': 99,
    'gia-s5-proof-outputs': 100,
    'gia-s5-beneficiaries-list': 101,
    'gia-s5-purchase-docs': 102,
    'gia-s5-insurance-equipment': 103,
    'gia-s5-jev-depreciation': 104,
    'gia-s5-par-ics': 105,
    'gia-s5-inventory-inspection': 106,
    'gia-s5-schedule-depreciation': 107,
    'gia-s5-dost-form-14': 108,
};

export const APPLICANT_REQ_ID_TO_DOC_TYPE_ID: Record<string, number> = {
    'recent-mayors-permit': 3,
    'dti-registration-certificate': 4,
    'sec-cda-registration': 5,
    'bir-registration': 6,
    'blank-official-receipt': 7,
    'three-equipment-quotations': 8,
    'manufacturing-space-lease': 9,
    'notarized-board-resolution': 10,
    'articles-of-incorporation-cooperation': 11,
    'secretarys-certificate': 12,
    'statement-financial-position': 13,
    'statement-financial-operations': 14,
    'statement-financial-cash-flows': 15,
    'statement-financial-equity-changes': 16,
    'statement-financial-notes': 17,
    'letter-of-intent-setup': 18,
    'tna-form-01': 19,
    'bio-data-signatory': 23,
    'valid-id-signatory': 24,
    'barangay-certificate': 25,
    'omnibus-affidavit': 26,
    'tna-form-4': 27,
    'gia-letter-of-intent': 41,
    'gia-endorsement-letter': 36,
    'gia-project-proposal': 42,
    'gia-eligibility-checklist': 43,
    'gia-line-item-budget': 34,
    'gia-workplan': 44,
    'gia-funds-availability': 45,
    'gia-private-registration': 46,
    'gia-private-financial-statements': 47,
    'gia-private-affidavit': 48,
    'gia-private-secretary-certificate': 49,
    'gia-private-board-resolution': 50,
    'gia-hei-ched-accreditation': 51,
    'gia-hei-dost-track-record': 52,
    'gia-barangay-official-bond': 53,
    'gia-barangay-project-track-record': 54,
};

export type ChecklistItemStatus = 'Complied' | 'Missing' | 'Under Review' | 'Needs Revision';
export type GiaStageId = '01' | '02' | '03' | '04' | '05';
export type SetupSetId = 'SET1' | 'SET2' | 'SET3';

export interface GiaStageDefinition
{
    id: GiaStageId;
    number: string;
    title: string;
    shortTitle: string;
    subtitle: string;
}

export interface SetupSetDefinition
{
    id: SetupSetId;
    number: string;
    title: string;
    shortTitle: string;
    subtitle: string;
}

export const GIA_STAGES: GiaStageDefinition[] = [
    {
        id: '01',
        number: '01',
        title: 'Project Proposal Submission, Evaluation, and Approval',
        shortTitle: 'Proposal Submission & Approval',
        subtitle: 'Initial project evaluation, eligibility review, and endorsement',
    },
    {
        id: '02',
        number: '02',
        title: 'Releasing of Project Funds',
        shortTitle: 'Releasing of Funds',
        subtitle: 'MOA notarization, payee verification, and fund clearance',
    },
    {
        id: '03',
        number: '03',
        title: 'Project Monitoring',
        shortTitle: 'Project Monitoring',
        subtitle: 'Progress accomplishment reports, financial reports, and monitoring evaluations',
    },
    {
        id: '04',
        number: '04',
        title: 'Extension & Reprogramming',
        shortTitle: 'Extension & Reprogramming',
        subtitle: 'Requests for extension, timeline change, and workplan reprogramming',
    },
    {
        id: '05',
        number: '05',
        title: 'Project Liquidation and Completion',
        shortTitle: 'Liquidation & Completion',
        subtitle: 'Terminal financial reporting, inventory handover, and project closure',
    },
];

export const SETUP_SETS: SetupSetDefinition[] = [
    {
        id: 'SET1',
        number: 'SET 1',
        title: 'SET 1 (To be compiled and reviewed prior to conduct of TNA)',
        shortTitle: 'Prior to TNA (SET 1)',
        subtitle: 'Compiled and reviewed prior to conduct of Technology Needs Assessment (TNA)',
    },
    {
        id: 'SET2',
        number: 'SET 2',
        title: 'SET 2 (To be compiled and check during proposal preparation)',
        shortTitle: 'Proposal Preparation (SET 2)',
        subtitle: 'Compiled and checked during detailed project proposal preparation',
    },
    {
        id: 'SET3',
        number: 'SET 3',
        title: 'SET 3 (To be compiled and check after project proposal deliberation and approval)',
        shortTitle: 'Post-Approval (SET 3)',
        subtitle: 'Compiled and checked after proposal deliberation, RTEC, and approval',
    },
];

export interface DocumentChecklistItem
{
    id: string;
    templateId?: number;
    documentTypeId?: number;
    name: string;
    group: string;
    stageId?: GiaStageId;
    setId?: SetupSetId;
    isRequired: boolean;
    isPresent: boolean;
    status: ChecklistItemStatus;
    remarks: string;
    uploadedDoc?: DocumentApiRecord | null;
    reviewedAt?: string | null;
}

export interface ProposalChecklistRecord
{
    proposalId: number;
    referenceNumber: string;
    enterpriseName: string;
    proponentName: string;
    proponentEmail: string;
    program: ApplicationProgram;
    status: string;
    submittedDate: string;
    district?: string;
    focalName?: string;
    totalRequired: number;
    uploadedCount?: number;
    remainingCount?: number;
    compliedCount: number;
    compliancePercentage: number;
    items: DocumentChecklistItem[];
    overallRemarks: string;
    lastUpdated: string;
    detailsLoaded?: boolean;
    reviewStatus?: 'Completed' | 'Needs Revision' | 'In Review' | 'In Progress' | 'Not Started';
}

/** Calculate checklist document counts. */
export function calculateChecklistDocumentCounts(arrItems: DocumentChecklistItem[])
{
    const arrExplicitlyRequired = arrItems.filter((objItem) => objItem.isRequired);
    const arrRequiredItems = arrExplicitlyRequired.length > 0 ? arrExplicitlyRequired : arrItems;
    const intTotalRequired = arrRequiredItems.length;
    const intUploadedCount = arrRequiredItems.filter((objItem) =>
        Boolean(objItem.uploadedDoc),
    ).length;
    const intCompliedCount = arrRequiredItems.filter((objItem) => objItem.isPresent).length;

    return {
        totalRequired: intTotalRequired,
        uploadedCount: intUploadedCount,
        remainingCount: Math.max(0, intTotalRequired - intUploadedCount),
        compliedCount: intCompliedCount,
    };
}

export const OFFICIAL_SETUP_SET_ITEMS: Array<{
    id: string;
    name: string;
    group: string;
    setId: SetupSetId;
    isRequired: boolean;
}> = [
        // SET 1: Prior to conduct of TNA
        {
            id: 'setup-s1-tna-01',
            name: 'Filled-out TNA Form 01 (form to be provided by CSTC/PSTC)',
            group: 'General Requirements',
            setId: 'SET1',
            isRequired: true,
        },
        {
            id: 'setup-s1-gad-assessment',
            name: 'GAD Assessment (GWP)',
            group: 'General Requirements',
            setId: 'SET1',
            isRequired: true,
        },
        {
            id: 'setup-s1-gad-checklist',
            name: 'GAD Checklist for Science and Technology Interventions in MSMEs',
            group: 'General Requirements',
            setId: 'SET1',
            isRequired: true,
        },
        {
            id: 'setup-s1-hazard-hunter',
            name: 'Hazard Hunter',
            group: 'General Requirements',
            setId: 'SET1',
            isRequired: true,
        },
        {
            id: 'setup-s1-mayors-permit',
            name: "Recent Mayor's Permit indicating the firm's line of business",
            group: 'Business Documents',
            setId: 'SET1',
            isRequired: true,
        },
        {
            id: 'setup-s1-dti-registration',
            name: 'DTI registration for sole proprietorship',
            group: 'Business Documents',
            setId: 'SET1',
            isRequired: false,
        },
        {
            id: 'setup-s1-bir-registration',
            name: 'BIR Registration',
            group: 'Business Documents',
            setId: 'SET1',
            isRequired: true,
        },
        {
            id: 'setup-s1-blank-or',
            name: 'Photocopy of Blank Official Receipt',
            group: 'Business Documents',
            setId: 'SET1',
            isRequired: true,
        },
        {
            id: 'setup-s1-equipment-quotations',
            name: '3 valid equipment quotations from 3 different suppliers, originally signed with preference to the lowest bidder',
            group: 'Technical & Equipment Documents',
            setId: 'SET1',
            isRequired: true,
        },
        {
            id: 'setup-s1-lease-contract',
            name: 'Lease contract for rented manufacturing space or equivalent',
            group: 'Business Documents',
            setId: 'SET1',
            isRequired: false,
        },
        {
            id: 'setup-s1-corp-board-res',
            name: 'Notarized Board Resolution authorizing the availment of assistance & designating the approved signatory for the funding assistance',
            group: 'For Corporations / Cooperatives',
            setId: 'SET1',
            isRequired: false,
        },
        {
            id: 'setup-s1-corp-sec-cda',
            name: 'SEC or CDA registration',
            group: 'For Corporations / Cooperatives',
            setId: 'SET1',
            isRequired: false,
        },
        {
            id: 'setup-s1-corp-aoi',
            name: 'Articles of Incorporation/Cooperation',
            group: 'For Corporations / Cooperatives',
            setId: 'SET1',
            isRequired: false,
        },
        {
            id: 'setup-s1-corp-sec-cert',
            name: "Secretary's certificate of incumbent officers",
            group: 'For Corporations / Cooperatives',
            setId: 'SET1',
            isRequired: false,
        },
        {
            id: 'setup-s1-fs-financial-position',
            name: "A. Statement of Financial Position (with Proponent's Notarized Sworn Statement)",
            group: 'Financial Statements (past 3 years for Small/Medium, 1 year for Micro)',
            setId: 'SET1',
            isRequired: true,
        },
        {
            id: 'setup-s1-fs-financial-operation',
            name: "B. Statement of Financial Operation (with Proponent's Notarized Sworn Statement)",
            group: 'Financial Statements (past 3 years for Small/Medium, 1 year for Micro)',
            setId: 'SET1',
            isRequired: true,
        },
        {
            id: 'setup-s1-fs-cash-flows',
            name: "C. Statement of Financial Cash Flows (with Proponent's Notarized Sworn Statement)",
            group: 'Financial Statements (past 3 years for Small/Medium, 1 year for Micro)',
            setId: 'SET1',
            isRequired: true,
        },
        {
            id: 'setup-s1-fs-changes-equity',
            name: "D. Statement of Changes in Owner's Equity (with Proponent's Notarized Sworn Statement)",
            group: 'Financial Statements (past 3 years for Small/Medium, 1 year for Micro)',
            setId: 'SET1',
            isRequired: true,
        },
        {
            id: 'setup-s1-fs-notes',
            name: "E. Notes to Financial Statements (with Proponent's Notarized Sworn Statement)",
            group: 'Financial Statements (past 3 years for Small/Medium, 1 year for Micro)',
            setId: 'SET1',
            isRequired: true,
        },
        {
            id: 'setup-s1-loi-commitment',
            name: 'Letter of Intent for SETUP Assistance, stating commitment to refund the assistance and cover the insurance cost of equipment.',
            group: 'General Requirements',
            setId: 'SET1',
            isRequired: true,
        },

        // SET 2: During proposal preparation
        {
            id: 'setup-s2-biodata',
            name: 'Bio-data of the approved signatory',
            group: 'Signatory & Identification Documents',
            setId: 'SET2',
            isRequired: true,
        },
        {
            id: 'setup-s2-govt-id',
            name: 'Photocopy of valid government issued ID of the approved signatory with 3 signatures',
            group: 'Signatory & Identification Documents',
            setId: 'SET2',
            isRequired: true,
        },
        {
            id: 'setup-s2-brgy-cert',
            name: 'Barangay certification of permanent residence of the approved signatory',
            group: 'Signatory & Identification Documents',
            setId: 'SET2',
            isRequired: true,
        },
        {
            id: 'setup-s2-omnibus',
            name: 'Omnibus affidavit stating: 1) None of organizers/officials is an agent, 2) No bad debt, 3) No previous DOST accountabilities, 4) Information in AFR true & correct, 5) Truthfulness of stated facts',
            group: 'Signatory & Identification Documents',
            setId: 'SET2',
            isRequired: true,
        },
        {
            id: 'setup-s2-tna-form-4',
            name: 'TNA Form 4',
            group: 'TNA Technical Documents',
            setId: 'SET2',
            isRequired: true,
        },

        // SET 3: Post-approval & deliberation
        {
            id: 'setup-s3-request-funds',
            name: 'Request for Release of Funds',
            group: 'Fund Release & Financial Requirements',
            setId: 'SET3',
            isRequired: true,
        },
        {
            id: 'setup-s3-lbp-waiver',
            name: 'Waiver and Authorization to Tag LBP Account',
            group: 'Fund Release & Financial Requirements',
            setId: 'SET3',
            isRequired: true,
        },
        {
            id: 'setup-s3-payee-form',
            name: 'Payee Data Form',
            group: 'Fund Release & Financial Requirements',
            setId: 'SET3',
            isRequired: true,
        },
        {
            id: 'setup-s3-notarized-moa',
            name: 'Notarized and signed MOA',
            group: 'Legal & Agreement Documents',
            setId: 'SET3',
            isRequired: true,
        },
        {
            id: 'setup-s3-pre-project-sheet',
            name: 'Pre- Project Implementation Sheet',
            group: 'Project Implementation & Approvals',
            setId: 'SET3',
            isRequired: true,
        },
        {
            id: 'setup-s3-notice-approval',
            name: 'Notice of Approval',
            group: 'Project Implementation & Approvals',
            setId: 'SET3',
            isRequired: true,
        },
        {
            id: 'setup-s3-approved-lib',
            name: 'Approved Line-Item Budget',
            group: 'Project Implementation & Approvals',
            setId: 'SET3',
            isRequired: true,
        },
        {
            id: 'setup-s3-ard-approval',
            name: 'Recommending Approval of ARD',
            group: 'Project Implementation & Approvals',
            setId: 'SET3',
            isRequired: true,
        },
        {
            id: 'setup-s3-psto-endorsement',
            name: 'Endorsement letter from C/PSTO',
            group: 'Project Implementation & Approvals',
            setId: 'SET3',
            isRequired: true,
        },
        {
            id: 'setup-s3-final-proposal',
            name: 'Final Copy of Project Proposal',
            group: 'Project Implementation & Approvals',
            setId: 'SET3',
            isRequired: true,
        },
        {
            id: 'setup-s3-rtec-report',
            name: 'RTEC Report',
            group: 'Project Implementation & Approvals',
            setId: 'SET3',
            isRequired: true,
        },
        {
            id: 'setup-s3-risk-register',
            name: 'Candidate Risk Register',
            group: 'Project Implementation & Approvals',
            setId: 'SET3',
            isRequired: true,
        },
        {
            id: 'setup-s3-seti-scorecard',
            name: 'SETI Scorecard',
            group: 'Project Implementation & Approvals',
            setId: 'SET3',
            isRequired: true,
        },
    ];

export const OFFICIAL_GIA_STAGE_ITEMS: Array<{
    id: string;
    name: string;
    group: string;
    stageId: GiaStageId;
    isRequired: boolean;
}> = [
        // Stage 01: Proposal Submission, Evaluation, and Approval
        {
            id: 'gia-s1-loi',
            name: 'Letter of Intent or for Collaboration duly signed by the Head of IA',
            group: 'General Documentary Requirements',
            stageId: '01',
            isRequired: true,
        },
        {
            id: 'gia-s1-endorsement',
            name: 'Endorsement Letter from the concerned PSTO/Division',
            group: 'General Documentary Requirements',
            stageId: '01',
            isRequired: true,
        },
        {
            id: 'gia-s1-eligibility',
            name: 'Accomplished eligibility checklist for project leader',
            group: 'General Documentary Requirements',
            stageId: '01',
            isRequired: true,
        },
        {
            id: 'gia-s1-dost-form-4',
            name: 'DOST Form 4.A (R&D Project) or DOST Form 4.B (Non-R&D Project Proposal)',
            group: 'General Documentary Requirements',
            stageId: '01',
            isRequired: true,
        },
        {
            id: 'gia-s1-dost-form-6',
            name: 'DOST Form 6 (Line Item Budget) with counterpart funds',
            group: 'General Documentary Requirements',
            stageId: '01',
            isRequired: true,
        },
        {
            id: 'gia-s1-dost-form-5',
            name: 'DOST Form 5 (Workplan)',
            group: 'General Documentary Requirements',
            stageId: '01',
            isRequired: true,
        },
        {
            id: 'gia-s1-rtec-report',
            name: 'RTEC Report',
            group: 'General Documentary Requirements',
            stageId: '01',
            isRequired: true,
        },
        {
            id: 'gia-s1-seti-scorecard',
            name: 'SETI Scorecard',
            group: 'General Documentary Requirements',
            stageId: '01',
            isRequired: true,
        },
        {
            id: 'gia-s1-gad-checklist',
            name: 'GAD Checklist',
            group: 'General Documentary Requirements',
            stageId: '01',
            isRequired: true,
        },
        {
            id: 'gia-s1-moa-resolution',
            name: 'Memorandum of Agreement (MOA) with resolution to sign (if LGU/NGO)',
            group: 'General Documentary Requirements',
            stageId: '01',
            isRequired: true,
        },
        {
            id: 'gia-s1-cfa',
            name: 'Certificate of Funds Availability (CFA)',
            group: 'General Documentary Requirements',
            stageId: '01',
            isRequired: true,
        },
        {
            id: 'gia-s1-ched-accreditation',
            name: 'CHED Accreditation',
            group: 'Additional documents for Higher Education Institutions',
            stageId: '01',
            isRequired: false,
        },
        {
            id: 'gia-s1-good-track-record',
            name: 'Certification of Good Track Record with DOST',
            group: 'Additional documents for Higher Education Institutions',
            stageId: '01',
            isRequired: false,
        },
        {
            id: 'gia-s1-sec-cda-dole',
            name: 'SEC/CDA/DOLE Registration and Articles of Incorporation/Cooperation with By-Laws',
            group: 'Additional documents for (NGOs/CSOs/Private Sector) - without transfer of funds',
            stageId: '01',
            isRequired: false,
        },
        {
            id: 'gia-s1-audited-fs',
            name: 'Audited Financial Statements for the past three (3) years',
            group: 'Additional documents for (NGOs/CSOs/Private Sector) - without transfer of funds',
            stageId: '01',
            isRequired: false,
        },
        {
            id: 'gia-s1-sworn-affidavit',
            name: 'Sworn Affidavit of no relationship',
            group: 'Additional documents for (NGOs/CSOs/Private Sector) - without transfer of funds',
            stageId: '01',
            isRequired: false,
        },
        {
            id: 'gia-s1-secretary-cert',
            name: "Secretary's Certificate of directors and officers",
            group: 'Additional documents for (NGOs/CSOs/Private Sector) - without transfer of funds',
            stageId: '01',
            isRequired: false,
        },
        {
            id: 'gia-s1-board-resolution',
            name: 'Board Resolution for the engagement of the NGO/CSO/PO for the project, assignment of the official representative, and authority to sign related documents and transact with DOST Davao Region',
            group: 'Additional documents for (NGOs/CSOs/Private Sector) - without transfer of funds',
            stageId: '01',
            isRequired: false,
        },

        // Stage 02: Releasing of Project Funds
        {
            id: 'gia-s2-request-release',
            name: 'Request for the release of funds',
            group: 'General Documentary Requirements',
            stageId: '02',
            isRequired: true,
        },
        {
            id: 'gia-s2-payee-data-form',
            name: 'Payee Data Form',
            group: 'General Documentary Requirements',
            stageId: '02',
            isRequired: true,
        },
        {
            id: 'gia-s2-notarized-moa',
            name: 'Notarized Memorandum of Agreement',
            group: 'General Documentary Requirements',
            stageId: '02',
            isRequired: true,
        },
        {
            id: 'gia-s2-rtec-report',
            name: 'RTEC Report',
            group: 'General Documentary Requirements',
            stageId: '02',
            isRequired: true,
        },
        {
            id: 'gia-s2-dost-form-4b',
            name: 'DOST Form 4.B (Non-R&D Project Proposal)',
            group: 'General Documentary Requirements',
            stageId: '02',
            isRequired: true,
        },
        {
            id: 'gia-s2-dost-form-6',
            name: 'DOST Form 6 (Line Item Budget) with counterpart funds',
            group: 'General Documentary Requirements',
            stageId: '02',
            isRequired: true,
        },
        {
            id: 'gia-s2-dost-form-5',
            name: 'DOST Form 5 (Workplan)',
            group: 'General Documentary Requirements',
            stageId: '02',
            isRequired: true,
        },
        {
            id: 'gia-s2-cfa',
            name: 'Certificate of Funds Availability (CFA)',
            group: 'General Documentary Requirements',
            stageId: '02',
            isRequired: true,
        },
        {
            id: 'gia-s2-loi',
            name: 'Letter of Intent',
            group: 'General Documentary Requirements',
            stageId: '02',
            isRequired: true,
        },
        {
            id: 'gia-s2-dost-form-7',
            name: 'DOST Form 7 (Clearance from the DOST or the Funding Agency on previously funded, completed projects)',
            group: 'General Documentary Requirements',
            stageId: '02',
            isRequired: true,
        },
        {
            id: 'gia-s2-brgy-bond',
            name: 'Bond of Barangay Captain and Barangay Treasurer with an amount that can cover the funds to be granted',
            group: 'Additional documents for Barangay LGUs',
            stageId: '02',
            isRequired: false,
        },
        {
            id: 'gia-s2-brgy-certification',
            name: 'Certification or other equivalent documents of previously handled projects through downloaded funds from external sources, preferably government agencies, as applicable',
            group: 'Additional documents for Barangay LGUs',
            stageId: '02',
            isRequired: false,
        },
        {
            id: 'gia-s2-ched-accreditation',
            name: 'CHED Accreditation',
            group: 'Additional documents for Higher Education Institutions',
            stageId: '02',
            isRequired: false,
        },
        {
            id: 'gia-s2-good-track-record',
            name: 'Certification of Good Track Record with DOST',
            group: 'Additional documents for Higher Education Institutions',
            stageId: '02',
            isRequired: false,
        },

        // Stage 03: Project Monitoring
        {
            id: 'gia-s3-dost-form-10',
            name: 'DOST Form 10 (Executive Summary of Technical Progress Report)',
            group: 'Documentary Reports: From Implementing Agency (IA)',
            stageId: '03',
            isRequired: true,
        },
        {
            id: 'gia-s3-dost-form-8',
            name: 'DOST Form 8 (List of Personnel Involved)',
            group: 'Documentary Reports: From Implementing Agency (IA)',
            stageId: '03',
            isRequired: true,
        },
        {
            id: 'gia-s3-dost-form-9',
            name: 'DOST Form 9 (List of Equipment Purchased, as applicable)',
            group: 'Documentary Reports: From Implementing Agency (IA)',
            stageId: '03',
            isRequired: false,
        },
        {
            id: 'gia-s3-dost-form-11',
            name: 'COA-received DOST Form 11 (Financial Report)',
            group: 'Documentary Reports: From Implementing Agency (IA)',
            stageId: '03',
            isRequired: true,
        },
        {
            id: 'gia-s3-dost-form-13',
            name: 'DOST Form 13 (Schedule of Accounts Payable)',
            group: 'Documentary Reports: From Implementing Agency (IA)',
            stageId: '03',
            isRequired: false,
        },
        {
            id: 'gia-s3-coa-checks',
            name: 'COA-received Reports of Checks Issued',
            group: 'Documentary Reports: From Implementing Agency (IA)',
            stageId: '03',
            isRequired: true,
        },
        {
            id: 'gia-s3-coa-disbursements',
            name: 'COA-received Reports of Disbursements',
            group: 'Documentary Reports: From Implementing Agency (IA)',
            stageId: '03',
            isRequired: true,
        },
        {
            id: 'gia-s3-dost-form-12',
            name: 'DOST Form 12 (Fund Utilization Report) (For Private)',
            group: 'Documentary Reports: From Implementing Agency (IA)',
            stageId: '03',
            isRequired: false,
        },
        {
            id: 'gia-s3-far-6',
            name: 'DBM URS-generated FAR 6 (Statement of Approved Budget, Utilizations, Disbursements and Balances for TRUST Receipts - for LGUs, NGAs, SUCs only)',
            group: 'Documentary Reports: From Implementing Agency (IA)',
            stageId: '03',
            isRequired: false,
        },
        {
            id: 'gia-s3-dost-form-14',
            name: 'DOST Form 14 (Report of Income/Interest Earned, as applicable)',
            group: 'Documentary Reports: From Implementing Agency (IA)',
            stageId: '03',
            isRequired: false,
        },
        {
            id: 'gia-s3-jev-equipment',
            name: 'Journal Entry Voucher for the Purchase of Equipment and Recognition of Depreciation Expenses',
            group: 'Documentary Reports: From Implementing Agency (IA)',
            stageId: '03',
            isRequired: false,
        },
        {
            id: 'gia-s3-dost-form-15',
            name: 'DOST Form 15 (Project Monitoring and Field Evaluation Report)',
            group: 'Documentary Reports: From Monitoring Agency (DOST Davao Region)',
            stageId: '03',
            isRequired: true,
        },

        // Stage 04: Extension & Reprogramming
        {
            id: 'gia-s4-request-extension',
            name: 'Letter of Request with justifications for extension/change of implementation date, duly signed by the Head of IA',
            group: 'Documentary Requirements',
            stageId: '04',
            isRequired: true,
        },
        {
            id: 'gia-s4-endorsement-monitoring',
            name: 'Endorsement Letter from the Monitoring Unit',
            group: 'Documentary Requirements',
            stageId: '04',
            isRequired: true,
        },
        {
            id: 'gia-s4-latest-dost-form-11',
            name: 'Latest DOST Form 11 (if project has transferred funds, must also attach the latest FR of the utilization of downloaded funds to IA)',
            group: 'Documentary Requirements',
            stageId: '04',
            isRequired: true,
        },
        {
            id: 'gia-s4-latest-dost-form-10',
            name: 'Latest DOST Form 10 (Executive Summary of Technical Progress Report) (for extension)',
            group: 'Documentary Requirements',
            stageId: '04',
            isRequired: true,
        },
        {
            id: 'gia-s4-dost-form-6',
            name: 'DOST Form 6 (Proposed Line-Item-Budget)',
            group: 'Documentary Requirements',
            stageId: '04',
            isRequired: true,
        },
        {
            id: 'gia-s4-updated-dost-form-5',
            name: 'Updated DOST Form 5 (Workplan)',
            group: 'Documentary Requirements',
            stageId: '04',
            isRequired: true,
        },

        // Stage 05: Project Liquidation and Completion
        {
            id: 'gia-s5-endorsement-complete',
            name: 'Endorsement Letter from Head of IA for the submission of complete set of documents',
            group: 'Documentary Requirements: From Implementing Agency',
            stageId: '05',
            isRequired: true,
        },
        {
            id: 'gia-s5-dost-form-11-updated',
            name: 'DOST Form 11 - updated Financial Report (FR) duly signed as to approval by the Implementing Agency (IA)',
            group: 'Documentary Requirements: From Implementing Agency',
            stageId: '05',
            isRequired: true,
        },
        {
            id: 'gia-s5-dost-form-18',
            name: 'DOST Form 18 - Terminal Financial Report duly signed as to approval by the Implementing Agency (IA) and duly stamped received by COA',
            group: 'Documentary Requirements: From Implementing Agency',
            stageId: '05',
            isRequired: true,
        },
        {
            id: 'gia-s5-coa-checks',
            name: 'COA-received Report of Checks Issued',
            group: 'Documentary Requirements: From Implementing Agency',
            stageId: '05',
            isRequired: true,
        },
        {
            id: 'gia-s5-coa-disbursement',
            name: 'COA-received Report of Disbursement',
            group: 'Documentary Requirements: From Implementing Agency',
            stageId: '05',
            isRequired: true,
        },
        {
            id: 'gia-s5-or-unexpended',
            name: 'Official Receipt (OR) of Unexpended Balance (as applicable)',
            group: 'Documentary Requirements: From Implementing Agency',
            stageId: '05',
            isRequired: false,
        },
        {
            id: 'gia-s5-lib-realignment',
            name: 'Line-Item Budget / Realignment (as applicable)',
            group: 'Documentary Requirements: From Implementing Agency',
            stageId: '05',
            isRequired: false,
        },
        {
            id: 'gia-s5-dost-form-8',
            name: 'DOST Form 8: List of Personnel Involved',
            group: 'Documentary Requirements: From Implementing Agency',
            stageId: '05',
            isRequired: true,
        },
        {
            id: 'gia-s5-dost-form-9',
            name: 'DOST Form 9: List of Equipment Purchased',
            group: 'Documentary Requirements: From Implementing Agency',
            stageId: '05',
            isRequired: false,
        },
        {
            id: 'gia-s5-dost-form-17',
            name: 'DOST Form 17: Executive Summary of Terminal Accomplishment Report',
            group: 'Documentary Requirements: From Implementing Agency',
            stageId: '05',
            isRequired: true,
        },
        {
            id: 'gia-s5-narrative-report',
            name: 'Narrative Report with photo documentation of the implemented projects/activities',
            group: 'Documentary Requirements: From Implementing Agency',
            stageId: '05',
            isRequired: true,
        },
        {
            id: 'gia-s5-proof-outputs',
            name: 'Proof of Outputs: Inspection Report, publishable or pre-print manuscript, evidence of IP protection filing; (as applicable)',
            group: 'Documentary Requirements: From Implementing Agency',
            stageId: '05',
            isRequired: false,
        },
        {
            id: 'gia-s5-beneficiaries-list',
            name: 'List of Beneficiaries signifying acceptance/acknowledgement of the project/funds/goods/services received, (as applicable)',
            group: 'Documentary Requirements: From Implementing Agency',
            stageId: '05',
            isRequired: false,
        },
        {
            id: 'gia-s5-purchase-docs',
            name: 'All documents related to the purchase of equipment',
            group: 'Documentary Requirements: From Implementing Agency',
            stageId: '05',
            isRequired: false,
        },
        {
            id: 'gia-s5-insurance-equipment',
            name: 'Insurance of the procured equipment (CTC)',
            group: 'Documentary Requirements: From Implementing Agency',
            stageId: '05',
            isRequired: false,
        },
        {
            id: 'gia-s5-jev-depreciation',
            name: 'JEV on Depreciation pertaining to the procured equipment, if applicable',
            group: 'Documentary Requirements: From Implementing Agency',
            stageId: '05',
            isRequired: false,
        },
        {
            id: 'gia-s5-par-ics',
            name: 'PAR/ICS issued by IA',
            group: 'Documentary Requirements: From Implementing Agency',
            stageId: '05',
            isRequired: false,
        },
        {
            id: 'gia-s5-inventory-inspection',
            name: 'Inventory of Equipment and Inspection report prepared by IA, conforme by Monitoring Unit',
            group: 'Documentary Requirements: From Implementing Agency',
            stageId: '05',
            isRequired: false,
        },
        {
            id: 'gia-s5-schedule-depreciation',
            name: 'Schedule of Depreciation and Net Book Value of procured equipment',
            group: 'Documentary Requirements: From Implementing Agency',
            stageId: '05',
            isRequired: false,
        },
        {
            id: 'gia-s5-dost-form-14',
            name: 'DOST Form 14 (Report of Income/Interest Earned, as applicable)',
            group: 'Documentary Requirements: From Implementing Agency',
            stageId: '05',
            isRequired: false,
        },
    ];

const CHECKLIST_STORAGE_KEY = 'dprms_document_checklist_cache_v1';

/** Get local checklist cache. */
function _getLocalChecklistCache(): Record<
    number,
    { items: DocumentChecklistItem[]; overallRemarks: string; lastUpdated: string; }
>
{
    try
    {
        const strRaw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
        return strRaw ? JSON.parse(strRaw) : {};
    } catch (errCaught)
    {
        reportError(errCaught, 'document_checklist_store: get local checklist cache failed.');

        return {};
    }
}

/** Save local checklist cache. */
function _saveLocalChecklistCache(
    intProposalId: number,
    arrItems: DocumentChecklistItem[],
    txtOverallRemarks: string,
)
{
    try
    {
        const objCurrent = _getLocalChecklistCache();
        objCurrent[intProposalId] = {
            items: arrItems,
            overallRemarks: txtOverallRemarks,
            lastUpdated: new Date().toISOString(),
        };
        localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(objCurrent));
    } catch (errCaught)
    {
        reportError(errCaught, 'document_checklist_store: save local checklist cache failed.');

        //
    }
}

/** Ensure backend token. */
export async function ensureBackendToken(): Promise<string | null>
{
    return localStorage.getItem('dprms.auth-token');
}

/** Normalize text. */
function _normalizeText(strValue?: string | null): string
{
    if (!strValue)
    {
        return '';
    }
    return strValue
        .toLowerCase()
        .replace(/^[a-z0-9]+[.)]\s*/i, '')
        .replace(/[^a-z0-9]+/gi, ' ')
        .trim();
}

/** Is internal checklist item. */
export function isInternalChecklistItem(strReqId: string, strReqName?: string): boolean
{
    if (
        strReqId.startsWith('setup-s3-') ||
        strReqId.startsWith('gia-s2-') ||
        strReqId.startsWith('gia-s3-') ||
        strReqId.startsWith('gia-s4-') ||
        strReqId.startsWith('gia-s5-')
    )
    {
        return true;
    }
    if (
        [
            'setup-s1-tna-01',
            'setup-s1-gad-assessment',
            'setup-s1-gad-checklist',
            'setup-s1-hazard-hunter',
            'setup-s2-tna-form-4',
            'gia-s1-endorsement',
            'gia-s1-rtec-report',
            'gia-s1-seti-scorecard',
        ].includes(strReqId)
    )
    {
        return true;
    }
    if (strReqName)
    {
        const strNameLower = strReqName.toLowerCase();
        if (
            strNameLower.includes('tna form') ||
            strNameLower.includes('gad assessment') ||
            strNameLower.includes('hazard hunter')
        )
        {
            return true;
        }
    }
    return false;
} /* end isInternalChecklistItem */

/** Find matching uploaded doc. */
function _findMatchingUploadedDoc(
    strReqId: string,
    strReqName: string,
    arrUploadedDocs: DocumentApiRecord[],
    intExpectedDocTypeId?: number,
): DocumentApiRecord | null
{
    const blnIsInternal = isInternalChecklistItem(strReqId, strReqName);
    const intTargetDocTypeId = intExpectedDocTypeId || CHECKLIST_ITEM_DOC_TYPE_ID[strReqId];

    /** Is proposal doc. */
    const _isProposalDoc = (objDoc: DocumentApiRecord) =>
    {
        const objSetNum = (objDoc.document_type as any)?.set_number;
        if (objSetNum === 'PROPOSAL')
        {
            return true;
        }
        const strDocName = objDoc.document_type?.name?.toLowerCase() || '';
        const strFileName = objDoc.file_name?.toLowerCase() || '';
        return (
            strDocName.includes('setup form 001') ||
            strFileName.includes('setup_form_001') ||
            strDocName.includes('project proposal form')
        );
    };

    if (intTargetDocTypeId)
    {
        const objExactMatch = arrUploadedDocs.find(
            (objDoc) =>
                (objDoc.document_type_id === intTargetDocTypeId ||
                    objDoc.document_type?.id === intTargetDocTypeId) &&
                !_isProposalDoc(objDoc),
        );
        if (objExactMatch)
        {
            return objExactMatch;
        }
    }

    const strCanonicalName = _normalizeText(strReqName);
    const objExactNameMatch = arrUploadedDocs.find((objDoc) =>
    {
        if (_isProposalDoc(objDoc))
        {
            return false;
        }
        const strNorm = _normalizeText(objDoc.document_type?.name);
        return strNorm && strNorm === strCanonicalName;
    });
    if (objExactNameMatch)
    {
        return objExactNameMatch;
    }

    if (blnIsInternal)
    {
        return null;
    }

    const strNormalizedTarget = strCanonicalName;

    return (
        arrUploadedDocs.find(
            (objDoc) =>
            {
                if (_isProposalDoc(objDoc))
                {
                    return false;
                }
                const strNormalizedType = _normalizeText(objDoc.document_type?.name);
                const strNormalizedFile = _normalizeText(
                    objDoc.file_name?.replace(/\.[^/.]+$/, ''),
                );

                if (
                    strNormalizedType &&
                    (strNormalizedType === strNormalizedTarget ||
                        (strNormalizedType.length >= 4 &&
                            strNormalizedTarget.includes(strNormalizedType)) ||
                        (strNormalizedTarget.length >= 4 &&
                            strNormalizedType.includes(strNormalizedTarget)))
                )
                {
                    return true;
                }

                if (
                    strNormalizedFile &&
                    (strNormalizedFile === strNormalizedTarget ||
                        (strNormalizedFile.length >= 4 &&
                            strNormalizedTarget.includes(strNormalizedFile)) ||
                        (strNormalizedTarget.length >= 4 &&
                            strNormalizedFile.includes(strNormalizedTarget)))
                )
                {
                    return true;
                }

                return false;
            } /* end _findMatchingUploadedDoc */,
        ) || null
    );
} /* end _findMatchingUploadedDoc */

/** Make local doc record. */
function _makeLocalDocRecord(
    objDoc: any,
    intDocTypeId: number | undefined,
    strReqName: string,
    intProposalId?: number,
): DocumentApiRecord
{
    return {
        id: objDoc.backendId || Math.floor(Math.random() * 100000),
        proposal_id: intProposalId || 0,
        document_type_id: intDocTypeId || 1,
        uploaded_by: 1,
        reviewed_by: null,
        file_name: objDoc.fileName || 'document.pdf',
        file_path: objDoc.dataUrl || '',
        file_size: objDoc.fileSize || 1024,
        mime_type: objDoc.fileType || 'application/pdf',
        status: objDoc.verificationStatus === 'Approved' ? 'approved' : 'pending',
        remarks: objDoc.remarks || null,
        reviewed_at: objDoc.reviewedAt || null,
        created_at: objDoc.uploadedAt || new Date().toISOString(),
        updated_at: objDoc.uploadedAt || new Date().toISOString(),
        document_type: {
            id: intDocTypeId || 1,
            name: strReqName,
            group: '',
        },
    };
}

/** Find matching local doc. */
function _findMatchingLocalDoc(
    strReqId: string,
    strReqName: string,
    objLocalDocs: Record<string, any>,
    intProposalId?: number,
): DocumentApiRecord | null
{
    const intExpectedDocTypeId = CHECKLIST_ITEM_DOC_TYPE_ID[strReqId];
    const blnIsInternal = isInternalChecklistItem(strReqId);

    if (objLocalDocs[strReqId])
    {
        return _makeLocalDocRecord(
            objLocalDocs[strReqId],
            intExpectedDocTypeId,
            strReqName,
            intProposalId,
        );
    }

    if (intExpectedDocTypeId && objLocalDocs[String(intExpectedDocTypeId)])
    {
        return _makeLocalDocRecord(
            objLocalDocs[String(intExpectedDocTypeId)],
            intExpectedDocTypeId,
            strReqName,
            intProposalId,
        );
    }

    if (blnIsInternal)
    {
        return null;
    }

    if (intExpectedDocTypeId)
    {
        for (const [strAppKey, intTypeId] of Object.entries(APPLICANT_REQ_ID_TO_DOC_TYPE_ID))
        {
            if (intTypeId === intExpectedDocTypeId && objLocalDocs[strAppKey])
            {
                return _makeLocalDocRecord(
                    objLocalDocs[strAppKey],
                    intExpectedDocTypeId,
                    strReqName,
                    intProposalId,
                );
            }
        }
    }

    const strCode = strReqId.toLowerCase();
    const strCleanName = strReqName.toLowerCase().replace(/^\d+\.\s*/, '');

    for (const [strKey, objDoc] of Object.entries(objLocalDocs))
    {
        if (!objDoc)
        {
            continue;
        }
        const strKeyLower = strKey.toLowerCase();
        const objNameLower = (objDoc.fileName || '').toLowerCase();

        if (
            strKeyLower === strCode ||
            strCleanName.includes(strKeyLower) ||
            (strCode.includes('dti') &&
                (strKeyLower.includes('dti') || objNameLower.includes('dti'))) ||
            (strCode.includes('bir') &&
                (strKeyLower.includes('bir') || objNameLower.includes('bir'))) ||
            (strCode.includes('mayor') &&
                (strKeyLower.includes('mayor') || objNameLower.includes('mayor'))) ||
            (strCode.includes('receipt') &&
                (strKeyLower.includes('receipt') || objNameLower.includes('receipt'))) ||
            (strCode.includes('quotation') &&
                (strKeyLower.includes('quotation') ||
                    objNameLower.includes('quotation') ||
                    objNameLower.includes('quote'))) ||
            (strCode.includes('lease') &&
                (strKeyLower.includes('lease') ||
                    objNameLower.includes('lease') ||
                    strKeyLower.includes('ownership'))) ||
            (strCode.includes('board-res') &&
                (strKeyLower.includes('board-res') ||
                    objNameLower.includes('board_res') ||
                    strKeyLower.includes('resolution'))) ||
            (strCode.includes('sec-cda') &&
                (strKeyLower.includes('sec') ||
                    strKeyLower.includes('cda') ||
                    objNameLower.includes('sec') ||
                    objNameLower.includes('cda'))) ||
            (strCode.includes('financial') &&
                (strKeyLower.includes('financial') ||
                    objNameLower.includes('financial') ||
                    objNameLower.includes('fs'))) ||
            (strCode.includes('letter-of-intent') &&
                (strKeyLower.includes('intent') ||
                    objNameLower.includes('intent') ||
                    objNameLower.includes('loi'))) ||
            (strCode.includes('biodata') &&
                (strKeyLower.includes('biodata') || objNameLower.includes('cv'))) ||
            (strCode.includes('govt-id') &&
                (strKeyLower.includes('id') || objNameLower.includes('id'))) ||
            (strCode.includes('brgy-cert') &&
                (strKeyLower.includes('brgy') || strKeyLower.includes('barangay'))) ||
            (strCode.includes('omnibus') &&
                (strKeyLower.includes('omnibus') || objNameLower.includes('omnibus')))
        )
        {
            return _makeLocalDocRecord(objDoc, intExpectedDocTypeId, strReqName, intProposalId);
        }
    } /* end loop */
    return null;
} /* end _findMatchingLocalDoc */

type ChecklistRequirement = {
    id: string;
    name: string;
    group: string;
    isRequired: boolean;
    stageId?: GiaStageId;
    setId?: SetupSetId;
};

const g_objChecklistSummaryRequests = new Map<
    ApplicationProgram,
    Promise<ProposalChecklistRecord[]>
>();
const g_objProposalChecklistRequests = new Map<number, Promise<ProposalChecklistRecord>>();

/** Normalize review status. */
function _normalizeReviewStatus(objValue: unknown): ProposalChecklistRecord['reviewStatus']
{
    return objValue === 'Completed' ||
        objValue === 'Needs Revision' ||
        objValue === 'In Review' ||
        objValue === 'In Progress'
        ? objValue
        : 'Not Started';
}

/** Map project summary. */
function _mapProjectSummary(objData: any): ProposalChecklistRecord
{
    const strProgram: ApplicationProgram = objData.program === 'GIA' ? 'GIA' : 'SETUP';
    const arrFallbackRequirements =
        strProgram === 'GIA' ? OFFICIAL_GIA_STAGE_ITEMS : OFFICIAL_SETUP_SET_ITEMS;
    const intReportedTotalRequired = Number(objData.total_required || 0);
    const intFallbackTotalRequired =
        arrFallbackRequirements.filter((objItem) => objItem.isRequired).length ||
        arrFallbackRequirements.length;
    const intTotalRequired = intReportedTotalRequired || intFallbackTotalRequired;
    const intUploadedCount = Math.min(
        intTotalRequired,
        Math.max(0, Number(objData.uploaded_count ?? objData.complied_count ?? 0)),
    );
    const intRemainingCount = Math.min(
        intTotalRequired,
        Math.max(0, Number(objData.remaining_count ?? intTotalRequired - intUploadedCount)),
    );

    return {
        proposalId: Number(objData.proposal_id),
        referenceNumber: objData.reference_number || `PROP-${objData.proposal_id}`,
        enterpriseName: objData.enterprise_name || 'Unnamed Enterprise',
        proponentName: objData.proponent_name || 'Proponent',
        proponentEmail: objData.proponent_email || '',
        program: strProgram,
        status: objData.status || 'APPROVED',
        submittedDate: objData.submitted_date || new Date().toISOString(),
        district: objData.district || '',
        focalName: objData.focal_name || '',
        totalRequired: intTotalRequired,
        uploadedCount: intUploadedCount,
        remainingCount: intRemainingCount,
        compliedCount: Number(objData.complied_count || 0),
        compliancePercentage: Number(objData.compliance_percentage || 0),
        items: [],
        overallRemarks: '',
        lastUpdated: objData.last_updated || objData.submitted_date || new Date().toISOString(),
        detailsLoaded: false,
        reviewStatus: _normalizeReviewStatus(objData.review_status),
    };
} /* end _mapProjectSummary */

/** Map proposal checklist. */
function _mapProposalChecklist(objData: any): ProposalChecklistRecord
{
    const objSummary = _mapProjectSummary(objData);
    const objItems = Array.isArray(objData.items)
        ? objData.items.map((objItem: any): DocumentChecklistItem => ({
            id: objItem.id,
            templateId: objItem.template_id,
            documentTypeId:
                objItem.document_type_id ||
                CHECKLIST_ITEM_DOC_TYPE_ID[objItem.id] ||
                objItem.uploaded_doc?.document_type_id ||
                1,
            name: objItem.name,
            group: objItem.group,
            setId: objItem.set_id,
            stageId: objItem.stage_id,
            isRequired: objItem.is_required,
            isPresent: objItem.is_present,
            status: objItem.status,
            remarks: objItem.remarks || '',
            uploadedDoc: objItem.uploaded_doc,
            reviewedAt: objItem.reviewed_at,
        }))
        : [];

    const objCounts = calculateChecklistDocumentCounts(objItems);

    return {
        ...objSummary,
        totalRequired: objCounts.totalRequired,
        uploadedCount: objCounts.uploadedCount,
        remainingCount: objCounts.remainingCount,
        items: objItems,
        overallRemarks: objData.overall_remarks || '',
        detailsLoaded: true,
        reviewStatus: objData.is_completed ? 'Completed' : objSummary.reviewStatus,
    };
} /* end _mapProposalChecklist */

/** Build fallback checklist. */
async function _buildFallbackChecklist(
    objSummary: ProposalChecklistRecord,
): Promise<ProposalChecklistRecord>
{
    const objLocalCache = _getLocalChecklistCache();
    const objCached = objLocalCache[objSummary.proposalId];
    const objLocalDocs = getDocuments(objSummary.referenceNumber);
    let arrUploadedDocs: DocumentApiRecord[] = [];

    try
    {
        arrUploadedDocs = await fetchProposalDocumentsForStaff(objSummary.proposalId);
    } catch (errCaught)
    {
        reportError(errCaught, 'document_checklist_store: build fallback checklist failed.');

        arrUploadedDocs = [];
    }

    const arrRequirements: ChecklistRequirement[] =
        objSummary.program === 'GIA' ? OFFICIAL_GIA_STAGE_ITEMS : OFFICIAL_SETUP_SET_ITEMS;

    const arrItems = arrRequirements.map(
        (objRequirement): DocumentChecklistItem =>
        {
            const blnIsInternal = isInternalChecklistItem(objRequirement.id, objRequirement.name);
            const objCachedItem = objCached?.items.find(
                (objItem) =>
                    objItem.id === objRequirement.id || objItem.name === objRequirement.name,
            );
            const objMatchedUploaded =
                _findMatchingUploadedDoc(objRequirement.id, objRequirement.name, arrUploadedDocs) ||
                _findMatchingLocalDoc(
                    objRequirement.id,
                    objRequirement.name,
                    objLocalDocs,
                    objSummary.proposalId,
                ) ||
                (!blnIsInternal ? objCachedItem?.uploadedDoc : null) ||
                null;

            let blnIsPresent = false;
            let strStatus: ChecklistItemStatus = 'Missing';

            if (objMatchedUploaded)
            {
                const blnIsApproved = objMatchedUploaded.status === 'approved';
                blnIsPresent = blnIsApproved;
                strStatus = blnIsApproved
                    ? 'Complied'
                    : objMatchedUploaded.status === 'returned_for_revision'
                        ? 'Needs Revision'
                        : 'Under Review';
            } else if (!blnIsInternal && objCachedItem)
            {
                blnIsPresent = objCachedItem.isPresent;
                strStatus = objCachedItem.status;
            }

            return {
                id: objRequirement.id,
                name: objRequirement.name,
                group: objRequirement.group,
                stageId: objRequirement.stageId,
                setId: objRequirement.setId,
                documentTypeId:
                    CHECKLIST_ITEM_DOC_TYPE_ID[objRequirement.id] ||
                    objMatchedUploaded?.document_type_id,
                isRequired: objRequirement.isRequired,
                isPresent: blnIsPresent,
                status: strStatus,
                remarks: objCachedItem?.remarks ?? objMatchedUploaded?.remarks ?? '',
                uploadedDoc: objMatchedUploaded ? { ...objMatchedUploaded } : null,
                reviewedAt: objMatchedUploaded?.reviewed_at || objCachedItem?.reviewedAt || null,
            };
        } /* end arrItems */,
    );

    const objCounts = calculateChecklistDocumentCounts(arrItems);
    const intTotalRequired = objCounts.totalRequired;
    const intCompliedCount = objCounts.compliedCount;
    const dblCompliancePercentage =
        intTotalRequired > 0 ? Math.round((intCompliedCount / intTotalRequired) * 100) : 0;

    return {
        ...objSummary,
        totalRequired: intTotalRequired,
        uploadedCount: objCounts.uploadedCount,
        remainingCount: objCounts.remainingCount,
        compliedCount: intCompliedCount,
        compliancePercentage: dblCompliancePercentage,
        items: arrItems,
        overallRemarks: objCached?.overallRemarks || objSummary.overallRemarks,
        lastUpdated: objCached?.lastUpdated || objSummary.lastUpdated,
        detailsLoaded: true,
    };
} /* end _buildFallbackChecklist */

/** Fetch checklist project summaries. */
export async function fetchChecklistProjectSummaries(
    strProgram: ApplicationProgram,
): Promise<ProposalChecklistRecord[]>
{
    try
    {
        const objPending = g_objChecklistSummaryRequests.get(strProgram);
        if (objPending)
        {
            return objPending;
        }

        const objRequest = (
            async () =>
            {
                try
                {
                    await ensureBackendToken();
                    const objParams = { program: strProgram, per_page: 100 };
                    const objFirstResponse = await g_objApi.get('/document-checklist/projects', {
                        params: objParams,
                    });
                    const objFirstPage = Array.isArray(objFirstResponse.data?.data)
                        ? objFirstResponse.data.data
                        : [];
                    const intLastPage = Math.max(
                        1,
                        Number(objFirstResponse.data?.meta?.last_page || 1),
                    );
                    const arrRemainingPages =
                        intLastPage > 1
                            ? await Promise.all(
                                Array.from({ length: intLastPage - 1 }, (_objUnused, intIndex) =>
                                    g_objApi.get('/document-checklist/projects', {
                                        params: { ...objParams, page: intIndex + 2 },
                                    }),
                                ),
                            )
                            : [];
                    const arrSummaries = [
                        ...objFirstPage,
                        ...arrRemainingPages.flatMap((objResponse) =>
                            Array.isArray(objResponse.data?.data) ? objResponse.data.data : [],
                        ),
                    ];
                    return arrSummaries.map(_mapProjectSummary);
                } catch (errOperation)
                {
                    /* end try */

                    reportError(errOperation, 'document_checklist_store: request failed.');
                    throw errOperation;
                }
            } /* end objRequest */
        )();

        g_objChecklistSummaryRequests.set(strProgram, objRequest);
        try
        {
            return await objRequest;
        } finally
        {
            g_objChecklistSummaryRequests.delete(strProgram);
        }
    } catch (errOperation)
    {
        /* end try */

        reportError(
            errOperation,
            'document_checklist_store: fetch checklist project summaries failed.',
        );
        throw errOperation;
    }
} /* end fetchChecklistProjectSummaries */

/** Fetch proposal checklist. */
export async function fetchProposalChecklist(
    intProposalId: number,
    objProjectSummary?: ProposalChecklistRecord,
): Promise<ProposalChecklistRecord>
{
    try
    {
        const objPending = g_objProposalChecklistRequests.get(intProposalId);
        if (objPending)
        {
            return objPending;
        }

        const objRequest = (
            async () =>
            {
                try
                {
                    await ensureBackendToken();
                    let objServerData: any = null;

                    try
                    {
                        const objResponse = await g_objApi.get(
                            `/proposals/${intProposalId}/checklist`,
                        );
                        objServerData = objResponse.data?.data;
                    } catch (errError)
                    {
                        reportError(errError, 'document_checklist_store: request failed.');

                        if (!objProjectSummary)
                        {
                            throw errError;
                        }
                    }

                    if (
                        objServerData &&
                        Array.isArray(objServerData.items) &&
                        objServerData.items.length > 0
                    )
                    {
                        return _mapProposalChecklist(objServerData);
                    }

                    const objSummary = objServerData
                        ? _mapProjectSummary(objServerData)
                        : objProjectSummary;

                    if (!objSummary)
                    {
                        throw new Error('The selected project checklist could not be loaded.');
                    }

                    return _buildFallbackChecklist(objSummary);
                } catch (errOperation)
                {
                    /* end try */

                    reportError(errOperation, 'document_checklist_store: request failed.');
                    throw errOperation;
                }
            } /* end objRequest */
        )();

        g_objProposalChecklistRequests.set(intProposalId, objRequest);
        try
        {
            return await objRequest;
        } finally
        {
            g_objProposalChecklistRequests.delete(intProposalId);
        }
    } catch (errOperation)
    {
        /* end try */

        reportError(errOperation, 'document_checklist_store: fetch proposal checklist failed.');
        throw errOperation;
    }
} /* end fetchProposalChecklist */

/** Fetch checklist proposals. */
export async function fetchChecklistProposals(): Promise<ProposalChecklistRecord[]>
{
    try
    {
        await ensureBackendToken();
        const objLocalCache = _getLocalChecklistCache();
        const arrRecords: ProposalChecklistRecord[] = [];

        try
        {
            let arrRawProposals: any[] = [];
            try
            {
                const objResponse = await g_objApi.get('/proposals');
                arrRawProposals = Array.isArray(objResponse.data?.data)
                    ? objResponse.data.data
                    : [];
            } catch (errCaught)
            {
                reportError(
                    errCaught,
                    'document_checklist_store: fetch checklist proposals failed.',
                );

                try
                {
                    const objResponse = await g_objApi.get('/proposal');
                    arrRawProposals = Array.isArray(objResponse.data?.data)
                        ? objResponse.data.data
                        : [];
                } catch (errCaught)
                {
                    reportError(
                        errCaught,
                        'document_checklist_store: fetch checklist proposals failed.',
                    );

                    arrRawProposals = [];
                }
            }

            const arrFetchedRecords = await Promise.all(
                arrRawProposals.map(
                    async (objProposal: any) =>
                    {
                        const objProposalId = objProposal.id;
                        const strProgram: ApplicationProgram =
                            objProposal.program_type === 'GIA' ? 'GIA' : 'SETUP';
                        const objSetupObj = objProposal.setup_proposal?.[0];
                        const objGiaObj = objProposal.gia_proposal?.[0];

                        const objEnterpriseName =
                            objSetupObj?.business_name ||
                            objGiaObj?.organization_name ||
                            objProposal.title ||
                            'Unnamed Enterprise';

                        const objProponentName = objProposal.user?.name || 'Proponent';
                        const objProponentEmail = objProposal.user?.email || '';
                        const objDistrict =
                            objSetupObj?.city_municipality ||
                            objSetupObj?.province ||
                            objGiaObj?.city_municipality ||
                            objGiaObj?.province ||
                            '';
                        const objReferenceNumber =
                            objProposal.reference_number || `PROP-${objProposalId}`;
                        const objSubmittedDate =
                            objProposal.submitted_at ||
                            objProposal.created_at ||
                            new Date().toISOString();
                        const objFocalName =
                            objProposal.assigned_focal?.name ||
                            objProposal.focal?.name ||
                            (strProgram === 'GIA' ? 'GIA Focal' : 'SETUP Focal');

                        let objServerChecklistData: any = null;
                        try
                        {
                            const objCheckRes = await g_objApi.get(
                                `/proposals/${objProposalId}/checklist`,
                            );
                            objServerChecklistData = objCheckRes.data?.data;
                        } catch (errCaught)
                        {
                            reportError(
                                errCaught,
                                'document_checklist_store: fetched records failed.',
                            );

                            objServerChecklistData = null;
                        }

                        if (
                            objServerChecklistData &&
                            Array.isArray(objServerChecklistData.items) &&
                            objServerChecklistData.items.length > 0
                        )
                        {
                            return {
                                proposalId: objServerChecklistData.proposal_id,
                                referenceNumber: objServerChecklistData.reference_number,
                                enterpriseName: objServerChecklistData.enterprise_name,
                                proponentName: objServerChecklistData.proponent_name,
                                proponentEmail: objServerChecklistData.proponent_email,
                                program: objServerChecklistData.program,
                                status: objServerChecklistData.status,
                                submittedDate: objServerChecklistData.submitted_date,
                                district: objServerChecklistData.district,
                                focalName: objServerChecklistData.focal_name,
                                totalRequired: objServerChecklistData.total_required,
                                compliedCount: objServerChecklistData.complied_count,
                                compliancePercentage: objServerChecklistData.compliance_percentage,
                                overallRemarks: objServerChecklistData.overall_remarks,
                                lastUpdated: objServerChecklistData.last_updated,
                                items: objServerChecklistData.items.map((objItem: any) => ({
                                    id: objItem.id,
                                    templateId: objItem.template_id,
                                    documentTypeId:
                                        objItem.document_type_id ||
                                        CHECKLIST_ITEM_DOC_TYPE_ID[objItem.id] ||
                                        objItem.uploaded_doc?.document_type_id ||
                                        1,
                                    name: objItem.name,
                                    group: objItem.group,
                                    setId: objItem.set_id,
                                    stageId: objItem.stage_id,
                                    isRequired: objItem.is_required,
                                    isPresent: objItem.is_present,
                                    status: objItem.status,
                                    remarks: objItem.remarks || '',
                                    uploadedDoc: objItem.uploaded_doc,
                                    reviewedAt: objItem.reviewed_at,
                                })),
                            } as ProposalChecklistRecord;
                        } /* end if */

                        let arrUploadedDocs: DocumentApiRecord[] = [];
                        try
                        {
                            arrUploadedDocs = await fetchProposalDocumentsForStaff(objProposalId);
                        } catch (errCaught)
                        {
                            reportError(
                                errCaught,
                                'document_checklist_store: fetched records failed.',
                            );

                            arrUploadedDocs = [];
                        }

                        const objLocalDocs = getDocuments(objReferenceNumber);
                        const objCached = objLocalCache[objProposalId];

                        let arrItems: DocumentChecklistItem[] = [];

                        if (strProgram === 'GIA')
                        {
                            arrItems = OFFICIAL_GIA_STAGE_ITEMS.map(
                                (objRequest) =>
                                {
                                    const blnIsInternal = isInternalChecklistItem(
                                        objRequest.id,
                                        objRequest.name,
                                    );
                                    const objCachedItem = objCached?.items.find(
                                        (objIndex) =>
                                            objIndex.id === objRequest.id ||
                                            objIndex.name === objRequest.name,
                                    );
                                    const objMatchedUploaded =
                                        _findMatchingUploadedDoc(
                                            objRequest.id,
                                            objRequest.name,
                                            arrUploadedDocs,
                                        ) ||
                                        _findMatchingLocalDoc(
                                            objRequest.id,
                                            objRequest.name,
                                            objLocalDocs,
                                            objProposalId,
                                        ) ||
                                        (!blnIsInternal ? objCachedItem?.uploadedDoc : null) ||
                                        null;

                                    let blnIsPresent = false;
                                    let strStatus: ChecklistItemStatus = 'Missing';

                                    if (objMatchedUploaded)
                                    {
                                        const blnIsApproved =
                                            objMatchedUploaded.status === 'approved';
                                        blnIsPresent = blnIsApproved;
                                        strStatus = blnIsApproved
                                            ? 'Complied'
                                            : objMatchedUploaded.status === 'returned_for_revision'
                                                ? 'Needs Revision'
                                                : 'Under Review';
                                    } else if (blnIsInternal)
                                    {
                                        blnIsPresent = false;
                                        strStatus = 'Missing';
                                    } else if (objCachedItem)
                                    {
                                        blnIsPresent = objCachedItem.isPresent;
                                        strStatus = objCachedItem.status;
                                    }

                                    return {
                                        id: objRequest.id,
                                        name: objRequest.name,
                                        group: objRequest.group,
                                        stageId: objRequest.stageId,
                                        documentTypeId:
                                            CHECKLIST_ITEM_DOC_TYPE_ID[objRequest.id] ||
                                            objMatchedUploaded?.document_type_id,
                                        isRequired: objRequest.isRequired,
                                        isPresent: blnIsPresent,
                                        status: strStatus,
                                        remarks:
                                            objCachedItem?.remarks ??
                                            objMatchedUploaded?.remarks ??
                                            '',
                                        uploadedDoc: objMatchedUploaded
                                            ? {
                                                ...objMatchedUploaded,
                                                status: objMatchedUploaded.status,
                                            }
                                            : null,
                                        reviewedAt:
                                            objMatchedUploaded?.reviewed_at ||
                                            objCachedItem?.reviewedAt ||
                                            null,
                                    };
                                } /* end arrFetchedRecords */,
                            );
                        } /* end if */ else
                        {
                            arrItems = OFFICIAL_SETUP_SET_ITEMS.map(
                                (objRequest) =>
                                {
                                    const blnIsInternal = isInternalChecklistItem(
                                        objRequest.id,
                                        objRequest.name,
                                    );
                                    const objCachedItem = objCached?.items.find(
                                        (objIndex) =>
                                            objIndex.id === objRequest.id ||
                                            objIndex.name === objRequest.name,
                                    );
                                    const objMatchedUploaded =
                                        _findMatchingUploadedDoc(
                                            objRequest.id,
                                            objRequest.name,
                                            arrUploadedDocs,
                                        ) ||
                                        _findMatchingLocalDoc(
                                            objRequest.id,
                                            objRequest.name,
                                            objLocalDocs,
                                            objProposalId,
                                        ) ||
                                        (!blnIsInternal ? objCachedItem?.uploadedDoc : null) ||
                                        null;

                                    let blnIsPresent = false;
                                    let strStatus: ChecklistItemStatus = 'Missing';

                                    if (objMatchedUploaded)
                                    {
                                        const blnIsApproved =
                                            objMatchedUploaded.status === 'approved';
                                        blnIsPresent = blnIsApproved;
                                        strStatus = blnIsApproved
                                            ? 'Complied'
                                            : objMatchedUploaded.status === 'returned_for_revision'
                                                ? 'Needs Revision'
                                                : 'Under Review';
                                    } else if (blnIsInternal)
                                    {
                                        blnIsPresent = false;
                                        strStatus = 'Missing';
                                    } else if (objCachedItem)
                                    {
                                        blnIsPresent = objCachedItem.isPresent;
                                        strStatus = objCachedItem.status;
                                    }

                                    return {
                                        id: objRequest.id,
                                        name: objRequest.name,
                                        group: objRequest.group,
                                        setId: objRequest.setId,
                                        documentTypeId:
                                            CHECKLIST_ITEM_DOC_TYPE_ID[objRequest.id] ||
                                            objMatchedUploaded?.document_type_id,
                                        isRequired: objRequest.isRequired,
                                        isPresent: blnIsPresent,
                                        status: strStatus,
                                        remarks:
                                            objCachedItem?.remarks ??
                                            objMatchedUploaded?.remarks ??
                                            '',
                                        uploadedDoc: objMatchedUploaded
                                            ? {
                                                ...objMatchedUploaded,
                                                status: objMatchedUploaded.status,
                                            }
                                            : null,
                                        reviewedAt:
                                            objMatchedUploaded?.reviewed_at ||
                                            objCachedItem?.reviewedAt ||
                                            null,
                                    };
                                } /* end arrFetchedRecords */,
                            );
                        } /* end if */

                        const intTotalRequired =
                            arrItems.filter((objIndex) => objIndex.isRequired).length ||
                            arrItems.length;
                        const intCompliedCount = arrItems.filter((objIndex) =>
                            objIndex.isRequired ? objIndex.isPresent : false,
                        ).length;
                        const dblCompliancePercentage =
                            intTotalRequired > 0
                                ? Math.round((intCompliedCount / intTotalRequired) * 100)
                                : 0;

                        return {
                            proposalId: objProposalId,
                            referenceNumber: objReferenceNumber,
                            enterpriseName: objEnterpriseName,
                            proponentName: objProponentName,
                            proponentEmail: objProponentEmail,
                            program: strProgram,
                            status: objProposal.status || 'Submitted',
                            submittedDate: objSubmittedDate,
                            district: objDistrict,
                            focalName: objFocalName,
                            totalRequired: intTotalRequired,
                            compliedCount: intCompliedCount,
                            compliancePercentage: dblCompliancePercentage,
                            items: arrItems,
                            overallRemarks: objCached?.overallRemarks || objProposal.remarks || '',
                            lastUpdated:
                                objCached?.lastUpdated ||
                                objProposal.updated_at ||
                                objSubmittedDate,
                        } as ProposalChecklistRecord;
                    } /* end arrFetchedRecords */,
                ),
            );

            arrRecords.push(...arrFetchedRecords.filter(Boolean));
        } /* end try */ catch (errError)
        {
            reportError(errError, 'document_checklist_store: fetch checklist proposals failed.');

            reportError(
                errError,
                'Could not load proposals from API, building from applications store',
            );
        }

        if (arrRecords.length === 0)
        {
            const arrFallbackApps = getApplications();
            arrFallbackApps.forEach(
                (objApp, intIndex) =>
                {
                    const intProposalId =
                        objApp.proposalId ||
                        (Number(objApp.id.replace(/\D/g, '')) > 0
                            ? Number(objApp.id.replace(/\D/g, ''))
                            : intIndex + 1);
                    const objLocalDocs = getDocuments(objApp.referenceNo);
                    const objCached = objLocalCache[intProposalId];
                    const strProgram = objApp.program || 'SETUP';

                    let arrItems: DocumentChecklistItem[] = [];

                    if (strProgram === 'GIA')
                    {
                        arrItems = OFFICIAL_GIA_STAGE_ITEMS.map(
                            (objRequest) =>
                            {
                                const blnIsInternal = isInternalChecklistItem(
                                    objRequest.id,
                                    objRequest.name,
                                );
                                const objCachedItem = objCached?.items.find(
                                    (objIndex) =>
                                        objIndex.id === objRequest.id ||
                                        objIndex.name === objRequest.name,
                                );
                                const objMatchedUploaded =
                                    _findMatchingLocalDoc(
                                        objRequest.id,
                                        objRequest.name,
                                        objLocalDocs,
                                        intProposalId,
                                    ) ||
                                    (!blnIsInternal ? objCachedItem?.uploadedDoc : null) ||
                                    null;

                                let blnIsPresent = false;
                                let strStatus: ChecklistItemStatus = 'Missing';

                                if (objMatchedUploaded)
                                {
                                    const blnIsApproved = objMatchedUploaded.status === 'approved';
                                    blnIsPresent = blnIsApproved;
                                    strStatus = blnIsApproved
                                        ? 'Complied'
                                        : objMatchedUploaded.status === 'returned_for_revision'
                                            ? 'Needs Revision'
                                            : 'Under Review';
                                } else if (blnIsInternal)
                                {
                                    blnIsPresent = false;
                                    strStatus = 'Missing';
                                } else if (objCachedItem)
                                {
                                    blnIsPresent = objCachedItem.isPresent;
                                    strStatus = objCachedItem.status;
                                }

                                return {
                                    id: objRequest.id,
                                    name: objRequest.name,
                                    group: objRequest.group,
                                    stageId: objRequest.stageId,
                                    documentTypeId:
                                        CHECKLIST_ITEM_DOC_TYPE_ID[objRequest.id] ||
                                        objMatchedUploaded?.document_type_id,
                                    isRequired: objRequest.isRequired,
                                    isPresent: blnIsPresent,
                                    status: strStatus,
                                    remarks:
                                        objCachedItem?.remarks || objMatchedUploaded?.remarks || '',
                                    uploadedDoc: objMatchedUploaded
                                        ? {
                                            ...objMatchedUploaded,
                                            status: objMatchedUploaded.status,
                                        }
                                        : null,
                                    reviewedAt: objCachedItem?.reviewedAt || null,
                                };
                            } /* end fetchChecklistProposals */,
                        );
                    } /* end if */ else
                    {
                        arrItems = OFFICIAL_SETUP_SET_ITEMS.map(
                            (objRequest) =>
                            {
                                const blnIsInternal = isInternalChecklistItem(
                                    objRequest.id,
                                    objRequest.name,
                                );
                                const objCachedItem = objCached?.items.find(
                                    (objIndex) =>
                                        objIndex.id === objRequest.id ||
                                        objIndex.name === objRequest.name,
                                );
                                const objMatchedUploaded =
                                    _findMatchingLocalDoc(
                                        objRequest.id,
                                        objRequest.name,
                                        objLocalDocs,
                                        intProposalId,
                                    ) ||
                                    (!blnIsInternal ? objCachedItem?.uploadedDoc : null) ||
                                    null;

                                let blnIsPresent = false;
                                let strStatus: ChecklistItemStatus = 'Missing';

                                if (objMatchedUploaded)
                                {
                                    const blnIsApproved = objMatchedUploaded.status === 'approved';
                                    blnIsPresent = blnIsApproved;
                                    strStatus = blnIsApproved
                                        ? 'Complied'
                                        : objMatchedUploaded.status === 'returned_for_revision'
                                            ? 'Needs Revision'
                                            : 'Under Review';
                                } else if (blnIsInternal)
                                {
                                    blnIsPresent = false;
                                    strStatus = 'Missing';
                                } else if (objCachedItem)
                                {
                                    blnIsPresent = objCachedItem.isPresent;
                                    strStatus = objCachedItem.status;
                                }

                                return {
                                    id: objRequest.id,
                                    name: objRequest.name,
                                    group: objRequest.group,
                                    setId: objRequest.setId,
                                    documentTypeId:
                                        CHECKLIST_ITEM_DOC_TYPE_ID[objRequest.id] ||
                                        objMatchedUploaded?.document_type_id,
                                    isRequired: objRequest.isRequired,
                                    isPresent: blnIsPresent,
                                    status: strStatus,
                                    remarks:
                                        objCachedItem?.remarks || objMatchedUploaded?.remarks || '',
                                    uploadedDoc: objMatchedUploaded
                                        ? {
                                            ...objMatchedUploaded,
                                            status: objMatchedUploaded.status,
                                        }
                                        : null,
                                    reviewedAt: objCachedItem?.reviewedAt || null,
                                };
                            } /* end fetchChecklistProposals */,
                        );
                    } /* end if */

                    const intTotalRequired =
                        arrItems.filter((objIndex) => objIndex.isRequired).length ||
                        arrItems.length;
                    const intCompliedCount = arrItems.filter((objIndex) =>
                        objIndex.isRequired ? objIndex.isPresent : false,
                    ).length;
                    const dblCompliancePercentage =
                        intTotalRequired > 0
                            ? Math.round((intCompliedCount / intTotalRequired) * 100)
                            : 0;

                    arrRecords.push({
                        proposalId: intProposalId,
                        referenceNumber: objApp.referenceNo || `PROP-${intProposalId}`,
                        enterpriseName:
                            objApp.organizationName || objApp.projectTitle || 'Enterprise',
                        proponentName: objApp.applicantName || 'Proponent',
                        proponentEmail: objApp.contactEmail || '',
                        program: strProgram,
                        status: objApp.status || 'Submitted',
                        submittedDate: objApp.createdAt || new Date().toISOString(),
                        district: objApp.location || '',
                        focalName: strProgram === 'GIA' ? 'GIA Focal' : 'SETUP Focal',
                        totalRequired: intTotalRequired,
                        compliedCount: intCompliedCount,
                        compliancePercentage: dblCompliancePercentage,
                        items: arrItems,
                        overallRemarks: objCached?.overallRemarks || '',
                        lastUpdated: objCached?.lastUpdated || new Date().toISOString(),
                    });
                } /* end fetchChecklistProposals */,
            );
        } /* end if */

        return arrRecords;
    } catch (errOperation)
    {
        /* end try */

        reportError(errOperation, 'document_checklist_store: fetch checklist proposals failed.');
        throw errOperation;
    }
} /* end fetchChecklistProposals */

/** Save proposal checklist review. */
export async function saveProposalChecklistReview(
    intProposalId: number,
    arrItems: DocumentChecklistItem[],
    txtOverallRemarks: string,
): Promise<void>
{
    _saveLocalChecklistCache(intProposalId, arrItems, txtOverallRemarks);

    try
    {
        await g_objApi.put(`/proposals/${intProposalId}/checklist/batch`, {
            overall_remarks: txtOverallRemarks,
            items: arrItems.map((objItem) => ({
                id: objItem.id,
                template_id: objItem.templateId,
                document_id: objItem.uploadedDoc?.id || null,
                is_present: objItem.isPresent,
                status: objItem.status,
                remarks: objItem.remarks,
            })),
        });
    } catch (errError)
    {
        reportError(errError, 'document_checklist_store: save proposal checklist review failed.');

        reportError(errError, `Failed to sync batch checklist review to backend:`);
    }
}

/** Upload checklist document. */
export async function uploadChecklistDocument(
    intProposalId: number,
    objItem: DocumentChecklistItem,
    objFile: File,
    strReferenceNumber?: string,
): Promise<{ uploadedDoc: DocumentApiRecord; blobUrl: string; }>
{
    try
    {
        const blnIsPdf =
            objFile.type === 'application/pdf' || objFile.name.toLowerCase().endsWith('.pdf');
        if (!blnIsPdf)
        {
            throw new Error(
                'Only PDF documents (.pdf) are allowed. Images and other file formats cannot be uploaded.',
            );
        }

        if (objFile.size > 10 * 1024 * 1024)
        {
            const strSizeMb = (objFile.size / (1024 * 1024)).toFixed(1);
            throw new Error(`File is too large (${strSizeMb} MB). Maximum allowed size is 10 MB.`);
        }

        await ensureBackendToken();
        const strBlobUrl = URL.createObjectURL(objFile);

        let objUploadedDoc: DocumentApiRecord | null = null;
        let intDocTypeId = objItem.documentTypeId || CHECKLIST_ITEM_DOC_TYPE_ID[objItem.id];

        if (!intDocTypeId)
        {
            try
            {
                const objResponse = await g_objApi.get('/document-types', {
                    params: { program: 'SETUP' },
                });
                const objTypes = Array.isArray(objResponse.data?.data) ? objResponse.data.data : [];
                const objMatched = objTypes.find(
                    (objT: any) =>
                        objT.name.toLowerCase().includes(objItem.name.toLowerCase().slice(0, 15)) ||
                        objItem.name.toLowerCase().includes(objT.name.toLowerCase().slice(0, 15)),
                );
                intDocTypeId = objMatched?.id || objTypes[0]?.id || 19;
            } catch (errCaught)
            {
                reportError(
                    errCaught,
                    'document_checklist_store: upload checklist document failed.',
                );

                intDocTypeId = 19;
            }
        }

        try
        {
            const objFormData = new FormData();
            objFormData.append('proposal_id', String(intProposalId));
            objFormData.append('document_type_id', String(intDocTypeId));
            objFormData.append('file', objFile);

            const objResponse = await g_objApi.post<{ data: DocumentApiRecord; }>(
                '/documents',
                objFormData,
                {
                    headers: { 'Content-Type': undefined },
                },
            );
            objUploadedDoc = objResponse.data.data;
        } catch (errError: any)
        {
            reportError(errError, 'document_checklist_store: upload checklist document failed.');

            const objStatus = errError?.response?.status;
            const objErrorData = errError?.response?.data;
            let strReason = '';

            if (objStatus === 413)
            {
                strReason = 'File exceeds maximum upload size allowed by the server (10 MB).';
            } else if (objErrorData?.errors)
            {
                strReason = Object.values(objErrorData.errors).flat().join(' ');
            } else if (objErrorData?.message)
            {
                strReason = objErrorData.message;
            } else if (errError?.message)
            {
                strReason = errError.message;
            }

            if (objStatus === 401 || objStatus === 403)
            {
                strReason =
                    'Your session has expired or you do not have permission to upload this document.';
            }

            if (strReason)
            {
                throw new Error(strReason);
            }
        } /* end catch */

        if (objUploadedDoc)
        {
            try
            {
                await g_objApi.patch(`/documents/${objUploadedDoc.id}/review`, {
                    status: 'approved',
                    remarks: 'Uploaded by staff via checklist',
                });
                objUploadedDoc.status = 'approved';
                objUploadedDoc.reviewed_at = new Date().toISOString();
            } catch (errCaught)
            {
                reportError(
                    errCaught,
                    'document_checklist_store: upload checklist document failed.',
                );

                //
            }
            try
            {
                await g_objApi.put(`/proposals/${intProposalId}/checklist/batch`, {
                    items: [
                        {
                            id: objItem.id,
                            template_id: objItem.templateId,
                            document_id: objUploadedDoc.id,
                            is_present: true,
                            status: 'Complied',
                            remarks: 'Uploaded: ' + objFile.name,
                        },
                    ],
                });
            } catch (errEvent)
            {
                reportError(
                    errEvent,
                    'document_checklist_store: upload checklist document failed.',
                );

                reportError(errEvent, 'Could not immediately sync checklist review link:');
            }
        } /* end if */ else
        {
            objUploadedDoc = {
                id: Date.now(),
                proposal_id: intProposalId,
                document_type_id: intDocTypeId || 1,
                uploaded_by: 1,
                reviewed_by: null,
                file_name: objFile.name,
                file_path: strBlobUrl,
                file_size: objFile.size,
                mime_type: objFile.type || 'application/pdf',
                status: 'approved',
                remarks: 'Uploaded and verified',
                reviewed_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                document_type: {
                    id: intDocTypeId || 1,
                    name: objItem.name,
                    group: objItem.group,
                },
            };
        }

        const objStoredDoc: StoredDocument = {
            backendId: objUploadedDoc.id,
            fileName: objFile.name,
            fileSize: objFile.size,
            fileType: objFile.type || 'application/pdf',
            uploadedAt: new Date().toISOString(),
            verificationStatus: 'Approved',
            dataUrl: strBlobUrl,
        };

        if (strReferenceNumber)
        {
            try
            {
                saveDocument(strReferenceNumber, objItem.id, objStoredDoc);
                if (intDocTypeId)
                {
                    saveDocument(strReferenceNumber, String(intDocTypeId), objStoredDoc);
                }
            } catch (errCaught)
            {
                reportError(
                    errCaught,
                    'document_checklist_store: upload checklist document failed.',
                );

                //
            }
        }

        const objCurrentCache = _getLocalChecklistCache();
        const objCached = objCurrentCache[intProposalId];
        if (objCached)
        {
            const arrUpdatedItems = objCached.items.map((objIt) =>
                objIt.id === objItem.id
                    ? {
                        ...objIt,
                        documentTypeId: intDocTypeId,
                        isPresent: true,
                        status: 'Complied' as ChecklistItemStatus,
                        uploadedDoc: objUploadedDoc,
                        reviewedAt: new Date().toISOString(),
                    }
                    : objIt,
            );
            _saveLocalChecklistCache(intProposalId, arrUpdatedItems, objCached.overallRemarks);
        }

        return { uploadedDoc: objUploadedDoc, blobUrl: strBlobUrl };
    } catch (errOperation)
    {
        /* end try */

        reportError(errOperation, 'document_checklist_store: upload checklist document failed.');
        throw errOperation;
    }
} /* end uploadChecklistDocument */

/** Remove checklist document. */
export async function removeChecklistDocument(intDocId?: number): Promise<void>
{
    if (!intDocId)
    {
        return;
    }
    try
    {
        await g_objApi.delete(`/documents/${intDocId}`);
    } catch (errCaught)
    {
        reportError(errCaught, 'document_checklist_store: remove checklist document failed.');

        //
    }
}

export type ChecklistHistoryAction =
    | 'UPLOAD'
    | 'REPLACE'
    | 'REMOVE'
    | 'VERIFY'
    | 'UNVERIFY'
    | 'REVIEW_APPROVED'
    | 'REVIEW_RETURNED'
    | 'REVIEW_UNDER_REVIEW'
    | 'REVIEW_PENDING'
    | 'COMPLETE_REVIEW';

export interface ChecklistHistoryItem
{
    id: string;
    proposalId: number;
    action: ChecklistHistoryAction;
    itemName?: string;
    fileName?: string;
    userName: string;
    userRole: string;
    timestamp: string;
    details?: string;
}

const HISTORY_STORAGE_KEY_PREFIX = 'dprms_checklist_history_';

/** Get checklist history. */
export function getChecklistHistory(intProposalId: number): ChecklistHistoryItem[]
{
    try
    {
        const strRaw = localStorage.getItem(`${HISTORY_STORAGE_KEY_PREFIX}${intProposalId}`);
        if (strRaw)
        {
            const objParsed = JSON.parse(strRaw);
            if (Array.isArray(objParsed))
            {
                return objParsed;
            }
        }
    } catch (errCaught)
    {
        reportError(errCaught, 'document_checklist_store: get checklist history failed.');

        //
    }

    return [];
}

/** Add checklist history log. */
export function addChecklistHistoryLog(
    objLog: Omit<ChecklistHistoryItem, 'id' | 'timestamp'>,
): ChecklistHistoryItem
{
    const arrExisting = getChecklistHistory(objLog.proposalId);
    const objNewEntry: ChecklistHistoryItem = {
        ...objLog,
        id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
    };
    const arrUpdated = [objNewEntry, ...arrExisting].slice(0, 100);
    try
    {
        localStorage.setItem(
            `${HISTORY_STORAGE_KEY_PREFIX}${objLog.proposalId}`,
            JSON.stringify(arrUpdated),
        );
    } catch (errCaught)
    {
        reportError(errCaught, 'document_checklist_store: add checklist history log failed.');

        //
    }
    return objNewEntry;
}

export interface ChecklistTemplatePayload
{
    program_type: ApplicationProgram;
    phase_code: string;
    phase_title: string;
    item_code: string;
    document_name: string;
    group_name: string;
    is_mandatory?: boolean;
    sort_order?: number;
    applicability_rules?: any;
}

/** Fetch checklist templates. */
export async function fetchChecklistTemplates(
    strProgram: ApplicationProgram,
    blnIncludeInactive = false,
): Promise<any[]>
{
    try
    {
        await ensureBackendToken();
        const objResponse = await g_objApi.get('/document-checklist/templates', {
            params: { program: strProgram, include_inactive: blnIncludeInactive },
        });
        return objResponse.data?.data || [];
    } catch (errOperation)
    {
        reportError(errOperation, 'document_checklist_store: fetch checklist templates failed.');
        throw errOperation;
    }
}

/** Create checklist template. */
export async function createChecklistTemplate(objPayload: ChecklistTemplatePayload): Promise<any>
{
    try
    {
        await ensureBackendToken();
        const objResponse = await g_objApi.post('/document-checklist/templates', objPayload);
        return objResponse.data?.data;
    } catch (errOperation)
    {
        reportError(errOperation, 'document_checklist_store: create checklist template failed.');
        throw errOperation;
    }
}

/** Update checklist template. */
export async function updateChecklistTemplate(
    intId: number,
    objPayload: Partial<ChecklistTemplatePayload> & { is_active?: boolean; },
): Promise<any>
{
    try
    {
        await ensureBackendToken();
        const objResponse = await g_objApi.put(
            `/document-checklist/templates/${intId}`,
            objPayload,
        );
        return objResponse.data?.data;
    } catch (errOperation)
    {
        reportError(errOperation, 'document_checklist_store: update checklist template failed.');
        throw errOperation;
    }
}

/** Restore checklist template. */
export async function restoreChecklistTemplate(intId: number): Promise<any>
{
    try
    {
        await ensureBackendToken();
        const objResponse = await g_objApi.patch(`/document-checklist/templates/${intId}/restore`);
        return objResponse.data?.data;
    } catch (errOperation)
    {
        reportError(errOperation, 'document_checklist_store: restore checklist template failed.');
        throw errOperation;
    }
}

/** Delete checklist template. */
export async function deleteChecklistTemplate(intId: number): Promise<void>
{
    try
    {
        await ensureBackendToken();
        await g_objApi.delete(`/document-checklist/templates/${intId}`);
    } catch (errOperation)
    {
        reportError(errOperation, 'document_checklist_store: delete checklist template failed.');
        throw errOperation;
    }
}
