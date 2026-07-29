import { CheckCircle2, Home, MailCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { ApplicationProgram } from '../../types/application'

export function ProposalSubmissionSuccess({
  email,
  program,
  referenceNo,
}: {
  email: string
  program: ApplicationProgram
  referenceNo: string
}) {
  const programHome = `/programs/${program.toLowerCase()}`

  return (
    <section className="rounded-2xl border border-emerald-200 bg-white px-6 py-12 text-center shadow-sm sm:px-10 sm:py-16">
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="size-8" />
      </div>
      <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Submission complete</p>
      <h1 className="mt-2 text-2xl font-black text-[#073b82] sm:text-3xl">Your {program} proposal was submitted</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
        DOST has received your proposal. Keep your reference number for future updates; your application-stage records remain separate from this registration form.
      </p>

      <div className="mx-auto mt-6 max-w-md rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Reference number</p>
        <p className="mt-1 break-all font-mono text-lg font-black text-emerald-950">{referenceNo}</p>
      </div>

      <div className="mx-auto mt-4 flex max-w-md items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-left">
        <MailCheck className="mt-0.5 size-5 shrink-0 text-[#0f53b7]" />
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#073b82]">Proponent confirmation</p>
          <p className="mt-1 break-all text-sm font-semibold text-slate-700">Your submission confirmation is linked to {email}.</p>
        </div>
      </div>

      <Link
        className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#0f53b7] px-5 text-sm font-bold text-white transition hover:bg-[#0b3f8b] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
        to={programHome}
      >
        <Home className="size-4" />
        Return to {program} Homepage
      </Link>
    </section>
  )
}
