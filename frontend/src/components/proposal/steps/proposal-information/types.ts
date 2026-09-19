/**
 * System: DPRMS
 * Purpose: Types definitions for DPRMS.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type {
    ProposalFieldName,
    ProposalFormData,
    ProposalFormErrors,
} from '../../../../types/proposal';

export interface ProposalInformationSectionProps
{
    objData: ProposalFormData;
    objErrors: ProposalFormErrors;
    blnIsGia: boolean;
    onFieldChange: <K extends ProposalFieldName>(
        udtField: K,
        objValue: ProposalFormData[K],
    ) => void;
}
