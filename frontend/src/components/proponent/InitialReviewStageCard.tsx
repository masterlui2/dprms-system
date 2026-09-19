/**
 * System: DPRMS
 * Purpose: Render initial review stage card for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { Check, FileSearch, ShieldCheck, XCircle } from 'lucide-react';
import type { ApplicationRecord } from '../../types/application';
import { cn } from '../../utils/cn';

interface InitialReviewStageCardProps
{
    objApplication: ApplicationRecord;
}

/** Render initial review stage card and its available actions. */
export function InitialReviewStageCard({ objApplication }: InitialReviewStageCardProps)
{
    const blnIsSetup = objApplication.program === 'SETUP';
    const strSubmittedDateFormatted = new Date(objApplication.createdAt).toLocaleDateString(
        'en-US',
        {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        },
    );

    const strStatus = objApplication.status;

    let strBadgeText = 'DOST Initial Review Active';
    let strBadgeClass = 'text-[#0f53b7]';
    let strTitle = 'Application Submitted Successfully!';
    let strStageLabel = 'Stage 1: Document Checklist Review';
    let strStatusBadgeColor = 'text-[#0f53b7]';
    let txtDescription = blnIsSetup
        ? 'Your SETUP Application has been received and is currently undergoing initial documentary verification by the DOST SSCP Evaluator.'
        : 'Your GIA Application has been received and is currently undergoing initial documentary verification by the DOST CEST Evaluator.';
    let objIcon = <Check className="size-9" strokeWidth={3} />;
    let strIconBg = 'bg-emerald-100 text-emerald-600';

    if (strStatus === 'Approved')
    {
        strBadgeText = 'Application Formally Approved';
        strBadgeClass = 'text-emerald-700';
        strTitle = 'Application Approved!';
        strStageLabel = 'Stage 4: Executive Approval & Handover';
        strStatusBadgeColor = 'text-emerald-700';
        txtDescription = blnIsSetup
            ? 'Congratulations! Your SETUP project proposal has been formally approved by the Provincial Director. The DOST PSTO office will coordinate with you regarding the MOA signing and project setup.'
            : 'Congratulations! Your GIA project proposal has been formally approved by the Provincial Director. The DOST PSTO office will coordinate with you regarding the MOA signing and grant fund disbursement.';
        objIcon = <Check className="size-9" strokeWidth={3} />;
        strIconBg = 'bg-emerald-100 text-emerald-600';
    } else if (strStatus === 'Executive Approval')
    {
        strBadgeText = 'Executive Approval In Progress';
        strBadgeClass = 'text-purple-700';
        strTitle = 'Endorsed to Provincial Director';
        strStageLabel = 'Stage 3: Provincial Director Approval';
        strStatusBadgeColor = 'text-purple-700';
        txtDescription = blnIsSetup
            ? 'Your SETUP proposal has successfully passed technical evaluation and TNA. It has been endorsed to the Provincial Director for final executive approval.'
            : 'Your GIA proposal has passed technical evaluation and has been endorsed to the Provincial Director for final executive approval.';
        objIcon = <ShieldCheck className="size-9" />;
        strIconBg = 'bg-purple-100 text-purple-600';
    } else if (strStatus === 'In Process' || strStatus === 'Technical evaluation')
    {
        strBadgeText = 'Assessment & Validation Active';
        strBadgeClass = 'text-[#0f53b7]';
        strTitle = 'Application In Process';
        strStageLabel = 'Stage 2: Technical Assessment & TNA';
        strStatusBadgeColor = 'text-[#0f53b7]';
        txtDescription = blnIsSetup
            ? 'Your documentary checklist has been validated. The DOST PSTO team is currently conducting the Technology Needs Assessment (TNA), site inspection, and technical evaluation.'
            : 'Your documentary checklist has been validated. The DOST CEST team is currently conducting technical evaluation, field validation, and proposal appraisal.';
        objIcon = <FileSearch className="size-9" />;
        strIconBg = 'bg-blue-100 text-[#0f53b7]';
    } else if (strStatus === 'Disapproved')
    {
        strBadgeText = 'Application Disapproved';
        strBadgeClass = 'text-rose-700';
        strTitle = 'Application Not Approved';
        strStageLabel = 'Review Concluded';
        strStatusBadgeColor = 'text-rose-700';
        txtDescription =
            objApplication.remarks ||
            (blnIsSetup
                ? 'Your SETUP application was not approved during evaluation. Please contact the PSTO office for more details.'
                : 'Your GIA proposal was not approved during evaluation. Please contact the DOST office for more details.');
        objIcon = <XCircle className="size-9" />;
        strIconBg = 'bg-rose-100 text-rose-600';
    }

    return (
        <div className="min-h-[380px] rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 grid place-items-center text-center shadow-sm">
            <div className="max-w-lg space-y-4">
                {/* Stage Icon */}
                <div
                    className={cn(
                        'mx-auto grid size-16 place-items-center rounded-full shadow-sm',
                        strIconBg,
                    )}
                >
                    {objIcon}
                </div>

                {/* Heading & Metadata */}
                <div className="space-y-1">
                    <span className={cn('inline-block text-xs font-semibold', strBadgeClass)}>
                        {strBadgeText}
                    </span>
                    <h3 className="text-2xl font-black tracking-tight text-slate-900 pt-2">
                        {strTitle}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500">
                        Reference No:{' '}
                        <span className="font-mono font-bold text-[#0f53b7]">
                            {objApplication.referenceNo}
                        </span>{' '}
                        · Submitted on {strSubmittedDateFormatted}
                    </p>
                </div>

                {/* Stage Status & Info Box */}
                <div className="rounded-2xl bg-blue-50/80 border border-blue-100 p-5 text-left space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-[#073b82]">
                            {strStageLabel}
                        </span>
                        <span
                            className={cn(
                                'inline-flex text-[11px] font-semibold',
                                strStatusBadgeColor,
                            )}
                        >
                            {objApplication.status}
                        </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{txtDescription}</p>
                </div>
            </div>
        </div>
    ); // end return
} /* end InitialReviewStageCard */
