/**
 * System: DPRMS
 * Purpose: Render proposal stepper for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { LucideIcon } from 'lucide-react';
import { Check, CheckCircle2, FileText, Upload } from 'lucide-react';

import { cn } from '../../utils/cn';

type StepItem = {
    icon: LucideIcon;
    id: number;
    label: string;
};

const PROPOSAL_STEPS: StepItem[] = [
    { id: 1, label: 'Proposal Information', icon: FileText },
    { id: 2, label: 'Document Submission', icon: Upload },
    { id: 3, label: 'Review and Submit', icon: CheckCircle2 },
];

interface ProposalStepperProps
{
    intCurrentStep: number;
    onStepChange: (intStep: number) => void;
}

/** Render proposal stepper and its available actions. */
export function ProposalStepper({ intCurrentStep, onStepChange }: ProposalStepperProps)
{
    const intProgress = (intCurrentStep / PROPOSAL_STEPS.length) * 100;

    return (
        <nav aria-label="Proposal submission progress">
            <div className="grid grid-cols-1 gap-y-5 sm:grid-cols-3">
                {PROPOSAL_STEPS.map(
                    (objStep, intIndex) =>
                    {
                        const blnIsActive = intCurrentStep === objStep.id;
                        const blnIsComplete = intCurrentStep > objStep.id;
                        const Icon = objStep.icon;

                        return (
                            <div className="relative flex flex-col items-center" key={objStep.id}>
                                {intIndex < PROPOSAL_STEPS.length - 1 ? (
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            'absolute left-1/2 top-5 hidden h-0.5 w-full sm:block',
                                            blnIsComplete ? 'bg-emerald-600' : 'bg-slate-200',
                                        )}
                                    />
                                ) : null}

                                <button
                                    aria-current={blnIsActive ? 'step' : undefined}
                                    className={cn(
                                        'relative z-10 flex size-10 items-center justify-center rounded-full border-2 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100',
                                        blnIsActive && 'border-[#073b82] bg-[#073b82] text-white',
                                        blnIsComplete &&
                                        'border-emerald-600 bg-emerald-600 text-white',
                                        !blnIsActive &&
                                        !blnIsComplete &&
                                        'border-slate-300 bg-white text-slate-500',
                                    )}
                                    onClick={() => onStepChange(objStep.id)}
                                    type="button"
                                >
                                    {blnIsComplete ? (
                                        <Check className="size-5" />
                                    ) : (
                                        <Icon className="size-5" />
                                    )}
                                    <span className="sr-only">Go to {objStep.label}</span>
                                </button>

                                <span
                                    className={cn(
                                        'mt-2 max-w-36 text-center text-xs font-bold leading-4',
                                        blnIsActive || blnIsComplete
                                            ? 'text-slate-900'
                                            : 'text-slate-500',
                                    )}
                                >
                                    {objStep.label}
                                </span>
                            </div>
                        ); // end return
                    } /* end ProposalStepper */,
                )}
            </div>

            <div
                aria-label={`Step ${intCurrentStep} of ${PROPOSAL_STEPS.length}`}
                aria-valuemax={PROPOSAL_STEPS.length}
                aria-valuemin={1}
                aria-valuenow={intCurrentStep}
                className="mt-4 h-1 overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
            >
                <div
                    className="h-full rounded-full bg-[#073b82] transition-[width] duration-300"
                    style={{ width: `${intProgress}%` }}
                />
            </div>
        </nav>
    ); // end return
} /* end ProposalStepper */
