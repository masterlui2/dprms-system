/**
 * System: DPRMS
 * Purpose: Render proponent review section for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { ProposalFormData } from '../../../../types/proposal';
import { ReviewSection } from './ReviewSection';
import { SummaryItem } from './SummaryItem';

interface ProponentReviewSectionProps
{
    objData: ProposalFormData;
    blnIsGia: boolean;
    onEdit: () => void;
}

/** Render proponent review section and its available actions. */
export function ProponentReviewSection({ objData, blnIsGia, onEdit }: ProponentReviewSectionProps)
{
    return (
        <ReviewSection
            txtDescription="Contact and organization information for DOST notifications."
            onEdit={onEdit}
            title={blnIsGia ? 'Proponent and Agency' : 'Proponent and Business'}
        >
            <SummaryItem strLabel="Program" value={objData.proposalType} />
            <SummaryItem
                strLabel={blnIsGia ? 'Project Leader / Contact Person' : 'Owner / Representative'}
                value={objData.applicantFullName}
            />
            <SummaryItem strLabel="Position / Designation" value={objData.applicantPosition} />
            <SummaryItem strLabel="Email Address" value={objData.emailAddress} />
            <SummaryItem strLabel="Contact Number" value={objData.contactNumber} />
            <SummaryItem
                strLabel={blnIsGia ? 'Implementing Agency / Organization' : 'Business Name'}
                value={objData.organizationName}
            />
            <SummaryItem
                strLabel={blnIsGia ? 'Organization Type' : 'Business Type'}
                value={blnIsGia ? objData.organizationType : objData.businessType}
            />
            <SummaryItem strLabel="Municipality / City" value={objData.municipality} />
            <SummaryItem
                strLabel={blnIsGia ? 'Office Address' : 'Business Address'}
                value={objData.businessAddress}
                blnWide
            />
            {blnIsGia ? null : (
                <>
                    <SummaryItem strLabel="Line of Business" value={objData.lineOfBusiness} />
                    <SummaryItem strLabel="Enterprise Size" value={objData.enterpriseSize} />
                    <SummaryItem strLabel="Industry Sector" value={objData.industryCategory} />
                    <SummaryItem strLabel="Years in Operation" value={objData.yearEstablished} />
                </>
            )}
        </ReviewSection>
    ); // end return
} /* end ProponentReviewSection */
