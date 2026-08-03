import { Check } from 'lucide-react'
import type { ApplicationRecord } from '../../types/application'

interface InitialReviewStageCardProps {
  application: ApplicationRecord
}

export function InitialReviewStageCard({ application }: InitialReviewStageCardProps) {
  const isSetup = application.program === 'SETUP'
  const submittedDateFormatted = new Date(application.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="min-h-[380px] rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 grid place-items-center text-center shadow-sm">
      <div className="max-w-lg space-y-4">
        {/* Success Icon */}
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
          <Check className="size-9" strokeWidth={3} />
        </div>

        {/* Heading & Metadata */}
        <div className="space-y-1">
          <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-[#0f53b7]">
            DOST Initial Review Active
          </span>
          <h3 className="text-2xl font-black tracking-tight text-slate-900 pt-2">
            Application Submitted Successfully!
          </h3>
          <p className="text-xs font-semibold text-slate-500">
            Reference No: <span className="font-mono font-bold text-[#0f53b7]">{application.referenceNo}</span> · Submitted on {submittedDateFormatted}
          </p>
        </div>

        {/* Stage Status & Info Box */}
        <div className="rounded-2xl bg-blue-50/80 border border-blue-100 p-5 text-left space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#073b82]">
              Stage 2: DOST Initial Review
            </span>
            <span className="inline-flex rounded-full bg-blue-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
              {application.status}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isSetup
              ? "Your SETUP Application has been received and is currently under initial review by the PSTO SSCP Officer. A Technology Needs Assessment (TNA) site visit will be scheduled shortly."
              : "Your GIA Application has been received and is currently under initial preview by the PSTO CEST Officer. Your proposal has been endorsed for technical evaluation by the DOST technical committee."}
          </p>
        </div>
      </div>
    </div>
  )
}
