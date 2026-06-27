import type { ProposalFormData } from '../types/proposal'

export async function submitProposal(proposal: ProposalFormData): Promise<void> {
  void proposal

  await new Promise((resolve) => window.setTimeout(resolve, 700))
}
