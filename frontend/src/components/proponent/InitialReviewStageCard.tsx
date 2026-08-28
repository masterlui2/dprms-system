import { Check, FileSearch, ShieldCheck, XCircle } from 'lucide-react'
import type { ApplicationRecord } from '../../types/application'
import { cn } from '../../utils/cn'

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

  const status = application.status

  let badgeText = "DOST Initial Review Active"
  let badgeClass = "bg-blue-50 text-[#0f53b7] border-blue-200"
  let title = "Application Submitted Successfully!"
  let stageLabel = "Stage 1: Document Checklist Review"
  let statusBadgeColor = "bg-blue-600 text-white"
  let description = isSetup
    ? "Your SETUP Application has been received and is currently undergoing initial documentary verification by the DOST SSCP Evaluator."
    : "Your GIA Application has been received and is currently undergoing initial documentary verification by the DOST CEST Evaluator."
  let icon = <Check className="size-9" strokeWidth={3} />
  let iconBg = "bg-emerald-100 text-emerald-600"

  if (status === "Approved") {
    badgeText = "Application Formally Approved"
    badgeClass = "bg-emerald-50 text-emerald-800 border-emerald-200"
    title = "Application Approved!"
    stageLabel = "Stage 4: Executive Approval & Handover"
    statusBadgeColor = "bg-emerald-600 text-white"
    description = isSetup
      ? "Congratulations! Your SETUP project proposal has been formally approved by the Provincial Director. The DOST PSTO office will coordinate with you regarding the MOA signing and project setup."
      : "Congratulations! Your GIA project proposal has been formally approved by the Provincial Director. The DOST PSTO office will coordinate with you regarding the MOA signing and grant fund disbursement."
    icon = <Check className="size-9" strokeWidth={3} />
    iconBg = "bg-emerald-100 text-emerald-600"
  } else if (status === "Executive Approval") {
    badgeText = "Executive Approval In Progress"
    badgeClass = "bg-purple-50 text-purple-700 border-purple-200"
    title = "Endorsed to Provincial Director"
    stageLabel = "Stage 3: Provincial Director Approval"
    statusBadgeColor = "bg-purple-600 text-white"
    description = isSetup
      ? "Your SETUP proposal has successfully passed technical evaluation and TNA. It has been endorsed to the Provincial Director for final executive approval."
      : "Your GIA proposal has passed technical evaluation and has been endorsed to the Provincial Director for final executive approval."
    icon = <ShieldCheck className="size-9" />
    iconBg = "bg-purple-100 text-purple-600"
  } else if (status === "In Process" || status === "Technical evaluation") {
    badgeText = "Assessment & Validation Active"
    badgeClass = "bg-blue-50 text-[#0f53b7] border-blue-200"
    title = "Application In Process"
    stageLabel = "Stage 2: Technical Assessment & TNA"
    statusBadgeColor = "bg-blue-600 text-white"
    description = isSetup
      ? "Your documentary checklist has been validated. The DOST PSTO team is currently conducting the Technology Needs Assessment (TNA), site inspection, and technical evaluation."
      : "Your documentary checklist has been validated. The DOST CEST team is currently conducting technical evaluation, field validation, and proposal appraisal."
    icon = <FileSearch className="size-9" />
    iconBg = "bg-blue-100 text-[#0f53b7]"
  } else if (status === "Disapproved") {
    badgeText = "Application Disapproved"
    badgeClass = "bg-rose-50 text-rose-700 border-rose-200"
    title = "Application Not Approved"
    stageLabel = "Review Concluded"
    statusBadgeColor = "bg-rose-600 text-white"
    description = application.remarks || (isSetup
      ? "Your SETUP application was not approved during evaluation. Please contact the PSTO office for more details."
      : "Your GIA proposal was not approved during evaluation. Please contact the DOST office for more details.")
    icon = <XCircle className="size-9" />
    iconBg = "bg-rose-100 text-rose-600"
  }

  return (
    <div className="min-h-[380px] rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 grid place-items-center text-center shadow-sm">
      <div className="max-w-lg space-y-4">
        {/* Stage Icon */}
        <div className={cn("mx-auto grid size-16 place-items-center rounded-full shadow-sm", iconBg)}>
          {icon}
        </div>

        {/* Heading & Metadata */}
        <div className="space-y-1">
          <span className={cn("inline-block rounded-full px-3.5 py-1 text-xs font-extrabold border", badgeClass)}>
            {badgeText}
          </span>
          <h3 className="text-2xl font-black tracking-tight text-slate-900 pt-2">
            {title}
          </h3>
          <p className="text-xs font-semibold text-slate-500">
            Reference No: <span className="font-mono font-bold text-[#0f53b7]">{application.referenceNo}</span> · Submitted on {submittedDateFormatted}
          </p>
        </div>

        {/* Stage Status & Info Box */}
        <div className="rounded-2xl bg-blue-50/80 border border-blue-100 p-5 text-left space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#073b82]">
              {stageLabel}
            </span>
            <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold", statusBadgeColor)}>
              {application.status}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}
