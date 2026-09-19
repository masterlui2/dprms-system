/**
 * System: DPRMS
 * Purpose: Render review step for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { CheckCircle2 } from 'lucide-react';

import type {
    ProposalFieldName,
    ProposalFormData,
    ProposalFormErrors,
} from '../../../types/proposal';
import { ProposalSectionHeading } from '../ProposalSectionHeading';
import { CertificationPanel } from './review/CertificationPanel';
import { DocumentsReviewSection } from './review/DocumentsReviewSection';
import { ProjectReviewSection } from './review/ProjectReviewSection';
import { ProponentReviewSection } from './review/ProponentReviewSection';

interface ReviewStepProps
{
    objData: ProposalFormData;
    objErrors: ProposalFormErrors;
    onEditSection: (intStep: number) => void;
    onFieldChange: <K extends ProposalFieldName>(
        udtField: K,
        objValue: ProposalFormData[K],
    ) => void;
}

/** Render review step and its available actions. */
export function ReviewStep({ objData, objErrors, onEditSection, onFieldChange }: ReviewStepProps)
{
    const blnIsGia = objData.proposalType === 'GIA';

    return (
        <div className="space-y-6">
            <ProposalSectionHeading
                txtDescription="Review the complete proposal and uploaded documents before sending it to DOST."
                blnDivided={false}
                title="Review and Submit"
            />

            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold leading-6 text-[#073b82]">
                This page summarizes the information that will be submitted. Use the Edit buttons to
                make changes before confirming.
            </div>

            <ProponentReviewSection
                objData={objData}
                blnIsGia={blnIsGia}
                onEdit={() => onEditSection(1)}
            />
            <ProjectReviewSection
                objData={objData}
                blnIsGia={blnIsGia}
                onEdit={() => onEditSection(1)}
            />
            <DocumentsReviewSection objData={objData} onEdit={() => onEditSection(2)} />
            <CertificationPanel
                blnCertified={objData.certified}
                strError={objErrors.certified}
                onCertifiedChange={(blnCertified) => onFieldChange('certified', blnCertified)}
            />

            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                <CheckCircle2 className="size-5 text-[#0f53b7]" />
                Submitting will create a reference number and route the proposal for DOST
                validation.
            </div>
        </div>
    ); // end return
} /* end ReviewStep */
