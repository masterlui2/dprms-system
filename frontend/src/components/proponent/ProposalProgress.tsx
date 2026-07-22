import { Check, Circle } from 'lucide-react'

import type { ApplicationRecord } from '../../types/application'
import { cn } from '../../utils/cn'

const stages = [
  'Proposal Submitted',
  'Upload Documentary Requirements',
  'DOST Initial Review',
  'Technical Evaluation',
  'Approved / Returned for Revision',
]

function getActiveIndex(status: ApplicationRecord['status'], documentsComplete: boolean) {
  if (status === 'Approved' || status === 'Returned for Revision') return 4
  if (status === 'Under review') return documentsComplete ? 2 : 1
  return documentsComplete ? 2 : 1
}

export function ProposalProgress({
  application,
  documentsComplete,
  compact = false,
}: {
  application: ApplicationRecord
  documentsComplete: boolean
  compact?: boolean
}) {
  const activeIndex = getActiveIndex(application.status, documentsComplete)

  return (
    <ol className={cn('grid gap-0', compact ? 'sm:grid-cols-5' : 'lg:grid-cols-5')} aria-label="Proposal progress">
      {stages.map((stage, index) => {
        const complete = index < activeIndex || (index === 4 && application.status === 'Approved')
        const active = index === activeIndex
        return (
          <li className="relative flex gap-3 pb-5 last:pb-0 lg:block lg:pb-0" key={stage}>
            {index < stages.length - 1 ? <span className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px bg-slate-200 lg:left-[calc(50%+16px)] lg:top-4 lg:h-px lg:w-[calc(100%-32px)]" /> : null}
            <span className={cn('relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 bg-white lg:mx-auto', complete ? 'border-emerald-500 bg-emerald-500 text-white' : active ? 'border-[#0f53b7] text-[#0f53b7]' : 'border-slate-300 text-slate-300')}>
              {complete ? <Check className="size-4" strokeWidth={3} /> : <Circle className={cn('size-2.5', active && 'fill-current')} />}
            </span>
            <div className="pt-1 lg:px-2 lg:pt-3 lg:text-center">
              <p className={cn('text-xs font-bold leading-5', active || complete ? 'text-slate-800' : 'text-slate-400')}>{stage}</p>
              {active ? <p className="mt-0.5 text-[11px] font-semibold text-[#0f53b7]">Current stage</p> : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

