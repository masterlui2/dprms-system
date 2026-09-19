/**
 * System: DPRMS
 * Purpose: Render documents review section for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { Pencil } from 'lucide-react';

import { getVisibleDocumentRequirements } from '../../../../data/proposal';
import type { ProposalFormData } from '../../../../types/proposal';

interface DocumentsReviewSectionProps
{
    objData: ProposalFormData;
    onEdit: () => void;
}

/** Render documents review section and its available actions. */
export function DocumentsReviewSection({ objData, onEdit }: DocumentsReviewSectionProps)
{
    const arrRequirements = getVisibleDocumentRequirements(objData);
    const intUploadedCount = arrRequirements.filter(
        (objRequirement) => objData.documents[objRequirement.key],
    ).length;

    return (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="text-base font-black text-[#073b82]">Uploaded Documents</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                        {intUploadedCount} of {arrRequirements.length} required documents uploaded.
                    </p>
                </div>
                <button
                    className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-[#073b82] transition hover:border-[#0f53b7] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                    onClick={onEdit}
                    type="button"
                >
                    <Pencil className="size-4" />
                    Edit
                </button>
            </div>
            <div className="mt-5 space-y-3">
                {arrRequirements.map((objRequirement) =>
                {
                    const objFile = objData.documents[objRequirement.key];

                    return (
                        <div
                            className="flex flex-col gap-3 rounded-lg border border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                            key={objRequirement.key}
                        >
                            <div className="min-w-0">
                                <p className="font-bold text-slate-900">{objRequirement.label}</p>
                                <p className="mt-1 break-words text-sm text-slate-600">
                                    {objFile?.name ?? 'No file uploaded'}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    ); // end return
} /* end DocumentsReviewSection */
