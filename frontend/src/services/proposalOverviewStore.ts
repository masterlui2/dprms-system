import api from '../lib/axios'
import type { ApplicationProgram } from '../types/application'

interface PersonApiRecord {
  id: number
  name: string
  email: string
}

interface SetupOverviewApiRecord {
  business_address: string
  business_name: string
  business_type: string
  enterprise_size: string
  form_snapshot: Record<string, unknown> | null
  industry_sector: string
  years_in_operation: number
}

interface GiaOverviewApiRecord {
  contact_number: string
  form_snapshot: Record<string, unknown> | null
  office_address: string
  organization_name: string
  position: string
  proponent_category: string
  research_category: string
  research_type: string
}

interface ProposalOverviewApiRecord {
  created_at: string
  focal?: PersonApiRecord | null
  gia_proposal?: GiaOverviewApiRecord[] | GiaOverviewApiRecord | null
  id: number
  program_type: ApplicationProgram
  reference_number: string
  reviewed?: PersonApiRecord | null
  setup_proposal?: SetupOverviewApiRecord[] | SetupOverviewApiRecord | null
  status: string
  submitted_at: string | null
  title: string
  user?: PersonApiRecord | null
}

interface ProposalOverviewResponse {
  data: ProposalOverviewApiRecord
}

export interface ProposalOverviewData {
  address: string | null
  assignedOfficer: string | null
  businessIndustry: string | null
  businessSize: string | null
  contactNumber: string | null
  contactPerson: string | null
  emailAddress: string | null
  enterpriseBackground: string | null
  expectedOutputs: string | null
  generalObjective: string | null
  numberOfEmployees: string | null
  organizationName: string | null
  organizationType: string | null
  position: string | null
  productsServices: string | null
  program: ApplicationProgram
  projectBackground: string | null
  projectCategory: string | null
  projectSummary: string | null
  projectTitle: string
  projectType: string | null
  proponentCategory: string | null
  referenceNo: string
  siteOfImplementation: string | null
  specificObjectives: string | null
  status: string
  submittedAt: string
  yearEstablished: string | null
}

const organizationTypeLabels: Record<string, string> = {
  COOPERATIVE: 'Cooperative',
  CORPORATION: 'Corporation',
  PARTNERSHIP: 'Partnership',
  'SOLE-PROPRIETORSHIP': 'Sole Proprietorship',
}

const businessSizeLabels: Record<string, string> = {
  MEDIUM: 'Medium',
  MICRO: 'Micro',
  SMALL: 'Small',
}

function firstRelation<T>(record: T[] | T | null | undefined): T | null {
  if (!record) return null
  return Array.isArray(record) ? (record[0] ?? null) : record
}

function snapshotText(
  snapshot: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  const value = snapshot?.[key]
  if (value == null) return null
  const text = String(value).trim()
  return text || null
}

export async function fetchProposalOverview(
  referenceNo: string,
): Promise<ProposalOverviewData> {
  const response = await api.get<ProposalOverviewResponse>(
    `/proposal/reference-number/${encodeURIComponent(referenceNo)}`,
  )
  const proposal = response.data.data
  const assignedOfficer = proposal.focal?.name ?? proposal.reviewed?.name ?? null
  const submittedAt = proposal.submitted_at ?? proposal.created_at

  if (proposal.program_type === 'SETUP') {
    const setup = firstRelation(proposal.setup_proposal)
    if (!setup) throw new Error('SETUP proposal details were not found.')
    const snapshot = setup.form_snapshot
    const submittedYear = new Date(submittedAt).getFullYear()
    const derivedEstablishedYear =
      Number.isFinite(submittedYear) && setup.years_in_operation > 0
        ? String(submittedYear - setup.years_in_operation)
        : null

    return {
      address: snapshotText(snapshot, 'businessAddress') ?? setup.business_address,
      assignedOfficer,
      businessIndustry:
        snapshotText(snapshot, 'businessIndustry') ?? setup.industry_sector,
      businessSize:
        snapshotText(snapshot, 'businessSize') ??
        businessSizeLabels[setup.enterprise_size] ??
        setup.enterprise_size,
      contactNumber: snapshotText(snapshot, 'contactNumber'),
      contactPerson:
        snapshotText(snapshot, 'contactPerson') ?? proposal.user?.name ?? null,
      emailAddress:
        snapshotText(snapshot, 'emailAddress') ?? proposal.user?.email ?? null,
      enterpriseBackground: snapshotText(snapshot, 'enterpriseBackground'),
      expectedOutputs: null,
      generalObjective: snapshotText(snapshot, 'generalObjective'),
      numberOfEmployees: snapshotText(snapshot, 'numberOfEmployees'),
      organizationName:
        snapshotText(snapshot, 'businessName') ?? setup.business_name,
      organizationType:
        snapshotText(snapshot, 'organizationType') ??
        organizationTypeLabels[setup.business_type] ??
        setup.business_type,
      position: null,
      productsServices: snapshotText(snapshot, 'productsServices'),
      program: proposal.program_type,
      projectBackground: snapshotText(snapshot, 'projectBackground'),
      projectCategory: null,
      projectSummary: null,
      projectTitle: snapshotText(snapshot, 'projectTitle') ?? proposal.title,
      projectType: null,
      proponentCategory: null,
      referenceNo: proposal.reference_number,
      siteOfImplementation: null,
      specificObjectives: snapshotText(snapshot, 'specificObjectives'),
      status: proposal.status,
      submittedAt,
      yearEstablished:
        snapshotText(snapshot, 'yearEstablished') ?? derivedEstablishedYear,
    }
  }

  const gia = firstRelation(proposal.gia_proposal)
  if (!gia) throw new Error('GIA proposal details were not found.')
  const snapshot = gia.form_snapshot

  return {
    address: snapshotText(snapshot, 'officeAddress') ?? gia.office_address,
    assignedOfficer,
    businessIndustry: null,
    businessSize: null,
    contactNumber:
      snapshotText(snapshot, 'contactNumber') ?? gia.contact_number,
    contactPerson:
      snapshotText(snapshot, 'projectLeader') ?? proposal.user?.name ?? null,
    emailAddress:
      snapshotText(snapshot, 'emailAddress') ?? proposal.user?.email ?? null,
    enterpriseBackground: null,
    expectedOutputs: snapshotText(snapshot, 'expectedOutputs'),
    generalObjective: snapshotText(snapshot, 'generalObjective'),
    numberOfEmployees: null,
    organizationName:
      snapshotText(snapshot, 'organizationName') ?? gia.organization_name,
    organizationType: null,
    position: snapshotText(snapshot, 'position') ?? gia.position,
    productsServices: null,
    program: proposal.program_type,
    projectBackground:
      snapshotText(snapshot, 'projectRationale') ??
      snapshotText(snapshot, 'projectSummary'),
    projectCategory:
      snapshotText(snapshot, 'projectCategory') ?? gia.research_category,
    projectSummary: snapshotText(snapshot, 'projectSummary'),
    projectTitle: snapshotText(snapshot, 'projectTitle') ?? proposal.title,
    projectType: snapshotText(snapshot, 'projectType') ?? gia.research_type,
    proponentCategory:
      snapshotText(snapshot, 'proponentCategory') ?? gia.proponent_category,
    referenceNo: proposal.reference_number,
    siteOfImplementation: snapshotText(snapshot, 'siteOfImplementation'),
    specificObjectives: snapshotText(snapshot, 'specificObjectives'),
    status: proposal.status,
    submittedAt,
    yearEstablished: null,
  }
}
