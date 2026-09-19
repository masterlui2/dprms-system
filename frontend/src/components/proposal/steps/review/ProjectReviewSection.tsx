/**
 * System: DPRMS
 * Purpose: Render project review section for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { ProposalFormData } from '../../../../types/proposal';
import { ReviewSection } from './ReviewSection';
import { SummaryItem } from './SummaryItem';

interface ProjectReviewSectionProps
{
    objData: ProposalFormData;
    blnIsGia: boolean;
    onEdit: () => void;
}

/** Render project review section and its available actions. */
export function ProjectReviewSection({ objData, blnIsGia, onEdit }: ProjectReviewSectionProps)
{
    return (
        <ReviewSection
            txtDescription="Project scope, location, need, and expected outputs."
            onEdit={onEdit}
            title="Project Details"
        >
            <SummaryItem strLabel="Project Title" value={objData.projectTitle} blnWide />
            {blnIsGia ? (
                <>
                    <SummaryItem strLabel="Project Category" value={objData.projectCategory} />
                    <SummaryItem strLabel="Project Type" value={objData.projectType} />
                </>
            ) : (
                <SummaryItem
                    strLabel="Type of Assistance Needed"
                    value={objData.scopeOfAssistance}
                />
            )}
            <SummaryItem strLabel="Site of Implementation" value={objData.siteOfImplementation} />
            <SummaryItem
                strLabel={blnIsGia ? 'Project Summary / Need' : 'Business Problem or Need'}
                value={blnIsGia ? objData.projectDescription : objData.currentOperationalProblem}
                blnWide
            />
            <SummaryItem strLabel="Objectives" value={objData.projectObjectives} blnWide />
            {blnIsGia ? (
                <SummaryItem strLabel="Target Beneficiaries" value={objData.targetBeneficiary} />
            ) : (
                <SummaryItem
                    strLabel="Technology or Equipment Requested"
                    value={objData.proposedTechnologyAssistance}
                    blnWide
                />
            )}
            <SummaryItem
                strLabel={blnIsGia ? 'Expected Outputs' : 'Expected Results'}
                value={objData.expectedOutputs}
                blnWide
            />
        </ReviewSection>
    ); // end return
} /* end ProjectReviewSection */
