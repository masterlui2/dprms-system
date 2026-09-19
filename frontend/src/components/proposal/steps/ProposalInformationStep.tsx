/**
 * System: DPRMS
 * Purpose: Render proposal information step for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type {
    ProposalFieldName,
    ProposalFormData,
    ProposalFormErrors,
} from '../../../types/proposal';
import { ProposalSectionHeading } from '../ProposalSectionHeading';
import { ContactDetailsSection } from './proposal-information/ContactDetailsSection';
import { OrganizationSection } from './proposal-information/OrganizationSection';
import { ProjectDetailsSection } from './proposal-information/ProjectDetailsSection';

interface ProposalInformationStepProps
{
    objData: ProposalFormData;
    objErrors: ProposalFormErrors;
    onFieldChange: <K extends ProposalFieldName>(
        udtField: K,
        objValue: ProposalFormData[K],
    ) => void;
}

/** Render proposal information step and its available actions. */
export function ProposalInformationStep({
    objData,
    objErrors,
    onFieldChange,
}: ProposalInformationStepProps)
{
    const blnIsGia = objData.proposalType === 'GIA';
    const objSectionProps = { objData, objErrors, blnIsGia, onFieldChange };

    return (
        <div className="space-y-8">
            <ProposalSectionHeading
                txtDescription="Complete the essential information DOST needs to screen your proposal. You can edit these details before final submission."
                blnDivided={false}
                title="Proposal Information"
            />

            <ContactDetailsSection {...objSectionProps} />
            <OrganizationSection {...objSectionProps} />
            <ProjectDetailsSection {...objSectionProps} />
        </div>
    );
}
