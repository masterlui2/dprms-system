import api from '../lib/axios'
import type { ApplicationProgram } from '../types/application'
import {
  fetchProposalDocumentsForStaff,
  reviewProposalDocument,
  type DocumentApiRecord,
} from './documentStore'
import { getApplications } from './applicationStore'

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

export async function fetchChecklistProposals(): Promise<ProposalChecklistRecord[]> {
  const localCache = getLocalChecklistCache()
  const records: ProposalChecklistRecord[] = []

  try {
    const response = await api.get('/proposals')
    const rawProposals = Array.isArray(response.data?.data) ? response.data.data : []

    for (const proposal of rawProposals) {
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
      const district = setupObj?.city_municipality || setupObj?.province || 'Davao Oriental'
      const referenceNumber = proposal.reference_number || `PROP-${proposalId}`
      const submittedDate = proposal.submitted_at || proposal.created_at || new Date().toISOString()
      const focalName = program === 'GIA' ? 'GIA Focal' : 'SETUP Focal'

      let uploadedDocs: DocumentApiRecord[] = []
      try {
        uploadedDocs = await fetchProposalDocumentsForStaff(proposalId)
      } catch {
        uploadedDocs = []
      }

      const cached = localCache[proposalId]

      let items: DocumentChecklistItem[] = []

      if (program === 'GIA') {
        items = OFFICIAL_GIA_STAGE_ITEMS.map((req) => {
          const matchedUploaded = uploadedDocs.find(
            (doc) =>
              (doc.document_type?.name &&
                doc.document_type.name.toLowerCase().includes(req.name.toLowerCase().slice(0, 20))) ||
              doc.file_name.toLowerCase().includes(req.name.toLowerCase().slice(0, 15))
          )

          const cachedItem = cached?.items.find((i) => i.id === req.id || i.name === req.name)

          const isPresent = cachedItem ? cachedItem.isPresent : Boolean(matchedUploaded)
          let status: ChecklistItemStatus = 'Missing'

          if (matchedUploaded) {
            if (matchedUploaded.status === 'approved') status = 'Complied'
            else if (matchedUploaded.status === 'returned_for_revision') status = 'Needs Revision'
            else status = 'Under Review'
          } else if (isPresent) {
            status = 'Complied'
          }

          return {
            id: req.id,
            name: req.name,
            group: req.group,
            stageId: req.stageId,
            isRequired: req.isRequired,
            isPresent,
            status: cachedItem?.status || status,
            remarks: cachedItem?.remarks ?? matchedUploaded?.remarks ?? '',
            uploadedDoc: matchedUploaded || null,
            reviewedAt: matchedUploaded?.reviewed_at || cachedItem?.reviewedAt || null,
          }
        })
      } else {
        items = OFFICIAL_SETUP_SET_ITEMS.map((req) => {
          const matchedUploaded = uploadedDocs.find(
            (doc) =>
              (doc.document_type?.name &&
                doc.document_type.name.toLowerCase().includes(req.name.toLowerCase().slice(0, 20))) ||
              doc.file_name.toLowerCase().includes(req.name.toLowerCase().slice(0, 15))
          )

          const cachedItem = cached?.items.find((i) => i.id === req.id || i.name === req.name)

          const isPresent = cachedItem ? cachedItem.isPresent : Boolean(matchedUploaded)
          let status: ChecklistItemStatus = 'Missing'

          if (matchedUploaded) {
            if (matchedUploaded.status === 'approved') status = 'Complied'
            else if (matchedUploaded.status === 'returned_for_revision') status = 'Needs Revision'
            else status = 'Under Review'
          } else if (isPresent) {
            status = 'Complied'
          }

          return {
            id: req.id,
            name: req.name,
            group: req.group,
            setId: req.setId,
            isRequired: req.isRequired,
            isPresent,
            status: cachedItem?.status || status,
            remarks: cachedItem?.remarks ?? matchedUploaded?.remarks ?? '',
            uploadedDoc: matchedUploaded || null,
            reviewedAt: matchedUploaded?.reviewed_at || cachedItem?.reviewedAt || null,
          }
        })
      }

      const totalRequired = items.filter((i) => i.isRequired).length || items.length
      const compliedCount = items.filter((i) => (i.isRequired ? i.isPresent : false)).length
      const compliancePercentage = totalRequired > 0 ? Math.round((compliedCount / totalRequired) * 100) : 0

      records.push({
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
      })
    }
  } catch (error) {
    console.warn('Could not load proposals from API, building from applications store', error)
  }

  if (records.length === 0) {
    const fallbackApps = getApplications()
    for (const app of fallbackApps) {
      const proposalId = app.proposalId || Number(app.id.replace(/\D/g, '')) || 101
      const cached = localCache[proposalId]
      const program = app.program || 'SETUP'

      let items: DocumentChecklistItem[] = []

      if (program === 'GIA') {
        items = OFFICIAL_GIA_STAGE_ITEMS.map((req, index) => {
          const cachedItem = cached?.items.find((i) => i.id === req.id || i.name === req.name)
          const isPresent = cachedItem ? cachedItem.isPresent : index < 6
          return {
            id: req.id,
            name: req.name,
            group: req.group,
            stageId: req.stageId,
            isRequired: req.isRequired,
            isPresent,
            status: isPresent ? 'Complied' : 'Missing',
            remarks: cachedItem?.remarks || '',
            uploadedDoc: null,
            reviewedAt: cachedItem?.reviewedAt || null,
          }
        })
      } else {
        items = OFFICIAL_SETUP_SET_ITEMS.map((req, index) => {
          const cachedItem = cached?.items.find((i) => i.id === req.id || i.name === req.name)
          const isPresent = cachedItem ? cachedItem.isPresent : index < 8
          return {
            id: req.id,
            name: req.name,
            group: req.group,
            setId: req.setId,
            isRequired: req.isRequired,
            isPresent,
            status: isPresent ? 'Complied' : 'Missing',
            remarks: cachedItem?.remarks || '',
            uploadedDoc: null,
            reviewedAt: cachedItem?.reviewedAt || null,
          }
        })
      }

      const totalRequired = items.filter((i) => i.isRequired).length || items.length
      const compliedCount = items.filter((i) => i.isRequired && i.isPresent).length
      const compliancePercentage = totalRequired > 0 ? Math.round((compliedCount / totalRequired) * 100) : 0

      records.push({
        proposalId,
        referenceNumber: app.referenceNo || `PROP-2026-${proposalId}`,
        enterpriseName: app.organizationName || app.projectTitle || 'Enterprise',
        proponentName: app.applicantName || 'Proponent',
        proponentEmail: app.contactEmail || 'proponent@dost.gov.ph',
        program,
        status: app.status || 'Submitted',
        submittedDate: app.createdAt || new Date().toISOString(),
        district: app.location || 'District 1, Davao Oriental',
        focalName: program === 'GIA' ? 'GIA Focal' : 'SETUP Focal',
        totalRequired,
        compliedCount,
        compliancePercentage,
        items,
        overallRemarks: cached?.overallRemarks || '',
        lastUpdated: cached?.lastUpdated || new Date().toISOString(),
      })
    }
  }

  return records
}

export async function saveProposalChecklistReview(
  proposalId: number,
  items: DocumentChecklistItem[],
  overallRemarks: string,
): Promise<void> {
  saveLocalChecklistCache(proposalId, items, overallRemarks)

  const reviewPromises = items
    .filter((item) => item.uploadedDoc?.id)
    .map(async (item) => {
      const docId = item.uploadedDoc!.id
      const backendStatus: 'approved' | 'returned_for_revision' = item.isPresent ? 'approved' : 'returned_for_revision'
      const remarks = item.remarks || (item.isPresent ? 'Complied with requirements' : 'Document missing / incomplete')
      try {
        await reviewProposalDocument(docId, backendStatus, remarks)
      } catch (err) {
        console.warn(`Failed to sync review for document ${docId} to backend:`, err)
      }
    })

  await Promise.allSettled(reviewPromises)
}
