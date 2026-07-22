import type { MockUser } from '../lib/mockAuth'
import { getApplications } from './applicationStore'
import { getGiaProposal } from './giaProposalStore'
import { getSetupProposal } from './setupProposalStore'
import { isSampleSetupApplication } from '../data/sampleSetupProposal'

export const PROFILE_UPDATED_EVENT = 'dprms:profile-updated'

export interface ProponentProfile {
  businessAddress: string
  contactNumber: string
  email: string
  fullName: string
  organizationName: string
  organizationType: string
  photoDataUrl: string
  position: string
  program: string
}

const STORAGE_KEY = 'dprms.proponent-profiles'
type ProfileStore = Record<string, ProponentProfile>

function readStore(): ProfileStore {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as ProfileStore
  } catch {
    return {}
  }
}

function profileKey(user: MockUser) {
  return user.email.trim().toLowerCase()
}

function getRelatedApplication(user: MockUser) {
  const applications = getApplications()
  return applications.find((application) => (
    user.applicationReference
      ? application.referenceNo === user.applicationReference
      : application.contactEmail.toLowerCase() === user.email.toLowerCase()
  )) ?? (user.program === 'SETUP'
    ? applications.find((application) => isSampleSetupApplication(application.referenceNo))
    : undefined)
}

export function getProponentProfile(user: MockUser): ProponentProfile {
  const application = getRelatedApplication(user)
  const proposal = application?.program === 'SETUP'
    ? getSetupProposal(application.referenceNo)
    : null
  const giaProposal = application?.program === 'GIA'
    ? getGiaProposal(application.referenceNo)
    : null
  const defaults: ProponentProfile = {
    businessAddress: proposal?.businessAddress ?? giaProposal?.officeAddress ?? '',
    contactNumber: proposal?.contactNumber ?? giaProposal?.contactNumber ?? '',
    email: user.email,
    fullName: user.name,
    organizationName: proposal?.businessName ?? giaProposal?.organizationName ?? application?.organizationName ?? '',
    organizationType: proposal?.organizationType ?? giaProposal?.proponentCategory ?? '',
    photoDataUrl: '',
    position: giaProposal?.position ?? (isSampleSetupApplication(application?.referenceNo ?? '') ? 'Cooperative Chairperson' : ''),
    program: user.program ?? application?.program ?? '',
  }

  return {
    ...defaults,
    ...(readStore()[profileKey(user)] ?? {}),
    email: user.email,
  }
}

export function saveProponentProfile(user: MockUser, profile: ProponentProfile) {
  const store = readStore()
  store[profileKey(user)] = { ...profile, email: user.email }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT))
}
