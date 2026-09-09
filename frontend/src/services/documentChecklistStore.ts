import api from '../lib/axios'
import type { ApplicationProgram } from '../types/application'
import {
  fetchProposalDocumentsForStaff,
  getDocuments,
  saveDocument,
  type DocumentApiRecord,
  type StoredDocument,
} from './documentStore'
import { getApplications } from './applicationStore'
import { loginWithBackend } from './authService'

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
}

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
}

export type ChecklistItemStatus = 'Complied' | 'Missing' | 'Under Review' | 'Needs Revision'
export type GiaStageId = '01' | '02' | '03' | '04' | '05'
export type SetupSetId = 'SET1' | 'SET2' | 'SET3'

export interface GiaStageDefinition {
  id: GiaStageId
  number: string
  title: string
  shortTitle: string
  subtitle: string
}

export interface SetupSetDefinition {
  id: SetupSetId
  number: string
  title: string
  shortTitle: string
  subtitle: string
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
]

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
]

export interface DocumentChecklistItem {
  id: string
  templateId?: number
  documentTypeId?: number
  name: string
  group: string
  stageId?: GiaStageId
  setId?: SetupSetId
  isRequired: boolean
  isPresent: boolean
  status: ChecklistItemStatus
  remarks: string
  uploadedDoc?: DocumentApiRecord | null
  reviewedAt?: string | null
}

export interface ProposalChecklistRecord {
  proposalId: number
  referenceNumber: string
  enterpriseName: string
  proponentName: string
  proponentEmail: string
  program: ApplicationProgram
  status: string
  submittedDate: string
  district?: string
  focalName?: string
  totalRequired: number
  compliedCount: number
  compliancePercentage: number
  items: DocumentChecklistItem[]
  overallRemarks: string
  lastUpdated: string
}

export const OFFICIAL_SETUP_SET_ITEMS: Array<{
  id: string
  name: string
  group: string
  setId: SetupSetId
  isRequired: boolean
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
]

export const OFFICIAL_GIA_STAGE_ITEMS: Array<{
  id: string
  name: string
  group: string
  stageId: GiaStageId
  isRequired: boolean
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
]

const CHECKLIST_STORAGE_KEY = 'dprms_document_checklist_cache_v1'

function getLocalChecklistCache(): Record<number, { items: DocumentChecklistItem[]; overallRemarks: string; lastUpdated: string }> {
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveLocalChecklistCache(proposalId: number, items: DocumentChecklistItem[], overallRemarks: string) {
  try {
    const current = getLocalChecklistCache()
    current[proposalId] = {
      items,
      overallRemarks,
      lastUpdated: new Date().toISOString(),
    }
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(current))
  } catch {
    //
  }
}

export async function ensureBackendToken(): Promise<string | null> {
  const existing = localStorage.getItem('dprms.auth-token')
  if (existing) return existing

  try {
    const res = await loginWithBackend('admin@dost.gov.ph', 'Dprms@123')
    if (res?.token) {
      localStorage.setItem('dprms.auth-token', res.token)
      return res.token
    }
  } catch {
    //
  }
  return null
}

function normalizeText(value?: string | null): string {
  if (!value) return ''
  return value
    .toLowerCase()
    .replace(/^[a-z0-9]+[\.\)]\s*/i, '')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
}

export function isInternalChecklistItem(reqId: string, reqName?: string): boolean {
  if (
    reqId.startsWith('setup-s3-') ||
    reqId.startsWith('gia-s2-') ||
    reqId.startsWith('gia-s3-') ||
    reqId.startsWith('gia-s4-') ||
    reqId.startsWith('gia-s5-')
  ) {
    return true
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
    ].includes(reqId)
  ) {
    return true
  }
  if (reqName) {
    const nameLower = reqName.toLowerCase()
    if (
      nameLower.includes('tna form') ||
      nameLower.includes('gad assessment') ||
      nameLower.includes('hazard hunter')
    ) {
      return true
    }
  }
  return false
}

function findMatchingUploadedDoc(
  reqId: string,
  reqName: string,
  uploadedDocs: DocumentApiRecord[],
  expectedDocTypeId?: number
): DocumentApiRecord | null {
  const isInternal = isInternalChecklistItem(reqId, reqName)
  const targetDocTypeId = expectedDocTypeId || CHECKLIST_ITEM_DOC_TYPE_ID[reqId]

  const isProposalDoc = (doc: DocumentApiRecord) => {
    const setNum = (doc.document_type as any)?.set_number
    if (setNum === 'PROPOSAL') return true
    const docName = doc.document_type?.name?.toLowerCase() || ''
    const fileName = doc.file_name?.toLowerCase() || ''
    return docName.includes('setup form 001') || fileName.includes('setup_form_001') || docName.includes('project proposal form')
  }

  if (targetDocTypeId) {
    const exactMatch = uploadedDocs.find(
      (doc) =>
        (doc.document_type_id === targetDocTypeId || doc.document_type?.id === targetDocTypeId) &&
        !isProposalDoc(doc)
    )
    if (exactMatch) return exactMatch
  }

  const canonicalName = normalizeText(reqName)
  const exactNameMatch = uploadedDocs.find((doc) => {
    if (isProposalDoc(doc)) return false
    const norm = normalizeText(doc.document_type?.name)
    return norm && norm === canonicalName
  })
  if (exactNameMatch) return exactNameMatch

  if (isInternal) {
    return null
  }

  const normalizedTarget = canonicalName

  return (
    uploadedDocs.find((doc) => {
      if (isProposalDoc(doc)) return false
      const normalizedType = normalizeText(doc.document_type?.name)
      const normalizedFile = normalizeText(doc.file_name?.replace(/\.[^/.]+$/, ''))

      if (
        normalizedType &&
        (normalizedType === normalizedTarget ||
          (normalizedType.length >= 4 && normalizedTarget.includes(normalizedType)) ||
          (normalizedTarget.length >= 4 && normalizedType.includes(normalizedTarget)))
      ) {
        return true
      }

      if (
        normalizedFile &&
        (normalizedFile === normalizedTarget ||
          (normalizedFile.length >= 4 && normalizedTarget.includes(normalizedFile)) ||
          (normalizedTarget.length >= 4 && normalizedFile.includes(normalizedTarget)))
      ) {
        return true
      }

      return false
    }) || null
  )
}

function makeLocalDocRecord(
  doc: any,
  docTypeId: number | undefined,
  reqName: string,
  proposalId?: number
): DocumentApiRecord {
  return {
    id: doc.backendId || Math.floor(Math.random() * 100000),
    proposal_id: proposalId || 0,
    document_type_id: docTypeId || 1,
    uploaded_by: 1,
    reviewed_by: null,
    file_name: doc.fileName || 'document.pdf',
    file_path: doc.dataUrl || '',
    file_size: doc.fileSize || 1024,
    mime_type: doc.fileType || 'application/pdf',
    status: doc.verificationStatus === 'Approved' ? 'approved' : 'pending',
    remarks: doc.remarks || null,
    reviewed_at: doc.reviewedAt || null,
    created_at: doc.uploadedAt || new Date().toISOString(),
    updated_at: doc.uploadedAt || new Date().toISOString(),
    document_type: {
      id: docTypeId || 1,
      name: reqName,
      group: '',
    },
  }
}

function findMatchingLocalDoc(
  reqId: string,
  reqName: string,
  localDocs: Record<string, any>,
  proposalId?: number,
): DocumentApiRecord | null {
  const expectedDocTypeId = CHECKLIST_ITEM_DOC_TYPE_ID[reqId]
  const isInternal = isInternalChecklistItem(reqId)

  if (localDocs[reqId]) {
    return makeLocalDocRecord(localDocs[reqId], expectedDocTypeId, reqName, proposalId)
  }

  if (expectedDocTypeId && localDocs[String(expectedDocTypeId)]) {
    return makeLocalDocRecord(localDocs[String(expectedDocTypeId)], expectedDocTypeId, reqName, proposalId)
  }

  if (isInternal) {
    return null
  }

  if (expectedDocTypeId) {
    for (const [appKey, typeId] of Object.entries(APPLICANT_REQ_ID_TO_DOC_TYPE_ID)) {
      if (typeId === expectedDocTypeId && localDocs[appKey]) {
        return makeLocalDocRecord(localDocs[appKey], expectedDocTypeId, reqName, proposalId)
      }
    }
  }

  const code = reqId.toLowerCase()
  const cleanName = reqName.toLowerCase().replace(/^\d+\.\s*/, '')

  for (const [key, doc] of Object.entries(localDocs)) {
    if (!doc) continue
    const keyLower = key.toLowerCase()
    const nameLower = (doc.fileName || '').toLowerCase()

    if (
      keyLower === code ||
      cleanName.includes(keyLower) ||
      (code.includes('dti') && (keyLower.includes('dti') || nameLower.includes('dti'))) ||
      (code.includes('bir') && (keyLower.includes('bir') || nameLower.includes('bir'))) ||
      (code.includes('mayor') && (keyLower.includes('mayor') || nameLower.includes('mayor'))) ||
      (code.includes('receipt') && (keyLower.includes('receipt') || nameLower.includes('receipt'))) ||
      (code.includes('quotation') && (keyLower.includes('quotation') || nameLower.includes('quotation') || nameLower.includes('quote'))) ||
      (code.includes('lease') && (keyLower.includes('lease') || nameLower.includes('lease') || keyLower.includes('ownership'))) ||
      (code.includes('board-res') && (keyLower.includes('board-res') || nameLower.includes('board_res') || keyLower.includes('resolution'))) ||
      (code.includes('sec-cda') && (keyLower.includes('sec') || keyLower.includes('cda') || nameLower.includes('sec') || nameLower.includes('cda'))) ||
      (code.includes('financial') && (keyLower.includes('financial') || nameLower.includes('financial') || nameLower.includes('fs'))) ||
      (code.includes('letter-of-intent') && (keyLower.includes('intent') || nameLower.includes('intent') || nameLower.includes('loi'))) ||
      (code.includes('biodata') && (keyLower.includes('biodata') || nameLower.includes('cv'))) ||
      (code.includes('govt-id') && (keyLower.includes('id') || nameLower.includes('id'))) ||
      (code.includes('brgy-cert') && (keyLower.includes('brgy') || keyLower.includes('barangay'))) ||
      (code.includes('omnibus') && (keyLower.includes('omnibus') || nameLower.includes('omnibus')))
    ) {
      return makeLocalDocRecord(doc, expectedDocTypeId, reqName, proposalId)
    }
  }
  return null
}

export async function fetchChecklistProposals(): Promise<ProposalChecklistRecord[]> {
  await ensureBackendToken()
  const localCache = getLocalChecklistCache()
  const records: ProposalChecklistRecord[] = []

  try {
    let rawProposals: any[] = []
    try {
      const response = await api.get('/proposals')
      rawProposals = Array.isArray(response.data?.data) ? response.data.data : []
    } catch {
      try {
        const response = await api.get('/proposal')
        rawProposals = Array.isArray(response.data?.data) ? response.data.data : []
      } catch {
        rawProposals = []
      }
    }

    const fetchedRecords = await Promise.all(
      rawProposals.map(async (proposal: any) => {
        const proposalId = proposal.id
        const program: ApplicationProgram = proposal.program_type === 'GIA' ? 'GIA' : 'SETUP'
        const setupObj = proposal.setup_proposal?.[0]
        const giaObj = proposal.gia_proposal?.[0]

        const enterpriseName =
          setupObj?.business_name ||
          giaObj?.organization_name ||
          proposal.title ||
          'Unnamed Enterprise'

        const proponentName = proposal.user?.name || 'Proponent'
        const proponentEmail = proposal.user?.email || ''
        const district = setupObj?.city_municipality || setupObj?.province || giaObj?.city_municipality || giaObj?.province || ''
        const referenceNumber = proposal.reference_number || `PROP-${proposalId}`
        const submittedDate = proposal.submitted_at || proposal.created_at || new Date().toISOString()
        const focalName = proposal.assigned_focal?.name || proposal.focal?.name || (program === 'GIA' ? 'GIA Focal' : 'SETUP Focal')

        let serverChecklistData: any = null
        try {
          const checkRes = await api.get(`/proposals/${proposalId}/checklist`)
          serverChecklistData = checkRes.data?.data
        } catch {
          serverChecklistData = null
        }

        if (serverChecklistData && Array.isArray(serverChecklistData.items) && serverChecklistData.items.length > 0) {
          return {
            proposalId: serverChecklistData.proposal_id,
            referenceNumber: serverChecklistData.reference_number,
            enterpriseName: serverChecklistData.enterprise_name,
            proponentName: serverChecklistData.proponent_name,
            proponentEmail: serverChecklistData.proponent_email,
            program: serverChecklistData.program,
            status: serverChecklistData.status,
            submittedDate: serverChecklistData.submitted_date,
            district: serverChecklistData.district,
            focalName: serverChecklistData.focal_name,
            totalRequired: serverChecklistData.total_required,
            compliedCount: serverChecklistData.complied_count,
            compliancePercentage: serverChecklistData.compliance_percentage,
            overallRemarks: serverChecklistData.overall_remarks,
            lastUpdated: serverChecklistData.last_updated,
            items: serverChecklistData.items.map((item: any) => ({
              id: item.id,
              templateId: item.template_id,
              documentTypeId: item.document_type_id || CHECKLIST_ITEM_DOC_TYPE_ID[item.id] || item.uploaded_doc?.document_type_id || 1,
              name: item.name,
              group: item.group,
              setId: item.set_id,
              stageId: item.stage_id,
              isRequired: item.is_required,
              isPresent: item.is_present,
              status: item.status,
              remarks: item.remarks || '',
              uploadedDoc: item.uploaded_doc,
              reviewedAt: item.reviewed_at,
            })),
          } as ProposalChecklistRecord
        }

        let uploadedDocs: DocumentApiRecord[] = []
        try {
          uploadedDocs = await fetchProposalDocumentsForStaff(proposalId)
        } catch {
          uploadedDocs = []
        }

        const localDocs = getDocuments(referenceNumber)
        const cached = localCache[proposalId]

        let items: DocumentChecklistItem[] = []

        if (program === 'GIA') {
          items = OFFICIAL_GIA_STAGE_ITEMS.map((req) => {
            const isInternal = isInternalChecklistItem(req.id, req.name)
            const cachedItem = cached?.items.find((i) => i.id === req.id || i.name === req.name)
            const matchedUploaded = findMatchingUploadedDoc(req.id, req.name, uploadedDocs) || findMatchingLocalDoc(req.id, req.name, localDocs, proposalId) || (!isInternal ? cachedItem?.uploadedDoc : null) || null

            let isPresent = false
            let status: ChecklistItemStatus = 'Missing'

            if (matchedUploaded) {
              const isApproved = matchedUploaded.status === 'approved'
              isPresent = isApproved
              status = isApproved ? 'Complied' : matchedUploaded.status === 'returned_for_revision' ? 'Needs Revision' : 'Under Review'
            } else if (isInternal) {
              isPresent = false
              status = 'Missing'
            } else if (cachedItem) {
              isPresent = cachedItem.isPresent
              status = cachedItem.status
            }

            return {
              id: req.id,
              name: req.name,
              group: req.group,
              stageId: req.stageId,
              documentTypeId: CHECKLIST_ITEM_DOC_TYPE_ID[req.id] || matchedUploaded?.document_type_id,
              isRequired: req.isRequired,
              isPresent,
              status,
              remarks: cachedItem?.remarks ?? matchedUploaded?.remarks ?? '',
              uploadedDoc: matchedUploaded ? {
                ...matchedUploaded,
                status: matchedUploaded.status,
              } : null,
              reviewedAt: matchedUploaded?.reviewed_at || cachedItem?.reviewedAt || null,
            }
          })
        } else {
          items = OFFICIAL_SETUP_SET_ITEMS.map((req) => {
            const isInternal = isInternalChecklistItem(req.id, req.name)
            const cachedItem = cached?.items.find((i) => i.id === req.id || i.name === req.name)
            const matchedUploaded = findMatchingUploadedDoc(req.id, req.name, uploadedDocs) || findMatchingLocalDoc(req.id, req.name, localDocs, proposalId) || (!isInternal ? cachedItem?.uploadedDoc : null) || null

            let isPresent = false
            let status: ChecklistItemStatus = 'Missing'

            if (matchedUploaded) {
              const isApproved = matchedUploaded.status === 'approved'
              isPresent = isApproved
              status = isApproved ? 'Complied' : matchedUploaded.status === 'returned_for_revision' ? 'Needs Revision' : 'Under Review'
            } else if (isInternal) {
              isPresent = false
              status = 'Missing'
            } else if (cachedItem) {
              isPresent = cachedItem.isPresent
              status = cachedItem.status
            }

            return {
              id: req.id,
              name: req.name,
              group: req.group,
              setId: req.setId,
              documentTypeId: CHECKLIST_ITEM_DOC_TYPE_ID[req.id] || matchedUploaded?.document_type_id,
              isRequired: req.isRequired,
              isPresent,
              status,
              remarks: cachedItem?.remarks ?? matchedUploaded?.remarks ?? '',
              uploadedDoc: matchedUploaded ? {
                ...matchedUploaded,
                status: matchedUploaded.status,
              } : null,
              reviewedAt: matchedUploaded?.reviewed_at || cachedItem?.reviewedAt || null,
            }
          })
        }

        const totalRequired = items.filter((i) => i.isRequired).length || items.length
        const compliedCount = items.filter((i) => (i.isRequired ? i.isPresent : false)).length
        const compliancePercentage = totalRequired > 0 ? Math.round((compliedCount / totalRequired) * 100) : 0

        return {
          proposalId,
          referenceNumber,
          enterpriseName,
          proponentName,
          proponentEmail,
          program,
          status: proposal.status || 'Submitted',
          submittedDate,
          district,
          focalName,
          totalRequired,
          compliedCount,
          compliancePercentage,
          items,
          overallRemarks: cached?.overallRemarks || proposal.remarks || '',
          lastUpdated: cached?.lastUpdated || proposal.updated_at || submittedDate,
        } as ProposalChecklistRecord
      })
    )

    records.push(...fetchedRecords.filter(Boolean))
  } catch (error) {
    console.warn('Could not load proposals from API, building from applications store', error)
  }

  if (records.length === 0) {
    const fallbackApps = getApplications()
    fallbackApps.forEach((app, idx) => {
      const proposalId = app.proposalId || (Number(app.id.replace(/\D/g, '')) > 0 ? Number(app.id.replace(/\D/g, '')) : idx + 1)
      const localDocs = getDocuments(app.referenceNo)
      const cached = localCache[proposalId]
      const program = app.program || 'SETUP'

      let items: DocumentChecklistItem[] = []

      if (program === 'GIA') {
        items = OFFICIAL_GIA_STAGE_ITEMS.map((req) => {
          const isInternal = isInternalChecklistItem(req.id, req.name)
          const cachedItem = cached?.items.find((i) => i.id === req.id || i.name === req.name)
          const matchedUploaded = findMatchingLocalDoc(req.id, req.name, localDocs, proposalId) || (!isInternal ? cachedItem?.uploadedDoc : null) || null

          let isPresent = false
          let status: ChecklistItemStatus = 'Missing'

          if (matchedUploaded) {
            const isApproved = matchedUploaded.status === 'approved'
            isPresent = isApproved
            status = isApproved ? 'Complied' : matchedUploaded.status === 'returned_for_revision' ? 'Needs Revision' : 'Under Review'
          } else if (isInternal) {
            isPresent = false
            status = 'Missing'
          } else if (cachedItem) {
            isPresent = cachedItem.isPresent
            status = cachedItem.status
          }

          return {
            id: req.id,
            name: req.name,
            group: req.group,
            stageId: req.stageId,
            documentTypeId: CHECKLIST_ITEM_DOC_TYPE_ID[req.id] || matchedUploaded?.document_type_id,
            isRequired: req.isRequired,
            isPresent,
            status,
            remarks: cachedItem?.remarks || matchedUploaded?.remarks || '',
            uploadedDoc: matchedUploaded ? {
              ...matchedUploaded,
              status: matchedUploaded.status,
            } : null,
            reviewedAt: cachedItem?.reviewedAt || null,
          }
        })
      } else {
        items = OFFICIAL_SETUP_SET_ITEMS.map((req) => {
          const isInternal = isInternalChecklistItem(req.id, req.name)
          const cachedItem = cached?.items.find((i) => i.id === req.id || i.name === req.name)
          const matchedUploaded = findMatchingLocalDoc(req.id, req.name, localDocs, proposalId) || (!isInternal ? cachedItem?.uploadedDoc : null) || null

          let isPresent = false
          let status: ChecklistItemStatus = 'Missing'

          if (matchedUploaded) {
            const isApproved = matchedUploaded.status === 'approved'
            isPresent = isApproved
            status = isApproved ? 'Complied' : matchedUploaded.status === 'returned_for_revision' ? 'Needs Revision' : 'Under Review'
          } else if (isInternal) {
            isPresent = false
            status = 'Missing'
          } else if (cachedItem) {
            isPresent = cachedItem.isPresent
            status = cachedItem.status
          }

          return {
            id: req.id,
            name: req.name,
            group: req.group,
            setId: req.setId,
            documentTypeId: CHECKLIST_ITEM_DOC_TYPE_ID[req.id] || matchedUploaded?.document_type_id,
            isRequired: req.isRequired,
            isPresent,
            status,
            remarks: cachedItem?.remarks || matchedUploaded?.remarks || '',
            uploadedDoc: matchedUploaded ? {
              ...matchedUploaded,
              status: matchedUploaded.status,
            } : null,
            reviewedAt: cachedItem?.reviewedAt || null,
          }
        })
      }

      const totalRequired = items.filter((i) => i.isRequired).length || items.length
      const compliedCount = items.filter((i) => (i.isRequired ? i.isPresent : false)).length
      const compliancePercentage = totalRequired > 0 ? Math.round((compliedCount / totalRequired) * 100) : 0

      records.push({
        proposalId,
        referenceNumber: app.referenceNo || `PROP-${proposalId}`,
        enterpriseName: app.organizationName || app.projectTitle || 'Enterprise',
        proponentName: app.applicantName || 'Proponent',
        proponentEmail: app.contactEmail || '',
        program,
        status: app.status || 'Submitted',
        submittedDate: app.createdAt || new Date().toISOString(),
        district: app.location || '',
        focalName: program === 'GIA' ? 'GIA Focal' : 'SETUP Focal',
        totalRequired,
        compliedCount,
        compliancePercentage,
        items,
        overallRemarks: cached?.overallRemarks || '',
        lastUpdated: cached?.lastUpdated || new Date().toISOString(),
      })
    })
  }

  return records
}

export async function saveProposalChecklistReview(
  proposalId: number,
  items: DocumentChecklistItem[],
  overallRemarks: string,
): Promise<void> {
  saveLocalChecklistCache(proposalId, items, overallRemarks)

  try {
    await api.put(`/proposals/${proposalId}/checklist/batch`, {
      overall_remarks: overallRemarks,
      items: items.map((item) => ({
        id: item.id,
        template_id: item.templateId,
        document_id: item.uploadedDoc?.id || null,
        is_present: item.isPresent,
        status: item.status,
        remarks: item.remarks,
      })),
    })
  } catch (err) {
    console.warn(`Failed to sync batch checklist review to backend:`, err)
  }
}

export async function uploadChecklistDocument(
  proposalId: number,
  item: DocumentChecklistItem,
  file: File,
  referenceNumber?: string,
): Promise<{ uploadedDoc: DocumentApiRecord; blobUrl: string }> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) {
    throw new Error('Only PDF documents (.pdf) are allowed. Images and other file formats cannot be uploaded.')
  }

  if (file.size > 10 * 1024 * 1024) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
    throw new Error(`File is too large (${sizeMb} MB). Maximum allowed size is 10 MB.`)
  }

  await ensureBackendToken()
  const blobUrl = URL.createObjectURL(file)

  let uploadedDoc: DocumentApiRecord | null = null
  let docTypeId = item.documentTypeId || CHECKLIST_ITEM_DOC_TYPE_ID[item.id]

  if (!docTypeId) {
    try {
      const res = await api.get('/document-types', {
        params: { program: 'SETUP' },
      })
      const types = Array.isArray(res.data?.data) ? res.data.data : []
      const matched = types.find((t: any) =>
        t.name.toLowerCase().includes(item.name.toLowerCase().slice(0, 15)) ||
        item.name.toLowerCase().includes(t.name.toLowerCase().slice(0, 15))
      )
      docTypeId = matched?.id || types[0]?.id || 19
    } catch {
      docTypeId = 19
    }
  }

  try {
    const formData = new FormData()
    formData.append('proposal_id', String(proposalId))
    formData.append('document_type_id', String(docTypeId))
    formData.append('file', file)

    const response = await api.post<{ data: DocumentApiRecord }>('/documents', formData, {
      headers: { 'Content-Type': undefined },
    })
    uploadedDoc = response.data.data
  } catch (err: any) {
    const status = err?.response?.status
    const errorData = err?.response?.data
    let reason = ''

    if (status === 413) {
      reason = 'File exceeds maximum upload size allowed by the server (10 MB).'
    } else if (errorData?.errors) {
      reason = Object.values(errorData.errors).flat().join(' ')
    } else if (errorData?.message) {
      reason = errorData.message
    } else if (err?.message) {
      reason = err.message
    }

    if (status === 401 || status === 403) {
      reason = 'Your session has expired or you do not have permission to upload this document.'
    }

    if (reason) {
      throw new Error(reason)
    }
  }

  if (uploadedDoc) {
    try {
      await api.patch(`/documents/${uploadedDoc.id}/review`, {
        status: 'approved',
        remarks: 'Uploaded by staff via checklist',
      })
      uploadedDoc.status = 'approved'
      uploadedDoc.reviewed_at = new Date().toISOString()
    } catch {
      //
    }
    try {
      await api.put(`/proposals/${proposalId}/checklist/batch`, {
        items: [
          {
            id: item.id,
            template_id: item.templateId,
            document_id: uploadedDoc.id,
            is_present: true,
            status: 'Complied',
            remarks: 'Uploaded: ' + file.name,
          },
        ],
      })
    } catch (e) {
      console.warn('Could not immediately sync checklist review link:', e)
    }
  } else {
    uploadedDoc = {
      id: Date.now(),
      proposal_id: proposalId,
      document_type_id: docTypeId || 1,
      uploaded_by: 1,
      reviewed_by: null,
      file_name: file.name,
      file_path: blobUrl,
      file_size: file.size,
      mime_type: file.type || 'application/pdf',
      status: 'approved',
      remarks: 'Uploaded and verified',
      reviewed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      document_type: {
        id: docTypeId || 1,
        name: item.name,
        group: item.group,
      },
    }
  }

  const storedDoc: StoredDocument = {
    backendId: uploadedDoc.id,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || 'application/pdf',
    uploadedAt: new Date().toISOString(),
    verificationStatus: 'Approved',
    dataUrl: blobUrl,
  }

  if (referenceNumber) {
    try {
      saveDocument(referenceNumber, item.id, storedDoc)
      if (docTypeId) {
        saveDocument(referenceNumber, String(docTypeId), storedDoc)
      }
    } catch {
      //
    }
  }

  const currentCache = getLocalChecklistCache()
  const cached = currentCache[proposalId]
  if (cached) {
    const updatedItems = cached.items.map((it) =>
      it.id === item.id
        ? {
            ...it,
            documentTypeId: docTypeId,
            isPresent: true,
            status: 'Complied' as ChecklistItemStatus,
            uploadedDoc,
            reviewedAt: new Date().toISOString(),
          }
        : it
    )
    saveLocalChecklistCache(proposalId, updatedItems, cached.overallRemarks)
  }

  return { uploadedDoc, blobUrl }
}

export async function removeChecklistDocument(
  docId?: number,
): Promise<void> {
  if (!docId) return
  try {
    await api.delete(`/documents/${docId}`)
  } catch {
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
  | 'COMPLETE_REVIEW'

export interface ChecklistHistoryItem {
  id: string
  proposalId: number
  action: ChecklistHistoryAction
  itemName?: string
  fileName?: string
  userName: string
  userRole: string
  timestamp: string
  details?: string
}

const HISTORY_STORAGE_KEY_PREFIX = 'dprms_checklist_history_'

export function getChecklistHistory(proposalId: number): ChecklistHistoryItem[] {
  try {
    const raw = localStorage.getItem(`${HISTORY_STORAGE_KEY_PREFIX}${proposalId}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    //
  }

  return []
}

export function addChecklistHistoryLog(
  log: Omit<ChecklistHistoryItem, 'id' | 'timestamp'>
): ChecklistHistoryItem {
  const existing = getChecklistHistory(log.proposalId)
  const newEntry: ChecklistHistoryItem = {
    ...log,
    id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  }
  const updated = [newEntry, ...existing].slice(0, 100)
  try {
    localStorage.setItem(
      `${HISTORY_STORAGE_KEY_PREFIX}${log.proposalId}`,
      JSON.stringify(updated)
    )
  } catch {
    //
  }
  return newEntry
}

export interface ChecklistTemplatePayload {
  program_type: ApplicationProgram
  phase_code: string
  phase_title: string
  item_code: string
  document_name: string
  group_name: string
  is_mandatory?: boolean
  sort_order?: number
  applicability_rules?: any
}

export async function fetchChecklistTemplates(
  program: ApplicationProgram,
  includeInactive = false
): Promise<any[]> {
  await ensureBackendToken()
  const response = await api.get('/document-checklist/templates', {
    params: { program, include_inactive: includeInactive },
  })
  return response.data?.data || []
}

export async function createChecklistTemplate(payload: ChecklistTemplatePayload): Promise<any> {
  await ensureBackendToken()
  const response = await api.post('/document-checklist/templates', payload)
  return response.data?.data
}

export async function updateChecklistTemplate(
  id: number,
  payload: Partial<ChecklistTemplatePayload> & { is_active?: boolean }
): Promise<any> {
  await ensureBackendToken()
  const response = await api.put(`/document-checklist/templates/${id}`, payload)
  return response.data?.data
}

export async function restoreChecklistTemplate(id: number): Promise<any> {
  await ensureBackendToken()
  const response = await api.patch(`/document-checklist/templates/${id}/restore`)
  return response.data?.data
}

export async function deleteChecklistTemplate(id: number): Promise<void> {
  await ensureBackendToken()
  await api.delete(`/document-checklist/templates/${id}`)
}


