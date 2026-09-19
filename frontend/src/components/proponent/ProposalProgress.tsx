/**
 * System: DPRMS
 * Purpose: Render proposal progress for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { AlertTriangle, ArrowRight, Check, Circle } from 'lucide-react';

import type { ApplicationRecord } from '../../types/application';
import { cn } from '../../utils/cn';

/** Get active index. */
function _getActiveIndex(strStatus: ApplicationRecord['status'], blnDocumentsComplete: boolean)
{
    if (strStatus === 'Approved')
    {
        return 3;
    }
    if (strStatus === 'Executive Approval')
    {
        return 3;
    }
    if (strStatus === 'In Process' || strStatus === 'Technical evaluation')
    {
        return 2;
    }
    if (
        strStatus === 'Under review' ||
        strStatus === 'Submitted' ||
        (blnDocumentsComplete && strStatus !== 'Draft Submitted')
    )
    {
        return 1;
    }
    return 0;
}

/** Render proposal progress and its available actions. */
export function ProposalProgress({
    objApplication,
    blnDocumentsComplete,
    blnCompact = false,
}: {
    objApplication: ApplicationRecord;
    blnDocumentsComplete: boolean;
    blnCompact?: boolean;
})
{
    const blnIsGia = objApplication.program === 'GIA';
    const arrStages = blnIsGia
        ? ['GIA Proposal', 'DOST Desk Review', 'In Process (Assessment)', 'Executive Approval']
        : ['SETUP Proposal', 'DOST Desk Review', 'In Process (Assessment)', 'Executive Approval'];

    const intActiveIndex = _getActiveIndex(objApplication.status, blnDocumentsComplete);
    const intMaxIndex = arrStages.length - 1;
    const blnRevisionRequired = objApplication.status === 'Returned for Revision';
    const blnIsApproved = objApplication.status === 'Approved';

    return (
        <ol
            className={cn('grid gap-0', blnCompact ? 'md:grid-cols-4' : 'lg:grid-cols-4')}
            aria-label="Application progress"
        >
            {arrStages.map((strStage, intIndex) =>
            {
                const blnComplete = blnIsApproved ? true : intIndex < intActiveIndex;
                const blnActive = blnIsApproved ? false : intIndex === intActiveIndex;
                return (
                    <li
                        className="relative flex gap-3 pb-5 last:pb-0 lg:block lg:pb-0"
                        key={strStage}
                    >
                        {intIndex < arrStages.length - 1 ? (
                            <span className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px bg-slate-200 lg:left-[calc(50%+16px)] lg:top-4 lg:h-px lg:w-[calc(100%-32px)]" />
                        ) : null}
                        <span
                            className={cn(
                                'relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 bg-white lg:mx-auto',
                                blnComplete
                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                    : blnActive && blnRevisionRequired
                                        ? 'border-rose-500 bg-rose-50 text-rose-600'
                                        : blnActive
                                            ? 'border-[#0f53b7] text-[#0f53b7]'
                                            : 'border-slate-300 text-slate-300',
                            )}
                        >
                            {blnComplete ? (
                                <Check className="size-4" strokeWidth={3} />
                            ) : blnActive && blnRevisionRequired ? (
                                <AlertTriangle className="size-4" strokeWidth={2.5} />
                            ) : blnActive ? (
                                <ArrowRight className="size-4" strokeWidth={2.5} />
                            ) : (
                                <Circle className="size-2.5" />
                            )}
                        </span>
                        <div className="pt-1 lg:px-2 lg:pt-3 lg:text-center">
                            <p
                                className={cn(
                                    'text-xs font-bold leading-5',
                                    blnActive && blnRevisionRequired
                                        ? 'text-rose-800'
                                        : blnActive || blnComplete
                                            ? 'text-slate-800'
                                            : 'text-slate-400',
                                )}
                            >
                                {strStage}
                            </p>
                            {blnActive ? (
                                <p
                                    className={cn(
                                        'mt-0.5 text-[11px] font-semibold',
                                        blnRevisionRequired ? 'text-rose-600' : 'text-[#0f53b7]',
                                    )}
                                >
                                    {blnRevisionRequired ? 'Revision required' : 'Current stage'}
                                </p>
                            ) : blnComplete && blnIsApproved && intIndex === intMaxIndex ? (
                                <p className="mt-0.5 text-[11px] font-bold text-emerald-600">
                                    Approved
                                </p>
                            ) : null}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
} /* end ProposalProgress */
