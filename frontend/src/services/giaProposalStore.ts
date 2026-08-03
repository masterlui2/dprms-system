import type { ApplicationRecord } from '../types/application'
import type { GiaProposalData } from '../types/giaProposal'
import { getApplications, saveApplication } from './applicationStore'

const DRAFT_KEY = 'dprms.gia-proposal-draft'
const PROPOSALS_KEY = 'dprms.gia-proposal-details'

type ProposalDetails = Record<string, GiaProposalData>

function readDetails(): ProposalDetails {
  try {
    return JSON.parse(window.localStorage.getItem(PROPOSALS_KEY) ?? '{}') as ProposalDetails
  } catch {
    return {}
  }
}

export function getGiaDraft(): GiaProposalData | null {
  try {
    const draft = window.localStorage.getItem(DRAFT_KEY)
    return draft ? JSON.parse(draft) as GiaProposalData : null
  } catch {
    window.localStorage.removeItem(DRAFT_KEY)
    return null
  }
}

export function saveGiaDraft(data: GiaProposalData) {
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
}

export function clearGiaDraft() {
  window.localStorage.removeItem(DRAFT_KEY)
}

export function submitGiaProposal(data: GiaProposalData): ApplicationRecord {
  const referenceNo = `GIA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  const application: ApplicationRecord = {
    applicantName: data.projectLeader,
    contactEmail: data.emailAddress,
    createdAt: new Date().toISOString(),
    id: crypto.randomUUID(),
    organizationName: data.organizationName,
    program: 'GIA',
    projectTitle: data.projectTitle,
    referenceNo,
    status: 'Draft Submitted',
  }

  saveApplication(application)
  window.localStorage.setItem(
    PROPOSALS_KEY,
    JSON.stringify({ ...readDetails(), [referenceNo]: data }),
  )
  clearGiaDraft()
  return application
}

export function getSampleGiaProposalData(): GiaProposalData {
  return {
    organizationName: 'Davao Smart Agriculture & Innovation Cooperative',
    proponentCategory: 'Private Sector',
    projectTitle: 'Smart Solar-Powered Hydroponics and Automated Crop Monitoring System',
    projectLeader: 'Dr. Maria Santos',
    position: 'Executive Director / Project Lead',
    emailAddress: 'maria.santos@davaosmartagri.org',
    contactNumber: '+63 917 555 3829',
    officeAddress: 'Km 12, McArthur Highway, Matina, Davao City',
    projectCategory: 'Community Innovation',
    projectType: 'Research & Community Development',
    projectSummary: 'Deploying solar-powered automated hydroponics setups and IoT-based soil & climate monitoring sensors.',
    projectRationale: 'Frequent climate shifts affect traditional crop yields; hydroponics provides year-round food security.',
    generalObjective: 'Establish climate-resilient smart hydroponics and IoT monitoring systems for high-value crops in Davao Region.',
    specificObjectives: '1. Establish 5 automated hydroponic greenhouses.\n2. Train 50 local farmers in climate-resilient farming.\n3. Increase crop yield by 35% using DOST-assisted IoT monitoring.',
    siteOfImplementation: 'Barangay Matina Biao, Tugbok District, Davao City',
    targetBeneficiaries: 'Local agricultural cooperatives and smallholder farmers in Davao City.',
    methodology: 'Phase 1: Greenhouse construction. Phase 2: IoT sensor integration. Phase 3: Community training.',
    expectedOutputs: '5 operational smart greenhouses, 1 technical manual, 50 trained agricultural workers.',
    sustainabilityPlan: 'Cooperative revenue from high-value crop sales will fund ongoing maintenance and scaling.',
  }
}

export function getGiaProposal(referenceNo: string) {
  return readDetails()[referenceNo] ?? null
}

export function getGiaApplications() {
  return getApplications().filter((application) => application.program === 'GIA')
}
