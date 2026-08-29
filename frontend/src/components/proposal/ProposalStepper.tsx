import {
  Check,
  CheckCircle2,
  FileText,
  Upload,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '../../utils/cn'

type StepItem = {
  icon: LucideIcon
  id: number
  label: string
}

const proposalSteps: StepItem[] = [
  { id: 1, label: 'Proposal Information', icon: FileText },
  { id: 2, label: 'Document Submission', icon: Upload },
  { id: 3, label: 'Review and Submit', icon: CheckCircle2 },
]

interface ProposalStepperProps {
  currentStep: number
  onStepChange: (step: number) => void
}

export function ProposalStepper({
  currentStep,
  onStepChange,
}: ProposalStepperProps) {
  const progress = (currentStep / proposalSteps.length) * 100

  return (
    <nav aria-label="Proposal submission progress">
      <div className="grid grid-cols-1 gap-y-5 sm:grid-cols-3">
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
                    'absolute left-1/2 top-5 hidden h-0.5 w-full sm:block',
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
                  'mt-2 max-w-36 text-center text-xs font-bold leading-4',
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
