/**
 * System: DPRMS
 * Purpose: Render documents step for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { CheckCircle2, FileCheck2 } from 'lucide-react';

import { getVisibleDocumentRequirements } from '../../../data/proposal';
import type {
    ProposalDocumentKey,
    ProposalFormData,
    ProposalFormErrors,
} from '../../../types/proposal';
import { ProposalSectionHeading } from '../ProposalSectionHeading';
import { UploadCard } from '../UploadCard';

interface DocumentsStepProps
{
    objData: ProposalFormData;
    objErrors: ProposalFormErrors;
    onDocumentChange: (strDocumentKey: ProposalDocumentKey, objFile: File | null) => void;
}

/** Render documents step and its available actions. */
export function DocumentsStep({ objData, objErrors, onDocumentChange }: DocumentsStepProps)
{
    const arrRequirements = getVisibleDocumentRequirements(objData);
    const intUploadedCount = arrRequirements.filter(
        (objRequirement) => objData.documents[objRequirement.key],
    ).length;
    const intProgress = arrRequirements.length
        ? Math.round((intUploadedCount / arrRequirements.length) * 100)
        : 0;
    const blnIsGia = objData.proposalType === 'GIA';

    return (
        <div className="space-y-6">
            <ProposalSectionHeading
                txtDescription="Upload clear and complete copies of each required document. You can preview, replace, or remove files before submitting."
                blnDivided={false}
                title="Document Submission"
            />

            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 sm:flex-row sm:gap-8">
                <p>
                    <span className="font-bold text-slate-800">Accepted Formats:</span> PDF, DOCX,
                    XLSX, JPG, PNG
                </p>
                <p>
                    <span className="font-bold text-slate-800">Maximum Size:</span> 10 MB per file
                </p>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                <FileCheck2 className="mt-0.5 size-5 shrink-0 text-amber-700" />
                <p>
                    The list below only includes documents the proponent needs to provide for{' '}
                    {blnIsGia ? 'GIA' : 'SETUP'} screening. DOST evaluation forms and remarks are
                    handled after submission.
                </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <h3 className="text-sm font-black text-[#073b82]">Required Documents</h3>
                        <p className="mt-1 text-xs text-slate-500">
                            {objData.proposalType
                                ? `${arrRequirements.length} documents required for your ${objData.proposalType} submission`
                                : 'Select a program to view its requirements.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-5 text-xs font-bold">
                        <span className="flex items-center gap-1.5 text-emerald-700">
                            <CheckCircle2 className="size-4" />
                            {intUploadedCount} Uploaded
                        </span>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                    <div
                        aria-label={`${intProgress}% of required documents uploaded`}
                        aria-valuemax={100}
                        aria-valuemin={0}
                        aria-valuenow={intProgress}
                        className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200"
                        role="progressbar"
                    >
                        <div
                            className="h-full rounded-full bg-emerald-600 transition-[width] duration-300"
                            style={{ width: `${intProgress}%` }}
                        />
                    </div>
                    <span className="w-10 text-right text-xs font-black text-slate-700">
                        {intProgress}%
                    </span>
                </div>
            </div>

            <div className="space-y-3">
                {arrRequirements.map((objRequirement) => (
                    <UploadCard
                        strError={objErrors[`documents.${objRequirement.key}`]}
                        objFile={objData.documents[objRequirement.key]}
                        key={objRequirement.key}
                        onChange={(objFile) => onDocumentChange(objRequirement.key, objFile)}
                        objRequirement={objRequirement}
                    />
                ))}
            </div>
        </div>
    ); // end return
} /* end DocumentsStep */
