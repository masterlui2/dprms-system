import type { ProposalFormData } from '../types/proposal'
import type { ApplicationRecord } from '../types/application'
import { createApplicationFromProposal } from './applicationStore'

export async function submitProposal(
  proposal: ProposalFormData,
): Promise<ApplicationRecord> {
  await new Promise((resolve) => window.setTimeout(resolve, 700))

  return createApplicationFromProposal(proposal)
}
