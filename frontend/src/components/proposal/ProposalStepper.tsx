import {
  Building2,
  Check,
  CheckCircle2,
  ClipboardList,
  FileText,
  Upload,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { ProposalType } from '../../types/proposal'
import { cn } from '../../utils/cn'

type StepItem = {
  icon: LucideIcon
  id: number
  label: string
}

function getProposalSteps(program: Exclude<ProposalType, ''>): StepItem[] {
  if (program === 'GIA') {
    return [
      { id: 1, label: 'Applicant / Agency', icon: Building2 },
      { id: 2, label: 'Project Profile', icon: FileText },
      { id: 3, label: 'Workplan & Budget', icon: ClipboardList },
      { id: 4, label: 'Requirements', icon: Upload },
      { id: 5, label: 'Review', icon: CheckCircle2 },
    ]
  }

  return [
    { id: 1, label: 'Business Profile', icon: Building2 },
    { id: 2, label: 'TNA', icon: FileText },
    { id: 3, label: 'Proposal & Equipment', icon: ClipboardList },
    { id: 4, label: 'Requirements', icon: Upload },
    { id: 5, label: 'Review', icon: CheckCircle2 },
  ]
}

interface ProposalStepperProps {
  currentStep: number
  onStepChange: (step: number) => void
  program: Exclude<ProposalType, ''>
}

export function ProposalStepper({
  currentStep,
  onStepChange,
  program,
}: ProposalStepperProps) {
  const proposalSteps = getProposalSteps(program)
  const progress = (currentStep / proposalSteps.length) * 100

  return (
    <nav aria-label="Proposal submission progress">
      <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-5">
        {proposalSteps.map((step, index) => {
          const isActive = currentStep === step.id
          const isComplete = currentStep > step.id
          const Icon = step.icon

          return (
            <div className="relative flex flex-col items-center" key={step.id}>
              {index < proposalSteps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-1/2 top-5 h-0.5 w-full',
                    isComplete ? 'bg-emerald-600' : 'bg-slate-200',
                  )}
                />
              ) : null}

              <button
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'relative z-10 flex size-10 items-center justify-center rounded-full border-2 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100',
                  isActive && 'border-[#073b82] bg-[#073b82] text-white',
                  isComplete && 'border-emerald-600 bg-emerald-600 text-white',
                  !isActive && !isComplete && 'border-slate-300 bg-white text-slate-500',
                )}
                onClick={() => onStepChange(step.id)}
                type="button"
              >
                {isComplete ? <Check className="size-5" /> : <Icon className="size-5" />}
                <span className="sr-only">Go to {step.label}</span>
              </button>

              <span
                className={cn(
                  'mt-2 max-w-20 text-center text-[10px] font-bold leading-4 sm:max-w-none sm:text-xs',
                  isActive || isComplete ? 'text-slate-900' : 'text-slate-500',
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      <div
        aria-label={`Step ${currentStep} of ${proposalSteps.length}`}
        aria-valuemax={proposalSteps.length}
        aria-valuemin={1}
        aria-valuenow={currentStep}
        className="mt-4 h-1 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-[#073b82] transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </nav>
  )
}
