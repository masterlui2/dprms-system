import { LockKeyhole } from 'lucide-react'

import { ProposalForm } from '../components/proposal/ProposalForm'
import { ProposalHeader } from '../components/proposal/ProposalHeader'

export function ProposalSubmission() {
  return (
    <div className="min-h-screen bg-[#f4f8fc] text-slate-950">
      <ProposalHeader />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <ProposalForm />

        <div
          className="mt-7 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-5 text-center text-xs text-slate-500 sm:flex-row sm:text-left"
          id="proposal-support"
        >
          <span>For assistance, contact your nearest DOST Provincial Science and Technology Office.</span>
          <span className="flex items-center gap-1.5 font-semibold">
            <LockKeyhole className="size-3.5" />
            Your information is protected.
          </span>
        </div>
      </main>
    </div>
  )
}
